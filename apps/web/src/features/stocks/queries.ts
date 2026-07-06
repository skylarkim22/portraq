import { queryOptions } from "@tanstack/react-query";
import type { Asset, Market } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export type MarketFilter = Market | "ALL";

export const stockKeys = {
  all: ["stocks"] as const,
  search: (query: string, market: MarketFilter) =>
    [...stockKeys.all, "search", query, market] as const,
};

export const stockSearchQueryOptions = (query: string, market: MarketFilter) =>
  queryOptions({
    queryKey: stockKeys.search(query, market),
    queryFn: async (): Promise<Asset[]> => {
      let request = createClient()
        .from("assets")
        .select("ticker, name, market, color, is_active")
        .eq("is_active", true)
        .or(`ticker.ilike.%${query}%,name.ilike.%${query}%`)
        .order("ticker")
        .limit(20);

      if (market !== "ALL") {
        request = request.eq("market", market);
      }

      const { data, error } = await request;
      if (error) throw error;

      return data.map((row) => ({
        ticker: row.ticker,
        name: row.name,
        market: row.market as Market,
        color: row.color,
        isActive: row.is_active,
      }));
    },
    enabled: query.trim().length > 0,
  });
