import { derivePortfolioCardValue } from "@/features/portfolio/derivePortfolioCardMetrics";
import type { PortfolioSummary } from "@/features/portfolio/queries";

export type HomeSummary = {
  totalValue: number;
  portfolioCount: number;
};

export const deriveHomeSummary = (portfolios: PortfolioSummary[]): HomeSummary => ({
  totalValue: portfolios.reduce(
    (sum, portfolio) => sum + derivePortfolioCardValue(portfolio.assets),
    0
  ),
  portfolioCount: portfolios.length,
});
