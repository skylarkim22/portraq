import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StockSearch } from "@/features/stocks/components/StockSearch";

const ASSET_ROWS = [
  { ticker: "005930", name: "삼성전자", market: "KR", color: "#355df9", is_active: true },
  { ticker: "AAPL", name: "Apple Inc.", market: "US", color: "#e85d4a", is_active: true },
];

function createQueryBuilder(data: unknown[] = ASSET_ROWS) {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.then = (resolve: (result: unknown) => unknown) =>
    resolve({ data, error: null });
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

  it("검색 결과가 없으면 직접 추가하기 버튼을 보여준다", async () => {
    fromMock.mockImplementation(() => createQueryBuilder([]));
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "없는종목"
    );

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /직접 추가하기/ })
      ).toBeInTheDocument()
    );
  });

  it("직접 추가하기를 누르면 종목명·시장으로 자동 부여된 티커와 함께 onSelect를 호출한다", async () => {
    fromMock.mockImplementation(() => createQueryBuilder([]));
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    renderWithClient(<StockSearch onSelect={handleSelect} />);

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "나만의펀드"
    );
    await waitFor(() =>
      screen.getByRole("button", { name: /직접 추가하기/ })
    );
    await user.click(screen.getByRole("button", { name: /직접 추가하기/ }));

    expect(screen.getByText("CUSTOM_1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "직접 추가 시장 미국" }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        ticker: "CUSTOM_1",
        name: "나만의펀드",
        market: "US",
        isActive: true,
      })
    );
  });

  it("이미 커스텀 티커가 있으면 다음 번호를 이어서 부여한다", async () => {
    fromMock.mockImplementation(() => createQueryBuilder([]));
    const user = userEvent.setup();
    const handleSelect = vi.fn();
    renderWithClient(
      <StockSearch
        onSelect={handleSelect}
        existingTickers={["CUSTOM_1", "CUSTOM_2"]}
      />
    );

    await user.type(
      screen.getByPlaceholderText(/티커 또는 종목명/),
      "나만의펀드 2호"
    );
    await waitFor(() =>
      screen.getByRole("button", { name: /직접 추가하기/ })
    );
    await user.click(screen.getByRole("button", { name: /직접 추가하기/ }));
    await user.click(screen.getByRole("button", { name: "추가" }));

    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ ticker: "CUSTOM_3" })
    );
  });
});
