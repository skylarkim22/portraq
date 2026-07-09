import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";
import { usePortfolioList } from "@/features/portfolio/hooks";
import type { PortfolioSummary } from "@/features/portfolio/queries";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(),
}));

const portfolio = (id: string): PortfolioSummary => ({
  id,
  name: "포트폴리오",
  updatedAt: "2026-01-15",
  assets: [
    { ticker: "AAPL", market: "US", ratio: 100, shares: 10, currentPrice: 1000, color: "#355df9" },
  ],
  latestExecution: null,
});

describe("SummaryTiles", () => {
  it("총자산과 포트폴리오 수를 보여준다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [portfolio("p1"), portfolio("p2")],
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<SummaryTiles />);

    expect(screen.getByText("20,000원")).toBeInTheDocument();
    expect(screen.getByText("2개")).toBeInTheDocument();
  });

  it("데이터가 없으면 0으로 보여준다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<SummaryTiles />);

    expect(screen.getByText("0원")).toBeInTheDocument();
    expect(screen.getByText("0개")).toBeInTheDocument();
  });
});
