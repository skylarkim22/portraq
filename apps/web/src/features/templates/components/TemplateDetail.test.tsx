import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TemplateDetail } from "@/features/templates/components/TemplateDetail";
import type { PortfolioTemplate } from "@portraq/lib/types";

const mockTemplate: PortfolioTemplate = {
  id: "warren-buffett",
  name: "워런 버핏",
  strategy: "value",
  market: "US",
  cagr: 10.4,
  mdd: -32.7,
  description: "우량 기업을 적정 가격에 사서 오래 보유하는 전략입니다.",
  sourceDate: "2026-03-31",
  assets: [
    { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sortOrder: 0 },
    { ticker: null, name: "기타 (비공개 종목)", market: "US", ratio: 40, sortOrder: 1 },
  ],
};

describe("TemplateDetail", () => {
  it("투자 철학, CAGR/MDD, 종목 구성을 보여준다", () => {
    render(<TemplateDetail template={mockTemplate} />);

    expect(
      screen.getByText(/우량 기업을 적정 가격에 사서 오래 보유하는 전략입니다/)
    ).toBeInTheDocument();
    expect(screen.getByText("+10.4%")).toBeInTheDocument();
    expect(screen.getByText("-32.7%")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("기타 (비공개 종목)")).toBeInTheDocument();
  });

  it("사용하기 링크는 해당 템플릿 id로 /portfolio/new에 연결된다", () => {
    render(<TemplateDetail template={mockTemplate} />);

    const link = screen.getByRole("link", { name: /이 포트폴리오 사용하기/ });
    expect(link).toHaveAttribute("href", "/portfolio/new?template=warren-buffett");
  });

  it("설명이 없으면 문단을 렌더링하지 않는다", () => {
    render(<TemplateDetail template={{ ...mockTemplate, description: null }} />);

    expect(
      screen.queryByText(/우량 기업을 적정 가격에/)
    ).not.toBeInTheDocument();
  });

  it("10Y CAGR/MDD 안내 아이콘을 클릭하면 용어 설명이 노출된다", async () => {
    const user = userEvent.setup();
    render(<TemplateDetail template={mockTemplate} />);

    await user.click(screen.getByRole("button", { name: "10Y CAGR 설명" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("CAGR");

    await user.click(screen.getByRole("button", { name: "MDD 설명" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent("MDD");
  });
});
