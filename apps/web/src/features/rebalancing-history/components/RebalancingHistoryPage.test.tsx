import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RebalancingHistoryPage } from "@/features/rebalancing-history/components/RebalancingHistoryPage";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(() => ({ data: [{ id: "p1", name: "워런 버핏 전략" }] })),
}));

vi.mock("@/features/rebalancing-history/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/rebalancing-history/hooks")
  >("@/features/rebalancing-history/hooks");
  return {
    ...actual,
    useRebalancingHistory: vi.fn(),
    useUpdateExecutionRecord: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
    useDeleteExecutionRecord: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

const record = (id: string, executedAt: string): RebalancingHistoryRecord => ({
  id,
  portfolioId: "p1",
  portfolioName: "워런 버핏 전략",
  executedAt,
  totalBudget: 500000,
  actions: [
    {
      ticker: "AAPL",
      action: "buy",
      quantity: 1,
      pricePerShare: 200,
      name: "Apple",
      color: "#355df9",
    },
  ],
});

describe("RebalancingHistoryPage", () => {
  it("월별로 그룹핑해 기록을 보여준다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: {
        pages: [
          {
            records: [
              record("e1", "2026-01-15T00:00:00Z"),
              record("e2", "2025-12-02T00:00:00Z"),
            ],
            hasMore: false,
          },
        ],
      },
      isLoading: false,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    expect(screen.getByText("2026년 1월")).toBeInTheDocument();
    expect(screen.getByText("2025년 12월")).toBeInTheDocument();
  });

  it("포트폴리오별로 가장 최근 기록에만 삭제 버튼을 보여준다", async () => {
    const user = userEvent.setup();
    const recordForPortfolio = (
      id: string,
      executedAt: string,
      portfolioId: string,
      portfolioName: string
    ): RebalancingHistoryRecord => ({
      ...record(id, executedAt),
      portfolioId,
      portfolioName,
    });

    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: {
        pages: [
          {
            records: [
              recordForPortfolio("e1", "2026-01-20T00:00:00Z", "p1", "워런 버핏 전략"),
              recordForPortfolio("e2", "2026-01-15T00:00:00Z", "p2", "레이 달리오 올웨더"),
              recordForPortfolio("e3", "2026-01-10T00:00:00Z", "p1", "워런 버핏 전략"),
            ],
            hasMore: false,
          },
        ],
      },
      isLoading: false,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    const headers = screen.getAllByRole("button", { name: /워런 버핏 전략|레이 달리오 올웨더/ });
    for (const header of headers) {
      await user.click(header);
    }

    expect(screen.getAllByRole("button", { name: /삭제/ })).toHaveLength(2);
  });

  it("로딩 중에는 로딩 문구를 보여준다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("기록이 없으면 안내 문구를 보여준다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [], hasMore: false }] },
      isLoading: false,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    expect(
      screen.getByText("조건에 맞는 실행 기록이 없습니다.")
    ).toBeInTheDocument();
  });

  it("다음 페이지가 있으면 더보기 버튼을 누를 때만 fetchNextPage를 호출한다", async () => {
    const user = userEvent.setup();
    const fetchNextPage = vi.fn();
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [record("e1", "2026-01-15T00:00:00Z")], hasMore: true }] },
      isLoading: false,
      isError: false,
      fetchNextPage,
      hasNextPage: true,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    const loadMoreButton = screen.getByRole("button", { name: "더보기" });
    expect(fetchNextPage).not.toHaveBeenCalled();

    await user.click(loadMoreButton);

    expect(fetchNextPage).toHaveBeenCalledTimes(1);
  });

  it("hasNextPage가 false면 더보기 버튼을 보여주지 않는다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [record("e1", "2026-01-15T00:00:00Z")], hasMore: false }] },
      isLoading: false,
      isError: false,
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RebalancingHistoryPage />);

    expect(screen.queryByRole("button", { name: "더보기" })).not.toBeInTheDocument();
  });
});
