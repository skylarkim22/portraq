// SOL(신한자산운용) ETF 분배 내역 배치.
//
// ETF 분배금은 공식 공개 API가 없어(#76 fetchKrStockDividends.ts 헤더
// 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접 수집한다.
// SOL은 상품 목록 API(`/api/etf/pds`)가 KRX 티커(ETF_CD6)와 내부
// 상품코드(FUND_CD)를 함께 제공해 이름 매칭이 필요 없다. 분배 엑셀은
// 상품별로 2단계(토큰 발급 → 토큰으로 다운로드)를 거쳐야 하고, 토큰이
// 120초 후 만료되므로 상품마다 토큰 발급 직후 곧바로 다운로드한다.
//
// 토큰 발급 엔드포인트에 IP 기준 rate limit이 걸려 있어(실측: 동시
// 10개 요청 시 즉시 차단) CONCURRENCY를 낮게 유지하고, rate limit
// 응답("Rate limit exceeded")을 받으면 지수 백오프로 재시도한다.
// 상품 수(약 80개)가 많아 순차 처리만으로는 Vercel maxDuration(60초)을
// 넘길 수 있어(#76 프로덕션 타임아웃 사례 참고) 소규모 배치 단위로
// 병렬 처리한다.
//
// 엑셀 컬럼: 지급기준일, 실제지급일, 분배금액(원). 날짜는 "20251230"
// 형식(8자리, KODEX와 동일).

import * as XLSX from "xlsx";
import { fetchValidKrTickers } from "@/features/asset-prices/assetCatalog";
import { upsertAssetDividends, type AssetDividendRow } from "@/features/asset-prices/upsertAssetDividends";

const SOURCE = "SOL";
const PRODUCT_LIST_URL = "https://www.soletf.com/api/etf/pds";
const TOKEN_URL = "https://www.soletf.com/file/token/fund";
const DOWNLOAD_URL_BASE = "https://www.soletf.com/api/etf/pds/down/dividend";
const PDS_REFERER = "https://www.soletf.com/ko/fund/etf/pds";
const REQUEST_TIMEOUT_MS = 20_000;
const CONCURRENCY = 3;
const TOKEN_RETRY_LIMIT = 4;
const TOKEN_RETRY_BASE_DELAY_MS = 2_000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type SolProduct = { ticker: string; fundCode: string };

const toIsoDate = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const digits = String(value).trim();
  return /^\d{8}$/.test(digits) ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : null;
};

const fetchProductList = async (): Promise<SolProduct[]> => {
  const products: SolProduct[] = [];
  let page = 1;
  for (;;) {
    const url = `${PRODUCT_LIST_URL}?keyword=&page=${page}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
    const data = (await res.json()) as { items: { ETF_CD6: string; FUND_CD: string }[]; toalPage: number };
    for (const item of data.items) products.push({ ticker: item.ETF_CD6, fundCode: item.FUND_CD });
    if (page >= data.toalPage) break;
    page += 1;
  }
  return products;
};

const fetchToken = async (fundCode: string): Promise<string | null> => {
  for (let attempt = 0; attempt <= TOKEN_RETRY_LIMIT; attempt += 1) {
    const res = await fetch(`${TOKEN_URL}?fundCode=${fundCode}&downloadType=dividend`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`${TOKEN_URL} HTTP ${res.status}`);
    const data = (await res.json()) as { success?: boolean; token?: string; error?: string };
    if (data.success && data.token) return data.token;
    if (data.error !== "Rate limit exceeded" || attempt === TOKEN_RETRY_LIMIT) return null;
    await delay(TOKEN_RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  return null;
};

const fetchProductDividendRows = async ({
  product,
  validTickers,
}: {
  product: SolProduct;
  validTickers: Set<string>;
}): Promise<AssetDividendRow[]> => {
  if (!validTickers.has(product.ticker)) return [];

  const token = await fetchToken(product.fundCode);
  if (!token) return [];

  const downloadUrl = `${DOWNLOAD_URL_BASE}/${product.fundCode}?token=${token}`;
  const downloadRes = await fetch(downloadUrl, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Referer: PDS_REFERER, "X-Requested-With": "XMLHttpRequest" },
  });
  if (!downloadRes.ok) throw new Error(`${downloadUrl} HTTP ${downloadRes.status}`);
  const buffer = Buffer.from(await downloadRes.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];

  const headerRowIndex = grid.findIndex((row) => row.includes("지급기준일"));
  if (headerRowIndex === -1) return [];
  const header = grid[headerRowIndex] as string[];
  const recordDateCol = header.indexOf("지급기준일");
  const payDateCol = header.indexOf("실제지급일");
  const amountCol = header.indexOf("분배금액(원)");
  if ([recordDateCol, payDateCol, amountCol].some((i) => i === -1)) return [];

  const rows: AssetDividendRow[] = [];
  for (const row of grid.slice(headerRowIndex + 1)) {
    const recordDate = toIsoDate(row[recordDateCol]);
    if (!recordDate) continue;
    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rows.push({ ticker: product.ticker, record_date: recordDate, pay_date: toIsoDate(row[payDateCol]), dividend_reason: null, amount, source: SOURCE });
  }
  return rows;
};

const fetchInBatches = async <T, R>({ items, batchSize, handler }: { items: T[]; batchSize: number; handler: (item: T) => Promise<R> }): Promise<R[]> => {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(handler))));
  }
  return results;
};

export const fetchSolEtfDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun?: boolean;
}) => {
  const validTickers = await fetchValidKrTickers({ supabaseUrl, serviceRoleKey });
  const products = await fetchProductList();

  const rowsByProduct = await fetchInBatches({
    items: products,
    batchSize: CONCURRENCY,
    handler: (product) => fetchProductDividendRows({ product, validTickers }),
  });

  const rows = rowsByProduct.flat();

  if (!dryRun) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }

  return { matchedTickers: new Set(rows.map((r) => r.ticker)).size, rowCount: rows.length };
};
