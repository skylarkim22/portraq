import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RebalancingGuide } from "@/features/portfolio/components/RebalancingGuide";
import { usePortfolio, useLatestSnapshot } from "@/features/portfolio/hooks";
import { useRecordRebalancingExecution } from "@/features/portfolio/mutations";
import type { Portfolio } from "@portraq/lib/types";

const krPortfolio: Portfolio = {
  id: "p1",
  name: "테스트 포트폴리오",
  memo: null,
  assets: [
    {
      ticker: "005930",
      name: "삼성전자",
      market: "KR",
      color: "#355df9",
      ratio: 100,
      shares: 0,
      currentPrice: 0,
      order: 0,
    },
  ],
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
};

const slotPortfolio: Portfolio = {
  ...krPortfolio,
  assets: [
    ...krPortfolio.assets,
    {
      ticker: "SLOT",
      ratio: 0,
      shares: 0,
      order: 1,
      isSlot: true,
    },
  ],
};

const mutateMock = vi.fn();
const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("@/features/portfolio/hooks", () => ({
  usePortfolio: vi.fn(() => ({
    data: krPortfolio,
    isLoading: false,
    isError: false,
  })),
  useLatestSnapshot: vi.fn(() => ({ data: [] })),
}));

vi.mock("@/features/portfolio/mutations", () => ({
  useRecordRebalancingExecution: vi.fn(() => ({
    mutate: mutateMock,
    isPending: false,
  })),
}));

async function goToStep3(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByRole("textbox", { name: "005930 보유 주수" }),
    "10"
  );
  await user.click(screen.getByRole("button", { name: "투자금 설정" }));

  const budgetInput = screen.getByLabelText("이번 달 투자금");
  await user.clear(budgetInput);
  await user.type(budgetInput, "5000");

  const priceInput = screen.getByRole("textbox", {
    name: "005930 현재가",
  });
  await user.clear(priceInput);
  await user.type(priceInput, "1000");

  await user.click(screen.getByRole("button", { name: "계산하기" }));
}

describe("RebalancingGuide", () => {
  beforeEach(() => {
    mutateMock.mockReset();
    pushMock.mockReset();
    vi.mocked(usePortfolio).mockReturnValue({
      data: krPortfolio,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePortfolio>);
    vi.mocked(useLatestSnapshot).mockReturnValue({
      data: [],
    } as unknown as ReturnType<typeof useLatestSnapshot>);
  });

  it("Step 1에서 종목별 보유 주수 입력을 보여준다", () => {
    render(<RebalancingGuide portfolioId="p1" />);

    expect(screen.getByText("삼성전자")).toBeInTheDocument();
    expect(screen.getByText(/005930/)).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "005930 보유 주수" })
    ).toHaveValue("0");
  });

  it("Step 3에서 매수 액션을 계산해 보여준다", async () => {
    const user = userEvent.setup();
    render(<RebalancingGuide portfolioId="p1" />);

    await goToStep3(user);

    // holdings=10주 @1000원=10,000 + 예산 5,000 = 총 15,000, 목표 100% = 15,000
    // 차이 5,000 / 1000 = 5주 매수
    const quantityInput = screen.getByRole("textbox", {
      name: "005930 수량",
    });
    expect(quantityInput).toHaveValue("5");
    expect(screen.getAllByText("매수").length).toBeGreaterThan(0);
  });

  it("액션 수량을 수정하면 저장 시 수정된 값으로 반영된다", async () => {
    const user = userEvent.setup();
    render(<RebalancingGuide portfolioId="p1" />);

    await goToStep3(user);

    const quantityInput = screen.getByRole("textbox", {
      name: "005930 수량",
    });
    await user.clear(quantityInput);
    await user.type(quantityInput, "3");

    await user.click(screen.getByRole("button", { name: "저장하기" }));

    expect(mutateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        totalBudget: 5000,
        actions: [
          expect.objectContaining({
            ticker: "005930",
            action: "buy",
            quantity: 3,
            pricePerShare: 1000,
          }),
        ],
        updatedAssets: [
          expect.objectContaining({
            ticker: "005930",
            shares: 13,
            currentPrice: 1000,
          }),
        ],
      }),
      expect.objectContaining({
        onSuccess: expect.any(Function),
        onError: expect.any(Function),
      })
    );
  });

  it("미확정 슬롯이 있으면 Step 3에서 경고를 보여주고 결과를 숨긴다", async () => {
    vi.mocked(usePortfolio).mockReturnValue({
      data: slotPortfolio,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof usePortfolio>);

    const user = userEvent.setup();
    render(<RebalancingGuide portfolioId="p1" />);

    await user.type(
      screen.getByRole("textbox", { name: "005930 보유 주수" }),
      "10"
    );
    await user.click(screen.getByRole("button", { name: "투자금 설정" }));

    const priceInput = screen.getByRole("textbox", { name: "005930 현재가" });
    await user.clear(priceInput);
    await user.type(priceInput, "1000");

    await user.click(screen.getByRole("button", { name: "계산하기" }));

    expect(screen.getByText(/미확정 슬롯이 남아 있어/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "저장하기" })
    ).not.toBeInTheDocument();
  });
});
