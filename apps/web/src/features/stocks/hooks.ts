import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { stockSearchQueryOptions, type MarketFilter } from "./queries";

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
