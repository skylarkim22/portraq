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

      // execution_records.actions[].quantity는 부호 있는 값이다(매도면
      // 음수 — deriveActionRows.ts가 그렇게 만들어 저장한다). 방향은
      // action.action이 이미 나타내므로 여기서는 절대값(매매 수량)만 쓴다.
      const quantity = Math.abs(action.quantity);

      if (action.action === "buy") {
        const newShares = current.shares + quantity;
        const newAvgPrice =
          newShares > 0
            ? (current.avgPrice * current.shares + action.pricePerShare * quantity) / newShares
            : 0;
        state.set(action.ticker, { ticker: action.ticker, avgPrice: newAvgPrice, shares: newShares });
      } else if (action.action === "sell") {
        state.set(action.ticker, { ...current, shares: Math.max(0, current.shares - quantity) });
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

export type SharesCheckpoint = { date: string; shares: number };

// 특정 티커에 대해 execution_records를 시간순으로 재생하며, 각 실행 시점
// 직후의 누적 보유 수량 체크포인트를 만든다. dividend_inputs의 입력월마다
// 실제로 몇 주를 보유하고 있었는지, 새 컬럼 없이 이미 저장된 리밸런싱
// 실행 기록만으로 추정할 때 쓴다(연 환산 수익률이 중간에 수량이 늘어난
// 것 때문에 왜곡되는 문제 대응).
export const computeSharesTimeline = (
  orderedExecutionRecords: { executedAt: string; actions: ActionItem[] }[],
  ticker: string
): SharesCheckpoint[] => {
  let shares = 0;
  const checkpoints: SharesCheckpoint[] = [];

  for (const record of orderedExecutionRecords) {
    const action = record.actions.find((a) => a.ticker === ticker);
    if (!action) continue;

    // hold는 buy/sell 이력이 없는 종목(이 앱에 등록하기 전부터 보유하던
    // 종목 등)에서도 매 실행마다 찍힌다. 여기서 체크포인트를 남기면
    // shares가 여전히 0인 채로 "그 시점엔 0주였다"는 잘못된 기록이 되어
    // sharesAsOfMonth가 fallbackShares 대신 이 0을 써버린다 — 그래서
    // buy/sell일 때만 체크포인트를 남긴다.
    // execution_records.actions[].quantity는 부호 있는 값이다(매도면
    // 음수). 절대값(매매 수량)만 쓰고 방향은 action.action으로 판단한다.
    const quantity = Math.abs(action.quantity);
    if (action.action === "buy") {
      shares += quantity;
      checkpoints.push({ date: record.executedAt, shares });
    } else if (action.action === "sell") {
      shares = Math.max(0, shares - quantity);
      checkpoints.push({ date: record.executedAt, shares });
    }
  }

  return checkpoints;
};

// monthKey("YYYY-MM") 말일 시점까지 실행된 기록 중 가장 최근 체크포인트를
// 그 달의 보유 수량으로 추정한다. 그 이전에 실행 기록이 전혀 없으면(이 앱에
// 등록하기 전부터 보유하던 종목 등) fallbackShares(보통 현재 실제 보유
// 수량)를 그 달에도 이미 갖고 있었다는 가정으로 대신 쓴다.
export const sharesAsOfMonth = (
  timeline: SharesCheckpoint[],
  monthKey: string,
  fallbackShares: number
): number => {
  const [year, month] = monthKey.split("-").map(Number);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  let shares: number | null = null;
  for (const checkpoint of timeline) {
    if (new Date(checkpoint.date) > monthEnd) break;
    shares = checkpoint.shares;
  }
  return shares ?? fallbackShares;
};
