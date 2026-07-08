import { describe, it, expect } from "vitest";
import { deriveHoldings } from "@/features/trade-log/deriveHoldings";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const log = (overrides: Partial<EnrichedTradeLog>): EnrichedTradeLog => ({
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-01",
  ticker: "AAPL",
  quantity: 1,
  price: 1000,
  memo: null,
  name: "Apple",
  market: "US",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("deriveHoldings", () => {
  it("매수 기록만으로 평균단가를 계산한다", () => {
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "buy", quantity: 5, price: 200000 }),
      log({ id: "l2", type: "buy", quantity: 5, price: 300000 }),
    ];

    const [holding] = deriveHoldings(logs);

    expect(holding).toMatchObject({ ticker: "AAPL", avgPrice: 250000, quantity: 10 });
  });

  it("매도 기록은 보유 수량만 차감하고 평균단가는 그대로 유지한다", () => {
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "buy", quantity: 10, price: 200000 }),
      log({ id: "l2", type: "sell", quantity: 4, price: 300000 }),
    ];

    const [holding] = deriveHoldings(logs);

    expect(holding).toMatchObject({ avgPrice: 200000, quantity: 6 });
  });

  it("보유 수량이 0이 되면 목록에서 제외한다", () => {
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "buy", quantity: 5, price: 200000 }),
      log({ id: "l2", type: "sell", quantity: 5, price: 300000 }),
    ];

    expect(deriveHoldings(logs)).toEqual([]);
  });
});
