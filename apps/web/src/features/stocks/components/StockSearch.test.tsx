import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StockSearch } from "./StockSearch";

const ASSET_ROWS = [
  { ticker: "005930", name: "삼성전자", market: "KR", color: "#355df9", is_active: true },
  { ticker: "AAPL", name: "Apple Inc.", market: "US", color: "#e85d4a", is_active: true },
];

function createQueryBuilder() {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.then = (resolve: (result: unknown) => unknown) =>
    resolve({ data: ASSET_ROWS, error: null });
  return builder;
}

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

describe("StockSearch", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation(() => createQueryBuilder());
  });

  it("검색어를 입력하면 결과를 드롭다운에 표시한다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "삼성"
    );

    await waitFor(() =>
      expect(screen.getByText("삼성전자")).toBeInTheDocument()
    );
    expect(screen.getByText("Apple Inc.")).toBeInTheDocument();
  });

  it("종목을 클릭하면 onSelect가 해당 종목 정보와 함께 호출된다", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    renderWithClient(<StockSearch onSelect={handleSelect} />);

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "삼성"
    );
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: "005930", name: "삼성전자", market: "KR" })
    );
  });

  it("시장 탭을 클릭하면 market 필터로 다시 조회한다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "삼성"
    );
    await waitFor(() => screen.getByText("삼성전자"));

    await user.click(screen.getByRole("button", { name: "미국" }));

    await waitFor(() => {
      const latestBuilder = fromMock.mock.results.at(-1)?.value as {
        eq: ReturnType<typeof vi.fn>;
      };
      expect(latestBuilder.eq).toHaveBeenCalledWith("market", "US");
    });
  });

  it("취소 버튼을 누르면 검색어를 지우고 드롭다운을 닫는다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));

    await user.click(screen.getByRole("button", { name: "검색어 지우기" }));

    expect(input).toHaveValue("");
    expect(screen.queryByText("삼성전자")).not.toBeInTheDocument();
  });
});
