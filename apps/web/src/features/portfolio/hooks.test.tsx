import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  usePortfolio,
  useSavePortfolio,
  useCreatePortfolio,
  useLatestSnapshot,
  useRecordRebalancingExecution,
} from "@/features/portfolio/hooks";
import type { PortfolioAsset } from "@portraq/lib/types";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.delete = vi.fn(() => builder);
  builder.insert = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.single = vi.fn(() => Promise.resolve(result));
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const fromMock = vi.fn();
const rpcMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock, rpc: rpcMock }),
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

describe("useSavePortfolio", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it("save_portfolio RPC를 이름/메모와 isSlot 제외한 종목으로 호출한다", async () => {
    const { result } = renderWithClient(() => useSavePortfolio("p1"));

    const assets: PortfolioAsset[] = [
      { ticker: "AAPL", ratio: 70, shares: 0, order: 0 },
      { ticker: "SLOT", ratio: 30, shares: 0, order: 1, isSlot: true },
    ];

    await act(async () => {
      await result.current.mutateAsync({
        name: "테스트",
        memo: null,
        assets,
      });
    });

    expect(rpcMock).toHaveBeenCalledWith("save_portfolio", {
      p_portfolio_id: "p1",
      p_name: "테스트",
      p_memo: null,
      p_assets: [expect.objectContaining({ ticker: "AAPL", ratio: 70 })],
    });
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

describe("useRecordRebalancingExecution", () => {
  beforeEach(() => {
    rpcMock.mockReset();
    rpcMock.mockResolvedValue({ data: null, error: null });
  });

  it("record_rebalancing_execution RPC를 확정된 값으로 호출한다", async () => {
    const { result } = renderWithClient(() =>
      useRecordRebalancingExecution("p1")
    );

    await act(async () => {
      await result.current.mutateAsync({
        totalBudget: 500000,
        actions: [
          { ticker: "AAPL", action: "buy", quantity: 2, pricePerShare: 200, totalAmount: 400 },
        ],
        updatedAssets: [{ ticker: "AAPL", shares: 7, currentPrice: 200 }],
        snapshotAssets: [
          { ticker: "AAPL", name: "Apple", ratio: 100, shares: 7, pricePerShare: 200, color: "#000" },
        ],
      });
    });

    expect(rpcMock).toHaveBeenCalledWith("record_rebalancing_execution", {
      p_portfolio_id: "p1",
      p_total_budget: 500000,
      p_actions: [expect.objectContaining({ ticker: "AAPL", action: "buy" })],
      p_updated_assets: [expect.objectContaining({ ticker: "AAPL", shares: 7 })],
      p_snapshot_assets: [expect.objectContaining({ ticker: "AAPL", shares: 7 })],
    });
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
