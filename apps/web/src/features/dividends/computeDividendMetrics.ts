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

const trailing12MonthEntries = (manualHistory: DividendInputEntry[], asOf: Date) =>
  manualHistory.filter((entry) => isMonthWithinTrailing12Months(entry.month, asOf));

// 배당합 = 사용자가 직접 입력한 최근 12개월 배당금 합계(실수령액 그대로).
// asset_dividends 추정치로 폴백하지 않는다(#75) — 입력이 없으면 0.
export const computeDividendSum = (
  manualHistory: DividendInputEntry[],
  asOf: Date = new Date()
): number =>
  trailing12MonthEntries(manualHistory, asOf).reduce((sum, entry) => sum + entry.amount, 0);

// 연환산수익률 = 입력월별 "그 달 실제 보유 수량 기준 주당 배당금"을
// 평균 낸 값을 12개월로 환산 ÷ 매수 단가(avgPrice).
// 리밸런싱으로 중간에 수량이 늘어나면(예: 100주 → 150주) 예전 달의
// 배당 실수령액은 더 작은 수량 기준이라, 늘어난 현재 투자금(avgPrice×
// 현재shares)으로 그냥 나누면 수익률이 실제보다 낮게 나온다. 각 입력월의
// 배당금을 "그 달 당시 보유 수량"(entry.shares, computeSharesTimeline
// 기반)으로 먼저 나눠 주당 배당금으로 정규화한 뒤 평균·연환산하면, 수량
// 변화와 무관하게 매수 단가 대비 일관된 수익률이 나온다. avgPrice가
// 0이거나(=보유 없음) 입력이 아예 없으면 계산할 수 없다.
export const computeAnnualizedYield = ({
  manualHistory,
  avgPrice,
  asOf = new Date(),
}: {
  manualHistory: DividendInputEntry[];
  avgPrice: number;
  asOf?: Date;
}): number | null => {
  if (avgPrice <= 0) return null;

  const entries = trailing12MonthEntries(manualHistory, asOf).filter((entry) => entry.shares > 0);
  if (entries.length === 0) return 0;

  const perShareAmounts = entries.map((entry) => entry.amount / entry.shares);
  const avgPerShareMonth = perShareAmounts.reduce((sum, value) => sum + value, 0) / perShareAmounts.length;
  const annualizedPerShare = avgPerShareMonth * 12;
  return Math.round((annualizedPerShare / avgPrice) * 1000) / 10;
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
// 1~12월이 전부 채워져 있으면(매달 지급) "월배당"으로 축약한다.
export const formatPaySchedule = (dividendMonths: number[] | null): string | null => {
  if (!dividendMonths || dividendMonths.length === 0) return null;
  const sorted = [...dividendMonths].sort((a, b) => a - b);
  const isEveryMonth = sorted.length === 12 && sorted.every((month, i) => month === i + 1);
  if (isEveryMonth) return "월배당";
  return `${sorted.join("·")}월`;
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
