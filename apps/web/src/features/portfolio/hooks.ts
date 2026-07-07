import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Portfolio, PortfolioAsset } from "@portraq/lib/types";
import {
  DEFAULT_ASSET_COLOR,
  calcRebalancingActions,
  toActionItems,
} from "@portraq/lib/utils";
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
      const filteredAssets = input.assets.filter((asset) => !asset.isSlot);

      const assets = filteredAssets.map((asset) => ({
        ticker: asset.ticker,
        name: asset.name ?? asset.ticker,
        market: asset.market ?? "KR",
        ratio: asset.ratio,
        shares: asset.shares,
        currentPrice: asset.currentPrice ?? 0,
        color: asset.color ?? DEFAULT_ASSET_COLOR,
        order: asset.order,
      }));

      // #19(리밸런싱 가이드)가 아직 없어 보유 주수/현재가 입력이 없는 상태.
      // holdings=0, additionalBudget=0으로 계산하면 "보유 없음" 상태의
      // execution_record(전부 hold)가 생성되고, #19가 실제 보유 데이터로
      // 같은 RPC를 재사용해 의미 있는 액션을 기록하게 된다.
      const holdings = filteredAssets.map((asset) => ({
        ticker: asset.ticker,
        shares: asset.shares,
        pricePerShare: asset.currentPrice ?? 0,
      }));
      const actions = toActionItems(
        calcRebalancingActions({
          assets: filteredAssets,
          holdings,
          additionalBudget: 0,
        })
      );
      const totalBudget = holdings.reduce(
        (sum, holding) => sum + holding.shares * holding.pricePerShare,
        0
      );

      const snapshotAssets = filteredAssets.map((asset) => ({
        ticker: asset.ticker,
        name: asset.name ?? asset.ticker,
        ratio: asset.ratio,
        shares: asset.shares,
        pricePerShare: asset.currentPrice ?? 0,
        color: asset.color ?? DEFAULT_ASSET_COLOR,
      }));

      const { error } = await createClient().rpc("save_portfolio", {
        p_portfolio_id: portfolioId,
        p_name: input.name,
        p_memo: input.memo,
        p_assets: assets,
        p_total_budget: totalBudget,
        p_actions: actions,
        p_snapshot_assets: snapshotAssets,
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
