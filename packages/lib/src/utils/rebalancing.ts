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

const MIN_SHARES_KR = 1;
const MIN_SHARES_US = 0.5;

export function calcRebalancingActions(
  input: RebalancingInput
): RebalancingAction[] {
  const { assets, holdings, additionalBudget } = input;

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

      // PRD: 차이가 1주(KR) 또는 0.5주(US) 미만이면 유지
      const minShares =
        (asset.market ?? "KR") === "KR" ? MIN_SHARES_KR : MIN_SHARES_US;
      const quantityRaw = price > 0 ? Math.abs(diff) / price : 0;

      let action: ActionType = "hold";
      let quantity = 0;

      if (quantityRaw >= minShares) {
        action = diff > 0 ? "buy" : "sell";
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
