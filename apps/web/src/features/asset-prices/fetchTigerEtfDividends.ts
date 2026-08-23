// TIGER(미래에셋자산운용) ETF 분배 내역 배치.
//
// ETF 분배금은 공식 공개 API가 없어(#76 fetchKrStockDividends.ts 헤더
// 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접 수집한다.
// TIGER의 엑셀 다운로드는 "그달의 분배 내역"만 주는 월별 스냅샷이라
// (selectYear/selectMonth), 최근 MONTHS_BACK개월을 각각 조회해야
// 넓은 이력을 모을 수 있다 — 월마다 분배 종목 구성이 다르다(예:
// TIGER 증권은 7월에만 나타남).
//
// 종목코드가 없어 종목명으로만 식별된다 — assets 카탈로그(KR 전체)와
// 이름으로 매칭한다(fetchKrNameToTicker). 파일 쪽 종목명에 앞뒤 공백이
// 섞여 있어 trim 후 비교한다.
//
// 응답 컬럼: 종목명, 유형, 지급기준일, 실제지급일, 주당분배금(원),
// 주당과세표준액(원), 분배율(%)

import * as cheerio from "cheerio";
import { fetchKrNameToTicker } from "@/features/asset-prices/assetCatalog";
import { upsertAssetDividends, type AssetDividendRow } from "@/features/asset-prices/upsertAssetDividends";

const SOURCE = "TIGER";
const EXCEL_URL_BASE = "https://investments.miraeasset.com/tigeretf/ko/distribution/overall/excel.do";
const MONTHS_BACK = 12;
const REQUEST_TIMEOUT_MS = 20_000;

const monthsToFetch = () => {
  const now = new Date();
  return Array.from({ length: MONTHS_BACK }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
};

const fetchMonthRows = async ({
  year,
  month,
  nameToTicker,
}: {
  year: number;
  month: number;
  nameToTicker: Map<string, string>;
}): Promise<AssetDividendRow[]> => {
  const url = `${EXCEL_URL_BASE}?pageIndex=1&listCnt=1000&orderC=&orderType=&selectYear=${year}&selectMonth=${month}&orderB=ratioDESC&q=`;
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Referer: "https://investments.miraeasset.com/tigeretf/ko/distribution/overall/list.do" },
  });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const rows: AssetDividendRow[] = [];
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

export const fetchTigerEtfDividends = async ({
  supabaseUrl,
  serviceRoleKey,
  dryRun = false,
}: {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun?: boolean;
}) => {
  const nameToTicker = await fetchKrNameToTicker({ supabaseUrl, serviceRoleKey });

  const monthResults = await Promise.all(
    monthsToFetch().map((m) => fetchMonthRows({ ...m, nameToTicker }))
  );

  // 같은 (ticker, record_date)가 여러 달 조회에서 중복으로 잡힐 수 있어(경계
  // 월 등) Map으로 합쳐 중복을 제거한다.
  const rowByKey = new Map<string, AssetDividendRow>();
  for (const rows of monthResults) {
    for (const row of rows) rowByKey.set(`${row.ticker}|${row.record_date}`, row);
  }
  const rows = [...rowByKey.values()];

  if (!dryRun) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }

  return { matchedTickers: new Set(rows.map((r) => r.ticker)).size, rowCount: rows.length };
};
