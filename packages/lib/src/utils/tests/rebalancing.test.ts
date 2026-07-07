import { describe, it, expect } from "vitest";
import { calcRebalancingActions } from "../rebalancing";
import type { PortfolioAsset } from "../../types/index";

const assets: PortfolioAsset[] = [
  { ticker: "AAPL", ratio: 50, shares: 0, order: 0 },
  { ticker: "MSFT", ratio: 30, shares: 0, order: 1 },
  { ticker: "BND", ratio: 20, shares: 0, order: 2 },
];

describe("calcRebalancingActions", () => {
  it("보유 없이 투자금만 있을 때 전부 매수로 계산한다", () => {
    const result = calcRebalancingActions({
      assets,
      holdings: [
        { ticker: "AAPL", shares: 0, pricePerShare: 200 },
        { ticker: "MSFT", shares: 0, pricePerShare: 400 },
        { ticker: "BND", shares: 0, pricePerShare: 100 },
      ],
      additionalBudget: 1_000_000,
    });

    const aapl = result.find((r) => r.ticker === "AAPL")!;
    const msft = result.find((r) => r.ticker === "MSFT")!;

    expect(aapl.action).toBe("buy");
    expect(msft.action).toBe("buy");
  });

  it("목표 비율과 현재 비율이 같으면 유지(hold)로 처리한다", () => {
    const result = calcRebalancingActions({
      assets: [{ ticker: "AAPL", ratio: 100, shares: 5, order: 0 }],
      holdings: [{ ticker: "AAPL", shares: 5, pricePerShare: 200 }],
      additionalBudget: 0,
    });

    expect(result[0].action).toBe("hold");
  });

  it("isSlot 종목은 결과에서 제외한다", () => {
    const result = calcRebalancingActions({
      assets: [
        { ticker: "AAPL", ratio: 70, shares: 0, order: 0 },
        { ticker: "SLOT", ratio: 30, shares: 0, order: 1, isSlot: true },
      ],
      holdings: [{ ticker: "AAPL", shares: 0, pricePerShare: 200 }],
      additionalBudget: 1_000_000,
    });

    expect(result.find((r) => r.ticker === "SLOT")).toBeUndefined();
  });
});
