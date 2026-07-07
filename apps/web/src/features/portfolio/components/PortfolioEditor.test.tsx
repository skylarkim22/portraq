import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { PortfolioEditor } from "@/features/portfolio/components/PortfolioEditor";
import { usePortfolio } from "@/features/portfolio/hooks";
import type { Portfolio } from "@portraq/lib/types";

const mockPortfolio: Portfolio = {
  id: "p1",
  name: "테스트 포트폴리오",
  memo: null,
  assets: [
    { ticker: "AAPL", name: "Apple", market: "US", color: "#355df9", ratio: 60, shares: 0, currentPrice: 0, order: 0 },
    { ticker: "MSFT", name: "Microsoft", market: "US", color: "#6b8ffb", ratio: 20, shares: 0, currentPrice: 0, order: 1 },
  ],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const mutateMock = vi.fn();

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolio: vi.fn(() => ({
    data: mockPortfolio,
    isLoading: false,
    isError: false,
  })),
  useSavePortfolio: vi.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/stocks/components/StockSearch", () => ({
  StockSearch: ({ onSelect }: { onSelect: (asset: unknown) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSelect({ ticker: "TSLA", name: "Tesla", market: "US", color: "#e85d4a", isActive: true })
      }
    >
      TSLA 선택
    </button>
  ),
}));

describe("PortfolioEditor", () => {
  beforeEach(() => {
    mutateMock.mockReset();
  });

  it("불러온 포트폴리오의 이름과 종목을 렌더링한다", () => {
    render(<PortfolioEditor portfolioId="p1" />);

    expect(screen.getByDisplayValue("테스트 포트폴리오")).toBeInTheDocument();
    expect(screen.getAllByText("Apple").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Microsoft").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/AAPL/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MSFT/).length).toBeGreaterThan(0);
  });

  it("비중 합계가 100% 미만이면 미확정 슬롯을 보여준다", () => {
    render(<PortfolioEditor portfolioId="p1" />);

    expect(screen.getByText(/미확정 슬롯이 남아 있습니다/)).toBeInTheDocument();
    expect(screen.getByText("종목을 직접 추가하세요")).toBeInTheDocument();
  });

  it("종목 삭제 버튼을 누르면 목록에서 제거된다", async () => {
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    const removeButtons = screen.getAllByLabelText("종목 삭제");
    await user.click(removeButtons[0]);

    expect(screen.queryByText(/AAPL/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/MSFT/).length).toBeGreaterThan(0);
  });

  it("검색에서 종목을 선택하면 목록에 추가된다", async () => {
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    await user.click(screen.getByRole("button", { name: "종목 추가" }));
    await user.click(screen.getByRole("button", { name: "TSLA 선택" }));

    await waitFor(() =>
      expect(screen.getAllByText(/TSLA/).length).toBeGreaterThan(0)
    );
  });

  it("저장 버튼을 누르면 현재 종목 배열로 mutate를 호출한다", async () => {
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(mutateMock).toHaveBeenCalledWith(
      {
        name: "테스트 포트폴리오",
        memo: null,
        assets: expect.arrayContaining([
          expect.objectContaining({ ticker: "AAPL" }),
          expect.objectContaining({ ticker: "MSFT" }),
        ]),
      },
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it("저장 성공 시 리밸런싱 가이드 진입 버튼을 보여준다", async () => {
    mutateMock.mockImplementation((_input, options) => {
      options?.onSuccess?.();
    });
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    expect(
      screen.queryByRole("button", { name: /이달의 매수 가이드/ })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "저장" }));

    expect(
      screen.getByRole("button", { name: /이달의 매수 가이드/ })
    ).toBeInTheDocument();
  });

  it("조회에 실패하면 에러 메시지를 보여준다", () => {
    vi.mocked(usePortfolio).mockReturnValueOnce({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof usePortfolio>);

    render(<PortfolioEditor portfolioId="p1" />);

    expect(
      screen.getByText(/포트폴리오를 불러오지 못했습니다/)
    ).toBeInTheDocument();
  });
});
