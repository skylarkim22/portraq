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
  it("데이터가 아직 없으면(로딩 중) 빈 상태와 카드 목록 모두 보여주지 않는다", () => {
    // /home은 항상 서버에서 portfolioQueries.lists()를 프리페치해 hydrate하므로
    // 이 컴포넌트가 렌더될 때 data는 이미 채워져 있다 — 이 테스트는 그 전제가
    // 깨지는 경우(예: 프리페치 없이 재사용)에도 안전한지 확인하는 방어적 검증이다.
    vi.mocked(usePortfolioList).mockReturnValue({
      data: undefined,
    } as unknown as ReturnType<typeof usePortfolioList>);

    render(<PortfolioPreviewSection />);

    expect(
      screen.queryByText("아직 저장된 포트폴리오가 없습니다.")
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "전체 보기" })).toBeInTheDocument();
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
