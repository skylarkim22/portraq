import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";

vi.mock("@/features/rebalancing-history/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/rebalancing-history/hooks")
  >("@/features/rebalancing-history/hooks");
  return {
    ...actual,
    useRebalancingHistory: vi.fn(),
  };
});

const record = (id: string, portfolioName: string): RebalancingHistoryRecord => ({
  id,
  portfolioId: "p1",
  portfolioName,
  executedAt: "2026-01-15T00:00:00Z",
  totalBudget: 500000,
  actions: [],
});

describe("RecentHistorySection", () => {
  it("리밸런싱 기록을 포트폴리오명과 함께 보여준다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [record("e1", "워런 버핏 전략")], hasMore: false }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<RecentHistorySection />);

    expect(screen.getByText("최근 리밸런싱 기록")).toBeInTheDocument();
    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/rebalancing-history"
    );
  });

  it("기록이 없으면 아무것도 렌더링하지 않는다", () => {
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [{ records: [], hasMore: false }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    const { container } = render(<RecentHistorySection />);

    expect(container).toBeEmptyDOMElement();
  });

  it("데이터가 아직 없으면(로딩 중) 아무것도 렌더링하지 않는다", () => {
    // /home은 항상 서버에서 rebalancingHistoryQueries.list()를 프리페치해
    // hydrate하므로 이 컴포넌트가 렌더될 때 data는 이미 채워져 있다 — 이
    // 테스트는 그 전제가 깨지는 경우에도 안전한지 확인하는 방어적 검증이다.
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    const { container } = render(<RecentHistorySection />);

    expect(container).toBeEmptyDOMElement();
  });
});
