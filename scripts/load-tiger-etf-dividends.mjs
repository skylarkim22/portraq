// ============================================================
// TIGER(미래에셋자산운용) ETF 분배 내역 파일 적재
//
// ETF 분배금은 공식 공개 API가 없다(#76/load-kodex-etf-dividends.mjs
// 헤더 주석 참고). TIGER 파일은 KODEX와 형식이 다르다 — 확장자는 .xls지만
// 실제로는 HTML 테이블이고, 종목코드가 없어 종목명으로만 식별된다.
// 그래서 assets.name(market=KR)과 매칭해 티커를 역으로 찾는다 —
// 파일의 종목명에 앞뒤 공백이 섞여 있어 trim 후 비교해야 한다.
//
// 입력 파일 컬럼(<table> 헤더): 종목명, 유형, 지급기준일, 실제지급일,
// 주당분배금(원), 주당과세표준액(원), 분배율(%)
//   종목명        → assets.name 매칭 → ticker
//   지급기준일    → record_date
//   실제지급일    → pay_date
//   주당분배금(원) → amount
//
// 실제 보유 중인 KR 티커만 걸러 upsert한다(다른 배치들과 동일한 원칙).
//
// 실행:
//   node scripts/load-tiger-etf-dividends.mjs --file <경로> [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SOURCE = "TIGER";
const SUPABASE_QUERY_RANGE = "0-9999";
const DRY_RUN_PREVIEW_LIMIT = 10;

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const fileFlagIndex = args.indexOf("--file");
const filePath = fileFlagIndex !== -1 ? args[fileFlagIndex + 1] : undefined;

if (!filePath) {
  console.error("❌ --file <경로> 로 TIGER 분배 내역 파일 경로를 지정하세요.");
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

// ── 2. 보유 티커의 종목명 조회(파일의 종목명과 매칭하기 위한 역방향 맵) ──
const fetchNameToTicker = async ({ supabaseUrl, serviceRoleKey, tickers }) => {
  const url = `${supabaseUrl}/rest/v1/assets?select=ticker,name&ticker=in.(${[...tickers].join(",")})`;
  const res = await fetch(url, {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  if (!res.ok) {
    throw new Error(`assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return new Map(rows.map((r) => [r.name.trim(), r.ticker]));
};

// ── 3. HTML 테이블 파싱 ───────────────────────────────────────
const parseTigerFile = ({ filePath, nameToTicker }) => {
  const html = readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);

  const rows = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();
    // 종목명, 유형, 지급기준일, 실제지급일, 주당분배금(원), 주당과세표준액(원), 분배율(%)
    const [name, , recordDate, payDate, amountText] = cells;
    if (!name) return;
    const ticker = nameToTicker.get(name.trim());
    if (!ticker) return;
    const amount = Number(amountText);
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(recordDate ?? "")) return;
    rows.push({
      ticker,
      record_date: recordDate,
      pay_date: /^\d{4}-\d{2}-\d{2}$/.test(payDate ?? "") ? payDate : null,
      dividend_reason: null,
      amount,
      source: SOURCE,
    });
  });
  return rows;
};

// ── 4. asset_dividends upsert ─────────────────────────────────
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

  console.log("· 보유 티커의 종목명 조회 중(파일 매칭용)...");
  const nameToTicker = await fetchNameToTicker({ supabaseUrl, serviceRoleKey, tickers: heldTickers });

  console.log(`· ${filePath} 파싱 중...`);
  const rows = parseTigerFile({ filePath, nameToTicker });

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
