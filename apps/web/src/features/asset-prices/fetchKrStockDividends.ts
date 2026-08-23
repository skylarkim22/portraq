// KR 개별주식 배당 이력 배치.
//
// data.go.kr(공공데이터포털) 금융위원회_주식배당정보(GetStocDiviInfoService_V2,
// 한국예탁결제원 제공)에서 배당 이력을 가져와 asset_dividends 테이블에 upsert한다.
//
// 이 API는 KR 종가 API들과 달리 "그날의 시세"가 아니라 전체 상장사의
// 배당 이력 전체(수만 건)를 담고 있고, 티커/ISIN으로 서버 필터링하는
// 파라미터가 없다(법인등록번호·회사명만 가능) — 그래서 매 실행마다
// numOfRows=10000 페이지로 전체를 순회하며 응답의 isinCd(예: KR7000020008)에서
// 티커(6자리, isin.slice(3, 9))를 뽑아 보유 티커와 일치하는 행만 골라낸다.
// ETF는 이 API에 아예 없다(개별주식 배당 전용 — ETF 분배금은 별도 후속 이슈).
//
// Vercel Cron(app/api/cron/fetch-kr-stock-dividends/route.ts)이 매일 한 번
// 이 함수를 호출한다. 로컬 수동 실행/dry-run 용도로는
// scripts/fetch-kr-stock-dividends.mjs가 같은 로직을 Node 스크립트로
// 복제해 별도로 남아 있다.

const DATA_GO_KR_DIVIDEND_ENDPOINT = "https://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2";
const PAGE_SIZE = 10_000; // 전체 약 7~8만 건을 이 크기로 나눠 순회
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 30_000; // Vercel(미국 리전) → data.go.kr 경로가 로컬보다 훨씬 느려 넉넉하게 잡는다
const DIVIDEND_TYPE_CASH = "02"; // stckDvdnRcd: 현금배당만 취급(주식배당 등 제외)

type DataGoKrDividendResponse = {
  response: {
    header: { resultCode: string; resultMsg: string };
    body: { totalCount: number; items?: { item?: DividendItem[] } };
  };
};

type DividendItem = {
  isinCd?: string;
  dvdnBasDt?: string;
  cashDvdnPayDt?: string;
  stckDvdnRcd?: string;
  stckDvdnRcdNm?: string;
  stckGenrDvdnAmt?: string;
};

type AssetDividendRow = {
  ticker: string;
  record_date: string;
  pay_date: string | null;
  dividend_reason: string | null;
  amount: number;
  source: "DATA_GO_KR";
};

export type FetchKrStockDividendsResult =
  | { status: "no_holdings" }
  | { status: "success" | "partial_failure"; matched: number; missing: string[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (url: string) => {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
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

const isinToTicker = (isinCd: string) => isinCd.slice(3, 9);

const toIsoDate = (yyyymmdd: string) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;

// cashDvdnPayDt는 값이 없으면 빈 문자열로 온다(예: stckHndvDt와 동일 패턴).
const toIsoDateOrNull = (yyyymmdd?: string) => (yyyymmdd && yyyymmdd.length === 8 ? toIsoDate(yyyymmdd) : null);

// portfolio_assets 에서 실제 보유 중인 KR 티커 조회(ETF 포함 — 이 API엔 없어도
// 자연히 매칭 안 되고 넘어간다).
const fetchHeldKrTickers = async ({ supabaseUrl, serviceRoleKey }: { supabaseUrl: string; serviceRoleKey: string }) => {
  const url = `${supabaseUrl}/rest/v1/portfolio_assets?select=asset_ticker,assets!inner(market)&assets.market=eq.KR`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: "0-9999",
      "Range-Unit": "items",
    },
  });
  if (!res.ok) {
    throw new Error(`portfolio_assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = (await res.json()) as { asset_ticker: string | null }[];
  return new Set(rows.map((r) => r.asset_ticker).filter((t): t is string => Boolean(t)));
};

const buildPageUrl = ({ apiKey, pageNo }: { apiKey: string; pageNo: number }) =>
  `${DATA_GO_KR_DIVIDEND_ENDPOINT}?serviceKey=${apiKey}&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}&resultType=json`;

const fetchDividendPage = async ({ apiKey, pageNo }: { apiKey: string; pageNo: number }) => {
  const res = await fetchWithRetry(buildPageUrl({ apiKey, pageNo }));
  if (!res.ok) throw new Error(`${DATA_GO_KR_DIVIDEND_ENDPOINT} HTTP ${res.status}`);
  const json = (await res.json()) as DataGoKrDividendResponse;
  const header = json?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`${DATA_GO_KR_DIVIDEND_ENDPOINT} 응답 오류: ${header?.resultCode} ${header?.resultMsg}`);
  }
  return json.response.body;
};

const toRows = (items: DividendItem[], heldTickers: Set<string>) => {
  const rows: AssetDividendRow[] = [];
  for (const item of items) {
    if (!item.isinCd || !item.dvdnBasDt || item.stckDvdnRcd !== DIVIDEND_TYPE_CASH) continue;
    const ticker = isinToTicker(item.isinCd);
    if (!heldTickers.has(ticker)) continue;
    const amount = Number(item.stckGenrDvdnAmt ?? 0);
    if (amount <= 0) continue;
    rows.push({
      ticker,
      record_date: toIsoDate(item.dvdnBasDt),
      pay_date: toIsoDateOrNull(item.cashDvdnPayDt),
      dividend_reason: item.stckDvdnRcdNm ?? null,
      amount,
      source: "DATA_GO_KR",
    });
  }
  return rows;
};

// 전체 배당 이력을 페이지네이션으로 순회하며 보유 티커와 일치하는 현금배당
// 행만 골라 asset_dividends upsert용 row로 변환한다. Vercel(미국 리전)에서
// data.go.kr까지 왕복 지연이 커서(로컬 대비 수 배) 순차 조회 시 Vercel 함수
// 실행 제한(maxDuration)을 넘기기 쉽다 — 1페이지로 totalCount·페이지 수를
// 먼저 확인한 뒤 나머지 페이지는 전부 병렬로 요청해 총 소요 시간을
// "페이지 수 × 응답시간"이 아니라 "가장 느린 페이지 1개" 수준으로 줄인다.
const fetchMatchingDividendRows = async ({
  apiKey,
  heldTickers,
}: {
  apiKey: string;
  heldTickers: Set<string>;
}) => {
  const firstPage = await fetchDividendPage({ apiKey, pageNo: 1 });
  const totalCount = Number(firstPage.totalCount ?? 0);
  const rows = toRows(firstPage.items?.item ?? [], heldTickers);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages > 1) {
    const remainingPageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const remainingPages = await Promise.all(
      remainingPageNumbers.map((pageNo) => fetchDividendPage({ apiKey, pageNo }))
    );
    for (const page of remainingPages) {
      rows.push(...toRows(page.items?.item ?? [], heldTickers));
    }
  }

  return rows;
};

// asset_dividends upsert. 복합 유니크 키 (ticker, record_date) 기준으로 merge-duplicates.
const upsertAssetDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  rows,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  rows: AssetDividendRow[];
}) => {
  // asset_dividends는 id(UUID)가 PK라 on_conflict 없이는 merge-duplicates가
  // PK 기준으로 시도돼 항상 새 행으로 취급된다 — 실제 유니크 제약인
  // (ticker, record_date)를 명시해야 한다.
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

export const fetchKrStockDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  dataGoKrApiKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dataGoKrApiKey: string;
  dryRun?: boolean;
}): Promise<FetchKrStockDividendsResult> => {
  const heldTickers = await fetchHeldKrTickers({ supabaseUrl, serviceRoleKey });
  if (heldTickers.size === 0) {
    return { status: "no_holdings" };
  }

  const rows = await fetchMatchingDividendRows({ apiKey: dataGoKrApiKey, heldTickers });
  const matchedTickers = new Set(rows.map((r) => r.ticker));
  const missing = [...heldTickers].filter((t) => !matchedTickers.has(t)).sort();

  if (!dryRun && rows.length > 0) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }

  return {
    status: missing.length > 0 ? "partial_failure" : "success",
    matched: matchedTickers.size,
    missing,
  };
};
