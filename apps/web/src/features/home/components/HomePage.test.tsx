import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HomePage } from "@/features/home/components/HomePage";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import type { PortfolioSummary } from "@/features/portfolio/queries";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(),
}));

vi.mock("@/features/rebalancing-history/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/rebalancing-history/hooks")
  >("@/features/rebalancing-history/hooks");
  return {
    ...actual,
    useRebalancingHistory: vi.fn(),
  };
});

const portfolio = (id: string, name: string): PortfolioSummary => ({
  id,
  name,
  updatedAt: "2026-01-15",
  assets: [
    { ticker: "AAPL", market: "US", ratio: 100, shares: 10, currentPrice: 1000, color: "#355df9" },
  ],
  latestExecution: null,
});

describe("HomePage", () => {
  it("요약 타일과 포트폴리오 카드를 보여준다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [portfolio("p1", "워런 버핏 전략"), portfolio("p2", "레이 달리오 올웨더")],
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [], hasMore: false }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<HomePage />);

    expect(screen.getByText("20,000원")).toBeInTheDocument();
    expect(screen.getByText("2개")).toBeInTheDocument();
    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("레이 달리오 올웨더")).toBeInTheDocument();
  });
});
