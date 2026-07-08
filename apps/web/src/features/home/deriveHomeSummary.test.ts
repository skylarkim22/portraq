import { describe, it, expect } from "vitest";
import { deriveHomeSummary } from "@/features/home/deriveHomeSummary";
import type { PortfolioListItem } from "@/features/portfolio/queries";

const makePortfolio = (
  overrides: Partial<PortfolioListItem> = {}
): PortfolioListItem => ({
  id: "p1",
  name: "포트폴리오",
  updatedAt: "2026-01-01",
  assets: [],
  latestExecution: null,
  ...overrides,
});

describe("deriveHomeSummary", () => {
  it("포트폴리오가 없으면 총자산 0, 개수 0을 반환한다", () => {
    expect(deriveHomeSummary([])).toEqual({ totalValue: 0, portfolioCount: 0 });
  });

  it("모든 포트폴리오의 평가금액을 합산한다", () => {
    const summary = deriveHomeSummary([
      makePortfolio({
        id: "p1",
        assets: [{ ticker: "AAPL", market: "US", ratio: 100, shares: 10, currentPrice: 1000, color: "#355df9" }],
      }),
      makePortfolio({
        id: "p2",
        assets: [{ ticker: "360200", market: "KR", ratio: 100, shares: 5, currentPrice: 2000, color: "#6b8ffb" }],
      }),
    ]);

    expect(summary.totalValue).toBe(20000);
    expect(summary.portfolioCount).toBe(2);
  });
});
