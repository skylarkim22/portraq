import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { dividendQueries, type DividendRow } from "@/features/dividends/queries";
import { computeDividendSum, computeAnnualizedYield } from "@/features/dividends/computeDividendMetrics";

export type SaveDividendInputPayload = {
  portfolioId: string;
  ticker: string;
  isCustom?: boolean;
  month: string; // 'YYYY-MM'
  amount: number;
};

// 월별 배당금 직접 입력. (portfolio_id, ticker, month) 단위로 upsert —
// 같은 달을 다시 저장하면 값이 갱신된다. exclusive arc라 asset_ticker/
// custom_asset_id 중 채워지는 쪽에 맞는 UNIQUE 제약으로 충돌을 잡는다.
export const useSaveDividendInput = () => {
  const queryClient = useQueryClient();
  const listQueryKey = dividendQueries.list().queryKey;

  return useMutation({
    mutationFn: async (payload: SaveDividendInputPayload) => {
      const supabase = createClient();
      const row = {
        portfolio_id: payload.portfolioId,
        asset_ticker: payload.isCustom ? null : payload.ticker,
        custom_asset_id: payload.isCustom ? payload.ticker : null,
        month: `${payload.month}-01`,
        amount: payload.amount,
      };
      const onConflict = payload.isCustom
        ? "portfolio_id,custom_asset_id,month"
        : "portfolio_id,asset_ticker,month";

      const { error } = await supabase.from("dividend_inputs").upsert(row, { onConflict });
      if (error) throw error;
    },
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: dividendQueries.all() });
      const prev = queryClient.getQueryData<DividendRow[]>(listQueryKey);

      queryClient.setQueryData<DividendRow[]>(listQueryKey, (old) =>
        (old ?? []).map((row) => {
          if (row.portfolioId !== payload.portfolioId || row.ticker !== payload.ticker) return row;

          const existingIndex = row.manualHistory.findIndex((entry) => entry.month === payload.month);
          const manualHistory = [...row.manualHistory];
          if (existingIndex >= 0) manualHistory[existingIndex] = { month: payload.month, amount: payload.amount };
          else manualHistory.push({ month: payload.month, amount: payload.amount });

          const dividendSum = computeDividendSum(manualHistory);
          const annualizedYield = computeAnnualizedYield({
            manualHistory,
            avgPrice: row.avgPrice,
            shares: row.shares,
          });

          return { ...row, manualHistory, dividendSum, annualizedYield };
        })
      );

      return { prev };
    },
    onError: (_err, _payload, context) => {
      if (context?.prev) queryClient.setQueryData(listQueryKey, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dividendQueries.all() });
    },
  });
};

export type DeleteDividendInputPayload = {
  portfolioId: string;
  ticker: string;
  isCustom?: boolean;
  month: string; // 'YYYY-MM'
};

// 잘못 입력한 월별 배당금 삭제. 낙관적 업데이트 없이 서버 삭제 성공 후에만
// 캐시에서 해당 월 항목을 직접 제거한다(AGENTS.md 삭제 mutation 규칙).
export const useDeleteDividendInput = () => {
  const queryClient = useQueryClient();
  const listQueryKey = dividendQueries.list().queryKey;

  return useMutation({
    mutationFn: async (payload: DeleteDividendInputPayload) => {
      const supabase = createClient();
      let query = supabase
        .from("dividend_inputs")
        .delete()
        .eq("portfolio_id", payload.portfolioId)
        .eq("month", `${payload.month}-01`);
      query = payload.isCustom
        ? query.eq("custom_asset_id", payload.ticker)
        : query.eq("asset_ticker", payload.ticker);

      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: (_data, payload) => {
      queryClient.setQueryData<DividendRow[]>(listQueryKey, (old) =>
        (old ?? []).map((row) => {
          if (row.portfolioId !== payload.portfolioId || row.ticker !== payload.ticker) return row;

          const manualHistory = row.manualHistory.filter((entry) => entry.month !== payload.month);
          const dividendSum = computeDividendSum(manualHistory);
          const annualizedYield = computeAnnualizedYield({
            manualHistory,
            avgPrice: row.avgPrice,
            shares: row.shares,
          });

          return { ...row, manualHistory, dividendSum, annualizedYield };
        })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: dividendQueries.all() });
    },
  });
};
