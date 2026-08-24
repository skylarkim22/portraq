import type { ActionItem } from "@portraq/lib/types";

export type AveragePurchase = {
  ticker: string;
  avgPrice: number;
  shares: number;
};

// execution_records를 executed_at 오름차순으로 순회하며 이동평균법으로
// 티커별 평균 매수 단가·보유 수량을 계산한다(#75). 매도는 수량만 차감하고
// 평균 단가는 그대로 유지한다(증권사 잔고평균단가 방식과 동일).
export const computeAveragePurchases = (
  orderedExecutionRecords: { actions: ActionItem[] }[]
): Map<string, AveragePurchase> => {
  const state = new Map<string, AveragePurchase>();

  for (const record of orderedExecutionRecords) {
    for (const action of record.actions) {
      const current = state.get(action.ticker) ?? { ticker: action.ticker, avgPrice: 0, shares: 0 };

      if (action.action === "buy") {
        const newShares = current.shares + action.quantity;
        const newAvgPrice =
          newShares > 0
            ? (current.avgPrice * current.shares + action.pricePerShare * action.quantity) / newShares
            : 0;
        state.set(action.ticker, { ticker: action.ticker, avgPrice: newAvgPrice, shares: newShares });
      } else if (action.action === "sell") {
        state.set(action.ticker, { ...current, shares: Math.max(0, current.shares - action.quantity) });
      }
    }
  }

  return state;
};

export type ReconciledPurchase = { avgPrice: number; shares: number };

// buy/sell 액션으로 추적된 이동평균 매수단가(computeAveragePurchases 결과)는
// 이 앱에 등록하기 전부터 이미 보유하고 있던 수량은 반영하지 못한다 —
// 그런 종목은 buy 액션 자체가 없기 때문이다. portfolio_assets.shares(항상
// 최신 실제 보유 수량)가 계산된 shares보다 많으면 그 차이를 등록 시점의
// 가격(fallbackPrice, 보통 마지막 실행가)에 매수한 것으로 간주해 평균
// 단가에 반영한다. 최종 shares는 항상 portfolio_assets 기준이 진실이다.
export const reconcileWithActualHoldings = ({
  computed,
  actualShares,
  fallbackPrice,
}: {
  computed: AveragePurchase | undefined;
  actualShares: number;
  fallbackPrice: number;
}): ReconciledPurchase => {
  const computedShares = computed?.shares ?? 0;
  const computedAvgPrice = computed?.avgPrice ?? 0;

  if (actualShares <= 0) return { avgPrice: 0, shares: 0 };
  if (computedShares >= actualShares) return { avgPrice: computedAvgPrice, shares: actualShares };

  const preExistingShares = actualShares - computedShares;
  const totalCost = computedAvgPrice * computedShares + fallbackPrice * preExistingShares;
  return { avgPrice: totalCost / actualShares, shares: actualShares };
};
