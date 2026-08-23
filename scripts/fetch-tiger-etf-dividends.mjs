// ============================================================
// TIGER(미래에셋자산운용) ETF 분배금 배치 — 로컬 수동 실행/dry-run 전용
//
// ETF 분배금은 공식 공개 API가 없어(scripts/fetch-kr-stock-dividends.mjs
// 헤더 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접
// 수집한다. TIGER의 엑셀 다운로드는 "그달의 분배 내역"만 주는 월별
// 스냅샷이라(selectYear/selectMonth), 최근 MONTHS_BACK개월을 각각
// 조회해야 넓은 이력을 모을 수 있다 — 월마다 분배 종목 구성이 다르다.
//
// 종목코드가 없어 종목명으로만 식별된다 — assets 카탈로그(KR 전체)와
// 이름으로 매칭한다. 우리 assets 카탈로그에 있는 KR 티커만 걸러
// 저장한다(보유 여부와 무관 — #75/#76).
//
// 실제 매일 배치 실행은 Vercel Cron이 담당한다
// (apps/web/src/app/api/cron/fetch-tiger-etf-dividends/route.ts,
//  apps/web/vercel.json). 같은 로직을 apps/web 쪽
// TypeScript(fetchTigerEtfDividends.ts)로도 복제해 뒀다 — 실행 환경이
// 달라 공유 모듈로 묶기보다 중복을 허용했다.
//
// 실행:
//   node scripts/fetch-tiger-etf-dividends.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SOURCE = "TIGER";
const EXCEL_URL_BASE = "https://investments.miraeasset.com/tigeretf/ko/distribution/overall/excel.do";
const MONTHS_BACK = 12;
const REQUEST_TIMEOUT_MS = 20_000;
const PAGE_SIZE = 1000; // Supabase(PostgREST) db-max-rows 기본값 — Range 요청을 이 크기로 나눠 보낸다
const DRY_RUN_PREVIEW_LIMIT = 10;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

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

// 종목명만 제공하는 소스를 위한 역방향 맵(이름 → 티커). PostgREST
// db-max-rows(기본 1000)에 걸리지 않도록 페이지 단위로 전부 모은다.
const fetchKrNameToTicker = async ({ supabaseUrl, serviceRoleKey }) => {
  const map = new Map();
  let offset = 0;
  for (;;) {
    const url = `${supabaseUrl}/rest/v1/assets?select=ticker,name&market=eq.KR`;
    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
    const rows = await res.json();
    for (const row of rows) map.set(row.name.trim(), row.ticker);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return map;
};

const monthsToFetch = () => {
  const now = new Date();
  return Array.from({ length: MONTHS_BACK }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
};

const fetchMonthRows = async ({ year, month, nameToTicker }) => {
  const url = `${EXCEL_URL_BASE}?pageIndex=1&listCnt=1000&orderC=&orderType=&selectYear=${year}&selectMonth=${month}&orderB=ratioDESC&q=`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Referer: "https://investments.miraeasset.com/tigeretf/ko/distribution/overall/list.do" },
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows = [];
  $("table tbody tr").each((_, tr) => {
    const cells = $(tr)
      .find("td")
      .map((__, td) => $(td).text().trim())
      .get();
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

const upsertAssetDividends = async ({ supabaseUrl, serviceRoleKey, rows }) => {
  if (rows.length === 0) return;
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
  if (!res.ok) throw new Error(`asset_dividends upsert 실패: HTTP ${res.status} ${await res.text()}`);
};

const main = async () => {
  const supabaseUrl = loadEnvValue("SUPABASE_URL");
  const serviceRoleKey = loadEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요.");
    process.exit(1);
  }

  console.log("· assets 카탈로그의 KR 종목명→티커 조회 중...");
  const nameToTicker = await fetchKrNameToTicker({ supabaseUrl, serviceRoleKey });

  console.log(`· TIGER 최근 ${MONTHS_BACK}개월 분배 내역 다운로드 중...`);
  const monthResults = await Promise.all(monthsToFetch().map((m) => fetchMonthRows({ ...m, nameToTicker })));

  const rowByKey = new Map();
  for (const rows of monthResults) {
    for (const row of rows) rowByKey.set(`${row.ticker}|${row.record_date}`, row);
  }
  const rows = [...rowByKey.values()];

  const matchedTickers = new Set(rows.map((r) => r.ticker));
  console.log(`\n· 파싱 완료: ${matchedTickers.size}개 상품, ${rows.length}건`);

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
