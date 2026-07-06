import { queryOptions } from "@tanstack/react-query";
import type { Market, Portfolio, PortfolioAsset } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export const portfolioKeys = {
  all: ["portfolios"] as const,
  lists: () => [...portfolioKeys.all, "list"] as const,
  detail: (id: string) => [...portfolioKeys.all, "detail", id] as const,
};

export const portfolioQueryOptions = (id: string) =>
  queryOptions({
    queryKey: portfolioKeys.detail(id),
    queryFn: async (): Promise<Portfolio> => {
      const { data, error } = await createClient()
        .from("portfolios")
        .select(
          "id, name, memo, created_at, updated_at, portfolio_assets(ticker, name, market, ratio, shares, current_price, color, sort_order)"
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      const assets: PortfolioAsset[] = data.portfolio_assets
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((row) => ({
          ticker: row.ticker,
          name: row.name,
          market: row.market as Market,
          color: row.color,
          ratio: row.ratio,
          shares: row.shares,
          currentPrice: row.current_price,
          order: row.sort_order,
        }));

      return {
        id: data.id,
        name: data.name,
        memo: data.memo,
        assets,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    },
  });
