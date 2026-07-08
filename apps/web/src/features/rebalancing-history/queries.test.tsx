import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";

function makeBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.range = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.gte = vi.fn(() => builder);
  builder.lte = vi.fn(() => builder);
  builder.then = (resolve: (value: unknown) => unknown) => resolve(result);
  return builder;
}

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

function renderWithClient<T>(callback: () => T) {
  const queryClient = new QueryClient();
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
}

const baseRow = {
  id: "e1",
  portfolio_id: "p1",
  executed_at: "2026-01-15T00:00:00Z",
  total_budget: 500000,
  actions: [
    { ticker: "AAPL", action: "buy", quantity: 1, pricePerShare: 200, totalAmount: 200 },
    { ticker: "TSLA", action: "sell", quantity: -1, pricePerShare: 220, totalAmount: -220 },
  ],
  portfolios: { name: "워런 버핏 전략" },
  portfolio_snapshots: [
    {
      assets: [
        { ticker: "AAPL", name: "Apple", ratio: 60, shares: 3, pricePerShare: 200, color: "#355df9" },
        { ticker: "TSLA", name: "Tesla", ratio: 40, shares: 0, pricePerShare: 220, color: "#e85d4a" },
      ],
    },
  ],
};

describe("useRebalancingHistory", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("execution_records를 스냅샷 자산으로 보강해 이름/색상을 채운다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [baseRow], error: null }));

    const { result } = renderWithClient(() =>
      useRebalancingHistory({ portfolioId: null, dateFrom: null, dateTo: null })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const records = result.current.data?.pages.flat();
    expect(records?.[0]).toMatchObject({
      id: "e1",
      portfolioName: "워런 버핏 전략",
    });
    expect(records?.[0].actions[0]).toMatchObject({
      ticker: "AAPL",
      name: "Apple",
      color: "#355df9",
    });
  });

  it("페이지 크기(10)보다 적게 반환되면 다음 페이지가 없다고 판단한다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: [baseRow], error: null }));

    const { result } = renderWithClient(() =>
      useRebalancingHistory({ portfolioId: null, dateFrom: null, dateTo: null })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.hasNextPage).toBe(false);
  });

  it("포트폴리오가 삭제되어 조인 결과가 없으면 안내 문구로 대체한다", async () => {
    fromMock.mockReturnValue(
      makeBuilder({
        data: [{ ...baseRow, portfolios: null, portfolio_snapshots: null }],
        error: null,
      })
    );

    const { result } = renderWithClient(() =>
      useRebalancingHistory({ portfolioId: null, dateFrom: null, dateTo: null })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const records = result.current.data?.pages.flat();
    expect(records?.[0].portfolioName).toBe("삭제된 포트폴리오");
    expect(records?.[0].actions[0].name).toBe("AAPL");
  });

  it("dateTo가 오늘이면 자정이 아닌 하루의 끝(23:59:59.999)까지 조회한다", async () => {
    const builder = makeBuilder({ data: [baseRow], error: null });
    fromMock.mockReturnValue(builder);

    const { result } = renderWithClient(() =>
      useRebalancingHistory({ portfolioId: null, dateFrom: null, dateTo: "2026-07-08" })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const lteCall = (builder.lte as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(lteCall[0]).toBe("executed_at");
    expect(lteCall[1]).toBe(new Date("2026-07-08T23:59:59.999").toISOString());
    expect(lteCall[1]).not.toBe("2026-07-08");
  });

  it("dateFrom은 해당 날짜의 시작(00:00:00)부터 조회한다", async () => {
    const builder = makeBuilder({ data: [baseRow], error: null });
    fromMock.mockReturnValue(builder);

    const { result } = renderWithClient(() =>
      useRebalancingHistory({ portfolioId: null, dateFrom: "2026-07-08", dateTo: null })
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const gteCall = (builder.gte as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(gteCall[0]).toBe("executed_at");
    expect(gteCall[1]).toBe(new Date("2026-07-08T00:00:00").toISOString());
  });
});
