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
  createdAt: "2026-01-15T00:00:00Z",
  ...overrides,
});

describe("TradeLogDayFeed", () => {
  it("기록이 없으면 안내 문구를 보여준다", () => {
    renderWithClient(<TradeLogDayFeed dateLabel="1월 15일" logs={[]} />);

    expect(screen.getByText("해당 날짜에 등록된 거래가 없습니다.")).toBeInTheDocument();
  });

  it("로그의 종목별로 카드를 렌더링한다", () => {
    const buyLog = log({
      id: "l1",
      type: "buy",
      ticker: "OXY",
      date: "2026-01-10",
      quantity: 5,
      price: 58000,
      name: "Occidental",
      market: "KR",
    });
    const sellLog = log({
      id: "l2",
      type: "sell",
      ticker: "OXY",
      date: "2026-01-15",
      quantity: 3,
      price: 60000,
      tax: 400,
      name: "Occidental",
      market: "KR",
    });

    renderWithClient(
      <TradeLogDayFeed
        dateLabel="1월 15일"
        logs={[sellLog]}
        allLogs={[buyLog, sellLog]}
      />
    );

    expect(screen.getByText("1월 15일 거래 내역")).toBeInTheDocument();
    expect(screen.getByText("OXY")).toBeInTheDocument();
    expect(screen.getByText(/세금 400원/)).toBeInTheDocument();
  });

  it("avgPrice를 알 수 없는 매도 기록은 순손익 박스를 보여주지 않는다", () => {
    const logs = [
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

    expect(screen.queryByText(/세후 순손익/)).not.toBeInTheDocument();
  });

  it("매도일 이후에 추가된 매수 기록은 평균단가 계산에서 제외한다", () => {
    const earlyBuy = log({
      id: "l1",
      type: "buy",
      ticker: "OXY",
      date: "2026-01-10",
      quantity: 5,
      price: 50000,
      name: "Occidental",
      market: "KR",
    });
    const sellLog = log({
      id: "l2",
      type: "sell",
      ticker: "OXY",
      date: "2026-01-15",
      quantity: 3,
      price: 60000,
      name: "Occidental",
      market: "KR",
    });
    const laterBuy = log({
      id: "l3",
      type: "buy",
      ticker: "OXY",
      date: "2026-01-20",
      quantity: 5,
      price: 100000,
      name: "Occidental",
      market: "KR",
    });

    renderWithClient(
      <TradeLogDayFeed
        dateLabel="1월 15일"
        logs={[sellLog]}
        allLogs={[earlyBuy, sellLog, laterBuy]}
      />
    );

    // 매도일(1/15) 이전 매수만 반영: 평균매수가 50,000원 → 차액 +10,000원
    expect(screen.getByText("50,000원")).toBeInTheDocument();
    expect(screen.getByText("+10,000원")).toBeInTheDocument();
  });
});
