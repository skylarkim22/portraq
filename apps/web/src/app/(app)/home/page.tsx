import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { HomePage } from "@/features/home/components/HomePage";
import { portfolioQueries } from "@/features/portfolio/queries";
import { rebalancingHistoryQueries } from "@/features/rebalancing-history/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const Home = async () => {
  const queryClient = getQueryClient();

  await Promise.all([
    queryClient.prefetchQuery(portfolioQueries.lists(createClient)),
    queryClient.prefetchInfiniteQuery(
      rebalancingHistoryQueries.list(
        { portfolioId: null, dateFrom: null, dateTo: null },
        createClient
      )
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage />
    </HydrationBoundary>
  );
};

export default Home;
