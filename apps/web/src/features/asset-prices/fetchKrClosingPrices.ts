// KR 종목(개별주식 + ETF) 확정 종가 배치.
//
// data.go.kr(공공데이터포털) 금융위원회 시세정보 API에서 그날 전체 KR
// 개별주식·ETF 종가를 한 번에 가져와 asset_prices 테이블에 upsert한다.
//   - ETF: GetSecuritiesProductInfoService/getETFPriceInfo
//   - 개별주식: GetStockSecuritiesInfoService/getStockPriceInfo
//
// Vercel Cron(app/api/cron/fetch-kr-closing-prices/route.ts)이 매 평일
// 이 함수를 호출한다. GitHub Actions에서는 apis.data.go.kr 연결 자체가
// 막혀서(UND_ERR_CONNECT_TIMEOUT) Vercel로 실행 위치를 옮겼다 — 로컬
// 수동 실행/dry-run 용도로는 scripts/fetch-kr-closing-prices.mjs가
// 별도로 남아 있다(같은 로직을 Node 스크립트로 복제 — 실행 환경이 달라
// 공유 모듈로 묶기보다 중복을 허용했다).
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

const DATA_GO_KR_BASE = "https://apis.data.go.kr/1160100/service";
const ETF_ENDPOINT = `${DATA_GO_KR_BASE}/GetSecuritiesProductInfoService/getETFPriceInfo`;
const STOCK_ENDPOINT = `${DATA_GO_KR_BASE}/GetStockSecuritiesInfoService/getStockPriceInfo`;
const PAGE_SIZE = 1000; // 한 페이지당 조회 건수 — ETF(~1,160)·KR개별주식(~2,770) 모두 2페이지 이내로 커버
const MAX_LOOKBACK_DAYS = 10; // 주말·공휴일을 감안해 기준일을 최대 며칠 전까지 거슬러 탐색할지
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수
const REQUEST_TIMEOUT_MS = 15_000; // 응답이 없는(hang) 요청이 배치 전체를 막지 않도록
// 보유 종목 수가 많아져도 PostgREST 기본 페이지 크기(1000)에 잘리지 않도록
// 넉넉한 Range를 명시한다.
const SUPABASE_QUERY_RANGE = "0-9999";

type DataGoKrResponse = {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: { totalCount: number; items?: { item?: DataGoKrPriceItem[] } };
  };
};

type DataGoKrPriceItem = {
  srtnCd?: string;
  clpr?: string | number;
  basDt?: string;
};

type PriceHit = { close_price: number; basDt: string };

export type FetchKrClosingPricesResult =
  | { status: "no_holdings" }
  | {
      status: "success" | "partial_failure";
      basDt: string;
      priceDate: string;
      matched: number;
      missing: string[];
      rows: { ticker: string; price_date: string; close_price: number }[];
    };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 네트워크 오류(fetch failed)·5xx·429 는 지수 백오프로 재시도한다.
const fetchWithRetry = async (url: string, options: RequestInit) => {
  let lastErr: unknown;
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

// KST 기준 yyyymmdd 문자열 (Vercel 함수는 UTC라 타임존을 명시해야 한다).
const toKstYyyymmdd = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(date)
    .replaceAll("-", "");

const assertNormalService = (json: DataGoKrResponse, endpoint: string) => {
  const header = json?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`${endpoint} 응답 오류: ${header?.resultCode} ${header?.resultMsg}`);
  }
};

const buildDataGoKrUrl = ({
  endpoint,
  apiKey,
  basDt,
  numOfRows,
  pageNo,
}: {
  endpoint: string;
  apiKey: string;
  basDt: string;
  numOfRows: number;
  pageNo: number;
}) =>
  // apiKey는 data.go.kr이 발급하는 시점에 이미 URL-encoding된 값이라 재인코딩하지 않는다.
  `${endpoint}?serviceKey=${apiKey}&numOfRows=${numOfRows}&pageNo=${pageNo}&resultType=json&basDt=${basDt}`;

// portfolio_assets 에서 실제 보유 중인 KR 티커 조회.
// assets!inner(market) 로 embed하고 assets.market=eq.KR 로 필터하면
// KR 종목을 보유한 portfolio_assets 행만 top-level 필터링된다.
// (asset_ticker가 NULL인 커스텀 종목 행은 assets와 매칭되지 않아
//  inner join에서 자연히 제외된다.)
const fetchHeldKrTickers = async ({ supabaseUrl, serviceRoleKey }: { supabaseUrl: string; serviceRoleKey: string }) => {
  const url = `${supabaseUrl}/rest/v1/portfolio_assets?select=asset_ticker,assets!inner(market)&assets.market=eq.KR`;
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
  const rows = (await res.json()) as { asset_ticker: string | null }[];
  const tickers = new Set(rows.map((r) => r.asset_ticker).filter((t): t is string => Boolean(t)));
  return [...tickers].sort();
};

// 최신 공개 종가 기준일(basDt) 탐색.
// data.go.kr은 특정 basDt를 지정해야 하고, 종가는 보통 1영업일 지연 공개된다.
// ETF 엔드포인트로 1건만 조회해 totalCount>0 인 날짜를 뒤에서부터 찾는다.
const findLatestAvailableBasDt = async ({ apiKey }: { apiKey: string }) => {
  let cursor = new Date();
  for (let i = 0; i < MAX_LOOKBACK_DAYS; i += 1) {
    const basDt = toKstYyyymmdd(cursor);
    const url = buildDataGoKrUrl({ endpoint: ETF_ENDPOINT, apiKey, basDt, numOfRows: 1, pageNo: 1 });
    const res = await fetchWithRetry(url, {});
    if (!res.ok) throw new Error(`${ETF_ENDPOINT} HTTP ${res.status}`);
    const json = (await res.json()) as DataGoKrResponse;
    assertNormalService(json, ETF_ENDPOINT);
    const totalCount = Number(json.response.body.totalCount ?? 0);
    if (totalCount > 0) return basDt;
    cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
  }
  throw new Error(`최근 ${MAX_LOOKBACK_DAYS}일 이내 공개된 종가 데이터를 찾지 못했습니다.`);
};

// 기준일의 종가 전체 조회(페이지네이션). 반환: Map<srtnCd(6자리 티커), PriceHit>
const fetchAllPrices = async ({ endpoint, apiKey, basDt }: { endpoint: string; apiKey: string; basDt: string }) => {
  const priceByTicker = new Map<string, PriceHit>();
  let pageNo = 1;
  let totalCount = Infinity;
  while ((pageNo - 1) * PAGE_SIZE < totalCount) {
    const url = buildDataGoKrUrl({ endpoint, apiKey, basDt, numOfRows: PAGE_SIZE, pageNo });
    const res = await fetchWithRetry(url, {});
    if (!res.ok) throw new Error(`${endpoint} HTTP ${res.status}`);
    const json = (await res.json()) as DataGoKrResponse;
    assertNormalService(json, endpoint);
    const body = json.response.body;
    totalCount = Number(body.totalCount ?? 0);
    const items = body.items?.item ?? [];
    for (const item of items) {
      if (!item.srtnCd || typeof item.clpr === "undefined" || !item.basDt) continue;
      priceByTicker.set(item.srtnCd, { close_price: Number(item.clpr), basDt: item.basDt });
    }
    pageNo += 1;
  }
  return priceByTicker;
};

// data.go.kr은 데이터셋(ETF/개별주식)별로 별도 활용신청이 필요하다 — 한쪽이
// 아직 미승인(403)이거나 일시 장애여도 다른 쪽 매칭은 그대로 살리기 위해
// 소스별로 독립적으로 실패를 흡수한다.
const fetchAllPricesSafely = async ({
  endpoint,
  apiKey,
  basDt,
  label,
  warnings,
}: {
  endpoint: string;
  apiKey: string;
  basDt: string;
  label: string;
  warnings: string[];
}) => {
  try {
    return await fetchAllPrices({ endpoint, apiKey, basDt });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    warnings.push(`${label} 종가 조회 실패, 이 소스는 건너뜁니다: ${message}`);
    return new Map<string, PriceHit>();
  }
};

// asset_prices upsert. 복합 PK (ticker, price_date) 기준으로 merge-duplicates.
const upsertAssetPrices = async ({
  supabaseUrl,
  serviceRoleKey,
  rows,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  rows: { ticker: string; price_date: string; close_price: number }[];
}) => {
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

export const fetchKrClosingPrices = async ({
  supabaseUrl,
  serviceRoleKey,
  dataGoKrApiKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dataGoKrApiKey: string;
  dryRun?: boolean;
}): Promise<{ result: FetchKrClosingPricesResult; warnings: string[] }> => {
  const warnings: string[] = [];

  const tickers = await fetchHeldKrTickers({ supabaseUrl, serviceRoleKey });
  if (tickers.length === 0) {
    return { result: { status: "no_holdings" }, warnings };
  }

  const basDt = await findLatestAvailableBasDt({ apiKey: dataGoKrApiKey });
  const etfPrices = await fetchAllPricesSafely({
    endpoint: ETF_ENDPOINT,
    apiKey: dataGoKrApiKey,
    basDt,
    label: "ETF",
    warnings,
  });
  const stockPrices = await fetchAllPricesSafely({
    endpoint: STOCK_ENDPOINT,
    apiKey: dataGoKrApiKey,
    basDt,
    label: "개별주식",
    warnings,
  });

  const priceDate = `${basDt.slice(0, 4)}-${basDt.slice(4, 6)}-${basDt.slice(6, 8)}`;
  const rows: { ticker: string; price_date: string; close_price: number }[] = [];
  const missing: string[] = [];
  for (const ticker of tickers) {
    const hit = etfPrices.get(ticker) ?? stockPrices.get(ticker);
    if (!hit) {
      missing.push(ticker);
      continue;
    }
    rows.push({ ticker, price_date: priceDate, close_price: hit.close_price });
  }

  if (rows.length === 0) {
    throw new Error(`수집된 종가가 하나도 없습니다(전체 실패). 대상 티커: ${tickers.join(", ")}`);
  }

  if (!dryRun) {
    await upsertAssetPrices({ supabaseUrl, serviceRoleKey, rows });
  }

  return {
    result: {
      status: missing.length > 0 ? "partial_failure" : "success",
      basDt,
      priceDate,
      matched: rows.length,
      missing,
      rows,
    },
    warnings,
  };
};
