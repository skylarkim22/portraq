import { queryOptions } from "@tanstack/react-query";
import type {
  ActionItem,
  Market,
  Portfolio,
  PortfolioAsset,
  SnapshotAsset,
} from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

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

export const portfolioQueries = {
  all: () => ["portfolios"] as const,

  lists: () =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "list"] as const,
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
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "detail", id] as const,
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
    }),

  snapshots: (id: string) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "snapshots", id] as const,
      queryFn: async (): Promise<SnapshotAsset[]> => {
        const { data, error } = await createClient()
          .from("portfolio_snapshots")
          .select("assets")
          .eq("portfolio_id", id)
          .order("saved_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return (data?.assets as SnapshotAsset[] | undefined) ?? [];
      },
      staleTime: 1000 * 30,
    }),
};
