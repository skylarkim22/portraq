import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Portfolio, PortfolioAsset } from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { portfolioKeys, portfolioQueryOptions } from "@/features/portfolio/queries";

export function usePortfolio(id: string) {
  return useQuery(portfolioQueryOptions(id));
}

export function useUpdatePortfolio(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { name: string; memo: string | null }) => {
      const { error } = await createClient()
        .from("portfolios")
        .update({ name: input.name, memo: input.memo })
        .eq("id", portfolioId);
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

export function useUpdatePortfolioAssets(portfolioId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (assets: PortfolioAsset[]) => {
      const supabase = createClient();

      const { error: deleteError } = await supabase
        .from("portfolio_assets")
        .delete()
        .eq("portfolio_id", portfolioId);
      if (deleteError) throw deleteError;

      const rows = assets
        .filter((asset) => !asset.isSlot)
        .map((asset) => ({
          portfolio_id: portfolioId,
          ticker: asset.ticker,
          name: asset.name ?? asset.ticker,
          market: asset.market ?? "KR",
          ratio: asset.ratio,
          shares: asset.shares,
          current_price: asset.currentPrice ?? 0,
          color: asset.color ?? DEFAULT_ASSET_COLOR,
          sort_order: asset.order,
        }));

      if (rows.length > 0) {
        const { error: insertError } = await supabase
          .from("portfolio_assets")
          .insert(rows);
        if (insertError) throw insertError;
      }
    },
    onMutate: async (assets) => {
      await queryClient.cancelQueries({
        queryKey: portfolioKeys.detail(portfolioId),
      });
      const previous = queryClient.getQueryData<Portfolio>(
        portfolioKeys.detail(portfolioId)
      );
      if (previous) {
        queryClient.setQueryData(portfolioKeys.detail(portfolioId), {
          ...previous,
          assets,
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
