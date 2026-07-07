import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { PortfolioNavItem } from "@/features/portfolio/components/PortfolioNavItem";
import { usePortfolioList } from "@/features/portfolio/hooks";

vi.mock("next/navigation", () => ({
  usePathname: () => "/portfolio",
}));

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolioList: vi.fn(() => ({ data: [] })),
}));

describe("PortfolioNavItem", () => {
  it("내 포트폴리오 라벨은 /portfolio로 이동한다", () => {
    render(<PortfolioNavItem />);

    const homeLink = screen.getByRole("link", { name: /내 포트폴리오/ });
    expect(homeLink).toHaveAttribute("href", "/portfolio");
  });

  it("기본 상태에서는 포트폴리오 목록이 접혀 있다", () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [{ id: "p1", name: "테스트 포트폴리오" }],
    } as ReturnType<typeof usePortfolioList>);

    render(<PortfolioNavItem />);

    expect(screen.queryByText("테스트 포트폴리오")).not.toBeInTheDocument();
  });

  it("펼치기 버튼을 누르면 저장된 포트폴리오 목록을 보여준다", async () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [{ id: "p1", name: "테스트 포트폴리오" }],
    } as ReturnType<typeof usePortfolioList>);

    const user = userEvent.setup();
    render(<PortfolioNavItem />);

    await user.click(
      screen.getByRole("button", { name: "포트폴리오 목록 펼치기" })
    );

    const link = screen.getByRole("link", { name: "테스트 포트폴리오" });
    expect(link).toHaveAttribute("href", "/portfolio/p1");
  });

  it("저장된 포트폴리오가 없으면 안내 문구를 보여준다", async () => {
    vi.mocked(usePortfolioList).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof usePortfolioList>);

    const user = userEvent.setup();
    render(<PortfolioNavItem />);

    await user.click(
      screen.getByRole("button", { name: "포트폴리오 목록 펼치기" })
    );

    expect(
      screen.getByText("저장된 포트폴리오가 없습니다")
    ).toBeInTheDocument();
  });
});
