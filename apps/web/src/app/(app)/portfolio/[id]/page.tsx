import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { PortfolioEditor } from "@/features/portfolio/components/PortfolioEditor";
import { portfolioQueries } from "@/features/portfolio/queries";
import { getQueryClient } from "@/lib/getQueryClient";
import { createClient } from "@/lib/supabase/server";

const PortfolioEditPage = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const queryClient = getQueryClient();

  await queryClient.prefetchQuery(portfolioQueries.detail(id, createClient));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortfolioEditor portfolioId={id} />
    </HydrationBoundary>
  );
};

export default PortfolioEditPage;
