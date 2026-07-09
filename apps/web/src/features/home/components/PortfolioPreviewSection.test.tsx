import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PortfolioPreviewSection } from "@/features/home/components/PortfolioPreviewSection";
import { usePortfolioList } from "@/features/portfolio/hooks";
import type { PortfolioSummary } from "@/features/portfolio/queries";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(),
}));

const portfolio = (id: string, name: string): PortfolioSummary => ({
  id,
  name,
  updatedAt: "2026-01-15",
  assets: [
    { ticker: "AAPL", market: "US", ratio: 100, shares: 10, currentPrice: 1000, color: "#355df9" },
  ],
  latestExecution: null,
});

describe("PortfolioPreviewSection", () => {
  it("로딩 중에는 스켈레톤을 보여주고 카드/빈 상태는 보여주지 않는다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as unknown as ReturnType<typeof usePortfolioList>);

    const { container } = render(<PortfolioPreviewSection />);

    expect(container.querySelectorAll(".animate-pulse")).toHaveLength(3);
    expect(
      screen.queryByText("아직 저장된 포트폴리오가 없습니다.")
    ).not.toBeInTheDocument();
  });

  it("포트폴리오가 없으면 빈 상태 안내와 CTA를 보여준다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<PortfolioPreviewSection />);

    expect(screen.getByText("아직 저장된 포트폴리오가 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /대가 포트폴리오 둘러보기/ })
    ).toHaveAttribute("href", "/templates");
  });

  it("포트폴리오 카드 목록과 전체 보기 링크를 보여준다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [portfolio("p1", "워런 버핏 전략"), portfolio("p2", "레이 달리오 올웨더")],
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<PortfolioPreviewSection />);

    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("레이 달리오 올웨더")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /전체 보기/ })).toHaveAttribute(
      "href",
      "/portfolio"
    );
  });

  it("3개를 초과하는 포트폴리오는 미리보기에서 잘라낸다", () => {
    const portfolios = Array.from({ length: 6 }, (_, i) => portfolio(`p${i}`, `포트폴리오${i}`));
    vi.mocked(usePortfolioList).mockReturnValue({
      data: portfolios,
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<PortfolioPreviewSection />);

    expect(screen.getByText("포트폴리오0")).toBeInTheDocument();
    expect(screen.getByText("포트폴리오2")).toBeInTheDocument();
    expect(screen.queryByText("포트폴리오3")).not.toBeInTheDocument();
  });
});
