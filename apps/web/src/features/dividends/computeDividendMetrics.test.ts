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
    expect(
      computeAnnualizedYield({
        manualHistory: [{ month: "2026-08", amount: 1000 }],
        avgPrice: 0,
        shares: 10,
        asOf: FIXED_NOW,
      })
    ).toBeNull();
    expect(
      computeAnnualizedYield({
        manualHistory: [{ month: "2026-08", amount: 1000 }],
        avgPrice: 100,
        shares: 0,
        asOf: FIXED_NOW,
      })
    ).toBeNull();
  });

  it("입력이 없으면 0%를 반환한다", () => {
    const result = computeAnnualizedYield({ manualHistory: [], avgPrice: 150000, shares: 10, asOf: FIXED_NOW });
    expect(result).toBe(0);
  });

  it("12개월치가 모두 입력됐으면 배당합 ÷ 투자금과 같다", () => {
    const manualHistory = Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(((i + 8) % 12) + 1).padStart(2, "0")}`,
      amount: 1250,
    }));
    const result = computeAnnualizedYield({ manualHistory, avgPrice: 150000, shares: 10, asOf: FIXED_NOW });
    expect(result).toBe(1); // 15000 / 1500000 = 1%
  });

  it("일부 달만 입력됐으면 그 페이스를 12개월로 환산한다", () => {
    // 이번 달 하나만 5,000원 입력 → 연환산 60,000원 ÷ 투자금 600,000원 = 10%
    const result = computeAnnualizedYield({
      manualHistory: [{ month: "2026-08", amount: 5000 }],
      avgPrice: 60000,
      shares: 10,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(10);
  });

  it("최근 12개월 밖의 입력은 환산 대상에서 제외한다", () => {
    const result = computeAnnualizedYield({
      manualHistory: [
        { month: "2026-08", amount: 5000 },
        { month: "2024-01", amount: 9999 }, // 12개월 밖
      ],
      avgPrice: 60000,
      shares: 10,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(10);
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

  it("1~12월이 전부 있으면 월배당으로 표시한다", () => {
    expect(formatPaySchedule([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])).toBe("월배당");
    expect(formatPaySchedule([12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])).toBe("월배당");
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
