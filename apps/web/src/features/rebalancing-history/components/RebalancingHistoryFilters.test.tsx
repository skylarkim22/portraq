import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { RebalancingHistoryFilters } from "@/features/rebalancing-history/components/RebalancingHistoryFilters";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(() => ({
    data: [
      { id: "p1", name: "워런 버핏 전략" },
      { id: "p2", name: "레이 달리오 올웨더" },
    ],
  })),
}));

describe("RebalancingHistoryFilters", () => {
  it("포트폴리오 옵션과 날짜 입력을 보여준다", async () => {
    const user = userEvent.setup();
    render(
      <RebalancingHistoryFilters
        value={{ portfolioId: null, dateFrom: null, dateTo: null }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByRole("combobox")).toHaveTextContent("전체 포트폴리오");

    await user.click(screen.getByRole("combobox"));

    expect(screen.getByRole("option", { name: "워런 버핏 전략" })).toBeInTheDocument();
    expect(screen.getByLabelText("시작일")).toBeInTheDocument();
    expect(screen.getByLabelText("종료일")).toBeInTheDocument();
  });

  it("포트폴리오를 선택하면 onChange에 해당 id가 전달된다", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(
      <RebalancingHistoryFilters
        value={{ portfolioId: null, dateFrom: null, dateTo: null }}
        onChange={onChange}
      />
    );

    await user.click(screen.getByRole("combobox"));
    await user.click(screen.getByRole("option", { name: "워런 버핏 전략" }));

    expect(onChange).toHaveBeenCalledWith({
      portfolioId: "p1",
      dateFrom: null,
      dateTo: null,
    });
  });
});
