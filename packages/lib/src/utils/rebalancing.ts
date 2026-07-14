import type {
  ActionItem,
  ActionType,
  Market,
  PortfolioAsset,
} from "../types/index";

export function toKrwPrice(
  nativePrice: number,
  market: Market,
  exchangeRate: number
): number {
  return market === "US" ? nativePrice * exchangeRate : nativePrice;
}

export interface HoldingInput {
  ticker: string;
  shares: number;
  pricePerShare: number;
}

export interface RebalancingInput {
  assets: PortfolioAsset[];
  holdings: HoldingInput[];
  additionalBudget: number;
  sellThresholdPercent?: number;
}

export interface RebalancingAction {
  ticker: string;
  action: ActionType;
  quantity: number;
  pricePerShare: number;
  currentValue: number;
  targetValue: number;
  currentRatio: number;
  targetRatio: number;
}

const MIN_SHARES = 1;

export function calcRebalancingActions(
  input: RebalancingInput
): RebalancingAction[] {
  const { assets, holdings, additionalBudget, sellThresholdPercent = 0 } =
    input;

  const holdingMap = new Map(
    holdings.map((h) => [h.ticker, h])
  );

  const totalCurrentValue = holdings.reduce(
    (sum, h) => sum + h.shares * h.pricePerShare,
    0
  );
  const totalBudget = totalCurrentValue + additionalBudget;

  return assets
    .filter((a) => !a.isSlot)
    .map((asset) => {
      const holding = holdingMap.get(asset.ticker);
      const price = holding?.pricePerShare ?? 0;
      const currentShares = holding?.shares ?? 0;
      const currentValue = currentShares * price;
      const targetValue = totalBudget * (asset.ratio / 100);
      const diff = targetValue - currentValue;
      const currentRatio =
        totalCurrentValue > 0 ? (currentValue / totalBudget) * 100 : 0;

      const quantityRaw = price > 0 ? Math.abs(diff) / price : 0;

      // 매도는 목표 비율과의 괴리(%p)가 임계값 이상일 때만 발생시킨다.
      // 매수 우선·매도 최소화: 추가 투자금은 저비중 종목 매수로 최대한
      // 활용하고, 소폭 초과 비중은 매도 없이 유지한다.
      const deviation = currentRatio - asset.ratio;

      let action: ActionType = "hold";
      let quantity = 0;

      if (diff > 0 && quantityRaw >= MIN_SHARES) {
        action = "buy";
        quantity = Math.floor(quantityRaw);
      } else if (
        diff < 0 &&
        quantityRaw >= MIN_SHARES &&
        deviation >= sellThresholdPercent
      ) {
        action = "sell";
        quantity = Math.floor(quantityRaw);
      }

      return {
        ticker: asset.ticker,
        action,
        quantity,
        pricePerShare: price,
        currentValue,
        targetValue,
        currentRatio,
        targetRatio: asset.ratio,
      };
    });
}

export function toActionItems(actions: RebalancingAction[]): ActionItem[] {
  return actions.map((a) => {
    const quantity = a.action === "sell" ? -a.quantity : a.quantity;
    return {
      ticker: a.ticker,
      action: a.action,
      quantity,
      pricePerShare: a.pricePerShare,
    };
  });
}
