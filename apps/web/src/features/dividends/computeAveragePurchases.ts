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
