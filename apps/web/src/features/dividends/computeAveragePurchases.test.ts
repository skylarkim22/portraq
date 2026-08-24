import { describe, it, expect } from "vitest";
import { computeAveragePurchases, reconcileWithActualHoldings } from "@/features/dividends/computeAveragePurchases";

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

describe("reconcileWithActualHoldings", () => {
  it("실제 보유 수량이 0이면 0/0을 반환한다", () => {
    const result = reconcileWithActualHoldings({ computed: undefined, actualShares: 0, fallbackPrice: 1000 });
    expect(result).toEqual({ avgPrice: 0, shares: 0 });
  });

  it("buy 액션이 전혀 없어도(모두 hold) 실제 보유 수량 전체를 등록 시점 가격으로 반영한다", () => {
    const result = reconcileWithActualHoldings({
      computed: undefined,
      actualShares: 200,
      fallbackPrice: 8710,
    });
    expect(result).toEqual({ avgPrice: 8710, shares: 200 });
  });

  it("추적된 매수 수량이 실제 보유 수량과 같으면 계산된 평균단가를 그대로 쓴다", () => {
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 150, shares: 20 },
      actualShares: 20,
      fallbackPrice: 999,
    });
    expect(result).toEqual({ avgPrice: 150, shares: 20 });
  });

  it("추적된 매수 수량이 실제 보유 수량보다 적으면 차이만큼을 등록 시점 가격으로 섞어 평균을 낸다", () => {
    // 10주는 100원에 매수 기록, 나머지 10주(기존 보유분)는 200원으로 간주
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 100, shares: 10 },
      actualShares: 20,
      fallbackPrice: 200,
    });
    expect(result).toEqual({ avgPrice: 150, shares: 20 });
  });

  it("추적된 매수 수량이 실제 보유 수량보다 많으면(일부 매도가 앱 밖에서 일어난 경우) 계산된 평균단가를 유지한다", () => {
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 100, shares: 30 },
      actualShares: 20,
      fallbackPrice: 999,
    });
    expect(result).toEqual({ avgPrice: 100, shares: 20 });
  });
});
