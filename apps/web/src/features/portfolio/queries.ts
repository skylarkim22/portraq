import { queryOptions } from "@tanstack/react-query";
import type {
  Market,
  Portfolio,
  PortfolioAsset,
  SnapshotAsset,
} from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export const portfolioKeys = {
  all: ["portfolios"] as const,
  lists: () => [...portfolioKeys.all, "list"] as const,
  detail: (id: string) => [...portfolioKeys.all, "detail", id] as const,
  snapshots: (id: string) => [...portfolioKeys.all, "snapshots", id] as const,
};

export type PortfolioListItem = {
  id: string;
  name: string;
};

export const portfolioListQueryOptions = () =>
  queryOptions({
    queryKey: portfolioKeys.lists(),
    queryFn: async (): Promise<PortfolioListItem[]> => {
      const { data, error } = await createClient()
        .from("portfolios")
        .select("id, name")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
  });

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
    staleTime: 1000 * 30,
  });

export const latestSnapshotQueryOptions = (portfolioId: string) =>
  queryOptions({
    queryKey: portfolioKeys.snapshots(portfolioId),
    queryFn: async (): Promise<SnapshotAsset[]> => {
      const { data, error } = await createClient()
        .from("portfolio_snapshots")
        .select("assets")
        .eq("portfolio_id", portfolioId)
        .order("saved_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return (data?.assets as SnapshotAsset[] | undefined) ?? [];
    },
    staleTime: 1000 * 30,
  });
