import { queryOptions } from "@tanstack/react-query";
import type { Market, TradeLog } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export type EnrichedTradeLog = TradeLog & {
  name: string;
  market: Market;
};

export const tradeLogQueries = {
  all: () => ["trade-logs"] as const,

  list: () =>
    queryOptions({
      queryKey: [...tradeLogQueries.all(), "list"] as const,
      queryFn: async (): Promise<EnrichedTradeLog[]> => {
        const { data, error } = await createClient()
          .from("trade_logs")
          .select("id, user_id, type, date, ticker, quantity, price, tax, exchange_rate, memo, created_at")
          .order("date", { ascending: false })
          .order("created_at", { ascending: false });
        if (error) throw error;

        const tickers = Array.from(new Set(data.map((row) => row.ticker)));

        const assetByTicker = new Map<string, { name: string; market: Market }>();

        if (tickers.length > 0) {
          const { data: assets, error: assetsError } = await createClient()
            .from("assets")
            .select("ticker, name, market")
            .in("ticker", tickers);
          if (assetsError) throw assetsError;

          assets.forEach((asset) => {
            assetByTicker.set(asset.ticker, {
              name: asset.name,
              market: asset.market as Market,
            });
          });
        }

        return data.map((row) => {
          const asset = assetByTicker.get(row.ticker);
          return {
            id: row.id,
            userId: row.user_id,
            type: row.type as "buy" | "sell",
            date: row.date,
            ticker: row.ticker,
            quantity: row.quantity,
            price: row.price,
            tax: row.tax,
            exchangeRate: row.exchange_rate,
            memo: row.memo,
            createdAt: row.created_at,
            name: asset?.name ?? row.ticker,
            market: asset?.market ?? "KR",
          };
        });
      },
    }),
};
