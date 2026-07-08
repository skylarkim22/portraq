import type { PortfolioAsset, PortfolioTemplate } from "@portraq/lib/types";
import { resolveTemplateAssetColors } from "@/features/templates/templateStyles";

export const toPortfolioAssets = (template: PortfolioTemplate): PortfolioAsset[] => {
  let slotCount = 0;

  return resolveTemplateAssetColors(template.assets).map((asset, index) => {
    if (asset.ticker === null) {
      slotCount += 1;
      return {
        ticker: `SLOT_${slotCount}`,
        name: asset.name,
        market: asset.market,
        ratio: asset.ratio,
        shares: 0,
        currentPrice: 0,
        color: asset.color,
        order: index,
        isSlot: true,
      };
    }

    return {
      ticker: asset.ticker,
      name: asset.name,
      market: asset.market,
      ratio: asset.ratio,
      shares: 0,
      currentPrice: 0,
      color: asset.color,
      order: index,
    };
  });
};
