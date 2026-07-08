import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { TradeLogPage } from "@/features/trade-log/components/TradeLogPage";
import { useTradeLogs } from "@/features/trade-log/hooks";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const renderWithClient = (ui: React.ReactElement) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

vi.mock("@/features/trade-log/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/features/trade-log/hooks")>(
    "@/features/trade-log/hooks"
  );
  return {
    ...actual,
    useTradeLogs: vi.fn(),
    useCreateTradeLog: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  };
});

const log = (overrides: Partial<EnrichedTradeLog>): EnrichedTradeLog => ({
  id: "l1",
  userId: "u1",
  type: "buy",
  date: "2026-01-01",
  ticker: "AAPL",
  quantity: 1,
  price: 1000,
  memo: null,
  name: "Apple",
  market: "US",
  color: "#000",
  createdAt: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("TradeLogPage", () => {
  it("로딩 중에는 로딩 문구를 보여준다", () => {
    vi.mocked(useTradeLogs).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as unknown as ReturnType<typeof useTradeLogs>);

    renderWithClient(<TradeLogPage />);

    expect(screen.getByText("불러오는 중...")).toBeInTheDocument();
  });

  it("정상 로딩되면 달력·통계·매수/매도 기록 버튼을 보여준다", () => {
    vi.mocked(useTradeLogs).mockReturnValue({
      data: [
        log({
          id: "l1",
          ticker: "KO",
          quantity: 10,
          price: 83000,
          name: "Coca-Cola",
          market: "KR",
        }),
      ],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useTradeLogs>);

    renderWithClient(<TradeLogPage />);

    expect(screen.getByText("매매 일지")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /매수 기록/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /매도 기록/ }).length).toBeGreaterThan(0);
  });

  it("매수 기록 버튼을 누르면 매수 모달이 열린다", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    vi.mocked(useTradeLogs).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
    } as unknown as ReturnType<typeof useTradeLogs>);

    const user = userEvent.setup();
    renderWithClient(<TradeLogPage />);

    await user.click(screen.getAllByRole("button", { name: /매수 기록/ })[0]);

    expect(screen.getByRole("heading", { name: "매수 기록" })).toBeInTheDocument();
  });
});
