import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { TemplateCard } from "@/features/templates/components/TemplateCard";
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

describe("TemplateCard", () => {
  it("기본 상태에서는 상세 패널이 접혀 있다", () => {
    render(<TemplateCard template={mockTemplate} />);

    expect(screen.getByText("워런 버핏")).toBeInTheDocument();
    expect(screen.getByText("가치투자")).toBeInTheDocument();
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("+10.4%")).toBeInTheDocument();
    expect(screen.getByText("-32.7%")).toBeInTheDocument();
    expect(screen.getByText(/기준일 2026-03-31/)).toBeInTheDocument();
    expect(screen.queryByText(/이 포트폴리오 사용하기/)).not.toBeInTheDocument();
  });

  it("카드를 클릭하면 상세 패널이 펼쳐지고 사용하기 링크가 나타난다", async () => {
    const user = userEvent.setup();
    render(<TemplateCard template={mockTemplate} />);

    await user.click(screen.getByRole("button", { name: /워런 버핏/ }));

    expect(screen.getByText(mockTemplate.description!)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /이 포트폴리오 사용하기/ });
    expect(link).toHaveAttribute("href", "/portfolio/new?template=warren-buffett");
  });
});
