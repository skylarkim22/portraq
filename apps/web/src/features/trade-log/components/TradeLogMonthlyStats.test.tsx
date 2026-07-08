import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TradeLogMonthlyStats } from "@/features/trade-log/components/TradeLogMonthlyStats";
import type { MonthlyStats } from "@/features/trade-log/deriveMonthlyStats";

const baseStats: MonthlyStats = {
  totalBuyAmount: 2150000,
  totalSellAmount: 1380000,
  totalTax: 4200,
  netPnl: 186800,
  netPnlRate: 15.6,
  tradeCount: 5,
  marketShare: [
    { market: "US", ratio: 82 },
    { market: "KR", ratio: 18 },
  ],
};

describe("TradeLogMonthlyStats", () => {
  it("통계 타일과 시장별 비중을 보여준다", () => {
    render(<TradeLogMonthlyStats month={1} stats={baseStats} />);

    expect(screen.getByText("1월 통계")).toBeInTheDocument();
    expect(screen.getByText("2,150,000원")).toBeInTheDocument();
    expect(screen.getByText("+186,800원")).toBeInTheDocument();
    expect(screen.getByText("+15.6%")).toBeInTheDocument();
    expect(screen.getByText("5건")).toBeInTheDocument();
    expect(screen.getByText("US 82%")).toBeInTheDocument();
    expect(screen.getByText("KR 18%")).toBeInTheDocument();
  });

  it("순손익이 음수면 부호 없이 마이너스로 표시한다", () => {
    render(
      <TradeLogMonthlyStats
        month={2}
        stats={{ ...baseStats, netPnl: -50000, netPnlRate: -5 }}
      />
    );

    expect(screen.getByText("-50,000원")).toBeInTheDocument();
    expect(screen.getByText("-5.0%")).toBeInTheDocument();
  });

  it("거래 내역이 없으면 시장별 비중 영역을 숨긴다", () => {
    render(
      <TradeLogMonthlyStats
        month={3}
        stats={{ ...baseStats, marketShare: [] }}
      />
    );

    expect(screen.queryByText(/시장별 비중/)).not.toBeInTheDocument();
  });
});
