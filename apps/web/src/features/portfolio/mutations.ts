import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ActionItem,
  Portfolio,
  PortfolioAsset,
  SnapshotAsset,
} from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { portfolioQueries } from "@/features/portfolio/queries";

export const useCreatePortfolio = () => {
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
      queryClient.invalidateQueries({ queryKey: portfolioQueries.lists().queryKey });
    },
  });
};

type SavePortfolioInput = {
  portfolioId: string;
  name: string;
  memo: string | null;
  assets: PortfolioAsset[];
};

export const useSavePortfolio = () => {
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
      const queryKey = portfolioQueries.detail(input.portfolioId).queryKey;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<Portfolio>(queryKey);
      if (previous) {
        queryClient.setQueryData(queryKey, {
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
          portfolioQueries.detail(variables.portfolioId).queryKey,
          context.previous
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: portfolioQueries.detail(variables.portfolioId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: portfolioQueries.lists().queryKey });
    },
  });
};

export const useDeletePortfolio = () => {
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
        queryKey: portfolioQueries.detail(portfolioId).queryKey,
      });
      queryClient.invalidateQueries({ queryKey: portfolioQueries.lists().queryKey });
    },
  });
};

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

export const useRecordRebalancingExecution = (portfolioId: string) => {
  const queryClient = useQueryClient();
  const detailQueryKey = portfolioQueries.detail(portfolioId).queryKey;

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
      await queryClient.cancelQueries({ queryKey: detailQueryKey });
      const previous = queryClient.getQueryData<Portfolio>(detailQueryKey);
      if (previous) {
        const updatedByTicker = new Map(
          input.updatedAssets.map((asset) => [asset.ticker, asset])
        );
        queryClient.setQueryData(detailQueryKey, {
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
        queryClient.setQueryData(detailQueryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: detailQueryKey });
      queryClient.invalidateQueries({
        queryKey: portfolioQueries.snapshots(portfolioId).queryKey,
      });
    },
  });
};
