import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect } from "vitest";
import { TradeLogDayFeed } from "@/features/trade-log/components/TradeLogDayFeed";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

const log = (overrides: Partial<EnrichedTradeLog>): EnrichedTradeLog => ({
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-15",
  ticker: "AAPL",
  quantity: 1,
  price: 1000,
  memo: "테스트 메모입니다 20자 이상 채워보아요",
  name: "Apple",
  market: "US",
  color: "#000",
  createdAt: "2026-01-15T00:00:00Z",
  ...overrides,
});

describe("TradeLogDayFeed", () => {
  it("기록이 없으면 안내 문구를 보여준다", () => {
    renderWithClient(<TradeLogDayFeed dateLabel="1월 15일" logs={[]} />);

    expect(screen.getByText("해당 날짜에 등록된 거래가 없습니다.")).toBeInTheDocument();
  });

  it("로그의 종목별로 카드를 렌더링한다", () => {
    const logs = [
      log({
        id: "l1",
        type: "buy",
        ticker: "KO",
        quantity: 10,
        price: 83000,
        name: "Coca-Cola",
        market: "KR",
      }),
      log({
        id: "l2",
        type: "sell",
        ticker: "OXY",
        quantity: 3,
        price: 60000,
        tax: 400,
        name: "Occidental",
        market: "KR",
      }),
    ];

    renderWithClient(<TradeLogDayFeed dateLabel="1월 15일" logs={logs} />);

    expect(screen.getByText("1월 15일 거래 내역")).toBeInTheDocument();
    expect(screen.getByText("KO")).toBeInTheDocument();
    expect(screen.getByText("OXY")).toBeInTheDocument();
    expect(screen.getByText(/세금 400원/)).toBeInTheDocument();
  });
});
