import { calcPortfolioCardValue } from "@/features/portfolio/derivePortfolioCardMetrics";
import type { PortfolioListItem } from "@/features/portfolio/queries";

export type HomeSummary = {
  totalValue: number;
  portfolioCount: number;
};

export const deriveHomeSummary = (portfolios: PortfolioListItem[]): HomeSummary => ({
  totalValue: portfolios.reduce(
    (sum, portfolio) => sum + calcPortfolioCardValue(portfolio.assets),
    0
  ),
  portfolioCount: portfolios.length,
});
