import { describe, it, expect } from "vitest";
import {
  calcPortfolioCardValue,
  deriveAssetsMarket,
} from "@/features/portfolio/derivePortfolioCardMetrics";

describe("calcPortfolioCardValue", () => {
  it("보유 자산의 평가금액 합계를 계산한다", () => {
    const totalValue = calcPortfolioCardValue([
      { shares: 10, currentPrice: 1000 },
      { shares: 5, currentPrice: 2000 },
    ]);

    expect(totalValue).toBe(20000);
  });
});

describe("deriveAssetsMarket", () => {
  it("단일 시장이면 해당 시장을 반환한다", () => {
    expect(deriveAssetsMarket(["KR", "KR"])).toBe("KR");
    expect(deriveAssetsMarket(["US", "US"])).toBe("US");
  });

  it("여러 시장이 섞여 있으면 MIXED를 반환한다", () => {
    expect(deriveAssetsMarket(["KR", "US"])).toBe("MIXED");
  });

  it("빈 배열이면 KR을 기본값으로 반환한다", () => {
    expect(deriveAssetsMarket([])).toBe("KR");
  });
});
