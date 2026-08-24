import { describe, it, expect } from "vitest";
import { deriveDividendSummary } from "@/features/dividends/deriveDividendSummary";
import type { DividendRow } from "@/features/dividends/queries";

const makeRow = (overrides: Partial<DividendRow> = {}): DividendRow => ({
  portfolioId: "p1",
  portfolioName: "포트폴리오",
  ticker: "AAPL",
  name: "Apple Inc.",
  market: "US",
  color: "#355df9",
  isCustom: false,
  ratio: 100,
  avgPrice: 100,
  shares: 10,
  paySchedule: null,
  dividendSum: 0,
  annualizedYield: null,
  expectedYield: null,
  manualHistory: [],
  noDataReason: null,
  ...overrides,
});

describe("deriveDividendSummary", () => {
  it("종목이 없으면 0/null로 초기화된 요약을 반환한다", () => {
    expect(deriveDividendSummary([])).toEqual({
      totalInvested: 0,
      totalDividend: 0,
      avgYield: null,
      totalCount: 0,
    });
  });

  it("투자금·배당합을 전체 합산하고 가중평균수익률을 계산한다", () => {
    const summary = deriveDividendSummary([
      makeRow({ avgPrice: 1000, shares: 10, dividendSum: 100 }), // invested 10000
      makeRow({ avgPrice: 2000, shares: 5, dividendSum: 200 }), // invested 10000
    ]);

    expect(summary.totalInvested).toBe(20000);
    expect(summary.totalDividend).toBe(300);
    expect(summary.avgYield).toBe(1.5); // 300 / 20000 = 1.5%
  });

  it("종목 수를 센다", () => {
    const summary = deriveDividendSummary([
      makeRow({ noDataReason: "policy" }),
      makeRow({ noDataReason: "new" }),
      makeRow({ noDataReason: null }),
    ]);

    expect(summary.totalCount).toBe(3);
  });
});
