import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { RebalancingHistoryPage } from "@/features/rebalancing-history/components/RebalancingHistoryPage";
import { rebalancingHistoryQueries } from "@/features/rebalancing-history/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const RebalancingHistoryRoute = async () => {
  const queryClient = getQueryClient();

  await queryClient.prefetchInfiniteQuery(
    rebalancingHistoryQueries.list(
      { portfolioId: null, dateFrom: null, dateTo: null },
      createClient
    )
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RebalancingHistoryPage />
    </HydrationBoundary>
  );
};

export default RebalancingHistoryRoute;
