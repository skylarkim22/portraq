import { describe, it, expect, vi, beforeEach } from "vitest";
import { tradeLogQueries } from "@/features/trade-log/queries";

const createQueryBuilder = (data: unknown[]) => {
  const builder: Record<string, unknown> = {};
  builder.select = vi.fn(() => builder);
  builder.order = vi.fn(() => builder);
  builder.then = (resolve: (result: unknown) => unknown) =>
    resolve({ data, error: null });
  return builder;
};

const fromMock = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ from: fromMock }),
}));

describe("tradeLogQueries.list", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  it("assets 조인 결과는 isCustom:false로, custom_assets 조인 결과는 isCustom:true로 매핑한다", async () => {
    fromMock.mockReturnValue(
      createQueryBuilder([
        {
          id: "l1",
          user_id: "u1",
          type: "buy",
          date: "2026-01-01",
          asset_ticker: "AAPL",
          custom_asset_id: null,
          quantity: 1,
          price: 100,
          tax: null,
          exchange_rate: null,
          memo: null,
          created_at: "2026-01-01T00:00:00Z",
          assets: { name: "Apple", market: "US" },
          custom_assets: null,
        },
        {
          id: "l2",
          user_id: "u1",
          type: "buy",
          date: "2026-01-02",
          asset_ticker: null,
          custom_asset_id: "custom-uuid-1",
          quantity: 1,
          price: 5000,
          tax: null,
          exchange_rate: null,
          memo: null,
          created_at: "2026-01-02T00:00:00Z",
          assets: null,
          custom_assets: { name: "비상장 펀드", market: "KR" },
        },
      ])
    );

    const result = await tradeLogQueries.list().queryFn!({} as never);

    expect(result).toEqual([
      expect.objectContaining({ ticker: "AAPL", name: "Apple", market: "US", isCustom: false }),
      expect.objectContaining({
        ticker: "custom-uuid-1",
        name: "비상장 펀드",
        market: "KR",
        isCustom: true,
      }),
    ]);
  });
});
