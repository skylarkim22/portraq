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
// custom_asset_id 중 채워지는 쪽에 맞는 partial unique index로 충돌을 잡는다.
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
            dividendSum,
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
