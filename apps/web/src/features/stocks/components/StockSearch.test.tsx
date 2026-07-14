import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StockSearch } from "@/features/stocks/components/StockSearch";
import { readRecentSearches } from "@/features/stocks/recentSearches";

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
    window.localStorage.clear();
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

  it("종목을 클릭하면 검색어가 초기화되고 드롭다운이 닫힌다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));

    expect(input).toHaveValue("");
    expect(screen.queryByText("삼성전자")).not.toBeInTheDocument();
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

  it("종목 선택 후 검색창에 다시 포커스하면 최근 검색 목록을 보여준다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));

    expect(screen.queryByText("최근 검색")).not.toBeInTheDocument();

    await user.click(input);

    expect(screen.getByText("최근 검색")).toBeInTheDocument();
    expect(screen.getByText("삼성전자")).toBeInTheDocument();
  });

  it("검색창 바깥을 클릭하면 최근 검색 목록이 닫힌다", async () => {
    const user = userEvent.setup();
    renderWithClient(
      <div>
        <StockSearch onSelect={vi.fn()} />
        <button type="button">바깥 버튼</button>
      </div>
    );

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));
    await user.click(input);
    expect(screen.getByText("최근 검색")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "바깥 버튼" }));

    expect(screen.queryByText("최근 검색")).not.toBeInTheDocument();
  });

  it("이미 추가된 종목이어도 최근 검색 목록에는 계속 보인다", async () => {
    const user = userEvent.setup();
    renderWithClient(<StockSearch onSelect={vi.fn()} />);

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));

    // 방금 선택한 종목이 existingTickers에 반영된 뒤에도(예: 검색창 초기화
    // 없이 리렌더) 최근 검색 기록 자체는 남아 있어야 한다.
    cleanup();
    renderWithClient(
      <StockSearch onSelect={vi.fn()} existingTickers={["005930"]} />
    );
    await user.click(screen.getByPlaceholderText(/티커 또는 종목명/));

    expect(screen.getByText("최근 검색")).toBeInTheDocument();
    expect(screen.getByText("삼성전자")).toBeInTheDocument();
  });

  it("onSelect가 같은 이벤트에서 모달을 닫아 즉시 언마운트돼도 최근 검색이 저장된다", async () => {
    const user = userEvent.setup();

    const ModalHost = () => {
      const [open, setOpen] = useState(true);
      if (!open) return null;
      return <StockSearch onSelect={() => setOpen(false)} />;
    };

    renderWithClient(<ModalHost />);

    const input = screen.getByPlaceholderText(/티커 또는 종목명/);
    await user.type(input, "삼성");
    await waitFor(() => screen.getByText("삼성전자"));
    await user.click(screen.getByText("삼성전자"));

    expect(readRecentSearches()).toContainEqual(
      expect.objectContaining({ ticker: "005930" })
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
