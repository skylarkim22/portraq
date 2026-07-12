import { describe, it, expect, beforeEach } from "vitest";
import {
  readRecentSearches,
  writeRecentSearches,
  withRecentSearch,
  type RecentSearchAsset,
} from "@/features/stocks/recentSearches";

const asset = (ticker: string): RecentSearchAsset => ({
  ticker,
  name: `${ticker} 종목`,
  market: "KR",
  color: "#355df9",
});

describe("readRecentSearches / writeRecentSearches", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("저장된 게 없으면 빈 배열을 반환한다", () => {
    expect(readRecentSearches()).toEqual([]);
  });

  it("쓴 값을 그대로 읽어온다", () => {
    writeRecentSearches([asset("005930")]);

    expect(readRecentSearches()).toEqual([asset("005930")]);
  });

  it("저장된 값이 배열이 아니면(손상된 데이터) 빈 배열을 반환한다", () => {
    window.localStorage.setItem("portraq:recent-searches", JSON.stringify({ not: "an array" }));

    expect(readRecentSearches()).toEqual([]);
  });

  it("저장된 값이 JSON으로 파싱 불가능하면 빈 배열을 반환한다", () => {
    window.localStorage.setItem("portraq:recent-searches", "{invalid json");

    expect(readRecentSearches()).toEqual([]);
  });
});

describe("withRecentSearch", () => {
  it("새 종목을 맨 앞에 추가한다", () => {
    const result = withRecentSearch([asset("AAPL")], asset("005930"));

    expect(result.map((item) => item.ticker)).toEqual(["005930", "AAPL"]);
  });

  it("이미 있던 종목을 다시 선택하면 중복 없이 맨 앞으로 끌어올린다", () => {
    const result = withRecentSearch(
      [asset("005930"), asset("AAPL"), asset("TSLA")],
      asset("AAPL")
    );

    expect(result.map((item) => item.ticker)).toEqual(["AAPL", "005930", "TSLA"]);
  });

  it("5개를 초과하면 오래된 것부터 잘라낸다", () => {
    const items = Array.from({ length: 5 }, (_, i) => asset(`T${i}`));

    const result = withRecentSearch(items, asset("NEW"));

    expect(result).toHaveLength(5);
    expect(result[0].ticker).toBe("NEW");
    expect(result.map((item) => item.ticker)).not.toContain("T4");
  });
});
