import { describe, it, expect } from "vitest";
import { calcSellPnl } from "@/features/trade-log/calcSellPnl";

describe("calcSellPnl", () => {
  it("KR 종목은 환율 없이 그대로 계산한다", () => {
    const result = calcSellPnl({ quantity: 2, price: 80000, tax: 400 }, "KR", 70000);

    expect(result.amount).toBe(160000);
    expect(result.pnl).toBe(20000);
    expect(result.pnlAfterTax).toBe(19600);
  });

  it("US 종목은 환율로 원화 환산 후 계산한다", () => {
    const result = calcSellPnl(
      { quantity: 3, price: 60, exchangeRate: 1400, tax: 1000 },
      "US",
      70000
    );

    // priceKrw = 60 * 1400 = 84,000
    expect(result.amount).toBe(252000);
    expect(result.pnl).toBe((84000 - 70000) * 3);
    expect(result.pnlAfterTax).toBe((84000 - 70000) * 3 - 1000);
  });

  it("tax/exchangeRate가 없으면 0/1로 취급한다", () => {
    const result = calcSellPnl({ quantity: 1, price: 50000 }, "KR", 40000);

    expect(result.amount).toBe(50000);
    expect(result.pnl).toBe(10000);
    expect(result.pnlAfterTax).toBe(10000);
  });
});
