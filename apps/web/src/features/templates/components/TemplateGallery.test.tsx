import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TemplateGallery } from "@/features/templates/components/TemplateGallery";
import { useTemplateList } from "@/features/templates/hooks";
import type { PortfolioTemplate } from "@portraq/lib/types";

const mockTemplates: PortfolioTemplate[] = [
  {
    id: "warren-buffett",
    name: "워런 버핏",
    strategy: "value",
    market: "US",
    cagr: 10.4,
    mdd: -32.7,
    description: null,
    sourceDate: null,
    assets: [{ ticker: "AAPL", name: "Apple", market: "US", ratio: 100, sortOrder: 0 }],
  },
  {
    id: "ray-dalio-all-weather",
    name: "레이 달리오",
    strategy: "asset-allocation",
    market: "MIXED",
    cagr: 7.2,
    mdd: -12.4,
    description: null,
    sourceDate: null,
    assets: [{ ticker: "SPY", name: "S&P 500 ETF", market: "US", ratio: 100, sortOrder: 0 }],
  },
];

vi.mock("@/features/templates/hooks", () => ({
  useTemplateList: vi.fn(() => ({
    data: mockTemplates,
    isLoading: false,
    isError: false,
  })),
}));

describe("TemplateGallery", () => {
  it("모든 템플릿 카드와 직접 구성 링크를 보여준다", () => {
    render(<TemplateGallery />);

    expect(screen.getByText("워런 버핏")).toBeInTheDocument();
    expect(screen.getByText("레이 달리오")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /직접 구성/ })).toHaveAttribute(
      "href",
      "/portfolio/new"
    );
  });

  it("필터 탭을 클릭하면 해당 전략의 템플릿만 보여준다", async () => {
    const user = userEvent.setup();
    render(<TemplateGallery />);

    await user.click(screen.getByRole("button", { name: "자산배분" }));

    expect(screen.getByText("레이 달리오")).toBeInTheDocument();
    expect(screen.queryByText("워런 버핏")).not.toBeInTheDocument();
  });

  it("로딩 중에는 카드 대신 로딩 문구를 보여준다", () => {
    vi.mocked(useTemplateList).mockReturnValueOnce({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useTemplateList>);

    render(<TemplateGallery />);

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("조회에 실패하면 에러 메시지를 보여주고 카드는 렌더링하지 않는다", () => {
    vi.mocked(useTemplateList).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useTemplateList>);

    render(<TemplateGallery />);

    expect(
      screen.getByText(/템플릿을 불러오지 못했습니다/)
    ).toBeInTheDocument();
    expect(screen.queryByText("워런 버핏")).not.toBeInTheDocument();
  });
});
