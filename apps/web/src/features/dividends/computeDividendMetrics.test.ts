import { describe, it, expect } from "vitest";
import {
  computeDividendSum,
  computeAnnualizedYield,
  computeExpectedYield,
  formatPaySchedule,
  deriveNoDataReason,
} from "@/features/dividends/computeDividendMetrics";

const FIXED_NOW = new Date(2026, 7, 23); // 2026-08-23

describe("computeDividendSum", () => {
  it("입력 이력이 없으면 0을 반환한다", () => {
    expect(computeDividendSum([], FIXED_NOW)).toBe(0);
  });

  it("최근 12개월 이내 입력만 합산한다", () => {
    const result = computeDividendSum(
      [
        { month: "2026-06", amount: 100 },
        { month: "2026-07", amount: 200 },
        { month: "2024-01", amount: 9999 }, // 12개월 밖
      ],
      FIXED_NOW
    );
    expect(result).toBe(300);
  });
});

describe("computeAnnualizedYield", () => {
  it("투자금이 0이면 null을 반환한다", () => {
    expect(computeAnnualizedYield({ dividendSum: 1000, avgPrice: 0, shares: 10 })).toBeNull();
    expect(computeAnnualizedYield({ dividendSum: 1000, avgPrice: 100, shares: 0 })).toBeNull();
  });

  it("배당합 ÷ 투자금 비율을 백분율로 계산한다", () => {
    const result = computeAnnualizedYield({ dividendSum: 15000, avgPrice: 150000, shares: 10 });
    expect(result).toBe(1); // 15000 / 1500000 = 1%
  });

  it("입력이 없으면(배당합 0) 0%를 반환한다", () => {
    const result = computeAnnualizedYield({ dividendSum: 0, avgPrice: 150000, shares: 10 });
    expect(result).toBe(0);
  });
});

describe("computeExpectedYield", () => {
  it("현재가가 0이면 null을 반환한다", () => {
    const result = computeExpectedYield({
      dividendRecords: [{ recordDate: "2026-06-01", amount: 100 }],
      currentPrice: 0,
      asOf: FIXED_NOW,
    });
    expect(result).toBeNull();
  });

  it("배당 이력이 없으면 null을 반환한다", () => {
    const result = computeExpectedYield({ dividendRecords: [], currentPrice: 10000, asOf: FIXED_NOW });
    expect(result).toBeNull();
  });

  it("최근 12개월 주당 배당금 합을 현재가로 나눈다", () => {
    const result = computeExpectedYield({
      dividendRecords: [
        { recordDate: "2026-06-01", amount: 100 },
        { recordDate: "2026-07-01", amount: 100 },
      ],
      currentPrice: 10000,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(2); // 200 / 10000 = 2%
  });
});

describe("formatPaySchedule", () => {
  it("null이거나 빈 배열이면 null을 반환한다", () => {
    expect(formatPaySchedule(null)).toBeNull();
    expect(formatPaySchedule([])).toBeNull();
  });

  it("오름차순으로 정렬해 '·'로 이어붙이고 '월'을 붙인다", () => {
    expect(formatPaySchedule([11, 2, 8, 5])).toBe("2·5·8·11월");
  });
});

describe("deriveNoDataReason", () => {
  it("dividend_frequency가 없으면 policy를 반환한다", () => {
    expect(deriveNoDataReason({ dividendFrequency: null, expectedYield: null })).toBe("policy");
  });

  it("배당 정책은 있는데 기대배당률이 없으면 new를 반환한다", () => {
    expect(deriveNoDataReason({ dividendFrequency: "quarterly", expectedYield: null })).toBe("new");
  });

  it("기대배당률이 있으면 null을 반환한다", () => {
    expect(deriveNoDataReason({ dividendFrequency: "quarterly", expectedYield: 2.3 })).toBeNull();
  });
});
