import type { MarketFilter } from "@/features/stocks/queries";

export const MARKET_TABS: { label: string; value: MarketFilter }[] = [
  { label: "전체", value: "ALL" },
  { label: "한국", value: "KR" },
  { label: "미국", value: "US" },
];
