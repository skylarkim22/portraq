import { describe, it, expect } from "vitest";
import { computeAveragePurchases } from "@/features/dividends/computeAveragePurchases";

describe("computeAveragePurchases", () => {
  it("실행 기록이 없으면 빈 Map을 반환한다", () => {
    expect(computeAveragePurchases([]).size).toBe(0);
  });

  it("매수만 있으면 수량가중평균으로 매수 단가를 계산한다", () => {
    const result = computeAveragePurchases([
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 100 }] },
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 200 }] },
    ]);

    expect(result.get("AAPL")).toEqual({ ticker: "AAPL", avgPrice: 150, shares: 20 });
  });

  it("매도는 수량만 차감하고 평균 단가는 유지한다", () => {
    const result = computeAveragePurchases([
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 100 }] },
      { actions: [{ ticker: "AAPL", action: "sell", quantity: 4, pricePerShare: 300 }] },
    ]);

    expect(result.get("AAPL")).toEqual({ ticker: "AAPL", avgPrice: 100, shares: 6 });
  });

  it("hold는 상태를 변경하지 않는다", () => {
    const result = computeAveragePurchases([
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 100 }] },
      { actions: [{ ticker: "AAPL", action: "hold", quantity: 0, pricePerShare: 0 }] },
    ]);

    expect(result.get("AAPL")).toEqual({ ticker: "AAPL", avgPrice: 100, shares: 10 });
  });

  it("보유 수량보다 많이 매도해도 0 미만으로 내려가지 않는다", () => {
    const result = computeAveragePurchases([
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 5, pricePerShare: 100 }] },
      { actions: [{ ticker: "AAPL", action: "sell", quantity: 10, pricePerShare: 100 }] },
    ]);

    expect(result.get("AAPL")?.shares).toBe(0);
  });

  it("여러 티커를 독립적으로 계산한다", () => {
    const result = computeAveragePurchases([
      {
        actions: [
          { ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 100 },
          { ticker: "MSFT", action: "buy", quantity: 5, pricePerShare: 400 },
        ],
      },
    ]);

    expect(result.get("AAPL")).toEqual({ ticker: "AAPL", avgPrice: 100, shares: 10 });
    expect(result.get("MSFT")).toEqual({ ticker: "MSFT", avgPrice: 400, shares: 5 });
  });
});
