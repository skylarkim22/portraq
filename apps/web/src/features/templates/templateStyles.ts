import type { TemplateAsset, TemplateMarket, TemplateStrategy } from "@portraq/lib/types";
import { resolveColor } from "@portraq/lib/utils";

const SLOT_COLOR = "#e4e4e7";

export const resolveTemplateAssetColors = (
  assets: TemplateAsset[]
): (TemplateAsset & { color: string })[] => {
  const usedColors: string[] = [];
  return assets.map((asset) => {
    if (asset.ticker === null) {
      return { ...asset, color: SLOT_COLOR };
    }
    const color = resolveColor(undefined, asset.ticker, usedColors);
    usedColors.push(color);
    return { ...asset, color };
  });
};

export const STRATEGY_LABELS: Record<TemplateStrategy, string> = {
  passive: "패시브",
  value: "가치투자",
  quant: "퀀트·팩터",
  "asset-allocation": "자산배분",
};

export const STRATEGY_BADGE_CLASS: Record<TemplateStrategy, string> = {
  passive: "bg-[#f0f4ff] text-[#355df9]",
  value: "bg-[#fff7ed] text-[#c2410c]",
  quant: "bg-[#f0fdf4] text-[#15803d]",
  "asset-allocation": "bg-[#fdf4ff] text-[#7e22ce]",
};

export const MARKET_LABELS: Record<TemplateMarket, string> = {
  KR: "KR",
  US: "US",
  MIXED: "KR·US",
};

export const MARKET_BADGE_CLASS: Record<TemplateMarket, string> = {
  KR: "bg-[#fff1f2] text-[#be123c]",
  US: "bg-[#eff6ff] text-[#1d4ed8]",
  MIXED: "bg-[#fdf4ff] text-[#7e22ce]",
};

export const STRATEGY_FILTERS: { value: "all" | TemplateStrategy; label: string }[] = [
  { value: "all", label: "전체" },
  ...(Object.entries(STRATEGY_LABELS) as [TemplateStrategy, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];
