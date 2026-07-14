import { describe, it, expect, vi, beforeEach } from "vitest";
import { stockQueries } from "@/features/stocks/queries";

function createQueryBuilder() {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.eq = vi.fn(() => builder);
  builder.or = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn(() => builder);
  builder.then = (resolve: (result: unknown) => unknown) =>
    resolve({ data: [], error: null });
  return builder;
}

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

describe("stockQueries.search", () => {
  beforeEach(() => {
    fromMock.mockReset();
    fromMock.mockImplementation(() => createQueryBuilder());
  });

  it("티커는 대소문자 구분 없이 접두어로, 종목명은 포함(%검색어%)으로 매칭한다", async () => {
    await stockQueries.search("Samsung", "ALL").queryFn!({} as never);

    const builder = fromMock.mock.results[0]?.value as { or: ReturnType<typeof vi.fn> };
    expect(builder.or).toHaveBeenCalledWith(
      "ticker.ilike.Samsung%,name.ilike.%Samsung%"
    );
  });

  it("PostgREST 구문을 깨뜨릴 수 있는 문자(%, _, 쉼표, 괄호)는 제거한다", async () => {
    await stockQueries.search("a%b_c,d(e)", "ALL").queryFn!({} as never);

    const builder = fromMock.mock.results[0]?.value as { or: ReturnType<typeof vi.fn> };
    expect(builder.or).toHaveBeenCalledWith("ticker.ilike.abcde%,name.ilike.%abcde%");
  });

  it("*는 PostgREST가 %의 별칭으로 취급하므로 함께 제거한다", async () => {
    await stockQueries.search("a*b", "ALL").queryFn!({} as never);

    const builder = fromMock.mock.results[0]?.value as { or: ReturnType<typeof vi.fn> };
    expect(builder.or).toHaveBeenCalledWith("ticker.ilike.ab%,name.ilike.%ab%");
  });

  it("검색어가 비어있으면 쿼리를 호출하지 않고 빈 배열을 반환한다", async () => {
    const result = await stockQueries.search("   ", "ALL").queryFn!({} as never);

    expect(result).toEqual([]);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
