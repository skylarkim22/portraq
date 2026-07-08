import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PortfolioListItem } from "@/features/portfolio/components/PortfolioListItem";
import { usePortfolio } from "@/features/portfolio/hooks";
import type { Portfolio } from "@portraq/lib/types";

const mockPortfolio: Portfolio = {
  id: "p1",
  name: "테스트 포트폴리오",
  memo: null,
  assets: [
    { ticker: "AAPL", name: "Apple", color: "#355df9", ratio: 60, shares: 0, order: 0 },
    { ticker: "MSFT", name: "Microsoft", color: "#6b8ffb", ratio: 40, shares: 0, order: 1 },
  ],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolio: vi.fn(() => ({ data: undefined, isLoading: false })),
}));

describe("PortfolioListItem", () => {
  it("기본 상태에서는 배분 현황이 접혀 있다", () => {
    render(<PortfolioListItem portfolio={{ id: "p1", name: "테스트 포트폴리오" }} />);

    expect(screen.getByText("테스트 포트폴리오")).toBeInTheDocument();
    expect(screen.queryByText("전체 배분 현황")).not.toBeInTheDocument();
  });

  it("헤더를 클릭하면 usePortfolio가 해당 id로 활성화되고 배분 현황을 보여준다", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: mockPortfolio,
      isLoading: false,
    } as ReturnType<typeof usePortfolio>);

    const user = userEvent.setup();
    render(<PortfolioListItem portfolio={{ id: "p1", name: "테스트 포트폴리오" }} />);

    await user.click(screen.getByRole("button", { name: /테스트 포트폴리오/ }));

    expect(usePortfolio).toHaveBeenCalledWith("p1");
    expect(screen.getByText("전체 배분 현황")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /편집하기/ })).toHaveAttribute(
      "href",
      "/portfolio/p1"
    );
    expect(screen.getByRole("link", { name: /리밸런싱/ })).toHaveAttribute(
      "href",
      "/portfolio/p1/guide"
    );
  });

  it("종목이 없는 포트폴리오는 리밸런싱 버튼을 보여주지 않는다", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: { ...mockPortfolio, assets: [] },
      isLoading: false,
    } as ReturnType<typeof usePortfolio>);

    const user = userEvent.setup();
    render(<PortfolioListItem portfolio={{ id: "p1", name: "테스트 포트폴리오" }} />);

    await user.click(screen.getByRole("button", { name: /테스트 포트폴리오/ }));

    expect(screen.queryByRole("link", { name: /리밸런싱/ })).not.toBeInTheDocument();
  });

  it("펼치기 전에는 usePortfolio를 null로 호출해 조회를 비활성화한다", () => {
    render(<PortfolioListItem portfolio={{ id: "p1", name: "테스트 포트폴리오" }} />);

    expect(usePortfolio).toHaveBeenCalledWith(null);
  });
});
