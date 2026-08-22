// 미국 종목(개별주식) 확정 종가 배치.
//
// Finnhub(https://finnhub.io) /quote 엔드포인트에서 미국 장 마감 이후
// 최종 체결가를 가져와 asset_prices 테이블에 upsert한다. 무료 티어는
// 일별 확정 종가 캔들(/stock/candle)이 Premium 전용이라 쓸 수 없어,
// 장 마감 이후 /quote의 c(현재가=마지막 체결가)를 종가로 간주한다.
// 응답의 t(마지막 체결 타임스탬프)를 America/New_York 기준 날짜로
// 변환해 price_date로 저장한다 — 휴장일에는 직전 거래일의 t가
// 그대로 반환되므로 별도의 기준일 탐색이 필요 없다.
//
// Vercel Cron(app/api/cron/fetch-us-closing-prices/route.ts)이 매
// 평일(미국 장 마감 이후 시각) 이 함수를 호출한다. 로컬 수동 실행/
// dry-run 용도로는 scripts/fetch-us-closing-prices.mjs가 같은 로직을
// Node 스크립트로 복제해 별도로 남아 있다(fetchKrClosingPrices와 같은
// 이유로 공유 모듈 대신 중복을 허용했다).
//
// 흐름:
//   1. portfolio_assets 에서 실제 보유 중인 US 티커만 조회(전체 US 종목 대상 아님)
//   2. 대상 티커가 0개면 조용히 종료(정상 케이스)
//   3. 티커별로 /quote를 호출해 종가(c)·거래일(t→날짜)을 조회
//      존재하지 않는/상장폐지된 심볼은 필드가 전부 0으로 오므로 스킵 처리
//   4. 수집된 종가를 asset_prices 에 upsert(복합 PK 기준 merge-duplicates)
//   5. 매칭 0건(전체 실패)이면 예외, 일부라도 매칭되면 성공

const FINNHUB_QUOTE_ENDPOINT = "https://finnhub.io/api/v1/quote";
const REQUEST_DELAY_MS = 150; // 요청 간 지연 — Finnhub 무료 티어(60건/분) 여유가 크지만 예의상 소폭 페이싱
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수
const REQUEST_TIMEOUT_MS = 10_000; // 응답이 없는(hang) 요청이 배치 전체를 막지 않도록
// 보유 종목 수가 많아져도 PostgREST 기본 페이지 크기(1000)에 잘리지 않도록
// 넉넉한 Range를 명시한다.
const SUPABASE_QUERY_RANGE = "0-9999";

type FinnhubQuote = { c: number; h: number; l: number; o: number; pc: number; t: number };

export type FetchUsClosingPricesResult =
  | { status: "no_holdings" }
  | {
      status: "success" | "partial_failure";
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

// America/New_York 기준 yyyy-mm-dd 문자열.
const toNyDateString = (unixSeconds: number) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date(unixSeconds * 1000));

// portfolio_assets 에서 실제 보유 중인 US 티커 조회.
// assets!inner(market) 로 embed하고 assets.market=eq.US 로 필터하면
// US 종목을 보유한 portfolio_assets 행만 top-level 필터링된다.
const fetchHeldUsTickers = async ({ supabaseUrl, serviceRoleKey }: { supabaseUrl: string; serviceRoleKey: string }) => {
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
  const rows = (await res.json()) as { asset_ticker: string | null }[];
  const tickers = new Set(rows.map((r) => r.asset_ticker).filter((t): t is string => Boolean(t)));
  return [...tickers].sort();
};

// 반환: 성공 시 { price_date, close_price }, 존재하지 않는/상장폐지 심볼이면 null
const fetchQuote = async ({ ticker, apiKey }: { ticker: string; apiKey: string }) => {
  const url = `${FINNHUB_QUOTE_ENDPOINT}?symbol=${encodeURIComponent(ticker)}&token=${apiKey}`;
  const res = await fetchWithRetry(url, {});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const quote = (await res.json()) as FinnhubQuote;
  // Finnhub는 존재하지 않는 심볼도 200과 함께 모든 필드 0으로 응답한다.
  if (!quote.t || !quote.c) return null;
  return { price_date: toNyDateString(quote.t), close_price: quote.c };
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

export const fetchUsClosingPrices = async ({
  supabaseUrl,
  serviceRoleKey,
  finnhubApiKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  finnhubApiKey: string;
  dryRun?: boolean;
}): Promise<FetchUsClosingPricesResult> => {
  const tickers = await fetchHeldUsTickers({ supabaseUrl, serviceRoleKey });
  if (tickers.length === 0) {
    return { status: "no_holdings" };
  }

  const rows: { ticker: string; price_date: string; close_price: number }[] = [];
  const missing: string[] = [];
  for (const ticker of tickers) {
    if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS);
    const quote = await fetchQuote({ ticker, apiKey: finnhubApiKey });
    if (!quote) {
      missing.push(ticker);
      continue;
    }
    rows.push({ ticker, ...quote });
  }

  if (rows.length === 0) {
    throw new Error(`수집된 종가가 하나도 없습니다(전체 실패). 대상 티커: ${tickers.join(", ")}`);
  }

  if (!dryRun) {
    await upsertAssetPrices({ supabaseUrl, serviceRoleKey, rows });
  }

  return {
    status: missing.length > 0 ? "partial_failure" : "success",
    matched: rows.length,
    missing,
    rows,
  };
};
