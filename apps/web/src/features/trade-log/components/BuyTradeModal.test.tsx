import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BuyTradeModal } from "@/features/trade-log/components/BuyTradeModal";
import { useCreateTradeLog } from "@/features/trade-log/mutations";

const mutateMock = vi.fn();

vi.mock("@/features/trade-log/mutations", () => ({
  useCreateTradeLog: vi.fn(() => ({ mutate: mutateMock, isPending: false })),
}));

vi.mock("@/features/stocks/components/StockSearch", () => ({
  StockSearch: ({ onSelect }: { onSelect: (asset: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({ ticker: "AAPL", name: "Apple Inc.", market: "US", color: "#355df9", isActive: true })
      }
    >
      mock-select-AAPL
    </button>
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

describe("BuyTradeModal", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    vi.mocked(useCreateTradeLog).mockReturnValue({
      mutate: mutateMock,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateTradeLog>);
  });

  it("종목을 추가하기 전에는 저장 버튼이 비활성화된다", () => {
    render(<BuyTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    expect(screen.getByRole("button", { name: "매수 기록 저장" })).toBeDisabled();
  });

  it("종목 추가 + 메모 20자 미만이면 저장 버튼이 비활성화된다", async () => {
    const user = userEvent.setup();
    render(<BuyTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    await user.click(screen.getByText("mock-select-AAPL"));
    await user.type(screen.getByPlaceholderText(/매수 이유를 남겨보세요/), "짧은메모");

    expect(screen.getByRole("button", { name: "매수 기록 저장" })).toBeDisabled();
  });

  it("종목 추가 + 메모 20자 이상이면 저장 시 mutate가 올바른 payload로 호출된다", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<BuyTradeModal defaultDate="2026-01-15" onClose={onClose} />);

    await user.click(screen.getByText("mock-select-AAPL"));

    const quantityInput = screen.getByLabelText("AAPL 수량");
    await user.clear(quantityInput);
    await user.type(quantityInput, "5");

    const priceInput = screen.getByLabelText("AAPL 가격");
    await user.clear(priceInput);
    await user.type(priceInput, "260000");

    await user.type(
      screen.getByPlaceholderText(/매수 이유를 남겨보세요/),
      "신년 첫 적립 매수, 목표 비중 도달 전 분할 매수"
    );

    const submitButton = screen.getByRole("button", { name: "매수 기록 저장" });
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(mutateMock).toHaveBeenCalledWith(
      {
        type: "buy",
        date: "2026-01-15",
        items: expect.arrayContaining([
          expect.objectContaining({ ticker: "AAPL", quantity: 5, price: 260000 }),
        ]),
        memo: "신년 첫 적립 매수, 목표 비중 도달 전 분할 매수",
      },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("동일 종목을 다시 선택하면 별도 행으로 추가된다 (다른 가격에 나눠 매수 허용)", async () => {
    const user = userEvent.setup();
    render(<BuyTradeModal defaultDate="2026-01-15" onClose={vi.fn()} />);

    await user.click(screen.getByText("mock-select-AAPL"));
    await user.click(screen.getByText("mock-select-AAPL"));

    expect(screen.getAllByText("AAPL")).toHaveLength(2);
    expect(screen.getByLabelText("AAPL 1 수량")).toBeInTheDocument();
    expect(screen.getByLabelText("AAPL 2 수량")).toBeInTheDocument();
  });
});
