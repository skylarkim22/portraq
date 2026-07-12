import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { ActionItem } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  rebalancingHistoryQueries,
  type RebalancingHistoryPage,
  type RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";

type HistoryPages = InfiniteData<RebalancingHistoryPage>;

// hasMore는 건드리지 않고 records만 갱신한다 — "더보기" 노출 여부는 처음
// 조회 시점에 서버가 알려준 값을 그대로 유지해야, 캐시에서 항목을 지워도
// 다음 페이지가 있는지 여부가 잘못 바뀌지 않는다.
const patchHistoryCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (records: RebalancingHistoryRecord[]) => RebalancingHistoryRecord[]
) => {
  const previous = queryClient.getQueriesData<HistoryPages>({
    queryKey: rebalancingHistoryQueries.all(),
  });
  queryClient.setQueriesData<HistoryPages>(
    { queryKey: rebalancingHistoryQueries.all() },
    (old) =>
      old && {
        ...old,
        pages: old.pages.map((page) => ({ ...page, records: updater(page.records) })),
      }
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
      // 캐시에서 즉시 제거해 삭제 반응은 빠르게 보여주되, 그 페이지가 10개
      // 미만으로 줄어든 빈 자리는 서버의 다음 항목으로 다시 채워야 한다.
      // 커서 기반 페이지네이션이라 이미 불러온 페이지들을 순서대로 다시
      // 조회하면 각 페이지가 자동으로 10개씩 재정렬된다.
      queryClient.refetchQueries({ queryKey: rebalancingHistoryQueries.all(), type: "active" });
    },
  });
};

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
      await queryClient.cancelQueries({ queryKey: rebalancingHistoryQueries.all() });
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
