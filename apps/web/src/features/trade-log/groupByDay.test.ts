import { describe, it, expect } from "vitest";
import { buildDayMarkers, filterLogsByMonth, groupLogsByDate } from "@/features/trade-log/groupByDay";
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

describe("filterLogsByMonth", () => {
  it("연/월이 일치하는 기록만 남긴다", () => {
    const logs = [
      log({ id: "l1", date: "2026-01-15" }),
      log({ id: "l2", date: "2026-02-01" }),
      log({ id: "l3", date: "2026-01-31" }),
    ];

    const result = filterLogsByMonth(logs, 2026, 1);

    expect(result.map((l) => l.id)).toEqual(["l1", "l3"]);
  });
});

describe("groupLogsByDate", () => {
  it("같은 날짜의 기록을 하나의 배열로 묶는다", () => {
    const logs = [
      log({ id: "l1", date: "2026-01-15", type: "buy" }),
      log({ id: "l2", date: "2026-01-15", type: "sell" }),
      log({ id: "l3", date: "2026-01-16" }),
    ];

    const grouped = groupLogsByDate(logs);

    expect(grouped.get("2026-01-15")?.map((l) => l.id)).toEqual(["l1", "l2"]);
    expect(grouped.get("2026-01-16")?.map((l) => l.id)).toEqual(["l3"]);
  });
});

describe("buildDayMarkers", () => {
  it("매수/매도가 섞인 날은 두 표시가 모두 true다", () => {
    const logs = [
      log({ id: "l1", date: "2026-01-15", type: "buy" }),
      log({ id: "l2", date: "2026-01-15", type: "sell" }),
      log({ id: "l3", date: "2026-01-03", type: "buy" }),
    ];

    const markers = buildDayMarkers(logs);

    expect(markers.get(15)).toEqual({ hasBuy: true, hasSell: true });
    expect(markers.get(3)).toEqual({ hasBuy: true, hasSell: false });
    expect(markers.get(8)).toBeUndefined();
  });
});
