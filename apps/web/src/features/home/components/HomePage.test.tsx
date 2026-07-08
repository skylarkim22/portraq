import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { HomePage } from "@/features/home/components/HomePage";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import { useUser } from "@/features/auth/hooks";
import type { PortfolioListItem } from "@/features/portfolio/queries";

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(),
}));

vi.mock("@/features/rebalancing-history/hooks", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/rebalancing-history/hooks")
  >("@/features/rebalancing-history/hooks");
  return {
    ...actual,
    useRebalancingHistory: vi.fn(),
  };
});

vi.mock("@/features/auth/hooks", () => ({
  useUser: vi.fn(),
}));

const portfolio = (id: string, name: string): PortfolioListItem => ({
  id,
  name,
  updatedAt: "2026-01-15",
  assets: [
    { ticker: "AAPL", market: "US", ratio: 100, shares: 10, currentPrice: 1000, color: "#355df9" },
  ],
  latestExecution: null,
});

describe("HomePage", () => {
  it("사용자 이름과 요약 타일, 포트폴리오 카드를 보여준다", () => {
    vi.mocked(useUser).mockReturnValue({
      data: { user_metadata: { full_name: "김민준" }, email: "kim@example.com" },
    } as unknown as ReturnType<typeof useUser>);
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [portfolio("p1", "워런 버핏 전략"), portfolio("p2", "레이 달리오 올웨더")],
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [[]] },
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<HomePage />);

    expect(screen.getByText("안녕하세요, 김민준님")).toBeInTheDocument();
    expect(screen.getByText("20,000원")).toBeInTheDocument();
    expect(screen.getByText("2개")).toBeInTheDocument();
    expect(screen.getByText("워런 버핏 전략")).toBeInTheDocument();
    expect(screen.getByText("레이 달리오 올웨더")).toBeInTheDocument();
  });

  it("포트폴리오가 없으면 빈 상태 안내와 CTA를 보여준다", () => {
    vi.mocked(useUser).mockReturnValue({
      data: { user_metadata: {}, email: "kim@example.com" },
    } as unknown as ReturnType<typeof useUser>);
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [],
      isLoading: false,
    } as unknown as ReturnType<typeof usePortfolioList>);
    vi.mocked(useRebalancingHistory).mockReturnValue({
      data: { pages: [[]] },
    } as unknown as ReturnType<typeof useRebalancingHistory>);

    render(<HomePage />);

    expect(screen.getByText("아직 저장된 포트폴리오가 없습니다.")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /대가 포트폴리오 둘러보기/ })
    ).toHaveAttribute("href", "/templates");
  });
});
