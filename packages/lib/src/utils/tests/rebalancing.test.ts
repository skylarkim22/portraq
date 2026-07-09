import { describe, it, expect } from "vitest";
import { calcRebalancingActions, toActionItems, toKrwPrice } from "../rebalancing";
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

  it("market이 KR이면 0.5주 차이는 유지, US면 매수로 처리한다", () => {
    const holdings = [{ ticker: "X", shares: 0, pricePerShare: 100 }];

    const krResult = calcRebalancingActions({
      assets: [{ ticker: "X", ratio: 100, shares: 0, order: 0, market: "KR" }],
      holdings,
      additionalBudget: 50,
    });
    expect(krResult[0].action).toBe("hold");

    const usResult = calcRebalancingActions({
      assets: [{ ticker: "X", ratio: 100, shares: 0, order: 0, market: "US" }],
      holdings,
      additionalBudget: 50,
    });
    expect(usResult[0].action).toBe("buy");
  });

  it("market 필드가 없으면 KR 기준(1주)으로 처리한다", () => {
    const result = calcRebalancingActions({
      assets: [{ ticker: "X", ratio: 100, shares: 0, order: 0 }],
      holdings: [{ ticker: "X", shares: 0, pricePerShare: 100 }],
      additionalBudget: 50,
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

describe("toActionItems", () => {
  it("매도 액션의 수량을 음수로 변환한다", () => {
    const result = calcRebalancingActions({
      assets: [{ ticker: "AAPL", ratio: 0, shares: 10, order: 0 }],
      holdings: [{ ticker: "AAPL", shares: 10, pricePerShare: 200 }],
      additionalBudget: 0,
    });

    const [item] = toActionItems(result);

    expect(item.action).toBe("sell");
    expect(item.quantity).toBeLessThan(0);
    expect(item.pricePerShare).toBe(200);
  });

  it("매수 액션의 수량은 양수로 유지한다", () => {
    const result = calcRebalancingActions({
      assets: [{ ticker: "AAPL", ratio: 100, shares: 0, order: 0 }],
      holdings: [{ ticker: "AAPL", shares: 0, pricePerShare: 200 }],
      additionalBudget: 1000,
    });

    const [item] = toActionItems(result);

    expect(item.action).toBe("buy");
    expect(item.quantity).toBeGreaterThan(0);
  });
});

describe("toKrwPrice", () => {
  it("US 종목은 환율을 곱해 원화로 환산한다", () => {
    expect(toKrwPrice(100, "US", 1300)).toBe(130000);
  });

  it("KR 종목은 환율과 무관하게 그대로 반환한다", () => {
    expect(toKrwPrice(50000, "KR", 1300)).toBe(50000);
  });
});
