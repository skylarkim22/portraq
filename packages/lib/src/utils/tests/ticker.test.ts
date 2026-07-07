import { describe, it, expect } from "vitest";
import { generateCustomTicker } from "../ticker";

describe("generateCustomTicker", () => {
  it("기존 커스텀 티커가 없으면 CUSTOM_1을 반환한다", () => {
    expect(generateCustomTicker([])).toBe("CUSTOM_1");
    expect(generateCustomTicker(["AAPL", "005930"])).toBe("CUSTOM_1");
  });

  it("가장 큰 시퀀스 다음 번호를 반환한다", () => {
    expect(generateCustomTicker(["CUSTOM_1"])).toBe("CUSTOM_2");
    expect(generateCustomTicker(["CUSTOM_1", "CUSTOM_2", "CUSTOM_9"])).toBe(
      "CUSTOM_10"
    );
  });

  it("커스텀 티커가 아닌 값은 무시한다", () => {
    expect(generateCustomTicker(["AAPL", "CUSTOM_3", "005930"])).toBe(
      "CUSTOM_4"
    );
  });
});
