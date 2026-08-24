// shares = 그 달에 실제로 보유하고 있던 수량 추정치(computeSharesTimeline
// 기반, computeAveragePurchases.ts). 스키마에 저장된 값이 아니라 조회
// 시점에 execution_records로부터 매번 다시 계산된다.
export type DividendInputEntry = { month: string; amount: number; shares: number };

export type DividendDeclineSignal = { dropPercent: number };

// 최근월 대비 직전월 배당금이 상대적으로 얼마나 하락했는지 계산해
// 5% 이상 하락하면 "교체 고려" 신호를 낸다(#75). 입력 이력이 2개월
// 미만이면 비교 대상이 없어 판단을 보류한다(null).
export const DIVIDEND_DECLINE_THRESHOLD = 0.05;

export const computeDividendDeclineSignal = (
  history: Pick<DividendInputEntry, "month" | "amount">[]
): DividendDeclineSignal | null => {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.month.localeCompare(b.month));
  const curr = sorted[sorted.length - 1].amount;
  const prev = sorted[sorted.length - 2].amount;
  if (prev <= 0) return null;

  const dropRatio = (prev - curr) / prev;
  if (dropRatio < DIVIDEND_DECLINE_THRESHOLD) return null;

  return { dropPercent: Math.round(dropRatio * 1000) / 10 };
};
