import { HomePage } from "@/features/home/components/HomePage";
import { fetchPortfolioList } from "@/features/portfolio/queries";
import { fetchRebalancingHistoryPage } from "@/features/rebalancing-history/queries";
import { createClient } from "@/lib/supabase/server";

const RECENT_HISTORY_FILTERS = { portfolioId: null, dateFrom: null, dateTo: null };

const Home = async () => {
  const [portfolios, historyPage] = await Promise.all([
    fetchPortfolioList(createClient),
    fetchRebalancingHistoryPage(RECENT_HISTORY_FILTERS, createClient),
  ]);

  return <HomePage portfolios={portfolios} recentHistoryRecords={historyPage.records} />;
};

export default Home;
