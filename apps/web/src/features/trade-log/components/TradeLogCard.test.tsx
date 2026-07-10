import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TradeLogCard } from "@/features/trade-log/components/TradeLogCard";
import { useDeleteTradeLog } from "@/features/trade-log/hooks";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const deleteMutateMock = vi.fn();

vi.mock("@/features/trade-log/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/features/trade-log/hooks")>(
    "@/features/trade-log/hooks"
  );
  return {
    ...actual,
    useDeleteTradeLog: vi.fn(() => ({ mutate: deleteMutateMock, isPending: false })),
    useUpdateTradeLog: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

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
  memo: "신년 첫 적립 매수, 목표 비중 도달 전 분할 매수",
  createdAt: "2026-01-15T00:00:00Z",
};

const sellLog: EnrichedTradeLog = {
  id: "l2",
  userId: "u1",
  type: "sell",
  date: "2026-02-01",
  ticker: "KO",
  quantity: 5,
  price: 90000,
  name: "Coca-Cola",
  market: "KR",
  memo: "목표 비중 초과로 일부 매도",
  createdAt: "2026-02-01T00:00:00Z",
};

describe("TradeLogCard", () => {
  beforeEach(() => {
    deleteMutateMock.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("종목명·티커·수량/가격/합계·메모를 보여준다", () => {
    render(<TradeLogCard log={buyLog} />);

    expect(screen.getByText("Coca-Cola")).toBeInTheDocument();
    expect(screen.getByText("KO")).toBeInTheDocument();
    expect(screen.getByText(/830,000원/)).toBeInTheDocument();
    expect(screen.getByText(buyLog.memo!)).toBeInTheDocument();
  });

  it("삭제 버튼 클릭 시 확인 후 삭제 mutate를 호출한다", async () => {
    const user = userEvent.setup();
    render(<TradeLogCard log={buyLog} />);

    await user.click(screen.getByRole("button", { name: "KO 삭제" }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteMutateMock).toHaveBeenCalledWith(
      "l1",
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) })
    );
  });

  it("수정 버튼 클릭 시 수정 모달이 열린다", async () => {
    const user = userEvent.setup();
    render(<TradeLogCard log={buyLog} />);

    expect(screen.queryByRole("heading", { name: "매수 기록 수정" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "KO 수정" }));

    expect(screen.getByRole("heading", { name: "매수 기록 수정" })).toBeInTheDocument();
  });

  it("매도 기록은 평균매수가와 주당 차액을 함께 보여준다", () => {
    render(<TradeLogCard log={sellLog} avgPrice={83000} />);

    expect(screen.getByText("평균매수가")).toBeInTheDocument();
    expect(screen.getByText("83,000원")).toBeInTheDocument();
    expect(screen.getByText("차액(주당)")).toBeInTheDocument();
    expect(screen.getByText("+7,000원")).toBeInTheDocument();
  });

  it("avgPrice가 없는 매도 기록은 평균매수가 박스를 보여주지 않는다", () => {
    render(<TradeLogCard log={sellLog} />);

    expect(screen.queryByText("평균매수가")).not.toBeInTheDocument();
  });
});
