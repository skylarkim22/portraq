import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SellTradeModal } from "@/features/trade-log/components/SellTradeModal";
import { useTradeLogs, useCreateTradeLog } from "@/features/trade-log/hooks";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const mutateMock = vi.fn();

vi.mock("@/features/trade-log/hooks", () => ({
  useTradeLogs: vi.fn(),
  useCreateTradeLog: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const buyLog = (): EnrichedTradeLog => ({
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-01",
  ticker: "AAPL",
  quantity: 12,
  price: 192000,
  name: "Apple Inc.",
  market: "US",
  memo: null,
  createdAt: "2026-01-01T00:00:00Z",
});

describe("SellTradeModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    vi.mocked(useTradeLogs).mockReturnValue({
      data: [buyLog()],
    } as unknown as ReturnType<typeof useTradeLogs>);
    vi.mocked(useCreateTradeLog).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTradeLog>);
  });

  it("보유 종목 목록을 평균단가·보유수량과 함께 보여준다", () => {
    render(<SellTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    expect(screen.getByText(/AAPL/)).toBeInTheDocument();
    expect(screen.getByText(/평균단가 192,000원 · 보유 12주/)).toBeInTheDocument();
  });

  it("추가 버튼을 누르면 매도 종목 행이 생기고, US 종목이라 환율 입력이 나타난다", async () => {
    const user = userEvent.setup();
    render(<SellTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(screen.getByLabelText("AAPL 매도 수량")).toBeInTheDocument();
    expect(screen.getByLabelText("AAPL 환율")).toBeInTheDocument();
  });

  it("종목 추가 + 메모 20자 이상이면 저장 시 mutate가 호출된다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SellTradeModal defaultDate="2026-01-15" onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "추가" }));

    await user.type(
      screen.getByPlaceholderText(/매도 이유를 남겨보세요/),
      "비중 초과분 일부 정리하는 매도 기록입니다"
    );

    const submitButton = screen.getByRole("button", { name: "매도 기록 저장" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(mutateMock).toHaveBeenCalledWith(
      {
        type: "sell",
        date: "2026-01-15",
        items: expect.arrayContaining([
          expect.objectContaining({ ticker: "AAPL", market: "US" }),
        ]),
        memo: "비중 초과분 일부 정리하는 매도 기록입니다",
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("종목을 추가하지 않으면 저장 버튼이 비활성화된다", () => {
    render(<SellTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "매도 기록 저장" })).toBeDisabled();
  });

  it("매수일보다 이전 날짜로 바꾸면 보유 종목 목록에서 사라진다", () => {
    vi.mocked(useTradeLogs).mockReturnValue({
      data: [
        {
          id: "l1",
          userId: "u1",
          type: "buy",
          date: "2026-05-10",
          ticker: "005930",
          quantity: 10,
          price: 70000,
          name: "삼성전자",
          market: "KR",
          memo: null,
          createdAt: "2026-05-10T00:00:00Z",
        },
      ],
    } as unknown as ReturnType<typeof useTradeLogs>);

    render(<SellTradeModal defaultDate="2026-05-15" onClose={vi.fn()} />);

    expect(screen.getByText(/삼성전자/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-04-01" } });

    expect(screen.queryByText(/삼성전자/)).not.toBeInTheDocument();
    expect(screen.getByText("매도 가능한 보유 종목이 없습니다.")).toBeInTheDocument();
  });

  it("종목 추가 후 매수일보다 이전 날짜로 바꾸면 매도 행도 함께 제거된다", async () => {
    const user = userEvent.setup();
    render(<SellTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "추가" }));
    expect(screen.getByLabelText("AAPL 매도 수량")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2025-12-01" } });

    expect(screen.queryByLabelText("AAPL 매도 수량")).not.toBeInTheDocument();
  });
});
