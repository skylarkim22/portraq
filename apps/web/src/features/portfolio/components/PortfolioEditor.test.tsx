import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "sonner";
import { PortfolioEditor } from "@/features/portfolio/components/PortfolioEditor";
import { usePortfolio } from "@/features/portfolio/hooks";
import { useTemplate } from "@/features/templates/hooks";
import { useUser } from "@/features/auth/hooks";
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

const saveMutateMock = vi.fn();
const saveMutateAsyncMock = vi.fn();
const createMutateAsyncMock = vi.fn();
const deleteMutateMock = vi.fn();
const deleteMutateAsyncMock = vi.fn();
const routerReplaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: routerReplaceMock, push: routerReplaceMock }),
}));

vi.mock("@/features/auth/hooks", () => ({
  useUser: vi.fn(() => ({ data: { id: "u1", email: "u1@test.com" } })),
}));

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolio: vi.fn((id: string | null) => ({
    data: id === null ? undefined : mockPortfolio,
    isLoading: false,
    isError: false,
  })),
  useCreatePortfolio: vi.fn(() => ({
    mutateAsync: createMutateAsyncMock,
    isPending: false,
  })),
  useSavePortfolio: vi.fn(() => ({
    mutate: saveMutateMock,
    mutateAsync: saveMutateAsyncMock,
    isPending: false,
  })),
  useDeletePortfolio: vi.fn(() => ({
    mutate: deleteMutateMock,
    mutateAsync: deleteMutateAsyncMock,
    isPending: false,
  })),
}));

vi.mock("@/features/templates/hooks", () => ({
  useTemplate: vi.fn(() => ({ data: undefined })),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() },
}));

vi.mock("@/features/stocks/components/StockSearch", () => ({
  StockSearch: ({ onSelect }: { onSelect: (asset: unknown) => void }) => (
    <>
      <button
        type="button"
        onClick={() =>
          onSelect({ ticker: "TSLA", name: "Tesla", market: "US", color: "#e85d4a", isActive: true })
        }
      >
        TSLA 선택
      </button>
      <button
        type="button"
        onClick={() =>
          onSelect({ ticker: "AAPL", name: "Apple", market: "US", color: "#355df9", isActive: true })
        }
      >
        AAPL 선택
      </button>
    </>
  ),
}));

describe("PortfolioEditor", () => {
  beforeEach(() => {
    saveMutateMock.mockReset();
    saveMutateAsyncMock.mockReset();
    createMutateAsyncMock.mockReset();
    deleteMutateMock.mockReset();
    deleteMutateAsyncMock.mockReset();
    routerReplaceMock.mockReset();
    vi.mocked(useTemplate).mockReturnValue({
      data: undefined,
      isFetched: false,
    } as ReturnType<typeof useTemplate>);
    vi.spyOn(window, "confirm").mockReturnValue(true);
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

    expect(saveMutateMock).toHaveBeenCalledWith(
      {
        portfolioId: "p1",
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

  it("미확정 슬롯이 남아 있으면 리밸런싱 가이드 버튼을 숨긴다", () => {
    render(<PortfolioEditor portfolioId="p1" />);

    expect(
      screen.queryByRole("link", { name: /이달의 매수 가이드/ })
    ).not.toBeInTheDocument();
  });

  it("비중 합계가 100%면 리밸런싱 가이드 진입 링크를 보여준다", () => {
    vi.mocked(usePortfolio).mockReturnValueOnce({
      data: {
        ...mockPortfolio,
        assets: [
          { ...mockPortfolio.assets[0], ratio: 80 },
          { ...mockPortfolio.assets[1], ratio: 20 },
        ],
      },
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePortfolio>);

    render(<PortfolioEditor portfolioId="p1" />);

    const link = screen.getByRole("link", { name: /이달의 매수 가이드/ });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/portfolio/p1/guide");
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

  it("삭제 버튼을 누르면 확인 후 삭제를 요청하고, 성공 시 /portfolio로 이동한다", async () => {
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    await user.click(screen.getByRole("button", { name: /포트폴리오 삭제/ }));

    expect(window.confirm).toHaveBeenCalled();
    expect(deleteMutateMock).toHaveBeenCalledWith(
      "p1",
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );

    const { onSuccess } = deleteMutateMock.mock.calls[0][1];
    onSuccess();
    expect(routerReplaceMock).toHaveBeenCalledWith("/portfolio");
  });

  it("확인 대화상자에서 취소하면 삭제를 요청하지 않는다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    const user = userEvent.setup();
    render(<PortfolioEditor portfolioId="p1" />);

    await user.click(screen.getByRole("button", { name: /포트폴리오 삭제/ }));

    expect(deleteMutateMock).not.toHaveBeenCalled();
  });

  it("신규 생성 모드에서는 삭제 버튼을 보여주지 않는다", () => {
    render(<PortfolioEditor portfolioId={null} />);

    expect(
      screen.queryByRole("button", { name: /포트폴리오 삭제/ })
    ).not.toBeInTheDocument();
  });

  describe("신규 생성 모드 (portfolioId가 null)", () => {
    it("불러오는 중 화면 없이 곧바로 빈 편집 화면을 보여준다", () => {
      render(<PortfolioEditor portfolioId={null} />);

      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("포트폴리오 이름을 입력하세요")
      ).toHaveValue("");
    });

    it("이달의 매수 가이드 버튼을 보여주지 않는다", () => {
      render(<PortfolioEditor portfolioId={null} />);

      expect(
        screen.queryByRole("link", { name: /이달의 매수 가이드/ })
      ).not.toBeInTheDocument();
    });

    it("templateId가 있으면 템플릿의 이름/종목으로 초기값을 세팅하고, null-ticker 종목은 채우기용 슬롯으로 표시한다", () => {
      vi.mocked(useTemplate).mockReturnValue({
        data: {
          id: "warren-buffett",
          name: "워런 버핏",
          strategy: "value",
          market: "US",
          cagr: 10.4,
          mdd: -32.7,
          description: null,
          sourceDate: null,
          assets: [
            { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sortOrder: 0 },
            { ticker: null, name: "기타 (비공개 종목)", market: "US", ratio: 40, sortOrder: 1 },
          ],
        },
        isFetched: true,
      } as ReturnType<typeof useTemplate>);

      render(<PortfolioEditor portfolioId={null} templateId="warren-buffett" />);

      expect(screen.getByDisplayValue("워런 버핏")).toBeInTheDocument();
      expect(screen.getAllByText(/AAPL/).length).toBeGreaterThan(0);
      expect(
        screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
      ).toBeInTheDocument();
      expect(
        screen.getByText(/미확정 슬롯이 남아 있습니다/)
      ).toBeInTheDocument();
    });

    it("슬롯을 클릭해 종목을 선택하면 슬롯이 실제 종목으로 교체되고 미확정 슬롯 안내가 사라진다", async () => {
      vi.mocked(useTemplate).mockReturnValue({
        data: {
          id: "warren-buffett",
          name: "워런 버핏",
          strategy: "value",
          market: "US",
          cagr: 10.4,
          mdd: -32.7,
          description: null,
          sourceDate: null,
          assets: [
            { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sortOrder: 0 },
            { ticker: null, name: "기타 (비공개 종목)", market: "US", ratio: 40, sortOrder: 1 },
          ],
        },
        isFetched: true,
      } as ReturnType<typeof useTemplate>);

      const user = userEvent.setup();
      render(<PortfolioEditor portfolioId={null} templateId="warren-buffett" />);

      await user.click(
        screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
      );
      await user.click(screen.getByRole("button", { name: "TSLA 선택" }));

      expect(
        screen.queryByRole("button", { name: /기타 \(비공개 종목\)/ })
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(/TSLA/).length).toBeGreaterThan(0);
      expect(
        screen.queryByText(/미확정 슬롯이 남아 있습니다/)
      ).not.toBeInTheDocument();
      expect(screen.getByDisplayValue("40")).toBeInTheDocument();
    });

    it("슬롯 교체 중 이미 있는 종목을 고르면 경고만 뜨고, 이어서 다른 종목으로 정상 교체할 수 있다", async () => {
      vi.mocked(useTemplate).mockReturnValue({
        data: {
          id: "warren-buffett",
          name: "워런 버핏",
          strategy: "value",
          market: "US",
          cagr: 10.4,
          mdd: -32.7,
          description: null,
          sourceDate: null,
          assets: [
            { ticker: "AAPL", name: "Apple", market: "US", ratio: 60, sortOrder: 0 },
            { ticker: null, name: "기타 (비공개 종목)", market: "US", ratio: 40, sortOrder: 1 },
          ],
        },
        isFetched: true,
      } as ReturnType<typeof useTemplate>);

      const user = userEvent.setup();
      render(<PortfolioEditor portfolioId={null} templateId="warren-buffett" />);

      await user.click(
        screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
      );
      await user.click(screen.getByRole("button", { name: "AAPL 선택" }));

      expect(toast.warning).toHaveBeenCalledWith(
        "이미 포트폴리오에 있는 종목입니다."
      );
      expect(
        screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", { name: /기타 \(비공개 종목\)/ })
      );
      await user.click(screen.getByRole("button", { name: "TSLA 선택" }));

      expect(
        screen.queryByRole("button", { name: /기타 \(비공개 종목\)/ })
      ).not.toBeInTheDocument();
      expect(screen.getAllByText(/TSLA/).length).toBeGreaterThan(0);
    });

    it("templateId에 해당하는 템플릿을 찾지 못해도 무한 로딩 없이 빈 편집 화면을 보여준다", () => {
      vi.mocked(useTemplate).mockReturnValue({
        data: undefined,
        isFetched: true,
      } as ReturnType<typeof useTemplate>);

      render(<PortfolioEditor portfolioId={null} templateId="unknown-template" />);

      expect(screen.queryByText("불러오는 중...")).not.toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("포트폴리오 이름을 입력하세요")
      ).toHaveValue("");
    });

    it("저장 버튼을 누르면 포트폴리오를 생성한 뒤 저장하고 새 id로 이동한다", async () => {
      createMutateAsyncMock.mockResolvedValue("new-id");
      saveMutateAsyncMock.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<PortfolioEditor portfolioId={null} />);

      await user.click(screen.getByRole("button", { name: "저장" }));

      await waitFor(() => {
        expect(createMutateAsyncMock).toHaveBeenCalledWith({
          userId: "u1",
          name: "내 포트폴리오",
        });
      });
      expect(saveMutateAsyncMock).toHaveBeenCalledWith({
        portfolioId: "new-id",
        name: "내 포트폴리오",
        memo: null,
        assets: [],
      });
      expect(routerReplaceMock).toHaveBeenCalledWith("/portfolio/new-id");
    });

    it("저장 처리 중에 다시 클릭해도 생성 요청은 한 번만 발생한다", async () => {
      let resolveCreate: (value: string) => void = () => {};
      createMutateAsyncMock.mockReturnValue(
        new Promise<string>((resolve) => {
          resolveCreate = resolve;
        })
      );
      saveMutateAsyncMock.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<PortfolioEditor portfolioId={null} />);

      const saveButton = screen.getByRole("button", { name: "저장" });
      await user.click(saveButton);
      await user.click(saveButton);

      expect(createMutateAsyncMock).toHaveBeenCalledTimes(1);

      resolveCreate("new-id");
      await waitFor(() =>
        expect(routerReplaceMock).toHaveBeenCalledWith("/portfolio/new-id")
      );
    });

    it("생성 후 저장이 실패하면 방금 생성한 포트폴리오를 롤백 삭제한다", async () => {
      createMutateAsyncMock.mockResolvedValue("new-id");
      saveMutateAsyncMock.mockRejectedValue(new Error("save failed"));
      deleteMutateAsyncMock.mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<PortfolioEditor portfolioId={null} />);

      await user.click(screen.getByRole("button", { name: "저장" }));

      await waitFor(() =>
        expect(deleteMutateAsyncMock).toHaveBeenCalledWith("new-id")
      );
      expect(routerReplaceMock).not.toHaveBeenCalled();
    });
  });
});
