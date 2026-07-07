import type { ActionType, PortfolioAsset } from "@portraq/lib/types";
import type { RebalancingAction } from "@portraq/lib/utils";

export type RebalancingActionRow = {
  ticker: string;
  name?: string;
  color?: string;
  currentShares: number;
  targetShares: number;
  currentRatio: number;
  targetRatio: number;
  pricePerShare: number;
  quantity: number;
  action: ActionType;
};

const deriveAction = (quantity: number): ActionType => {
  if (quantity > 0) return "buy";
  if (quantity < 0) return "sell";
  return "hold";
};

export const deriveActionRows = (
  actions: RebalancingAction[],
  overrides: Record<string, number>,
  assets: PortfolioAsset[]
): RebalancingActionRow[] => {
  const assetByTicker = new Map(assets.map((asset) => [asset.ticker, asset]));

  return actions.map((action) => {
    const computedSignedQuantity =
      action.action === "sell" ? -action.quantity : action.quantity;
    const quantity = overrides[action.ticker] ?? computedSignedQuantity;
    const asset = assetByTicker.get(action.ticker);

    return {
      ticker: action.ticker,
      name: asset?.name,
      color: asset?.color,
      currentShares:
        action.pricePerShare > 0
          ? action.currentValue / action.pricePerShare
          : 0,
      targetShares:
        action.pricePerShare > 0
          ? action.targetValue / action.pricePerShare
          : 0,
      currentRatio: action.currentRatio,
      targetRatio: action.targetRatio,
      pricePerShare: action.pricePerShare,
      quantity,
      action: deriveAction(quantity),
    };
  });
};
