import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ActionItem,
  Portfolio,
  PortfolioAsset,
  SnapshotAsset,
} from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  latestSnapshotQueryOptions,
  portfolioKeys,
  portfolioListQueryOptions,
  portfolioQueryOptions,
} from "@/features/portfolio/queries";

export function usePortfolio(id: string | null) {
  return useQuery({ ...portfolioQueryOptions(id ?? ""), enabled: id !== null });
}

export function usePortfolioList() {
  return useQuery(portfolioListQueryOptions());
}

export function useLatestSnapshot(portfolioId: string) {
  return useQuery(latestSnapshotQueryOptions(portfolioId));
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { userId: string; name: string }) => {
      const { data, error } = await createClient()
        .from("portfolios")
        .insert({ user_id: input.userId, name: input.name })
        .select("id")
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
    },
  });
}

type SavePortfolioInput = {
  portfolioId: string;
  name: string;
  memo: string | null;
  assets: PortfolioAsset[];
};

export function useSavePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SavePortfolioInput) => {
      const assets = input.assets
        .filter((asset) => !asset.isSlot)
        .map((asset) => ({
          ticker: asset.ticker,
          name: asset.name ?? asset.ticker,
          market: asset.market ?? "KR",
          ratio: asset.ratio,
          shares: asset.shares,
          currentPrice: asset.currentPrice ?? 0,
          color: asset.color ?? DEFAULT_ASSET_COLOR,
          order: asset.order,
        }));

      const { error } = await createClient().rpc("save_portfolio", {
        p_portfolio_id: input.portfolioId,
        p_name: input.name,
        p_memo: input.memo,
        p_assets: assets,
      });
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: portfolioKeys.detail(input.portfolioId),
      });
      const previous = queryClient.getQueryData<Portfolio>(
        portfolioKeys.detail(input.portfolioId)
      );
      if (previous) {
        queryClient.setQueryData(portfolioKeys.detail(input.portfolioId), {
          ...previous,
          name: input.name,
          memo: input.memo,
          assets: input.assets,
        });
      }
      return { previous };
    },
    onError: (_error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          portfolioKeys.detail(variables.portfolioId),
          context.previous
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.detail(variables.portfolioId),
      });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
    },
  });
}

export function useDeletePortfolio() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (portfolioId: string) => {
      const { error } = await createClient().rpc("delete_portfolio", {
        p_portfolio_id: portfolioId,
      });
      if (error) throw error;
    },
    onSuccess: (_data, portfolioId) => {
      queryClient.removeQueries({
        queryKey: portfolioKeys.detail(portfolioId),
      });
      queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() });
    },
  });
}

type UpdatedAsset = {
  ticker: string;
  shares: number;
  currentPrice: number;
};

type RecordRebalancingExecutionInput = {
  totalBudget: number;
  actions: ActionItem[];
  updatedAssets: UpdatedAsset[];
  snapshotAssets: SnapshotAsset[];
};

export function useRecordRebalancingExecution(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RecordRebalancingExecutionInput) => {
      const { error } = await createClient().rpc(
        "record_rebalancing_execution",
        {
          p_portfolio_id: portfolioId,
          p_total_budget: input.totalBudget,
          p_actions: input.actions,
          p_updated_assets: input.updatedAssets,
          p_snapshot_assets: input.snapshotAssets,
        }
      );
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({
        queryKey: portfolioKeys.detail(portfolioId),
      });
      const previous = queryClient.getQueryData<Portfolio>(
        portfolioKeys.detail(portfolioId)
      );
      if (previous) {
        const updatedByTicker = new Map(
          input.updatedAssets.map((asset) => [asset.ticker, asset])
        );
        queryClient.setQueryData(portfolioKeys.detail(portfolioId), {
          ...previous,
          assets: previous.assets.map((asset) => {
            const updated = updatedByTicker.get(asset.ticker);
            if (!updated) return asset;
            return {
              ...asset,
              shares: updated.shares,
              currentPrice: updated.currentPrice,
            };
          }),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          portfolioKeys.detail(portfolioId),
          context.previous
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.detail(portfolioId),
      });
      queryClient.invalidateQueries({
        queryKey: portfolioKeys.snapshots(portfolioId),
      });
    },
  });
}
