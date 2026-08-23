// KODEX(삼성자산운용) ETF 분배금 배치.
//
// ETF 분배금은 공식 공개 API가 없어(#76 fetchKrStockDividends.ts 헤더
// 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접 수집한다.
// KODEX는 인증 없는 단일 GET으로 전체 상품의 분배 이력을 한 번에
// 받을 수 있다(m.samsungfund.com/excel-distribution.do).
//
// 우리 assets 카탈로그에 있는 KR 티커만 걸러 저장한다(보유 여부와
// 무관 — #75/#76, assetCatalog.ts 참고). 상품코드가 곧 KRX 티커라
// 별도 매핑이 필요 없다.
//
// 응답 컬럼(3번째 행이 헤더): 상품명, 상품코드, 유형, 지급기준일,
// 실지급일, 분배율(%), 주당분배금, 주당과세표준액

import * as XLSX from "xlsx";
import { fetchValidKrTickers } from "@/features/asset-prices/assetCatalog";
import { upsertAssetDividends, type AssetDividendRow } from "@/features/asset-prices/upsertAssetDividends";

const SOURCE = "KODEX";
const EXCEL_URL = "https://m.samsungfund.com/excel-distribution.do?ordrColm=DIVID_Y&period=12&ordrSort=DESC&srchVal=";
const REQUEST_TIMEOUT_MS = 20_000;

// 지급기준일/실지급일은 "20260731" 같은 8자리 문자열로 오거나, 셀 서식에
// 따라 엑셀 날짜 일련번호(숫자)로 올 수 있어 둘 다 처리한다.
const toIsoDate = (value: unknown): string | null => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${parsed.y}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  const digits = String(value).trim();
  return /^\d{8}$/.test(digits) ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : null;
};

export const fetchKodexEtfDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun?: boolean;
}) => {
  const validTickers = await fetchValidKrTickers({ supabaseUrl, serviceRoleKey });

  const res = await fetch(EXCEL_URL, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`${EXCEL_URL} HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];

  const headerRowIndex = grid.findIndex((row) => row.includes("상품코드"));
  if (headerRowIndex === -1) throw new Error('헤더 행("상품코드" 포함)을 찾지 못했습니다 — 파일 형식이 바뀌었을 수 있습니다.');
  const header = grid[headerRowIndex] as string[];
  const tickerCol = header.indexOf("상품코드");
  const recordDateCol = header.indexOf("지급기준일");
  const payDateCol = header.indexOf("실지급일");
  const amountCol = header.indexOf("주당분배금");
  if ([tickerCol, recordDateCol, payDateCol, amountCol].some((i) => i === -1)) {
    throw new Error("필요한 컬럼(상품코드/지급기준일/실지급일/주당분배금) 중 일부를 찾지 못했습니다.");
  }

  const rows: AssetDividendRow[] = [];
  for (const row of grid.slice(headerRowIndex + 1)) {
    const ticker = String(row[tickerCol] ?? "").trim();
    if (!ticker || !validTickers.has(ticker)) continue;
    const recordDate = toIsoDate(row[recordDateCol]);
    if (!recordDate) continue;
    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rows.push({
      ticker,
      record_date: recordDate,
      pay_date: toIsoDate(row[payDateCol]),
      dividend_reason: null,
      amount,
      source: SOURCE,
    });
  }

  if (!dryRun) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }

  return { matchedTickers: new Set(rows.map((r) => r.ticker)).size, rowCount: rows.length };
};
