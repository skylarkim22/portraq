import { describe, it, expect } from "vitest";
import { getTickerColor, resolveColor } from "../ticker-color";

describe("getTickerColor", () => {
  it("동일 티커는 항상 같은 색상을 반환한다", () => {
    expect(getTickerColor("AAPL")).toBe(getTickerColor("AAPL"));
    expect(getTickerColor("005930")).toBe(getTickerColor("005930"));
  });

  it("유효한 hex 색상을 반환한다", () => {
    const color = getTickerColor("TSLA");
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});

describe("resolveColor", () => {
  it("기존 색상이 있으면 그대로 반환한다", () => {
    expect(resolveColor("#abcdef", "AAPL")).toBe("#abcdef");
  });

  it("이미 사용된 색상이면 다음 팔레트 색상을 반환한다", () => {
    const base = getTickerColor("AAPL");
    const resolved = resolveColor(undefined, "AAPL", [base]);
    expect(resolved).not.toBe(base);
  });
});
