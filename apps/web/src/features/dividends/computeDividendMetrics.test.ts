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
        { month: "2026-06", amount: 100, shares: 10 },
        { month: "2026-07", amount: 200, shares: 10 },
        { month: "2024-01", amount: 9999, shares: 10 }, // 12개월 밖
      ],
      FIXED_NOW
    );
    expect(result).toBe(300);
  });
});

describe("computeAnnualizedYield", () => {
  it("매수 단가가 0이면 null을 반환한다", () => {
    const result = computeAnnualizedYield({
      manualHistory: [{ month: "2026-08", amount: 1000, shares: 10 }],
      avgPrice: 0,
      asOf: FIXED_NOW,
    });
    expect(result).toBeNull();
  });

  it("입력이 없으면 0%를 반환한다", () => {
    const result = computeAnnualizedYield({ manualHistory: [], avgPrice: 150000, asOf: FIXED_NOW });
    expect(result).toBe(0);
  });

  it("수량이 변하지 않았으면 배당합 ÷ 투자금과 같다", () => {
    const manualHistory = Array.from({ length: 12 }, (_, i) => ({
      month: `2025-${String(((i + 8) % 12) + 1).padStart(2, "0")}`,
      amount: 1250,
      shares: 10,
    }));
    const result = computeAnnualizedYield({ manualHistory, avgPrice: 150000, asOf: FIXED_NOW });
    expect(result).toBe(1); // (1250/10)×12 / 150000 = 1%
  });

  it("일부 달만 입력됐으면 그 페이스를 12개월로 환산한다", () => {
    // 이번 달 하나만 5,000원(10주 기준=주당 500원) 입력 → 연환산 6,000원 ÷ 매수단가 60,000원 = 10%
    const result = computeAnnualizedYield({
      manualHistory: [{ month: "2026-08", amount: 5000, shares: 10 }],
      avgPrice: 60000,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(10);
  });

  it("최근 12개월 밖의 입력은 환산 대상에서 제외한다", () => {
    const result = computeAnnualizedYield({
      manualHistory: [
        { month: "2026-08", amount: 5000, shares: 10 },
        { month: "2024-01", amount: 9999, shares: 10 }, // 12개월 밖
      ],
      avgPrice: 60000,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(10);
  });

  it("중간에 수량이 늘어나도 매수 단가 대비 주당 배당 기준으로 왜곡 없이 계산한다", () => {
    // 7월: 100주일 때 5,000원(주당 50원) 8월: 150주로 늘어난 뒤 7,500원(주당 50원)
    // 두 달 다 주당 50원 페이스 → 연환산 600원 ÷ 매수단가 10,667원 ≈ 5.6%
    const result = computeAnnualizedYield({
      manualHistory: [
        { month: "2026-07", amount: 5000, shares: 100 },
        { month: "2026-08", amount: 7500, shares: 150 },
      ],
      avgPrice: 10667,
      asOf: FIXED_NOW,
    });
    expect(result).toBe(5.6);
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
  it("dividend_frequency가 없으면 null을 반환한다", () => {
    expect(formatPaySchedule({ dividendFrequency: null, dividendMonths: [2, 5, 8, 11] })).toBeNull();
  });

  it("monthly면 dividend_months와 무관하게 '월배당'만 반환한다", () => {
    expect(formatPaySchedule({ dividendFrequency: "monthly", dividendMonths: null })).toBe("월배당");
    expect(formatPaySchedule({ dividendFrequency: "monthly", dividendMonths: [1, 2, 3] })).toBe("월배당");
  });

  it("quarterly/semiannual/annual이면 라벨과 오름차순 정렬한 월을 줄바꿈으로 이어붙인다", () => {
    expect(formatPaySchedule({ dividendFrequency: "quarterly", dividendMonths: [11, 2, 8, 5] })).toBe(
      "분기배당\n2·5·8·11월"
    );
    expect(formatPaySchedule({ dividendFrequency: "semiannual", dividendMonths: [12, 6] })).toBe(
      "반기배당\n6·12월"
    );
    expect(formatPaySchedule({ dividendFrequency: "annual", dividendMonths: [12] })).toBe("연배당\n12월");
  });

  it("dividend_months가 없으면 라벨만 반환한다", () => {
    expect(formatPaySchedule({ dividendFrequency: "quarterly", dividendMonths: null })).toBe("분기배당");
    expect(formatPaySchedule({ dividendFrequency: "quarterly", dividendMonths: [] })).toBe("분기배당");
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
