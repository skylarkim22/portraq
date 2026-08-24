import type { DividendInputEntry } from "@/features/dividends/computeDividendTrend";

export type AssetDividendRecord = { recordDate: string; amount: number };

const isWithinTrailing12Months = (dateIso: string, asOf: Date) => {
  const cutoff = new Date(asOf.getFullYear(), asOf.getMonth() - 11, 1);
  return new Date(dateIso) >= cutoff;
};

const isMonthWithinTrailing12Months = (monthKey: string, asOf: Date) => {
  const [year, month] = monthKey.split("-").map(Number);
  const cutoff = new Date(asOf.getFullYear(), asOf.getMonth() - 11, 1);
  return new Date(year, month - 1, 1) >= cutoff;
};

// 배당합 = 사용자가 직접 입력한 최근 12개월 배당금 합계. asset_dividends
// 추정치로 폴백하지 않는다(#75) — 입력이 없으면 0.
export const computeDividendSum = (
  manualHistory: DividendInputEntry[],
  asOf: Date = new Date()
): number =>
  manualHistory
    .filter((entry) => isMonthWithinTrailing12Months(entry.month, asOf))
    .reduce((sum, entry) => sum + entry.amount, 0);

// 연환산수익률 = 배당합 ÷ 투자금(매수가 × 수량) — 내가 실제로 낸 원금
// 대비 실현 수익률. 투자금이 0이면 계산할 수 없다(null).
export const computeAnnualizedYield = ({
  dividendSum,
  avgPrice,
  shares,
}: {
  dividendSum: number;
  avgPrice: number;
  shares: number;
}): number | null => {
  const invested = avgPrice * shares;
  if (invested <= 0) return null;
  return Math.round((dividendSum / invested) * 1000) / 10;
};

// 기대 배당률 = asset_dividends의 최근 12개월 주당 배당금 합 ÷ 현재가.
// 매수 단가가 아니라 현재가 기준이라 "지금 사면 기대할 수 있는 수익률"을
// 뜻한다(연환산수익률과는 다른 지표).
export const computeExpectedYield = ({
  dividendRecords,
  currentPrice,
  asOf = new Date(),
}: {
  dividendRecords: AssetDividendRecord[];
  currentPrice: number;
  asOf?: Date;
}): number | null => {
  if (currentPrice <= 0) return null;
  const perShareAnnual = dividendRecords
    .filter((record) => isWithinTrailing12Months(record.recordDate, asOf))
    .reduce((sum, record) => sum + record.amount, 0);
  if (perShareAnnual <= 0) return null;
  return Math.round((perShareAnnual / currentPrice) * 1000) / 10;
};

// assets.dividend_months([2,5,8,11]) → "2·5·8·11월" 형태로 포맷한다.
export const formatPaySchedule = (dividendMonths: number[] | null): string | null => {
  if (!dividendMonths || dividendMonths.length === 0) return null;
  return `${[...dividendMonths].sort((a, b) => a - b).join("·")}월`;
};

export type DividendNoDataReason = "policy" | "new";

// 배당일/기대배당률이 비어있는 이유를 구분한다: 카탈로그에
// dividend_frequency가 아예 없으면(무배당 정책) 'policy', 배당 정책은
// 있는데 asset_dividends에 최근 12개월 이력이 아직 없으면(신규 편입 등) 'new'.
export const deriveNoDataReason = ({
  dividendFrequency,
  expectedYield,
}: {
  dividendFrequency: string | null;
  expectedYield: number | null;
}): DividendNoDataReason | null => {
  if (dividendFrequency === null) return "policy";
  if (expectedYield === null) return "new";
  return null;
};
