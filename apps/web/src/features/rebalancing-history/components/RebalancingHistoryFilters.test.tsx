import { fireEvent, render, screen } from "@testing-library/react";
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

  it("종료일 입력에 시작일을 min으로 지정한다", () => {
    render(
      <RebalancingHistoryFilters
        value={{ portfolioId: null, dateFrom: "2026-07-01", dateTo: null }}
        onChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("종료일")).toHaveAttribute("min", "2026-07-01");
  });

  it("시작일을 기존 종료일보다 늦게 바꾸면 종료일이 시작일과 같아진다", () => {
    const onChange = vi.fn();
    render(
      <RebalancingHistoryFilters
        value={{ portfolioId: null, dateFrom: "2026-07-01", dateTo: "2026-07-05" }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-07-10" },
    });

    expect(onChange).toHaveBeenCalledWith({
      portfolioId: null,
      dateFrom: "2026-07-10",
      dateTo: "2026-07-10",
    });
  });

  it("시작일을 기존 종료일보다 이르게 바꾸면 종료일은 그대로 유지한다", () => {
    const onChange = vi.fn();
    render(
      <RebalancingHistoryFilters
        value={{ portfolioId: null, dateFrom: "2026-07-01", dateTo: "2026-07-05" }}
        onChange={onChange}
      />
    );

    fireEvent.change(screen.getByLabelText("시작일"), {
      target: { value: "2026-06-20" },
    });

    expect(onChange).toHaveBeenCalledWith({
      portfolioId: null,
      dateFrom: "2026-06-20",
      dateTo: "2026-07-05",
    });
  });
});
