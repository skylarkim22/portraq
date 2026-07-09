import type { Market, TemplateMarket } from "@portraq/lib/types";

type PortfolioCardAssetInput = {
  shares: number;
  currentPrice: number;
};

export const derivePortfolioCardValue = (assets: PortfolioCardAssetInput[]): number =>
  assets.reduce((sum, asset) => sum + asset.shares * asset.currentPrice, 0);

export const deriveAssetsMarket = (markets: Market[]): TemplateMarket => {
  const unique = new Set(markets);
  if (unique.size > 1) return "MIXED";
  return (unique.values().next().value as Market | undefined) ?? "KR";
};
