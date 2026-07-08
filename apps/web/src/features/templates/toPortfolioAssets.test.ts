import { describe, it, expect } from "vitest";
import { toPortfolioAssets } from "@/features/templates/toPortfolioAssets";
import type { PortfolioTemplate } from "@portraq/lib/types";

const mockTemplate: PortfolioTemplate = {
  id: "warren-buffett",
  name: "워런 버핏",
  strategy: "value",
  market: "US",
  cagr: 10.4,
  mdd: -32.7,
  description: null,
  sourceDate: null,
  assets: [
    { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sortOrder: 0 },
    { ticker: null, name: "기타 (비공개 종목)", market: "US", ratio: 40, sortOrder: 1 },
  ],
};

describe("toPortfolioAssets", () => {
  it("일반 종목은 그대로 PortfolioAsset으로 변환한다", () => {
    const result = toPortfolioAssets(mockTemplate);

    expect(result[0]).toMatchObject({
      ticker: "AAPL",
      name: "Apple",
      market: "US",
      ratio: 60,
      shares: 0,
      currentPrice: 0,
      order: 0,
    });
    expect(result[0].isSlot).toBeUndefined();
    expect(result[0].color).toBeTruthy();
  });

  it("null-ticker 종목은 isSlot: true와 SLOT_N 플레이스홀더 티커로 변환한다", () => {
    const result = toPortfolioAssets(mockTemplate);

    expect(result).toHaveLength(2);
    expect(result[1]).toMatchObject({
      ticker: "SLOT_1",
      name: "기타 (비공개 종목)",
      market: "US",
      ratio: 40,
      shares: 0,
      currentPrice: 0,
      order: 1,
      isSlot: true,
    });
  });

  it("null-ticker 종목이 여러 개면 순서대로 SLOT_1, SLOT_2를 부여한다", () => {
    const result = toPortfolioAssets({
      ...mockTemplate,
      assets: [
        { ticker: null, name: "슬롯 A", market: "US", ratio: 20, sortOrder: 0 },
        { ticker: null, name: "슬롯 B", market: "US", ratio: 20, sortOrder: 1 },
      ],
    });

    expect(result.map((asset) => asset.ticker)).toEqual(["SLOT_1", "SLOT_2"]);
    expect(result.every((asset) => asset.isSlot)).toBe(true);
  });
});
