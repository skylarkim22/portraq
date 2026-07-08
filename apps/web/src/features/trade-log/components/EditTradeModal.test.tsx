import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { EditTradeModal } from "@/features/trade-log/components/EditTradeModal";
import { useUpdateTradeLog } from "@/features/trade-log/hooks";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const updateMutateMock = vi.fn();

vi.mock("@/features/trade-log/hooks", () => ({
  useUpdateTradeLog: vi.fn(() => ({ mutate: updateMutateMock, isPending: false })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const buyLog: EnrichedTradeLog = {
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-15",
  ticker: "KO",
  quantity: 10,
  price: 83000,
  name: "Coca-Cola",
  market: "KR",
  color: "#000",
  memo: "신년 첫 적립 매수, 목표 비중 도달 전 분할 매수",
  createdAt: "2026-01-15T00:00:00Z",
};

const sellLog: EnrichedTradeLog = {
  id: "l2",
  userId: "u1",
  type: "sell",
  date: "2026-01-15",
  ticker: "AAPL",
  quantity: 2,
  price: 60,
  exchangeRate: 1400,
  tax: 500,
  name: "Apple Inc.",
  market: "US",
  color: "#000",
  memo: "비중 초과분 일부 정리하는 매도 기록입니다",
  createdAt: "2026-01-15T00:00:00Z",
};

describe("EditTradeModal", () => {
  beforeEach(() => {
    updateMutateMock.mockReset();
  });

  it("날짜/수량/가격 초기값을 기존 기록으로 채운다", () => {
    render(<EditTradeModal log={buyLog} onClose={vi.fn()} />);

    expect(screen.getByLabelText("날짜")).toHaveValue("2026-01-15");
    expect(screen.getByLabelText("수량")).toHaveValue("10");
    expect(screen.getByLabelText("가격")).toHaveValue("83,000");
  });

  it("날짜를 바꾸고 저장하면 변경된 날짜로 mutate가 호출된다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<EditTradeModal log={buyLog} onClose={onClose} />);

    const dateInput = screen.getByLabelText("날짜");
    await user.clear(dateInput);
    await user.type(dateInput, "2026-02-01");

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(updateMutateMock).toHaveBeenCalledWith(
      {
        id: "l1",
        date: "2026-02-01",
        quantity: 10,
        price: 83000,
        tax: undefined,
        exchangeRate: undefined,
        memo: buyLog.memo,
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("메모가 20자 미만이면 저장 버튼이 비활성화된다", async () => {
    const user = userEvent.setup();
    render(<EditTradeModal log={buyLog} onClose={vi.fn()} />);

    const memoInput = screen.getByDisplayValue(buyLog.memo!);
    await user.clear(memoInput);
    await user.type(memoInput, "짧은메모");

    expect(screen.getByRole("button", { name: "저장" })).toBeDisabled();
  });

  it("US 매도 종목은 환율/세금 입력을 보여주고 patch에 포함한다", async () => {
    const user = userEvent.setup();
    render(<EditTradeModal log={sellLog} onClose={vi.fn()} />);

    expect(screen.getByLabelText("환율")).toBeInTheDocument();
    expect(screen.getByLabelText("세금")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(updateMutateMock).toHaveBeenCalledWith(
      expect.objectContaining({ tax: 500, exchangeRate: 1400 }),
      expect.anything()
    );
  });
});
