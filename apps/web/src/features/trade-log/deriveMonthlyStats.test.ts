import { describe, it, expect } from "vitest";
import { deriveMonthlyStats } from "@/features/trade-log/deriveMonthlyStats";
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
  market: "KR",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("deriveMonthlyStats", () => {
  it("매수/매도 금액과 세금 합계를 계산한다", () => {
    const oxyBuy = log({
      id: "b1",
      type: "buy",
      ticker: "OXY",
      date: "2025-12-01",
      quantity: 5,
      price: 50000,
      name: "Occidental",
    });
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "buy", ticker: "KO", quantity: 10, price: 83000, name: "Coca-Cola" }),
      log({
        id: "l2",
        type: "sell",
        ticker: "OXY",
        quantity: 3,
        price: 60000,
        tax: 400,
        name: "Occidental",
      }),
    ];

    const stats = deriveMonthlyStats(logs, [oxyBuy, ...logs]);

    expect(stats.totalBuyAmount).toBe(830000);
    expect(stats.totalSellAmount).toBe(180000);
    expect(stats.totalTax).toBe(400);
    expect(stats.tradeCount).toBe(2);
  });

  it("순손익 = (매도가-평균단가)*수량 - 세금, 순수익률 = 순손익/매도분 매수원금*100", () => {
    const aaplBuy = log({
      id: "b1",
      type: "buy",
      ticker: "AAPL",
      date: "2025-12-01",
      quantity: 8,
      price: 70000,
    });
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "sell", ticker: "AAPL", quantity: 2, price: 100000, tax: 1000 }),
    ];

    const stats = deriveMonthlyStats(logs, [aaplBuy, ...logs]);

    // pnl = (100000-70000)*2 = 60000, after tax = 59000
    expect(stats.netPnl).toBe(59000);
    // sellCostBasis = 70000*2 = 140000
    expect(stats.netPnlRate).toBeCloseTo((59000 / 140000) * 100);
  });

  it("US 종목 매도는 환율로 원화 환산해 계산한다", () => {
    const aaplBuy = log({
      id: "b1",
      type: "buy",
      ticker: "AAPL",
      date: "2025-12-01",
      quantity: 5,
      price: 70000,
      market: "US",
    });
    const logs: EnrichedTradeLog[] = [
      log({
        id: "l1",
        type: "sell",
        ticker: "AAPL",
        quantity: 2,
        price: 60,
        exchangeRate: 1400,
        market: "US",
      }),
    ];

    const stats = deriveMonthlyStats(logs, [aaplBuy, ...logs]);

    // priceKrw = 60*1400 = 84000, amount = 168000
    expect(stats.totalSellAmount).toBe(168000);
    expect(stats.netPnl).toBe((84000 - 70000) * 2);
  });

  it("시장별 비중은 매수금액 기준으로 계산한다", () => {
    const logs: EnrichedTradeLog[] = [
      log({ id: "l1", type: "buy", ticker: "AAPL", quantity: 1, price: 80000, market: "US" }),
      log({
        id: "l2",
        type: "buy",
        ticker: "005930",
        quantity: 1,
        price: 20000,
        name: "삼성전자",
        market: "KR",
      }),
    ];

    const stats = deriveMonthlyStats(logs, logs);

    const us = stats.marketShare.find((m) => m.market === "US");
    const kr = stats.marketShare.find((m) => m.market === "KR");
    expect(us?.ratio).toBeCloseTo(80);
    expect(kr?.ratio).toBeCloseTo(20);
  });

  it("데이터가 없으면 0으로 채운다", () => {
    const stats = deriveMonthlyStats([], []);

    expect(stats).toMatchObject({
      totalBuyAmount: 0,
      totalSellAmount: 0,
      totalTax: 0,
      netPnl: 0,
      netPnlRate: 0,
      tradeCount: 0,
      marketShare: [],
    });
  });
});
