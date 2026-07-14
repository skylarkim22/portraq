import { useInfiniteQuery } from "@tanstack/react-query";
import {
  rebalancingHistoryQueries,
  type RebalancingHistoryFilters,
} from "@/features/rebalancing-history/queries";

export const useRebalancingHistory = (filters: RebalancingHistoryFilters) =>
  useInfiniteQuery(rebalancingHistoryQueries.list(filters));
