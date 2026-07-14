import type { Asset } from "@portraq/lib/types";

export type RecentSearchAsset = Pick<Asset, "ticker" | "name" | "market" | "color">;

const STORAGE_KEY = "portraq:recent-searches";
const MAX_RECENT_SEARCHES = 5;

export const readRecentSearches = (): RecentSearchAsset[] => {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const writeRecentSearches = (items: RecentSearchAsset[]): void => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage가 꽉 찼거나(private mode 등) 접근 불가한 경우 조용히 무시한다.
  }
};

// 이미 있던 종목은 앞으로 끌어올리고, 최대 개수를 넘으면 오래된 것부터 잘라낸다.
export const withRecentSearch = (
  items: RecentSearchAsset[],
  asset: RecentSearchAsset
): RecentSearchAsset[] => {
  const next = [asset, ...items.filter((item) => item.ticker !== asset.ticker)];
  return next.slice(0, MAX_RECENT_SEARCHES);
};
