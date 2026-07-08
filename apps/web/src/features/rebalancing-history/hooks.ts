import {
  type InfiniteData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ActionItem, ActionType } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  rebalancingHistoryInfiniteQueryOptions,
  rebalancingHistoryKeys,
  type RebalancingHistoryFilters,
  type RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";

export const useRebalancingHistory = (filters: RebalancingHistoryFilters) => {
  return useInfiniteQuery(rebalancingHistoryInfiniteQueryOptions(filters));
};

type HistoryPages = InfiniteData<RebalancingHistoryRecord[]>;

const patchHistoryCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (page: RebalancingHistoryRecord[]) => RebalancingHistoryRecord[]
) => {
  const previous = queryClient.getQueriesData<HistoryPages>({
    queryKey: rebalancingHistoryKeys.all,
  });
  queryClient.setQueriesData<HistoryPages>(
    { queryKey: rebalancingHistoryKeys.all },
    (old) => old && { ...old, pages: old.pages.map(updater) }
  );
  return previous;
};

const rollbackHistoryCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  previous: [readonly unknown[], HistoryPages | undefined][]
) => {
  previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
};

export const useDeleteExecutionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await createClient()
        .from("execution_records")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_data, id) => {
      patchHistoryCache(queryClient, (page) => page.filter((record) => record.id !== id));
    },
  });
};

const deriveActionType = (quantity: number): ActionType => {
  if (quantity > 0) return "buy";
  if (quantity < 0) return "sell";
  return "hold";
};

export type UpdateActionInput = {
  ticker: string;
  quantity: number;
  pricePerShare: number;
};

export const recomputeActions = (edits: UpdateActionInput[]): ActionItem[] =>
  edits.map((edit) => ({
    ticker: edit.ticker,
    quantity: edit.quantity,
    pricePerShare: edit.pricePerShare,
    action: deriveActionType(edit.quantity),
    totalAmount: edit.quantity * edit.pricePerShare,
  }));

export const useUpdateExecutionRecord = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; actions: ActionItem[] }) => {
      const { error } = await createClient()
        .from("execution_records")
        .update({ actions: input.actions })
        .eq("id", input.id);
      if (error) throw error;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: rebalancingHistoryKeys.all });
      const updateByTicker = new Map(input.actions.map((action) => [action.ticker, action]));
      const previous = patchHistoryCache(queryClient, (page) =>
        page.map((record) =>
          record.id === input.id
            ? {
                ...record,
                actions: record.actions.map((action) => {
                  const update = updateByTicker.get(action.ticker);
                  return update ? { ...action, ...update } : action;
                }),
              }
            : record
        )
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context) rollbackHistoryCache(queryClient, context.previous);
    },
  });
};
