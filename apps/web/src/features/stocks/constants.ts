import type { MarketFilter } from "@/features/stocks/queries";

export const MARKET_TABS: { label: string; value: MarketFilter; icon: string }[] = [
  { label: "전체", value: "ALL", icon: "🌐" },
  { label: "한국", value: "KR", icon: "🇰🇷" },
  { label: "미국", value: "US", icon: "🇺🇸" },
];
