import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PortfolioListItem } from "@/features/portfolio/components/PortfolioListItem";
import type { PortfolioSummary } from "@/features/portfolio/queries";

const basePortfolio: PortfolioSummary = {
  id: "p1",
  name: "워런 버핏 전략",
  updatedAt: "2026-01-15",
  assets: [
    { ticker: "AAPL", market: "US", ratio: 50, shares: 10, currentPrice: 1000, color: "#355df9" },
    { ticker: "MSFT", market: "US", ratio: 50, shares: 10, currentPrice: 1000, color: "#6b8ffb" },
  ],
  latestExecution: null,
};

describe("PortfolioListItem", () => {
  it("포트폴리오 이름과 마지막 수정일을 보여준다", () => {
    render(<PortfolioListItem portfolio={basePortfolio} />);

    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("마지막 수정: 2026. 1. 15")).toBeInTheDocument();
  });

  it("카드 클릭 시 포트폴리오 상세로 이동한다", () => {
    render(<PortfolioListItem portfolio={basePortfolio} />);

    expect(screen.getByText("워런 버핏 전략").closest("a")).toHaveAttribute(
      "href",
      "/portfolio/p1"
    );
  });

  it("평가금액을 보여준다", () => {
    render(<PortfolioListItem portfolio={basePortfolio} />);

    expect(screen.getByText("평가금액")).toBeInTheDocument();
    expect(screen.getByText("20,000원")).toBeInTheDocument();
  });

  it("최근 실행 기록이 있으면 액션 요약 칩과 리밸런싱 링크를 보여준다", () => {
    render(
      <PortfolioListItem
        portfolio={{
          ...basePortfolio,
          latestExecution: { buyCount: 3, sellCount: 0, holdCount: 1 },
        }}
      />
    );

    expect(screen.getByText("매수 3종")).toBeInTheDocument();
    expect(screen.getByText("유지 1종")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /리밸런싱/ })).toHaveAttribute(
      "href",
      "/portfolio/p1/guide"
    );
  });

  it("전 종목이 유지 상태면 '전 종목 유지'로 표시한다", () => {
    render(
      <PortfolioListItem
        portfolio={{
          ...basePortfolio,
          latestExecution: { buyCount: 0, sellCount: 0, holdCount: 2 },
        }}
      />
    );

    expect(screen.getByText("전 종목 유지")).toBeInTheDocument();
  });

  it("실행 기록이 없으면 액션 요약 영역을 보여주지 않는다", () => {
    render(<PortfolioListItem portfolio={basePortfolio} />);

    expect(screen.queryByRole("link", { name: /리밸런싱/ })).not.toBeInTheDocument();
  });

  it("종목이 없는 포트폴리오는 배분 관련 영역을 보여주지 않는다", () => {
    render(<PortfolioListItem portfolio={{ ...basePortfolio, assets: [] }} />);

    expect(screen.queryByText("평가금액")).not.toBeInTheDocument();
  });
});
