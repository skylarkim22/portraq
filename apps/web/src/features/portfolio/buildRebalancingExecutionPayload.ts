import type { ActionItem, PortfolioAsset, SnapshotAsset } from "@portraq/lib/types";
import type { RebalancingActionRow } from "@/features/portfolio/deriveActionRows";

type UpdatedAsset = {
  ticker: string;
  shares: number;
  currentPrice: number;
};

export type RebalancingExecutionPayload = {
  actions: ActionItem[];
  updatedAssets: UpdatedAsset[];
  snapshotAssets: SnapshotAsset[];
};

export const buildRebalancingExecutionPayload = (
  rows: RebalancingActionRow[],
  assets: PortfolioAsset[]
): RebalancingExecutionPayload => {
  const rowByTicker = new Map(rows.map((row) => [row.ticker, row]));

  const updatedAssets: UpdatedAsset[] = rows.map((row) => ({
    ticker: row.ticker,
    shares: row.currentShares + row.quantity,
    currentPrice: row.pricePerShare,
  }));

  const snapshotAssets: SnapshotAsset[] = assets.map((asset) => {
    const row = rowByTicker.get(asset.ticker);
    return {
      ticker: asset.ticker,
      name: asset.name ?? asset.ticker,
      ratio: asset.ratio,
      shares: row ? row.currentShares + row.quantity : asset.shares,
      pricePerShare: row?.pricePerShare ?? 0,
      color: asset.color ?? "",
    };
  });

  const actions: ActionItem[] = rows.map((row) => ({
    ticker: row.ticker,
    action: row.action,
    quantity: row.quantity,
    pricePerShare: row.pricePerShare,
  }));

  return { actions, updatedAssets, snapshotAssets };
};
