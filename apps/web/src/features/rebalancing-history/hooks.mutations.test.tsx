import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  useDeleteExecutionRecord,
  useUpdateExecutionRecord,
} from "@/features/rebalancing-history/hooks";
import {
  rebalancingHistoryKeys,
  type RebalancingHistoryFilters,
  type RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";

const makeBuilder = (result: { data: unknown; error: unknown }) => {
  const builder: Record<string, unknown> = {};
  builder.delete = vi.fn(() => builder);
  builder.update = vi.fn(() => builder);
  builder.eq = vi.fn(() => Promise.resolve(result));
  return builder;
};

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
};

const filters: RebalancingHistoryFilters = {
  portfolioId: null,
  dateFrom: null,
  dateTo: null,
};

const record = (id: string): RebalancingHistoryRecord => ({
  id,
  portfolioId: "p1",
  portfolioName: "워런 버핏 전략",
  executedAt: "2026-01-15T00:00:00Z",
  totalBudget: 500000,
  actions: [
    {
      ticker: "AAPL",
      action: "buy",
      quantity: 2,
      pricePerShare: 200,
      name: "Apple",
      color: "#355df9",
    },
  ],
});

describe("useDeleteExecutionRecord", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("성공 시 캐시에서 해당 기록을 제거한다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    const { result, queryClient } = renderWithClient(() => useDeleteExecutionRecord());

    queryClient.setQueryData(rebalancingHistoryKeys.list(filters), {
      pages: [[record("e1"), record("e2")]],
      pageParams: [0],
    });

    result.current.mutate("e1");

    await waitFor(() => {
      const cache = queryClient.getQueryData(rebalancingHistoryKeys.list(filters)) as {
        pages: RebalancingHistoryRecord[][];
      };
      expect(cache.pages[0].map((r) => r.id)).toEqual(["e2"]);
    });
  });

  it("실패 시에는 캐시를 건드리지 않는다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: new Error("delete failed") }));
    const { result, queryClient } = renderWithClient(() => useDeleteExecutionRecord());

    queryClient.setQueryData(rebalancingHistoryKeys.list(filters), {
      pages: [[record("e1"), record("e2")]],
      pageParams: [0],
    });

    result.current.mutate("e1");

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cache = queryClient.getQueryData(rebalancingHistoryKeys.list(filters)) as {
      pages: RebalancingHistoryRecord[][];
    };
    expect(cache.pages[0].map((r) => r.id)).toEqual(["e1", "e2"]);
  });
});

describe("useUpdateExecutionRecord", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("성공 시 캐시의 수량/가격을 낙관적으로 반영하고 name/color는 유지한다", async () => {
    fromMock.mockReturnValue(makeBuilder({ data: null, error: null }));
    const { result, queryClient } = renderWithClient(() => useUpdateExecutionRecord());

    queryClient.setQueryData(rebalancingHistoryKeys.list(filters), {
      pages: [[record("e1")]],
      pageParams: [0],
    });

    result.current.mutate({
      id: "e1",
      actions: [
        {
          ticker: "AAPL",
          action: "buy",
          quantity: 5,
          pricePerShare: 300,
        },
      ],
    });

    await waitFor(() => {
      const cache = queryClient.getQueryData(rebalancingHistoryKeys.list(filters)) as {
        pages: RebalancingHistoryRecord[][];
      };
      expect(cache.pages[0][0].actions[0]).toMatchObject({
        ticker: "AAPL",
        quantity: 5,
        name: "Apple",
        color: "#355df9",
      });
    });
  });
});
