import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Portfolio, PortfolioAsset } from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { portfolioKeys, portfolioQueryOptions } from "@/features/portfolio/queries";

export function usePortfolio(id: string) {
  return useQuery(portfolioQueryOptions(id));
}

export function useCreatePortfolio() {
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
  });
}

type SavePortfolioInput = {
  name: string;
  memo: string | null;
  assets: PortfolioAsset[];
};

export function useSavePortfolio(portfolioId: string) {
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
        p_portfolio_id: portfolioId,
        p_name: input.name,
        p_memo: input.memo,
        p_assets: assets,
      });
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
        queryClient.setQueryData(portfolioKeys.detail(portfolioId), {
          ...previous,
          name: input.name,
          memo: input.memo,
          assets: input.assets,
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
    },
  });
}
