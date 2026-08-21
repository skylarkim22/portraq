import { queryOptions } from "@tanstack/react-query";
import type { Market, TradeLog } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export type EnrichedTradeLog = TradeLog & {
  name: string;
  market: Market;
};

// asset_ticker/custom_asset_id는 exclusive arc라 assets(...)/custom_assets(...)
// 중 채워진 쪽 하나만 실제로 존재한다. Supabase 클라이언트가 Database 타입 없이
// 쓰이는 이 프로젝트에서는 to-one 관계도 배열 타입으로 추론되므로(실제 런타임
// 응답은 단일 객체) 여기서 실제 형태로 캐스팅해 흡수한다.
type AssetJoinInfo = { name: string; market: string };

const pickAssetInfo = (
  catalogAsset: unknown,
  customAsset: unknown
): AssetJoinInfo | null => (catalogAsset ?? customAsset) as unknown as AssetJoinInfo | null;

export const tradeLogQueries = {
  all: () => ["trade-logs"] as const,

  list: () =>
    queryOptions({
      queryKey: [...tradeLogQueries.all(), "list"] as const,
      queryFn: async (): Promise<EnrichedTradeLog[]> => {
        const { data, error } = await createClient()
          .from("trade_logs")
          .select(
            "id, user_id, type, date, asset_ticker, custom_asset_id, quantity, price, tax, exchange_rate, memo, created_at, assets(name, market), custom_assets(name, market)"
          )
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) throw error;

        return data.map((row) => {
          const info = pickAssetInfo(row.assets, row.custom_assets);
          const ticker = row.asset_ticker ?? row.custom_asset_id;
          return {
            id: row.id,
            userId: row.user_id,
            type: row.type as "buy" | "sell",
            date: row.date,
            ticker,
            quantity: row.quantity,
            price: row.price,
            tax: row.tax,
            exchangeRate: row.exchange_rate,
            memo: row.memo,
            createdAt: row.created_at,
            name: info?.name ?? ticker,
            market: (info?.market as Market) ?? "KR",
            isCustom: row.custom_asset_id !== null,
          };
        });
      },
      staleTime: 1000 * 30,
    }),
};
