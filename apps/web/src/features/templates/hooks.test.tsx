import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useTemplateList, useTemplate } from "@/features/templates/hooks";

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

const rows = [
  {
    id: "warren-buffett",
    name: "워런 버핏",
    strategy: "value",
    market: "US",
    cagr: 10.4,
    mdd: -32.7,
    description: "집중 투자",
    source_date: "2026-03-31",
    assets: [
      { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sort_order: 1 },
      { ticker: null, name: "기타", market: "US", ratio: 40, sort_order: 0 },
    ],
  },
  {
    id: "ray-dalio-all-weather",
    name: "레이 달리오",
    strategy: "asset-allocation",
    market: "MIXED",
    cagr: 7.2,
    mdd: -12.4,
    description: "올웨더",
    source_date: "2025-01-01",
    assets: [
      { ticker: "SPY", name: "S&P 500 ETF", market: "US", ratio: 100, sort_order: 0 },
    ],
  },
];

describe("useTemplateList", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("템플릿 목록을 지정된 표시 순서로 정렬해 반환하고, 자산은 sort_order로 정렬한다", async () => {
    fromMock.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: rows, error: null })),
    });

    const { result } = renderWithClient(() => useTemplateList());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.map((t) => t.id)).toEqual([
      "ray-dalio-all-weather",
      "warren-buffett",
    ]);
    expect(result.current.data?.[1].assets.map((a) => a.ticker)).toEqual([
      null,
      "AAPL",
    ]);
  });
});

describe("useTemplate", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockReturnValue({
      select: vi.fn(() => Promise.resolve({ data: rows, error: null })),
    });
  });

  it("id가 null이면 조회를 비활성화한다", () => {
    const { result } = renderWithClient(() => useTemplate(null));
    expect(result.current.fetchStatus).toBe("idle");
  });

  it("해당 id의 템플릿만 선택해 반환한다", async () => {
    const { result } = renderWithClient(() => useTemplate("ray-dalio-all-weather"));

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe("레이 달리오");
  });
});
