import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RebalancingHistoryRecordCard } from "@/features/rebalancing-history/components/RebalancingHistoryRecordCard";
import {
  useDeleteExecutionRecord,
  useUpdateExecutionRecord,
} from "@/features/rebalancing-history/hooks";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";

const updateMutateMock = vi.fn();
const deleteMutateMock = vi.fn();

vi.mock("@/features/rebalancing-history/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/rebalancing-history/hooks")
  >("@/features/rebalancing-history/hooks");
  return {
    ...actual,
    useUpdateExecutionRecord: vi.fn(() => ({
      mutate: updateMutateMock,
      isPending: false,
    })),
    useDeleteExecutionRecord: vi.fn(() => ({
      mutate: deleteMutateMock,
      isPending: false,
    })),
  };
});

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const mockRecord: RebalancingHistoryRecord = {
  id: "e1",
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
    {
      ticker: "TSLA",
      action: "sell",
      quantity: -1,
      pricePerShare: 220,
      name: "Tesla",
      color: "#e85d4a",
    },
  ],
};

describe("RebalancingHistoryRecordCard", () => {
  beforeEach(() => {
    updateMutateMock.mockReset();
    deleteMutateMock.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("기본 상태에서는 상세 내역이 접혀 있다", () => {
    render(<RebalancingHistoryRecordCard record={mockRecord} canDelete />);

    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("매수 1종")).toBeInTheDocument();
    expect(screen.getByText("매도 1종")).toBeInTheDocument();
    expect(screen.queryByText("종목별 실행 내역")).not.toBeInTheDocument();
  });

  it("클릭하면 펼쳐지고 총 실행 금액·매도 회수금 안내를 보여준다", async () => {
    const user = userEvent.setup();
    render(<RebalancingHistoryRecordCard record={mockRecord} canDelete />);

    await user.click(screen.getByRole("button", { name: /워런 버핏 전략/ }));

    expect(screen.getByText("종목별 실행 내역")).toBeInTheDocument();
    expect(screen.getByText("400원")).toBeInTheDocument();
    expect(screen.getByText(/매도 회수금 220원을 이번 달/)).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 확인 후 삭제 mutate를 호출한다", async () => {
    const user = userEvent.setup();
    render(<RebalancingHistoryRecordCard record={mockRecord} canDelete />);

    await user.click(screen.getByRole("button", { name: /워런 버핏 전략/ }));
    await user.click(screen.getByRole("button", { name: /삭제/ }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteMutateMock).toHaveBeenCalledWith(
      "e1",
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("canDelete가 false면 삭제 버튼을 보여주지 않는다", async () => {
    const user = userEvent.setup();
    render(<RebalancingHistoryRecordCard record={mockRecord} canDelete={false} />);

    await user.click(screen.getByRole("button", { name: /워런 버핏 전략/ }));

    expect(screen.queryByRole("button", { name: /삭제/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /수정/ })).toBeInTheDocument();
  });

  it("수정 모드에서 수량을 바꾸고 저장하면 재계산된 actions로 mutate를 호출한다", async () => {
    const user = userEvent.setup();
    render(<RebalancingHistoryRecordCard record={mockRecord} canDelete />);

    await user.click(screen.getByRole("button", { name: /워런 버핏 전략/ }));
    await user.click(screen.getByRole("button", { name: /수정/ }));

    const quantityInput = screen.getByLabelText("AAPL 수량");
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(updateMutateMock).toHaveBeenCalledWith(
      {
        id: "e1",
        actions: expect.arrayContaining([
          expect.objectContaining({ ticker: "AAPL", quantity: 3 }),
        ]),
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });
});
