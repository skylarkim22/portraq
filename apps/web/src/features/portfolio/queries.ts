import { queryOptions } from "@tanstack/react-query";
import type {
  ActionItem,
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

export type PortfolioCardAsset = {
  ticker: string;
  market: Market;
  ratio: number;
  shares: number;
  currentPrice: number;
  color: string;
};

export type PortfolioCardExecutionSummary = {
  buyCount: number;
  sellCount: number;
  holdCount: number;
};

export type PortfolioSummary = {
  id: string;
  name: string;
  updatedAt: string;
  assets: PortfolioCardAsset[];
  latestExecution: PortfolioCardExecutionSummary | null;
};

const summarizeExecution = (
  actions: ActionItem[]
): PortfolioCardExecutionSummary =>
  actions.reduce(
    (acc, action) => {
      if (action.action === "buy") acc.buyCount += 1;
      else if (action.action === "sell") acc.sellCount += 1;
      else acc.holdCount += 1;
      return acc;
    },
    { buyCount: 0, sellCount: 0, holdCount: 0 }
  );

export const portfolioListQueryOptions = () =>
  queryOptions({
    queryKey: portfolioKeys.lists(),
    queryFn: async (): Promise<PortfolioSummary[]> => {
      const { data, error } = await createClient()
        .from("portfolios")
        .select(
          "id, name, updated_at, portfolio_assets(ticker, market, ratio, shares, current_price, color, sort_order), execution_records(executed_at, actions)"
        )
        .order("updated_at", { ascending: false })
        .order("executed_at", { referencedTable: "execution_records", ascending: false })
        .limit(1, { referencedTable: "execution_records" });

      if (error) throw error;

      return data.map((row) => {
        const assets: PortfolioCardAsset[] = row.portfolio_assets
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((asset) => ({
            ticker: asset.ticker,
            market: asset.market as Market,
            ratio: asset.ratio,
            shares: asset.shares,
            currentPrice: asset.current_price,
            color: asset.color,
          }));

        const latestExecution = row.execution_records[0]
          ? summarizeExecution(row.execution_records[0].actions as ActionItem[])
          : null;

        return {
          id: row.id,
          name: row.name,
          updatedAt: row.updated_at,
          assets,
          latestExecution,
        };
      });
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
