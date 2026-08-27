import type { PortfolioSummary } from "@/features/portfolio/queries";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";
import { deriveHomeSummary } from "@/features/home/deriveHomeSummary";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";
import { PortfolioPreviewSection } from "@/features/home/components/PortfolioPreviewSection";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";

type HomePageProps = {
  portfolios: PortfolioSummary[];
  recentHistoryRecords: RebalancingHistoryRecord[];
};

export const HomePage = ({ portfolios, recentHistoryRecords }: HomePageProps) => {
  const summary = deriveHomeSummary(portfolios);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-6">
        <SummaryTiles totalValue={summary.totalValue} portfolioCount={summary.portfolioCount} />
      </section>

      <PortfolioPreviewSection portfolios={portfolios} />

      <RecentHistorySection records={recentHistoryRecords} />
    </div>
  );
};
