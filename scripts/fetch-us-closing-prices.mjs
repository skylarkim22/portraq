// ============================================================
// 미국 종목(개별주식) 확정 종가 — 로컬 수동 실행/dry-run 전용
//
// Finnhub(https://finnhub.io) /quote 엔드포인트에서 미국 장 마감 이후
// 최종 체결가를 가져와 asset_prices 테이블에 upsert한다. 무료 티어는
// 일별 확정 종가 캔들(/stock/candle)이 Premium 전용이라 쓸 수 없어,
// 장 마감 이후 /quote의 c(현재가=마지막 체결가)를 종가로 간주한다.
// 응답의 t(마지막 체결 타임스탬프)를 America/New_York 기준 날짜로
// 변환해 price_date로 저장한다 — 휴장일에는 직전 거래일의 t가
// 그대로 반환되므로 별도의 기준일 탐색이 필요 없다.
//
// 실제 매일 배치 실행은 Vercel Cron이 담당한다
// (apps/web/src/app/api/cron/fetch-us-closing-prices/route.ts,
//  apps/web/vercel.json). 이 스크립트는 로컬에서 수동 실행하거나
// --dry-run으로 점검할 때만 쓴다. 같은 로직을 apps/web 쪽
// TypeScript(fetchUsClosingPrices.ts)로도 복제해 뒀다 — 실행 환경
// (Node CLI vs Next.js 라우트)이 달라 공유 모듈로 묶기보다 중복을 허용했다.
//
// 흐름:
//   1. portfolio_assets 에서 실제 보유 중인 US 티커만 조회(전체 US 종목 대상 아님)
//   2. 대상 티커가 0개면 조용히 종료(정상 케이스)
//   3. 티커별로 /quote를 호출해 종가(c)·거래일(t→날짜)을 조회
//      존재하지 않는/상장폐지된 심볼은 필드가 전부 0으로 오므로 스킵 처리
//   4. 수집된 종가를 asset_prices 에 upsert(복합 PK 기준 merge-duplicates)
//   5. 매칭 0건(전체 실패)이면 exit 1, 일부라도 매칭되면 성공으로 exit 0
//
// 실행:
//   node scripts/fetch-us-closing-prices.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / FINNHUB_API_KEY 는
//    .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const FINNHUB_QUOTE_ENDPOINT = "https://finnhub.io/api/v1/quote";
const REQUEST_DELAY_MS = 150; // 요청 간 지연 — Finnhub 무료 티어(60건/분) 여유가 크지만 예의상 소폭 페이싱
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수
const REQUEST_TIMEOUT_MS = 10_000; // 응답이 없는(hang) 요청이 배치 전체를 막지 않도록
const DRY_RUN_PREVIEW_LIMIT = 5; // --dry-run 시 콘솔에 미리 보여줄 건수
// 보유 종목 수가 많아져도 PostgREST 기본 페이지 크기(1000)에 잘리지 않도록
// 넉넉한 Range를 명시한다.
const SUPABASE_QUERY_RANGE = "0-9999";

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// ── 환경변수 로딩 (process.env → .env 탐색) ──
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

// America/New_York 기준 yyyy-mm-dd 문자열.
const toNyDateString = (unixSeconds) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(unixSeconds * 1000)
  );

// ── 1. portfolio_assets 에서 실제 보유 중인 US 티커 조회 ───────
// assets!inner(market) 로 embed하고 assets.market=eq.US 로 필터하면
// US 종목을 보유한 portfolio_assets 행만 top-level 필터링된다.
const fetchHeldUsTickers = async ({ supabaseUrl, serviceRoleKey }) => {
  const url = `${supabaseUrl}/rest/v1/portfolio_assets?select=asset_ticker,assets!inner(market)&assets.market=eq.US`;
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

// ── 2. Finnhub /quote 조회 ────────────────────────────────────
// 반환: { ticker, price_date, close_price } 성공, null 이면 존재하지 않는/상장폐지 심볼
const fetchQuote = async (ticker, apiKey) => {
  const url = `${FINNHUB_QUOTE_ENDPOINT}?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const quote = await res.json();
  // Finnhub는 존재하지 않는 심볼도 200과 함께 모든 필드 0으로 응답한다.
  if (!quote.t || !quote.c) return null;
  return { ticker, price_date: toNyDateString(quote.t), close_price: quote.c };
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
  const finnhubApiKey = loadEnvValue("FINNHUB_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !finnhubApiKey) {
    console.error(
      "❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / FINNHUB_API_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요."
    );
    process.exit(1);
  }

  console.log("· 보유 중인 US 종목 조회 중...");
  const tickers = await fetchHeldUsTickers({ supabaseUrl, serviceRoleKey });
  if (tickers.length === 0) {
    console.log("· 보유 중인 US 종목이 없습니다. 종료합니다.");
    return;
  }
  console.log(`· 대상 티커 ${tickers.length}개: ${tickers.join(", ")}`);

  const rows = [];
  const missing = [];
  const failed = [];
  for (const ticker of tickers) {
    if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS);
    try {
      const quote = await fetchQuote(ticker, finnhubApiKey);
      if (!quote) {
        missing.push(ticker);
        continue;
      }
      rows.push(quote);
      if (isDryRun && rows.length <= DRY_RUN_PREVIEW_LIMIT) {
        console.log(`  [dry-run] ${ticker} → ${quote.price_date} 종가 ${quote.close_price}`);
      }
    } catch (e) {
      failed.push({ ticker, error: e.message });
    }
  }

  console.log(`\n· 조회 완료: 성공 ${rows.length} / 누락 ${missing.length} / 실패 ${failed.length} (총 ${tickers.length})`);
  if (missing.length > 0) console.log(`  누락: ${missing.join(", ")}`);
  if (failed.length > 0) console.log(`  실패: ${failed.map((f) => `${f.ticker}(${f.error})`).join(", ")}`);

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
  const causeMessage = e.cause ? ` (원인: ${e.cause.code ?? e.cause.message ?? e.cause})` : "";
  console.error(`\n❌ 실패: ${e.message}${causeMessage}`);
  process.exit(1);
});
