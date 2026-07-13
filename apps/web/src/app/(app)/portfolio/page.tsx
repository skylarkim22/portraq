import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PortfolioListPage } from "@/features/portfolio/components/PortfolioListPage";
import { portfolioQueries } from "@/features/portfolio/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const PortfolioPage = async () => {
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(portfolioQueries.lists(createClient));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortfolioListPage />
    </HydrationBoundary>
  );
};

export default PortfolioPage;
