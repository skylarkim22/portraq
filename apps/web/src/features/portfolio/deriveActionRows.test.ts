import { describe, it, expect } from "vitest";
import { deriveActionRows } from "@/features/portfolio/deriveActionRows";
import type { RebalancingAction } from "@portraq/lib/utils";
import type { PortfolioAsset } from "@portraq/lib/types";

const buyAction: RebalancingAction = {
  ticker: "AAPL",
  action: "buy",
  quantity: 5,
  pricePerShare: 200,
  currentValue: 2000,
  targetValue: 3000,
  currentRatio: 40,
  targetRatio: 60,
};

const sellAction: RebalancingAction = {
  ticker: "MSFT",
  action: "sell",
  quantity: 3,
  pricePerShare: 100,
  currentValue: 1000,
  targetValue: 700,
  currentRatio: 20,
  targetRatio: 14,
};

const assets: PortfolioAsset[] = [
  { ticker: "AAPL", name: "Apple", color: "#355df9", ratio: 60, shares: 10, order: 0 },
  { ticker: "MSFT", name: "Microsoft", color: "#6b8ffb", ratio: 14, shares: 10, order: 1 },
];

describe("deriveActionRows", () => {
  it("override가 없으면 계산된 부호 있는 수량을 사용한다", () => {
    const rows = deriveActionRows([buyAction, sellAction], {}, assets);

    const aapl = rows.find((r) => r.ticker === "AAPL")!;
    const msft = rows.find((r) => r.ticker === "MSFT")!;

    expect(aapl.quantity).toBe(5);
    expect(aapl.action).toBe("buy");
    expect(msft.quantity).toBe(-3);
    expect(msft.action).toBe("sell");
  });

  it("override가 있으면 해당 값과 그에 맞는 action으로 재계산한다", () => {
    const rows = deriveActionRows([buyAction], { AAPL: -2 }, assets);

    expect(rows[0].quantity).toBe(-2);
    expect(rows[0].action).toBe("sell");
  });

  it("override 값이 0이면 hold로 처리한다", () => {
    const rows = deriveActionRows([buyAction], { AAPL: 0 }, assets);

    expect(rows[0].action).toBe("hold");
  });

  it("자산 목록에서 name/color를 채워 넣는다", () => {
    const rows = deriveActionRows([buyAction], {}, assets);

    expect(rows[0].name).toBe("Apple");
    expect(rows[0].color).toBe("#355df9");
  });

  it("현재/목표 주수를 pricePerShare 기준으로 계산한다", () => {
    const rows = deriveActionRows([buyAction], {}, assets);

    expect(rows[0].currentShares).toBe(2000 / 200);
    expect(rows[0].targetShares).toBe(3000 / 200);
  });
});
