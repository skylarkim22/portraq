import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { stockSearchQueryOptions, type MarketFilter } from "@/features/stocks/queries";
import {
  readRecentSearches,
  withRecentSearch,
  writeRecentSearches,
  type RecentSearchAsset,
} from "@/features/stocks/recentSearches";

export function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useStockSearch(query: string, market: MarketFilter) {
  return useQuery(stockSearchQueryOptions(query, market));
}

export function useRecentSearches() {
  // StockSearch는 모달이 열릴 때만 마운트되는 클라이언트 전용 컴포넌트라
  // 서버에서 렌더링될 일이 없으므로, lazy initializer로 곧장 읽어도 hydration
  // 불일치가 생기지 않는다.
  const [recentSearches, setRecentSearches] = useState<RecentSearchAsset[]>(
    () => readRecentSearches()
  );

  // localStorage 쓰기는 setState 업데이터 함수 밖에서 즉시 실행한다.
  // 선택 직후 부모가 모달을 닫아 이 컴포넌트가 같은 이벤트 배치 안에서
  // 언마운트되면, React가 이미 큐에 든 setState 업데이트를 아예 실행하지
  // 않을 수 있어 업데이터 안의 side effect(저장)까지 함께 유실될 수 있다.
  const addRecentSearch = useCallback((asset: RecentSearchAsset) => {
    const next = withRecentSearch(readRecentSearches(), asset);
    writeRecentSearches(next);
    setRecentSearches(next);
  }, []);

  return { recentSearches, addRecentSearch };
}
