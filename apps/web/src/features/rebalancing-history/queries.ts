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

export type RebalancingHistoryPage = {
  records: RebalancingHistoryRecord[];
  hasMore: boolean;
};

export type RebalancingHistoryCursor = { executedAt: string; id: string } | null;

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
    queryFn: async ({ pageParam }: { pageParam: RebalancingHistoryCursor }): Promise<RebalancingHistoryPage> => {
      let query = createClient()
        .from("execution_records")
        .select(
          "id, portfolio_id, executed_at, total_budget, actions, portfolios(name), portfolio_snapshots(assets)"
        )
        .order("executed_at", { ascending: false })
        .order("id", { ascending: false })
        // 다음 페이지 존재 여부를 별도 조회 없이 판단하기 위해 한 건 더 가져온다.
        .limit(PAGE_SIZE + 1);

      if (filters.portfolioId) {
        query = query.eq("portfolio_id", filters.portfolioId);
      }
      if (filters.dateFrom) {
        query = query.gte("executed_at", new Date(`${filters.dateFrom}T00:00:00`).toISOString());
      }
      if (filters.dateTo) {
        query = query.lte(
          "executed_at",
          new Date(`${filters.dateTo}T23:59:59.999`).toISOString()
        );
      }
      // 삭제로 서버 데이터가 줄어들어도 위치가 밀리지 않도록, 오프셋이 아닌
      // 이전 페이지 마지막 항목(executed_at, id) 기준으로 다음 항목들을 조회한다.
      if (pageParam) {
        query = query.or(
          `executed_at.lt.${pageParam.executedAt},and(executed_at.eq.${pageParam.executedAt},id.lt.${pageParam.id})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const hasMore = data.length > PAGE_SIZE;
      const rows = hasMore ? data.slice(0, PAGE_SIZE) : data;

      const records = rows.map((row) => {
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

      return { records, hasMore };
    },
    initialPageParam: null as RebalancingHistoryCursor,
    getNextPageParam: (lastPage) => {
      if (!lastPage.hasMore) return undefined;
      const last = lastPage.records[lastPage.records.length - 1];
      return { executedAt: last.executedAt, id: last.id };
    },
  });
