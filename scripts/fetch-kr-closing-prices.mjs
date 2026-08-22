// ============================================================
// KR 종목 확정 종가 일일 배치
//
// aikstockdata(https://aikstockdata.com)에서 KOSPI·KOSDAQ 종목의
// 확정 종가(T+1)를 가져와 asset_prices 테이블에 upsert한다.
//
// 출처 표기(aikstockdata 응답 license/citation 필드 원문 인용):
//   license.name : "공공데이터(DART·금융위) 가공물 — 출처 표기 후 자유 이용(영리 포함)"
//   license.url  : "https://aikstockdata.com/terms"
//   citation     : "자료: 한국주식데이터(aikstockdata.com) — 원천: 금융감독원 DART · 금융위원회 공공데이터포털"
//
// 다른 backfill-*.mjs 스크립트들과 달리 이 스크립트는 사람이 리뷰하는
// SQL을 생성하지 않고, 매일 무인으로 실행되어 Supabase에 직접 upsert한다
// (GitHub Actions 스케줄, .github/workflows/fetch-kr-closing-prices.yml).
//
// 흐름:
//   1. portfolio_assets 에서 실제 보유 중인 KR 티커만 조회(전체 KR 종목 대상 아님)
//   2. 대상 티커가 0개면 조용히 종료(정상 케이스)
//   3. 티커별로 aikstockdata에서 종가 조회(quote.close/as_of/has_trade)
//      has_trade=false(휴장·거래없음)인 종목은 건너뛴다
//   4. 수집된 종가를 asset_prices 에 upsert(복합 PK 기준 merge-duplicates)
//   5. 성공/스킵/실패 건수를 stdout에 요약. 부분 실패는 exit 0,
//      전체(0건 성공) 실패는 exit 1
//
// 실행:
//   node scripts/fetch-kr-closing-prices.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const AIKSTOCKDATA_BASE = "https://aikstockdata.com/data/public/s";
const REQUEST_DELAY_MS = 150; // 요청 간 지연 — aikstockdata 서버 부담 최소화
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수
const REQUEST_TIMEOUT_MS = 10_000; // 응답이 없는(hang) 요청이 배치 전체를 막지 않도록
const DRY_RUN_PREVIEW_LIMIT = 5; // --dry-run 시 콘솔에 미리 보여줄 건수
// KR 종목 티커는 6자리 숫자(005930 등)다. portfolio_assets.asset_ticker는
// assets(ticker) FK + assets가 SELECT-only RLS라 이미 신뢰할 수 있는 값만
// 들어오지만, URL에 삽입하기 전 한 번 더 형태를 검증해 방어적으로 처리한다.
const KR_TICKER_PATTERN = /^\d{6}$/;
// 보유 종목 수가 많아져도 PostgREST 기본 페이지 크기(1000)에 잘리지 않도록
// 넉넉한 Range를 명시한다.
const SUPABASE_QUERY_RANGE = "0-9999";

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// ── SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 로딩 (process.env → .env 탐색) ──
// scripts/backfill-kr-dividends.mjs 의 loadDartKey() 패턴을 그대로 따른다.
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

// ── 유틸 ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 네트워크 오류(fetch failed)·5xx·429 는 지수 백오프로 재시도한다.
const fetchWithRetry = async (url, options) => {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === MAX_RETRIES) break;
      const backoff = Math.min(500 * 2 ** attempt, 8000) + Math.random() * 300;
      await sleep(backoff);
    }
  }
  throw lastErr;
};

// ── 1. portfolio_assets 에서 실제 보유 중인 KR 티커 조회 ───────
// assets!inner(market) 로 embed하고 assets.market=eq.KR 로 필터하면
// KR 종목을 보유한 portfolio_assets 행만 top-level 필터링된다.
// (asset_ticker가 NULL인 커스텀 종목 행은 assets와 매칭되지 않아
//  inner join에서 자연히 제외된다.)
const fetchHeldKrTickers = async ({ supabaseUrl, serviceRoleKey }) => {
  const url =
    `${supabaseUrl}/rest/v1/portfolio_assets` +
    `?select=asset_ticker,assets!inner(market)&assets.market=eq.KR`;
  const res = await fetchWithRetry(url, {
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
  const tickers = new Set(rows.map((r) => r.asset_ticker).filter(Boolean));
  return [...tickers].sort();
};

// ── 2. aikstockdata 종가 조회 ────────────────────────────────
// quote.as_of 는 "YYYYMMDD" 문자열 → "YYYY-MM-DD" 로 변환.
const toIsoDate = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

// 반환:
//   { ticker, price_date, close_price }              성공
//   { ticker, skipped: "not_found" | "no_trade" | "malformed" }  건너뜀(에러 아님)
const fetchClosingPrice = async (ticker) => {
  if (!KR_TICKER_PATTERN.test(ticker)) return { ticker, skipped: "malformed_ticker" };

  const res = await fetchWithRetry(`${AIKSTOCKDATA_BASE}/${encodeURIComponent(ticker)}.json`);
  if (res.status === 404) return { ticker, skipped: "not_found" };
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json();
  const quote = json.quote;
  if (!quote || quote.has_trade !== true) return { ticker, skipped: "no_trade" };
  if (typeof quote.close !== "number" || !quote.as_of) return { ticker, skipped: "malformed" };

  return { ticker, price_date: toIsoDate(quote.as_of), close_price: quote.close };
};

// ── 3. asset_prices upsert ───────────────────────────────────
// 복합 PK (ticker, price_date) 기준으로 merge-duplicates.
const upsertAssetPrices = async ({ supabaseUrl, serviceRoleKey, rows }) => {
  const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/asset_prices`, {
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
    throw new Error(`asset_prices upsert 실패: HTTP ${res.status} ${await res.text()}`);
  }
};

// ── 메인 ──────────────────────────────────────────────────────
const main = async () => {
  const supabaseUrl = loadEnvValue("SUPABASE_URL");
  const serviceRoleKey = loadEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요."
    );
    process.exit(1);
  }

  console.log("· 보유 중인 KR 종목 조회 중...");
  const tickers = await fetchHeldKrTickers({ supabaseUrl, serviceRoleKey });
  if (tickers.length === 0) {
    console.log("· 보유 중인 KR 종목이 없습니다. 종료합니다.");
    return;
  }
  console.log(`· 대상 티커 ${tickers.length}개: ${tickers.join(", ")}`);

  const rows = [];
  const skipped = [];
  const failed = [];
  for (const ticker of tickers) {
    if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS);
    try {
      const result = await fetchClosingPrice(ticker);
      if (result.skipped) {
        skipped.push({ ticker, reason: result.skipped });
        continue;
      }
      rows.push(result);
      if (isDryRun && rows.length <= DRY_RUN_PREVIEW_LIMIT) {
        console.log(`  [dry-run] ${ticker} → ${result.price_date} 종가 ${result.close_price}`);
      }
    } catch (e) {
      failed.push({ ticker, error: e.message });
    }
  }

  console.log(
    `\n· 조회 완료: 성공 ${rows.length} / 스킵 ${skipped.length} / 실패 ${failed.length} (총 ${tickers.length})`
  );
  if (skipped.length) console.log(`  스킵: ${skipped.map((s) => `${s.ticker}(${s.reason})`).join(", ")}`);
  if (failed.length) console.log(`  실패: ${failed.map((f) => `${f.ticker}(${f.error})`).join(", ")}`);

  if (rows.length === 0) {
    console.error("\n❌ 수집된 종가가 하나도 없습니다(전체 실패).");
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`\n[dry-run] 실제 upsert는 건너뜁니다. (${rows.length}건 upsert 예정)`);
    return;
  }

  await upsertAssetPrices({ supabaseUrl, serviceRoleKey, rows });
  console.log(`\n✅ asset_prices upsert 완료: ${rows.length}건`);
};

main().catch((e) => {
  console.error(`\n❌ 실패: ${e.message}`);
  process.exit(1);
});
