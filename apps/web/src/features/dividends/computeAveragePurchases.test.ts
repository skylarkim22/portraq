import { describe, it, expect } from "vitest";
import {
  computeAveragePurchases,
  reconcileWithActualHoldings,
  computeSharesTimelines,
  sharesAsOfMonth,
} from "@/features/dividends/computeAveragePurchases";

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

  it("실제 저장 형식대로 매도 quantity가 음수여도 올바르게 차감한다", () => {
    // deriveActionRows.ts가 매도 수량을 음수로 부호화해 저장한다
    // (RebalancingHistoryActionRow.tsx가 표시할 때 Math.abs를 쓰는 이유).
    const result = computeAveragePurchases([
      { actions: [{ ticker: "AAPL", action: "buy", quantity: 10, pricePerShare: 100 }] },
      { actions: [{ ticker: "AAPL", action: "sell", quantity: -4, pricePerShare: 300 }] },
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
    expect(result).toEqual({ avgPrice: 0, shares: 0, preExistingShares: 0 });
  });

  it("buy 액션이 전혀 없어도(모두 hold) 실제 보유 수량 전체를 등록 시점 가격으로 반영한다", () => {
    const result = reconcileWithActualHoldings({
      computed: undefined,
      actualShares: 200,
      fallbackPrice: 8710,
    });
    expect(result).toEqual({ avgPrice: 8710, shares: 200, preExistingShares: 200 });
  });

  it("추적된 매수 수량이 실제 보유 수량과 같으면 계산된 평균단가를 그대로 쓴다", () => {
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 150, shares: 20 },
      actualShares: 20,
      fallbackPrice: 999,
    });
    expect(result).toEqual({ avgPrice: 150, shares: 20, preExistingShares: 0 });
  });

  it("추적된 매수 수량이 실제 보유 수량보다 적으면 차이만큼을 등록 시점 가격으로 섞어 평균을 낸다", () => {
    // 10주는 100원에 매수 기록, 나머지 10주(기존 보유분)는 200원으로 간주
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 100, shares: 10 },
      actualShares: 20,
      fallbackPrice: 200,
    });
    expect(result).toEqual({ avgPrice: 150, shares: 20, preExistingShares: 10 });
  });

  it("추적된 매수 수량이 실제 보유 수량보다 많으면(일부 매도가 앱 밖에서 일어난 경우) 계산된 평균단가를 유지한다", () => {
    const result = reconcileWithActualHoldings({
      computed: { ticker: "AAPL", avgPrice: 100, shares: 30 },
      actualShares: 20,
      fallbackPrice: 999,
    });
    expect(result).toEqual({ avgPrice: 100, shares: 20, preExistingShares: 0 });
  });
});

describe("computeSharesTimelines", () => {
  it("실행 기록이 없으면 빈 Map을 반환한다", () => {
    expect(computeSharesTimelines([]).size).toBe(0);
  });

  it("buy/sell을 시간순으로 한 번만 재생해 티커별 누적 보유 수량 체크포인트를 만든다", () => {
    const result = computeSharesTimelines([
      {
        executedAt: "2026-07-01T00:00:00Z",
        actions: [
          { ticker: "AAPL", action: "buy", quantity: 100, pricePerShare: 10000 },
          { ticker: "MSFT", action: "buy", quantity: 5, pricePerShare: 400 },
        ],
      },
      { executedAt: "2026-08-01T00:00:00Z", actions: [{ ticker: "AAPL", action: "buy", quantity: 50, pricePerShare: 12000 }] },
    ]);

    expect(result.get("AAPL")).toEqual([
      { date: "2026-07-01T00:00:00Z", shares: 100 },
      { date: "2026-08-01T00:00:00Z", shares: 150 },
    ]);
    expect(result.get("MSFT")).toEqual([{ date: "2026-07-01T00:00:00Z", shares: 5 }]);
  });

  it("실제 저장 형식대로 매도 quantity가 음수여도 체크포인트가 올바르게 줄어든다", () => {
    const result = computeSharesTimelines([
      { executedAt: "2026-07-01T00:00:00Z", actions: [{ ticker: "AAPL", action: "buy", quantity: 100, pricePerShare: 10000 }] },
      { executedAt: "2026-08-01T00:00:00Z", actions: [{ ticker: "AAPL", action: "sell", quantity: -30, pricePerShare: 12000 }] },
    ]);

    expect(result.get("AAPL")).toEqual([
      { date: "2026-07-01T00:00:00Z", shares: 100 },
      { date: "2026-08-01T00:00:00Z", shares: 70 },
    ]);
  });

  it("hold만 있는 종목(앱 등록 전부터 보유)은 0주 체크포인트를 남기지 않고 Map에 아예 등록되지 않는다", () => {
    const result = computeSharesTimelines([
      { executedAt: "2026-07-01T00:00:00Z", actions: [{ ticker: "AAPL", action: "hold", quantity: 0, pricePerShare: 0 }] },
      { executedAt: "2026-08-01T00:00:00Z", actions: [{ ticker: "AAPL", action: "hold", quantity: 0, pricePerShare: 0 }] },
    ]);

    expect(result.get("AAPL")).toBeUndefined();
  });
});

describe("sharesAsOfMonth", () => {
  it("timeline이 비어있으면 fallbackShares를 그대로 쓴다", () => {
    expect(sharesAsOfMonth([], "2026-07", 200)).toBe(200);
  });

  it("해당 월 말일 이전 체크포인트가 없으면(등록 전부터 보유) fallbackShares를 쓴다", () => {
    const timeline = [{ date: "2026-08-01T00:00:00Z", shares: 150 }];
    expect(sharesAsOfMonth(timeline, "2026-07", 999)).toBe(999);
  });

  it("해당 월 말일까지의 체크포인트 중 가장 최근 값을 그 달 보유 수량으로 쓴다", () => {
    const timeline = [
      { date: "2026-07-01T00:00:00Z", shares: 100 },
      { date: "2026-08-01T00:00:00Z", shares: 150 },
    ];
    expect(sharesAsOfMonth(timeline, "2026-07", 0)).toBe(100);
    expect(sharesAsOfMonth(timeline, "2026-08", 0)).toBe(150);
    expect(sharesAsOfMonth(timeline, "2026-09", 0)).toBe(150);
  });

  it("체크포인트가 있는 달에는 preExistingOffset을 더해 등록 전부터 보유하던 수량까지 반영한다(#91)", () => {
    // 233주를 등록 전부터 보유 중이던 종목에 36주만 추적된 buy 기록이 있는 경우.
    const timeline = [{ date: "2026-08-01T00:00:00Z", shares: 36 }];
    expect(sharesAsOfMonth(timeline, "2026-08", 233, 197)).toBe(233);
  });

  it("체크포인트가 없어 fallback을 타는 달에는 preExistingOffset을 더하지 않는다(이미 전체 수량임)", () => {
    expect(sharesAsOfMonth([], "2026-07", 233, 197)).toBe(233);
  });
});
