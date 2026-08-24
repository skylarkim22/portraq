import { describe, it, expect } from "vitest";
import { computeDividendDeclineSignal } from "@/features/dividends/computeDividendTrend";

describe("computeDividendDeclineSignal", () => {
  it("입력 이력이 2개월 미만이면 null을 반환한다", () => {
    expect(computeDividendDeclineSignal([])).toBeNull();
    expect(computeDividendDeclineSignal([{ month: "2026-08", amount: 1000 }])).toBeNull();
  });

  it("직전월 대비 5% 미만 하락이면 null을 반환한다", () => {
    const result = computeDividendDeclineSignal([
      { month: "2026-07", amount: 1000 },
      { month: "2026-08", amount: 970 },
    ]);
    expect(result).toBeNull();
  });

  it("직전월 대비 5% 이상 하락하면 하락률을 반환한다", () => {
    const result = computeDividendDeclineSignal([
      { month: "2026-07", amount: 5100 },
      { month: "2026-08", amount: 4300 },
    ]);
    expect(result).toEqual({ dropPercent: 15.7 });
  });

  it("배당금이 상승하면 null을 반환한다", () => {
    const result = computeDividendDeclineSignal([
      { month: "2026-07", amount: 1000 },
      { month: "2026-08", amount: 1200 },
    ]);
    expect(result).toBeNull();
  });

  it("입력 순서와 무관하게 월 기준으로 정렬해 최근 두 달을 비교한다", () => {
    const result = computeDividendDeclineSignal([
      { month: "2026-08", amount: 4300 },
      { month: "2026-06", amount: 5200 },
      { month: "2026-07", amount: 5100 },
    ]);
    expect(result).toEqual({ dropPercent: 15.7 });
  });
});
