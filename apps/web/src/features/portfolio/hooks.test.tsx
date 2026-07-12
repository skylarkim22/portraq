import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { usePortfolio, useLatestSnapshot } from "@/features/portfolio/hooks";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

function renderWithClient<T>(callback: () => T) {
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
    fromMock.mockReturnValue(
      makeBuilder({
        data: {
          id: "p1",
          name: "테스트 포트폴리오",
          memo: null,
          created_at: "2026-01-01",
          updated_at: "2026-01-01",
          portfolio_assets: [
            {
              ticker: "MSFT",
              name: "Microsoft",
              market: "US",
              ratio: 30,
              shares: 0,
              current_price: 0,
              color: "#000",
              sort_order: 1,
            },
            {
              ticker: "AAPL",
              name: "Apple",
              market: "US",
              ratio: 70,
              shares: 0,
              current_price: 0,
              color: "#111",
              sort_order: 0,
            },
          ],
        },
        error: null,
      })
    );

    const { result } = renderWithClient(() => usePortfolio("p1"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.assets.map((a) => a.ticker)).toEqual([
      "AAPL",
      "MSFT",
    ]);
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
