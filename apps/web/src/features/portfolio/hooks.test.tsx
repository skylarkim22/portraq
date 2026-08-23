import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePortfolio, useLatestSnapshot } from "@/features/portfolio/hooks";

const makeBuilder = (result: { data: unknown; error: unknown }) => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.in = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

// asset_prices 조회(fetchLatestClosePrices)는 항상 빈 배열로 응답해
// portfolio_assets.current_price로 폴백하는 기존 테스트 값을 그대로 유지한다.
const emptyAssetPricesBuilder = makeBuilder({ data: [], error: null });

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

const renderWithClient = <T,>(callback: () => T) => {
  const queryClient = new QueryClient();
  const view = renderHook(callback, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { ...view, queryClient };
}

describe("usePortfolio", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("portfolios와 portfolio_assets를 조인해 정렬된 assets로 변환한다", async () => {
    const portfoliosBuilder = makeBuilder({
      data: {
        id: "p1",
        name: "테스트 포트폴리오",
        memo: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
        portfolio_assets: [
          {
            asset_ticker: "MSFT",
            custom_asset_id: null,
            ratio: 30,
            shares: 0,
            current_price: 0,
            sort_order: 1,
            assets: { name: "Microsoft", market: "US", color: "#000" },
            custom_assets: null,
          },
          {
            asset_ticker: "AAPL",
            custom_asset_id: null,
            ratio: 70,
            shares: 0,
            current_price: 0,
            sort_order: 0,
            assets: { name: "Apple", market: "US", color: "#111" },
            custom_assets: null,
          },
        ],
      },
      error: null,
    });
    fromMock.mockImplementation((table: string) =>
      table === "asset_prices" ? emptyAssetPricesBuilder : portfoliosBuilder
    );

    const { result } = renderWithClient(() => usePortfolio("p1"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.assets.map((a) => a.ticker)).toEqual([
      "AAPL",
      "MSFT",
    ]);
  });

  it("asset_prices에 최신 종가가 있으면 current_price 대신 그 값을 쓰고, 없으면 current_price로 폴백한다", async () => {
    const portfoliosBuilder = makeBuilder({
      data: {
        id: "p1",
        name: "테스트 포트폴리오",
        memo: null,
        created_at: "2026-01-01",
        updated_at: "2026-01-01",
        portfolio_assets: [
          {
            asset_ticker: "AAPL",
            custom_asset_id: null,
            ratio: 50,
            shares: 1,
            current_price: 100, // 마지막 리밸런싱 실행가(구식)
            sort_order: 0,
            assets: { name: "Apple", market: "US", color: "#111" },
            custom_assets: null,
          },
          {
            asset_ticker: "NEWCO",
            custom_asset_id: null,
            ratio: 50,
            shares: 1,
            current_price: 50, // 오늘 막 추가해 저장한 실행가 — 배치가 아직 못 돈 상태
            sort_order: 1,
            assets: { name: "New Co", market: "US", color: "#222" },
            custom_assets: null,
          },
        ],
      },
      error: null,
    });
    // AAPL은 배치가 채운 최신 종가가 있고, NEWCO는 아직 없다.
    const assetPricesBuilder = makeBuilder({
      data: [{ ticker: "AAPL", close_price: 250, price_date: "2026-08-22" }],
      error: null,
    });
    fromMock.mockImplementation((table: string) =>
      table === "asset_prices" ? assetPricesBuilder : portfoliosBuilder
    );

    const { result } = renderWithClient(() => usePortfolio("p1"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const byTicker = new Map(result.current.data?.assets.map((a) => [a.ticker, a.currentPrice]));
    expect(byTicker.get("AAPL")).toBe(250);
    expect(byTicker.get("NEWCO")).toBe(50);
  });
});

describe("useLatestSnapshot", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("가장 최근 스냅샷의 assets를 반환한다", async () => {
    fromMock.mockReturnValue(
      makeBuilder({
        data: {
          assets: [
            { ticker: "AAPL", name: "Apple", ratio: 60, shares: 5, pricePerShare: 200, color: "#000" },
          ],
        },
        error: null,
      })
    );

    const { result } = renderWithClient(() => useLatestSnapshot("p1"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([
      { ticker: "AAPL", name: "Apple", ratio: 60, shares: 5, pricePerShare: 200, color: "#000" },
    ]);
  });

  it("스냅샷이 없으면 빈 배열을 반환한다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));

    const { result } = renderWithClient(() => useLatestSnapshot("p1"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
