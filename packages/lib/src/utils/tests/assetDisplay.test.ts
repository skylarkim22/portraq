import { describe, it, expect } from "vitest";
import { formatAssetTicker } from "../assetDisplay";

describe("formatAssetTicker", () => {
  it("커스텀 종목이면 UUID의 첫 세그먼트만 반환한다", () => {
    expect(formatAssetTicker("d0767289-7f88-4caa-8d35-0af611c0aff8", true)).toBe(
      "d0767289"
    );
  });

  it("카탈로그 종목이면 티커를 그대로 반환한다", () => {
    expect(formatAssetTicker("AAPL", false)).toBe("AAPL");
    expect(formatAssetTicker("005930")).toBe("005930");
  });
});
