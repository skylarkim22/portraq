import { useQuery } from "@tanstack/react-query";
import { portfolioQueries } from "@/features/portfolio/queries";

export const usePortfolio = (id: string | null) =>
  useQuery({ ...portfolioQueries.detail(id ?? ""), enabled: id !== null });

export const usePortfolioList = () => useQuery(portfolioQueries.lists());

export const useLatestSnapshot = (portfolioId: string) =>
  useQuery(portfolioQueries.snapshots(portfolioId));
