import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Market } from "@portraq/lib/types";
import { tradeLogSchema } from "@portraq/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import {
  tradeLogKeys,
  tradeLogListQueryOptions,
  type EnrichedTradeLog,
} from "@/features/trade-log/queries";

export const useTradeLogs = () => useQuery(tradeLogListQueryOptions);

export type CreateTradeLogItem = {
  ticker: string;
  quantity: number;
  price: number;
  tax?: number;
  exchangeRate?: number;
  name: string;
  market: Market;
  color: string;
};

export type CreateTradeLogInput = {
  type: "buy" | "sell";
  date: string;
  memo: string;
  items: CreateTradeLogItem[];
};

export const useCreateTradeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTradeLogInput) => {
      const rows = input.items.map((item) => ({
        type: input.type,
        date: input.date,
        ticker: item.ticker,
        quantity: item.quantity,
        price: item.price,
        tax: item.tax,
        exchange_rate: item.exchangeRate,
        memo: input.memo,
      }));
      rows.forEach((row) =>
        tradeLogSchema.parse({
          type: row.type,
          date: row.date,
          ticker: row.ticker,
          quantity: row.quantity,
          price: row.price,
          tax: row.tax,
          exchangeRate: row.exchange_rate,
          memo: row.memo,
        })
      );

      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("로그인이 필요합니다.");

      const { error } = await supabase
        .from("trade_logs")
        .insert(rows.map((row) => ({ ...row, user_id: user.id })));
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: tradeLogKeys.all });
      const previous = queryClient.getQueryData<EnrichedTradeLog[]>(
        tradeLogKeys.list()
      );

      const optimisticRows: EnrichedTradeLog[] = input.items.map((item, index) => ({
        id: `optimistic-${Date.now()}-${index}`,
        userId: "",
        type: input.type,
        date: input.date,
        ticker: item.ticker,
        quantity: item.quantity,
        price: item.price,
        tax: item.tax,
        exchangeRate: item.exchangeRate,
        memo: input.memo,
        createdAt: new Date().toISOString(),
        name: item.name,
        market: item.market,
        color: item.color,
      }));

      queryClient.setQueryData<EnrichedTradeLog[]>(tradeLogKeys.list(), (old) =>
        old ? [...optimisticRows, ...old] : optimisticRows
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tradeLogKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeLogKeys.all });
    },
  });
};

export type UpdateTradeLogInput = {
  id: string;
  date: string;
  quantity: number;
  price: number;
  tax?: number;
  exchangeRate?: number;
  memo: string;
};

export const useUpdateTradeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTradeLogInput) => {
      const { error } = await createClient()
        .from("trade_logs")
        .update({
          date: input.date,
          quantity: input.quantity,
          price: input.price,
          tax: input.tax,
          exchange_rate: input.exchangeRate,
          memo: input.memo,
        })
        .eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: tradeLogKeys.all });
      const previous = queryClient.getQueryData<EnrichedTradeLog[]>(
        tradeLogKeys.list()
      );

      queryClient.setQueryData<EnrichedTradeLog[]>(tradeLogKeys.list(), (old) =>
        old?.map((row) =>
          row.id === input.id
            ? {
                ...row,
                date: input.date,
                quantity: input.quantity,
                price: input.price,
                tax: input.tax,
                exchangeRate: input.exchangeRate,
                memo: input.memo,
              }
            : row
        )
      );

      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(tradeLogKeys.list(), context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: tradeLogKeys.all });
    },
  });
};

export const useDeleteTradeLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await createClient().from("trade_logs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      queryClient.setQueryData<EnrichedTradeLog[]>(tradeLogKeys.list(), (old) =>
        old?.filter((row) => row.id !== id)
      );
    },
  });
};
