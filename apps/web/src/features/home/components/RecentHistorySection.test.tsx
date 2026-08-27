import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";

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
    render(<RecentHistorySection records={[record("e1", "워런 버핏 전략")]} />);

    expect(screen.getByText("최근 리밸런싱 기록")).toBeInTheDocument();
    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "전체 보기" })).toHaveAttribute(
      "href",
      "/rebalancing-history"
    );
  });

  it("기록이 없으면 아무것도 렌더링하지 않는다", () => {
    const { container } = render(<RecentHistorySection records={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
