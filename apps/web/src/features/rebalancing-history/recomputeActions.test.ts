import { describe, it, expect } from "vitest";
import { recomputeActions } from "@/features/rebalancing-history/recomputeActions";

describe("recomputeActions", () => {
  it("수량이 양수이면 매수로 판정한다", () => {
    const [result] = recomputeActions([
      { ticker: "AAPL", quantity: 2, pricePerShare: 200 },
    ]);

    expect(result).toMatchObject({
      ticker: "AAPL",
      quantity: 2,
      pricePerShare: 200,
      action: "buy",
    });
  });

  it("수량이 음수이면 매도로 판정한다", () => {
    const [result] = recomputeActions([
      { ticker: "TSLA", quantity: -3, pricePerShare: 220 },
    ]);

    expect(result.action).toBe("sell");
  });

  it("수량이 0이면 유지로 판정한다", () => {
    const [result] = recomputeActions([
      { ticker: "KO", quantity: 0, pricePerShare: 60 },
    ]);

    expect(result.action).toBe("hold");
  });
});
