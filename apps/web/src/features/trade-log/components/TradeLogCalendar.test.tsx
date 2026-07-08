import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TradeLogCalendar } from "@/features/trade-log/components/TradeLogCalendar";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const log = (overrides: Partial<EnrichedTradeLog>): EnrichedTradeLog => ({
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-15",
  ticker: "AAPL",
  quantity: 1,
  price: 1000,
  memo: null,
  name: "Apple",
  market: "US",
  createdAt: "2026-01-15T00:00:00Z",
  ...overrides,
});

describe("TradeLogCalendar", () => {
  it("연/월 라벨과 요일 헤더를 보여준다", () => {
    render(
      <TradeLogCalendar
        year={2026}
        month={1}
        selectedDate="2026-01-15"
        monthLogs={[]}
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );

    expect(screen.getByText("2026년 1월")).toBeInTheDocument();
    expect(screen.getByText("일")).toBeInTheDocument();
    expect(screen.getByText("31")).toBeInTheDocument();
  });

  it("매수/매도가 있는 날짜에 점을 표시한다", () => {
    const logs = [
      log({ id: "l1", date: "2026-01-03", type: "buy" }),
      log({ id: "l2", date: "2026-01-08", type: "sell" }),
    ];

    render(
      <TradeLogCalendar
        year={2026}
        month={1}
        selectedDate="2026-01-15"
        monthLogs={logs}
        onSelectDate={vi.fn()}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );

    expect(screen.getByRole("button", { name: "1월 3일" })).toBeInTheDocument();
  });

  it("날짜를 클릭하면 onSelectDate가 해당 날짜로 호출된다", async () => {
    const onSelectDate = vi.fn();
    const user = userEvent.setup();
    render(
      <TradeLogCalendar
        year={2026}
        month={1}
        selectedDate="2026-01-15"
        monthLogs={[]}
        onSelectDate={onSelectDate}
        onPrevMonth={vi.fn()}
        onNextMonth={vi.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "1월 20일" }));

    expect(onSelectDate).toHaveBeenCalledWith("2026-01-20");
  });

  it("이전/다음 달 버튼 클릭 시 각각의 콜백을 호출한다", async () => {
    const onPrevMonth = vi.fn();
    const onNextMonth = vi.fn();
    const user = userEvent.setup();
    render(
      <TradeLogCalendar
        year={2026}
        month={1}
        selectedDate="2026-01-15"
        monthLogs={[]}
        onSelectDate={vi.fn()}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
      />
    );

    await user.click(screen.getByRole("button", { name: "이전 달" }));
    await user.click(screen.getByRole("button", { name: "다음 달" }));

    expect(onPrevMonth).toHaveBeenCalledTimes(1);
    expect(onNextMonth).toHaveBeenCalledTimes(1);
  });
});
