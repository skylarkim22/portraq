import { infiniteQueryOptions } from "@tanstack/react-query";
import type { ActionItem, SnapshotAsset } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export const rebalancingHistoryKeys = {
  all: ["rebalancing-history"] as const,
  list: (filters: RebalancingHistoryFilters) =>
    [...rebalancingHistoryKeys.all, "list", filters] as const,
};

export type RebalancingHistoryFilters = {
  portfolioId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
};

export type EnrichedActionItem = ActionItem & {
  name: string;
  color: string;
};

export type RebalancingHistoryRecord = {
  id: string;
  portfolioId: string;
  portfolioName: string;
  executedAt: string;
  totalBudget: number;
  actions: EnrichedActionItem[];
};

const PAGE_SIZE = 10;

const enrichActions = (
  actions: ActionItem[],
  snapshotAssets: SnapshotAsset[]
): EnrichedActionItem[] => {
  const assetByTicker = new Map(snapshotAssets.map((asset) => [asset.ticker, asset]));
  return actions.map((action) => {
    const asset = assetByTicker.get(action.ticker);
    return {
      ...action,
      name: asset?.name ?? action.ticker,
      color: asset?.color ?? "",
    };
  });
};

export const rebalancingHistoryInfiniteQueryOptions = (
  filters: RebalancingHistoryFilters
) =>
  infiniteQueryOptions({
    queryKey: rebalancingHistoryKeys.list(filters),
    queryFn: async ({ pageParam }): Promise<RebalancingHistoryRecord[]> => {
      let query = createClient()
        .from("execution_records")
        .select(
          "id, portfolio_id, executed_at, total_budget, actions, portfolios(name), portfolio_snapshots(assets)"
        )
        .order("executed_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, pageParam * PAGE_SIZE + PAGE_SIZE - 1);

      if (filters.portfolioId) {
        query = query.eq("portfolio_id", filters.portfolioId);
      }
      if (filters.dateFrom) {
        query = query.gte("executed_at", filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte("executed_at", filters.dateTo);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map((row) => {
        const portfolio = row.portfolios as unknown as { name: string } | null;
        const snapshots = row.portfolio_snapshots as unknown as
          | { assets: SnapshotAsset[] }[]
          | null;

        return {
          id: row.id,
          portfolioId: row.portfolio_id,
          portfolioName: portfolio?.name ?? "삭제된 포트폴리오",
          executedAt: row.executed_at,
          totalBudget: row.total_budget,
          actions: enrichActions(
            row.actions as ActionItem[],
            snapshots?.[0]?.assets ?? []
          ),
        };
      });
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length,
  });
