// ============================================================
// KR 종목(개별주식 + ETF) 확정 종가 일일 배치
//
// data.go.kr(공공데이터포털) 금융위원회 시세정보 API에서
// 그날 전체 KR 개별주식·ETF 종가를 한 번에 가져와 asset_prices 테이블에 upsert한다.
//   - ETF: GetSecuritiesProductInfoService/getETFPriceInfo
//   - 개별주식: GetStockSecuritiesInfoService/getStockPriceInfo
// (aikstockdata는 시총 상위 개별종목만 다루고 ETF를 전혀 지원하지 않아
//  ETF 위주 보유 종목에서 매번 전체 실패했다 — data.go.kr로 교체)
//
// 다른 backfill-*.mjs 스크립트들과 달리 이 스크립트는 사람이 리뷰하는
// SQL을 생성하지 않고, 매일 무인으로 실행되어 Supabase에 직접 upsert한다
// (GitHub Actions 스케줄, .github/workflows/fetch-kr-closing-prices.yml).
//
// 흐름:
//   1. portfolio_assets 에서 실제 보유 중인 KR 티커만 조회(전체 KR 종목 대상 아님)
//   2. 대상 티커가 0개면 조용히 종료(정상 케이스)
//   3. 최신 종가가 공개된 기준일(basDt)을 뒤에서부터 탐색
//   4. 그 기준일의 ETF·개별주식 종가 전체를 각각 한 번씩 조회해 티커→종가 맵으로 병합
//      (개별 종목이 ETF인지 주식인지는 assets.market만으로 구분되지 않아
//       두 데이터셋을 모두 조회한 뒤 매칭되는 쪽을 사용한다. data.go.kr은
//       데이터셋별로 별도 활용신청이 필요해 한쪽이 아직 미승인이거나 장애여도
//       그 소스만 건너뛰고 나머지로 계속 진행한다)
//   5. 보유 티커를 맵에서 찾아 매칭되면 upsert 대상, 못 찾으면 누락 처리
//   6. 매칭 0건(전체 실패)이면 exit 1, 일부라도 매칭되면 성공으로 exit 0
//
// 실행:
//   node scripts/fetch-kr-closing-prices.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY 는
//    .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const DATA_GO_KR_BASE = "https://apis.data.go.kr/1160100/service";
const ETF_ENDPOINT = `${DATA_GO_KR_BASE}/GetSecuritiesProductInfoService/getETFPriceInfo`;
const STOCK_ENDPOINT = `${DATA_GO_KR_BASE}/GetStockSecuritiesInfoService/getStockPriceInfo`;
const PAGE_SIZE = 1000; // 한 페이지당 조회 건수 — ETF(~1,160)·KR개별주식(~2,770) 모두 2페이지 이내로 커버
const MAX_LOOKBACK_DAYS = 10; // 주말·공휴일을 감안해 기준일을 최대 며칠 전까지 거슬러 탐색할지
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수
const REQUEST_TIMEOUT_MS = 15_000; // 응답이 없는(hang) 요청이 배치 전체를 막지 않도록
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

// KST 기준 yyyymmdd 문자열 (GitHub Actions 러너는 UTC라 타임존을 명시해야 한다).
const toKstYyyymmdd = (date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .replaceAll("-", "");

const assertNormalService = (json, endpoint) => {
  const header = json?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`${endpoint} 응답 오류: ${header?.resultCode} ${header?.resultMsg}`);
  }
};

const buildDataGoKrUrl = ({ endpoint, apiKey, basDt, numOfRows, pageNo }) =>
  // apiKey는 data.go.kr이 발급하는 시점에 이미 URL-encoding된 값이라 재인코딩하지 않는다.
  `${endpoint}?serviceKey=${apiKey}&numOfRows=${numOfRows}&pageNo=${pageNo}&resultType=json&basDt=${basDt}`;

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

// ── 2. 최신 공개 종가 기준일(basDt) 탐색 ────────────────────────
// data.go.kr은 특정 basDt를 지정해야 하고, 종가는 보통 1영업일 지연 공개된다.
// ETF 엔드포인트로 1건만 조회해 totalCount>0 인 날짜를 뒤에서부터 찾는다.
const findLatestAvailableBasDt = async ({ apiKey }) => {
  let cursor = new Date();
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    const basDt = toKstYyyymmdd(cursor);
    const url = buildDataGoKrUrl({ endpoint: ETF_ENDPOINT, apiKey, basDt, numOfRows: 1, pageNo: 1 });
    const res = await fetchWithRetry(url, {});
    if (!res.ok) throw new Error(`${ETF_ENDPOINT} HTTP ${res.status}`);
    const json = await res.json();
    assertNormalService(json, ETF_ENDPOINT);
    const totalCount = Number(json.response.body.totalCount ?? 0);
    if (totalCount > 0) return basDt;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  throw new Error(`최근 ${MAX_LOOKBACK_DAYS}일 이내 공개된 종가 데이터를 찾지 못했습니다.`);
};

// ── 3. 기준일의 종가 전체 조회(페이지네이션) ────────────────────
// 반환: Map<srtnCd(6자리 티커), { close_price, basDt }>
const fetchAllPrices = async ({ endpoint, apiKey, basDt }) => {
  const priceByTicker = new Map();
  let pageNo = 1;
  let totalCount = Infinity;
  while ((pageNo - 1) * PAGE_SIZE < totalCount) {
    const url = buildDataGoKrUrl({ endpoint, apiKey, basDt, numOfRows: PAGE_SIZE, pageNo });
    const res = await fetchWithRetry(url, {});
    if (!res.ok) throw new Error(`${endpoint} HTTP ${res.status}`);
    const json = await res.json();
    assertNormalService(json, endpoint);
    const body = json.response.body;
    totalCount = Number(body.totalCount ?? 0);
    const items = body.items?.item ?? [];
    for (const item of items) {
      if (!item.srtnCd || typeof item.clpr === "undefined") continue;
      priceByTicker.set(item.srtnCd, { close_price: Number(item.clpr), basDt: item.basDt });
    }
    pageNo += 1;
  }
  return priceByTicker;
};

// data.go.kr은 데이터셋(ETF/개별주식)별로 별도 활용신청이 필요하다 — 한쪽이
// 아직 미승인(403)이거나 일시 장애여도 다른 쪽 매칭은 그대로 살리기 위해
// 소스별로 독립적으로 실패를 흡수한다.
const fetchAllPricesSafely = async ({ endpoint, apiKey, basDt, label }) => {
  try {
    return await fetchAllPrices({ endpoint, apiKey, basDt });
  } catch (e) {
    console.warn(`⚠ ${label} 종가 조회 실패, 이 소스는 건너뜁니다: ${e.message}`);
    return new Map();
  }
};

// ── 4. asset_prices upsert ───────────────────────────────────
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
  const dataGoKrApiKey = loadEnvValue("DATA_GO_KR_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !dataGoKrApiKey) {
    console.error(
      "❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요."
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

  console.log("· 최신 공개 종가 기준일 탐색 중...");
  const basDt = await findLatestAvailableBasDt({ apiKey: dataGoKrApiKey });
  console.log(`· 기준일: ${basDt}`);

  console.log("· ETF 종가 전체 조회 중...");
  const etfPrices = await fetchAllPricesSafely({ endpoint: ETF_ENDPOINT, apiKey: dataGoKrApiKey, basDt, label: "ETF" });
  console.log(`· 개별주식 종가 전체 조회 중...`);
  const stockPrices = await fetchAllPricesSafely({
    endpoint: STOCK_ENDPOINT,
    apiKey: dataGoKrApiKey,
    basDt,
    label: "개별주식",
  });

  const priceDate = `${basDt.slice(0, 4)}-${basDt.slice(4, 6)}-${basDt.slice(6, 8)}`;
  const rows = [];
  const missing = [];
  for (const ticker of tickers) {
    const hit = etfPrices.get(ticker) ?? stockPrices.get(ticker);
    if (!hit) {
      missing.push(ticker);
      continue;
    }
    rows.push({ ticker, price_date: priceDate, close_price: hit.close_price });
  }

  console.log(`\n· 조회 완료: 성공 ${rows.length} / 누락 ${missing.length} (총 ${tickers.length})`);
  if (missing.length > 0) console.log(`  누락: ${missing.join(", ")}`);

  if (rows.length === 0) {
    console.error("\n❌ 수집된 종가가 하나도 없습니다(전체 실패).");
    process.exit(1);
  }

  if (isDryRun) {
    console.log(`\n[dry-run] 실제 upsert는 건너뜁니다. (${rows.length}건 upsert 예정)`);
    for (const row of rows.slice(0, DRY_RUN_PREVIEW_LIMIT)) {
      console.log(`  [dry-run] ${row.ticker} → ${row.price_date} 종가 ${row.close_price}`);
    }
    return;
  }

  await upsertAssetPrices({ supabaseUrl, serviceRoleKey, rows });
  console.log(`\n✅ asset_prices upsert 완료: ${rows.length}건`);
};

main().catch((e) => {
  console.error(`\n❌ 실패: ${e.message}`);
  process.exit(1);
});
