import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { HomePage } from "@/features/home/components/HomePage";
import { fetchPortfolioList, portfolioQueries } from "@/features/portfolio/queries";
import { fetchRebalancingHistoryPage } from "@/features/rebalancing-history/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const RECENT_HISTORY_FILTERS = { portfolioId: null, dateFrom: null, dateTo: null };

const Home = async () => {
  const queryClient = getQueryClient();

  const [portfolios, historyPage] = await Promise.all([
    fetchPortfolioList(createClient),
    fetchRebalancingHistoryPage(RECENT_HISTORY_FILTERS, createClient),
  ]);

  // 사이드바(PortfolioNavItem)가 브라우저 QueryClient 싱글턴에서 같은
  // portfolioQueries.lists() 쿼리 키를 구독한다. /home이 TanStack Query를
  // 거치지 않게 되면서 이 캐시를 더 이상 채워주지 않아 사이드바가 별도로
  // 재요청하게 되는 걸 막기 위해, 이미 가져온 결과를 캐시에 심어준다(#86).
  queryClient.setQueryData(portfolioQueries.lists().queryKey, portfolios);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HomePage portfolios={portfolios} recentHistoryRecords={historyPage.records} />
    </HydrationBoundary>
  );
};

export default Home;
