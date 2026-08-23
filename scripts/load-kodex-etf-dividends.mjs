// ============================================================
// KODEX(삼성자산운용) ETF 분배 현황 파일 적재
//
// ETF 분배금은 공식 공개 API가 없다(data.go.kr 금융위원회_주식배당정보는
// 개별주식 전용이라 ETF 미포함, SEIBRO 오픈플랫폼은 법인 회원 전용이라
// 개인 프로젝트로는 가입 불가). 대신 운용사가 자사 홈페이지에 공개하는
// "상품별 분배 현황" 파일(www.kodex.com에서 다운로드)을 사람이 받아와
// 이 스크립트로 적재한다 — TIGER/ACE/SOL 등 다른 운용사가 필요해지면
// 같은 패턴으로 스크립트를 하나씩 추가한다(운용사마다 파일 형식이 달라
// 공통 파서로 묶기 어렵다).
//
// 입력 파일 컬럼(3번째 행이 헤더): 상품명, 상품코드, 유형, 지급기준일,
// 실지급일, 분배율(%), 주당분배금, 주당과세표준액
//   상품코드      → ticker (6자리, 그대로 매칭됨)
//   지급기준일    → record_date
//   실지급일      → pay_date
//   주당분배금    → amount
//
// 실제 보유 중인 KR 티커만 걸러 upsert한다(다른 배치들과 동일한 원칙 —
// 전체 상품을 다 저장하지 않음).
//
// 실행:
//   node scripts/load-kodex-etf-dividends.mjs --file <경로> [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SOURCE = "KODEX";
const SUPABASE_QUERY_RANGE = "0-9999";
const DRY_RUN_PREVIEW_LIMIT = 10;

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const fileFlagIndex = args.indexOf("--file");
const filePath = fileFlagIndex !== -1 ? args[fileFlagIndex + 1] : undefined;

if (!filePath) {
  console.error("❌ --file <경로> 로 KODEX 분배 현황 파일 경로를 지정하세요.");
  process.exit(1);
}
if (!existsSync(filePath)) {
  console.error(`❌ 파일을 찾을 수 없습니다: ${filePath}`);
  process.exit(1);
}

// ── 환경변수 로딩 (process.env → .env 탐색) ──
const loadEnvValue = (name) => {
  if (process.env[name]) return process.env[name];
  let dir = REPO_ROOT;
  for (let depth = 0; depth < 6; depth += 1) {
    const envPath = join(dir, ".env");
    if (existsSync(envPath)) {
      const line = readFileSync(envPath, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith(`${name}=`));
      if (line) return line.slice(line.indexOf("=") + 1).trim();
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
};

// 지급기준일/실지급일은 파일 내에서 "20260731" 같은 8자리 문자열로 오거나,
// 셀 서식에 따라 엑셀 날짜 일련번호(숫자)로 올 수 있어 둘 다 처리한다.
const toIsoDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    const mm = String(parsed.m).padStart(2, "0");
    const dd = String(parsed.d).padStart(2, "0");
    return `${parsed.y}-${mm}-${dd}`;
  }
  const digits = String(value).trim();
  if (!/^\d{8}$/.test(digits)) return null;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

// ── 1. portfolio_assets 에서 실제 보유 중인 KR 티커 조회 ───────
const fetchHeldKrTickers = async ({ supabaseUrl, serviceRoleKey }) => {
  const url = `${supabaseUrl}/rest/v1/portfolio_assets?select=asset_ticker,assets!inner(market)&assets.market=eq.KR`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: SUPABASE_QUERY_RANGE,
      "Range-Unit": "items",
    },
  });
  if (!res.ok) {
    throw new Error(`portfolio_assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return new Set(rows.map((r) => r.asset_ticker).filter(Boolean));
};

// ── 2. 파일 파싱 ──────────────────────────────────────────────
// 1행 제목, 2행 기준일, 3행이 실제 헤더("상품코드" 포함)라 이 헤더 행을
// 찾아서 그 아래부터 데이터로 취급한다(파일 형식이 조금 바뀌어도 견고하게).
const parseKodexFile = ({ filePath, heldTickers }) => {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headerRowIndex = grid.findIndex((row) => row.includes("상품코드"));
  if (headerRowIndex === -1) {
    throw new Error('헤더 행("상품코드" 포함)을 찾지 못했습니다 — 파일 형식이 바뀌었을 수 있습니다.');
  }
  const header = grid[headerRowIndex];
  const col = (name) => header.indexOf(name);
  const tickerCol = col("상품코드");
  const recordDateCol = col("지급기준일");
  const payDateCol = col("실지급일");
  const amountCol = col("주당분배금");
  if ([tickerCol, recordDateCol, payDateCol, amountCol].some((i) => i === -1)) {
    throw new Error("필요한 컬럼(상품코드/지급기준일/실지급일/주당분배금) 중 일부를 찾지 못했습니다.");
  }

  const rows = [];
  for (const row of grid.slice(headerRowIndex + 1)) {
    const ticker = String(row[tickerCol] ?? "").trim();
    if (!ticker || !heldTickers.has(ticker)) continue;
    const recordDate = toIsoDate(row[recordDateCol]);
    if (!recordDate) continue;
    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rows.push({
      ticker,
      record_date: recordDate,
      pay_date: toIsoDate(row[payDateCol]),
      dividend_reason: null,
      amount,
      source: SOURCE,
    });
  }
  return rows;
};

// ── 3. asset_dividends upsert ─────────────────────────────────
// asset_dividends는 id(UUID)가 PK라 on_conflict 없이는 merge-duplicates가
// PK 기준으로 시도돼 항상 새 행으로 취급된다 — 실제 유니크 제약인
// (ticker, record_date)를 명시해야 한다.
const upsertAssetDividends = async ({ supabaseUrl, serviceRoleKey, rows }) => {
  const res = await fetch(`${supabaseUrl}/rest/v1/asset_dividends?on_conflict=ticker,record_date`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`asset_dividends upsert 실패: HTTP ${res.status} ${await res.text()}`);
  }
};

// ── 메인 ──────────────────────────────────────────────────────
const main = async () => {
  const supabaseUrl = loadEnvValue("SUPABASE_URL");
  const serviceRoleKey = loadEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요.");
    process.exit(1);
  }

  console.log("· 보유 중인 KR 종목 조회 중...");
  const heldTickers = await fetchHeldKrTickers({ supabaseUrl, serviceRoleKey });
  if (heldTickers.size === 0) {
    console.log("· 보유 중인 KR 종목이 없습니다. 종료합니다.");
    return;
  }

  console.log(`· ${filePath} 파싱 중...`);
  const rows = parseKodexFile({ filePath, heldTickers });

  const matchedTickers = new Set(rows.map((r) => r.ticker));
  console.log(
    `\n· 파싱 완료: 보유 티커 ${heldTickers.size}개 중 ${matchedTickers.size}개 매칭, 분배 레코드 ${rows.length}건`
  );
  if (matchedTickers.size > 0) console.log(`  매칭 티커: ${[...matchedTickers].sort().join(", ")}`);

  if (rows.length === 0) {
    console.log("· 적재할 레코드가 없습니다. 종료합니다.");
    return;
  }

  if (isDryRun) {
    console.log(`\n[dry-run] 실제 upsert는 건너뜁니다. (${rows.length}건 upsert 예정)`);
    for (const row of rows.slice(0, DRY_RUN_PREVIEW_LIMIT)) {
      console.log(`  [dry-run] ${row.ticker} → 기준일 ${row.record_date} / 지급일 ${row.pay_date ?? "-"} 주당 ${row.amount}원`);
    }
    return;
  }

  await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  console.log(`\n✅ asset_dividends upsert 완료: ${rows.length}건`);
};

main().catch((e) => {
  console.error(`\n❌ 실패: ${e.message}`);
  process.exit(1);
});
