import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  usePortfolio,
  useUpdatePortfolioAssets,
  useCreatePortfolio,
} from "@/features/portfolio/hooks";
import type { PortfolioAsset } from "@portraq/lib/types";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
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

describe("useUpdatePortfolioAssets", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
  });

  it("isSlot이 아닌 종목만 delete 후 insert한다", async () => {
    const { result } = renderWithClient(() =>
      useUpdatePortfolioAssets("p1")
    );

    const assets: PortfolioAsset[] = [
      { ticker: "AAPL", ratio: 70, shares: 0, order: 0 },
      { ticker: "SLOT", ratio: 30, shares: 0, order: 1, isSlot: true },
    ];

    await act(async () => {
      await result.current.mutateAsync(assets);
    });

    expect(fromMock).toHaveBeenCalledWith("portfolio_assets");
    const builder = fromMock.mock.results[0].value as {
      delete: ReturnType<typeof vi.fn>;
      insert: ReturnType<typeof vi.fn>;
    };
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.insert).toHaveBeenCalledWith([
      expect.objectContaining({ ticker: "AAPL", ratio: 70 }),
    ]);
  });
});

describe("useCreatePortfolio", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("생성된 포트폴리오의 id를 반환한다", async () => {
    fromMock.mockReturnValue(
      makeBuilder({ data: { id: "new-id" }, error: null })
    );

    const { result } = renderWithClient(() => useCreatePortfolio());

    let id: string | undefined;
    await act(async () => {
      id = await result.current.mutateAsync({
        userId: "u1",
        name: "새 포트폴리오",
      });
    });

    expect(id).toBe("new-id");
  });
});
