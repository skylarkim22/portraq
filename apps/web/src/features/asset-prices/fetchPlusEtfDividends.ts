// PLUS(한화자산운용) ETF 분배 내역 배치.
//
// ETF 분배금은 공식 공개 API가 없어(#76 fetchKrStockDividends.ts 헤더
// 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접 수집한다.
// PLUS는 상품 목록 API가 없어 상품 개요 페이지(product/overview)의 정적
// HTML에서 상품명↔내부코드(n)를 정규식으로 추출한 뒤, 상품마다 개별
// 분배 엑셀을 내려받는다. 상품 수(100개 이상)가 많아 순차 요청 시
// Vercel maxDuration(60초)을 넘길 수 있어(#76 프로덕션 타임아웃 사례
// 참고) CONCURRENCY 단위로 나눠 병렬 처리한다.
//
// 종목코드가 없어 종목명으로만 식별된다 — assets 카탈로그(KR 전체)와
// 이름으로 매칭한다(fetchKrNameToTicker).
//
// 엑셀 컬럼: 지급 기준일, 실 지급일, 분배금 (원). 날짜는 "2026.07.31"
// 형식(점 구분).

import * as XLSX from "xlsx";
import { fetchKrNameToTicker } from "@/features/asset-prices/assetCatalog";
import { upsertAssetDividends, type AssetDividendRow } from "@/features/asset-prices/upsertAssetDividends";

const SOURCE = "PLUS";
const OVERVIEW_URL = "https://www.plusetf.co.kr/product/overview";
const DIVIDEND_EXCEL_URL_BASE = "https://www.plusetf.co.kr/excel/product/dividend";
const REQUEST_TIMEOUT_MS = 20_000;
const CONCURRENCY = 10;

const PRODUCT_LINK_PATTERN = /product\/detail\?n=(\d+)">([^<]+)/g;

const toIsoDate = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  const match = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(text);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
};

const fetchProductList = async (): Promise<{ code: string; name: string }[]> => {
  const res = await fetch(OVERVIEW_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${OVERVIEW_URL} HTTP ${res.status}`);
  const html = await res.text();
  const products: { code: string; name: string }[] = [];
  for (const match of html.matchAll(PRODUCT_LINK_PATTERN)) {
    products.push({ code: match[1], name: match[2].trim() });
  }
  return products;
};

const fetchProductDividendRows = async ({
  product,
  nameToTicker,
}: {
  product: { code: string; name: string };
  nameToTicker: Map<string, string>;
}): Promise<AssetDividendRow[]> => {
  const ticker = nameToTicker.get(product.name);
  if (!ticker) return [];

  const url = `${DIVIDEND_EXCEL_URL_BASE}?&n=${product.code}&title=${encodeURIComponent(product.name)}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];

  const headerRowIndex = grid.findIndex((row) => row.includes("지급 기준일"));
  if (headerRowIndex === -1) return [];
  const header = grid[headerRowIndex] as string[];
  const recordDateCol = header.indexOf("지급 기준일");
  const payDateCol = header.indexOf("실 지급일");
  const amountCol = header.indexOf("분배금 (원)");
  if ([recordDateCol, payDateCol, amountCol].some((i) => i === -1)) return [];

  const rows: AssetDividendRow[] = [];
  for (const row of grid.slice(headerRowIndex + 1)) {
    const recordDate = toIsoDate(row[recordDateCol]);
    if (!recordDate) continue;
    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rows.push({ ticker, record_date: recordDate, pay_date: toIsoDate(row[payDateCol]), dividend_reason: null, amount, source: SOURCE });
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

export const fetchPlusEtfDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun?: boolean;
}) => {
  const nameToTicker = await fetchKrNameToTicker({ supabaseUrl, serviceRoleKey });
  const products = await fetchProductList();

  const rowsByProduct = await fetchInBatches({
    items: products,
    batchSize: CONCURRENCY,
    handler: (product) => fetchProductDividendRows({ product, nameToTicker }),
  });

  const rows = rowsByProduct.flat();

  if (!dryRun) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }

  return { matchedTickers: new Set(rows.map((r) => r.ticker)).size, rowCount: rows.length };
};
