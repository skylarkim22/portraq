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

  it("0.5주 차이는 시장(KR/US)과 무관하게 유지로 처리한다", () => {
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
    expect(usResult[0].action).toBe("hold");
  });

  it("market 필드가 없으면 KR 기준(1주)으로 처리한다", () => {
    const result = calcRebalancingActions({
      assets: [{ ticker: "X", ratio: 100, shares: 0, order: 0 }],
      holdings: [{ ticker: "X", shares: 0, pricePerShare: 100 }],
      additionalBudget: 50,
    });

    expect(result[0].action).toBe("hold");
  });

  it("sellThresholdPercent를 지정하면 괴리가 임계값 미만인 초과 비중 종목은 매도 대신 유지한다", () => {
    const result = calcRebalancingActions({
      assets: [
        { ticker: "AAPL", ratio: 50, shares: 0, order: 0 },
        { ticker: "MSFT", ratio: 50, shares: 0, order: 1 },
      ],
      holdings: [
        // AAPL: 목표보다 약 1%p 초과 비중, MSFT: 저비중
        { ticker: "AAPL", shares: 52, pricePerShare: 100 },
        { ticker: "MSFT", shares: 0, pricePerShare: 100 },
      ],
      additionalBudget: 5000,
      sellThresholdPercent: 5,
    });

    const aapl = result.find((r) => r.ticker === "AAPL")!;
    const msft = result.find((r) => r.ticker === "MSFT")!;

    expect(aapl.action).toBe("hold");
    expect(msft.action).toBe("buy");
  });

  it("sellThresholdPercent를 지정해도 괴리가 임계값 이상이면 매도로 계산한다", () => {
    const result = calcRebalancingActions({
      assets: [
        { ticker: "AAPL", ratio: 50, shares: 0, order: 0 },
        { ticker: "MSFT", ratio: 50, shares: 0, order: 1 },
      ],
      holdings: [
        // AAPL: 목표보다 크게 초과 비중
        { ticker: "AAPL", shares: 80, pricePerShare: 100 },
        { ticker: "MSFT", shares: 0, pricePerShare: 100 },
      ],
      additionalBudget: 2000,
      sellThresholdPercent: 5,
    });

    const aapl = result.find((r) => r.ticker === "AAPL")!;

    expect(aapl.action).toBe("sell");
  });

  it("임계값 미만이라 매도하지 않는 초과비중 종목이 있어도 매수 총액은 추가 투자금 + 실제 매도금을 넘지 않는다", () => {
    const result = calcRebalancingActions({
      assets: [
        { ticker: "OVER_SELL", ratio: 20, shares: 0, order: 0 }, // 임계값 이상 초과비중 → 매도
        { ticker: "OVER_HOLD", ratio: 40, shares: 0, order: 1 }, // 임계값 미만 초과비중 → 유지
        { ticker: "UNDER", ratio: 40, shares: 0, order: 2 }, // 저비중 → 매수
      ],
      holdings: [
        { ticker: "OVER_SELL", shares: 40, pricePerShare: 100 }, // 4,000원 보유
        { ticker: "OVER_HOLD", shares: 34, pricePerShare: 100 }, // 3,400원 보유
        { ticker: "UNDER", shares: 0, pricePerShare: 100 },
      ],
      additionalBudget: 500,
      sellThresholdPercent: 5,
    });

    const overSell = result.find((r) => r.ticker === "OVER_SELL")!;
    const overHold = result.find((r) => r.ticker === "OVER_HOLD")!;
    const under = result.find((r) => r.ticker === "UNDER")!;

    expect(overSell.action).toBe("sell");
    expect(overHold.action).toBe("hold");

    const sellProceeds = overSell.quantity * overSell.pricePerShare;
    const buyAmount = under.action === "buy" ? under.quantity * under.pricePerShare : 0;

    expect(buyAmount).toBeLessThanOrEqual(500 + sellProceeds);
  });

  it("매도 목표금액이 주식 수로 딱 나누어떨어지지 않아도 매수 총액은 실제(내림 처리된) 매도 회수액 기준을 넘지 않는다", () => {
    const price = 100;
    const sellShares = 60;
    const sellCurrentValue = sellShares * price; // 6,000원
    const sellDiffTarget = -199.99; // 목표 매도액(소수점) — 100원 단위로 안 나누어떨어짐
    const additionalBudget = 96400.03;
    const totalCurrentValue = sellCurrentValue * 3; // 매도 종목 3개, 매수 종목은 보유 0
    const totalBudget = totalCurrentValue + additionalBudget;
    const sellTargetValue = sellCurrentValue + sellDiffTarget;
    const sellRatio = (sellTargetValue / totalBudget) * 100;

    const buyDemand = 97000;
    const buyRatio = (buyDemand / totalBudget) * 100;

    const result = calcRebalancingActions({
      assets: [
        { ticker: "SELL1", ratio: sellRatio, shares: 0, order: 0 },
        { ticker: "SELL2", ratio: sellRatio, shares: 0, order: 1 },
        { ticker: "SELL3", ratio: sellRatio, shares: 0, order: 2 },
        { ticker: "BUY", ratio: buyRatio, shares: 0, order: 3 },
      ],
      holdings: [
        { ticker: "SELL1", shares: sellShares, pricePerShare: price },
        { ticker: "SELL2", shares: sellShares, pricePerShare: price },
        { ticker: "SELL3", shares: sellShares, pricePerShare: price },
        { ticker: "BUY", shares: 0, pricePerShare: price },
      ],
      additionalBudget,
      sellThresholdPercent: 0,
    });

    const sellRows = result.filter((r) => r.ticker.startsWith("SELL"));
    const buyRow = result.find((r) => r.ticker === "BUY")!;

    expect(sellRows.every((r) => r.action === "sell")).toBe(true);

    const actualSellProceeds = sellRows.reduce(
      (sum, r) => sum + r.quantity * r.pricePerShare,
      0
    );
    const buyAmount =
      buyRow.action === "buy" ? buyRow.quantity * buyRow.pricePerShare : 0;

    expect(buyAmount).toBeLessThanOrEqual(additionalBudget + actualSellProceeds);
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
