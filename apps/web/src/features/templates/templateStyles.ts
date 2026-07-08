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
  growth: "성장",
};

export const STRATEGY_BADGE_CLASS: Record<TemplateStrategy, string> = {
  passive: "bg-[#f0f4ff] text-[#355df9]",
  value: "bg-[#fff7ed] text-[#c2410c]",
  quant: "bg-[#f0fdf4] text-[#15803d]",
  "asset-allocation": "bg-[#fdf4ff] text-[#7e22ce]",
  growth: "bg-[#fef2f2] text-[#dc2626]",
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

export const CAGR_EXPLANATION =
  "10Y CAGR(연평균 복리 수익률)는 일정 기간의 총수익률을 연 단위 성장률로 환산한 값입니다.";

export const MDD_EXPLANATION =
  "MDD(최대낙폭)는 특정 기간 중 고점 대비 가장 크게 하락했던 비율입니다. 0%에 가까울수록 하락 폭이 작았다는 의미입니다.";
