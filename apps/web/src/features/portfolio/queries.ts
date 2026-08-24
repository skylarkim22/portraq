import { queryOptions } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ActionItem,
  Market,
  Portfolio,
  PortfolioAsset,
  SnapshotAsset,
} from "@portraq/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import type { SupabaseClientGetter } from "@/lib/supabase/types";

export type PortfolioCardAsset = {
  ticker: string;
  market: Market;
  ratio: number;
  shares: number;
  currentPrice: number;
  color: string;
  isCustom?: boolean;
};

// asset_ticker/custom_asset_id는 exclusive arc라 assets(...)/custom_assets(...)
// 중 채워진 쪽 하나만 실제로 존재한다. Supabase 클라이언트가 Database 타입 없이
// 쓰이는 이 프로젝트에서는 to-one 관계도 배열 타입으로 추론되므로(실제 런타임
// 응답은 단일 객체) 여기서 실제 형태로 캐스팅해 흡수한다.
type AssetJoinInfo = { name: string; market: string; color: string };

const pickAssetInfo = (catalogAsset: unknown, customAsset: unknown): AssetJoinInfo =>
  (catalogAsset ?? customAsset) as unknown as AssetJoinInfo;

export type PortfolioCardExecutionSummary = {
  buyCount: number;
  sellCount: number;
  holdCount: number;
};

export type PortfolioSummary = {
  id: string;
  name: string;
  updatedAt: string;
  assets: PortfolioCardAsset[];
  latestExecution: PortfolioCardExecutionSummary | null;
};

const summarizeExecution = (
  actions: ActionItem[]
): PortfolioCardExecutionSummary =>
  actions.reduce(
    (acc, action) => {
      if (action.action === "buy") acc.buyCount += 1;
      else if (action.action === "sell") acc.sellCount += 1;
      else acc.holdCount += 1;
      return acc;
    },
    { buyCount: 0, sellCount: 0, holdCount: 0 }
  );

// asset_prices에서 티커별 최신 종가만 골라 Map으로 반환한다.
// portfolio_assets.current_price(마지막 리밸런싱 실행가)보다 asset_prices가
// 있으면 그쪽을 우선한다 — 신규 추가돼 아직 배치가 못 돈 종목은 이 Map에
// 없으므로 호출부에서 current_price로 폴백한다(#60).
export const fetchLatestClosePrices = async (supabase: SupabaseClient, tickers: string[]) => {
  const latestByTicker = new Map<string, number>();
  if (tickers.length === 0) return latestByTicker;

  const { data, error } = await supabase
    .from("asset_prices")
    .select("ticker, close_price, price_date")
    .in("ticker", tickers)
    .order("price_date", { ascending: false });

  if (error) throw error;

  for (const row of data) {
    if (!latestByTicker.has(row.ticker)) {
      latestByTicker.set(row.ticker, row.close_price);
    }
  }
  return latestByTicker;
};

export const portfolioQueries = {
  all: () => ["portfolios"] as const,

  lists: (getClient: SupabaseClientGetter = createBrowserClient) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "list"] as const,
      queryFn: async (): Promise<PortfolioSummary[]> => {
        const supabase = await getClient();
        const { data, error } = await supabase
          .from("portfolios")
          .select(
            "id, name, updated_at, portfolio_assets(asset_ticker, custom_asset_id, ratio, shares, current_price, sort_order, assets(name, market, color), custom_assets(name, market, color)), execution_records(executed_at, actions)"
          )
          .order("updated_at", { ascending: false })
          .order("executed_at", { referencedTable: "execution_records", ascending: false })
          .limit(1, { referencedTable: "execution_records" });

        if (error) throw error;

        const heldTickers = [
          ...new Set(
            data.flatMap((row) => row.portfolio_assets.map((asset) => asset.asset_ticker).filter((t) => t !== null))
          ),
        ];
        const latestClosePrices = await fetchLatestClosePrices(supabase, heldTickers);

        return data.map((row) => {
          const assets: PortfolioCardAsset[] = row.portfolio_assets
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((asset) => {
              const info = pickAssetInfo(asset.assets, asset.custom_assets);
              return {
                ticker: asset.asset_ticker ?? asset.custom_asset_id,
                market: info.market as Market,
                ratio: asset.ratio,
                shares: asset.shares,
                currentPrice: latestClosePrices.get(asset.asset_ticker ?? "") ?? asset.current_price,
                color: info.color,
                isCustom: asset.custom_asset_id !== null,
              };
            });

          const latestExecution = row.execution_records[0]
            ? summarizeExecution(row.execution_records[0].actions as ActionItem[])
            : null;

          return {
            id: row.id,
            name: row.name,
            updatedAt: row.updated_at,
            assets,
            latestExecution,
          };
        });
      },
      staleTime: 1000 * 30,
    }),

  detail: (id: string, getClient: SupabaseClientGetter = createBrowserClient) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "detail", id] as const,
      queryFn: async (): Promise<Portfolio> => {
        const supabase = await getClient();
        const { data, error } = await supabase
          .from("portfolios")
          .select(
            "id, name, memo, created_at, updated_at, portfolio_assets(asset_ticker, custom_asset_id, ratio, shares, current_price, sort_order, assets(name, market, color), custom_assets(name, market, color))"
          )
          .eq("id", id)
          .single();

        if (error) throw error;

        const heldTickers = [...new Set(data.portfolio_assets.map((row) => row.asset_ticker).filter((t) => t !== null))];
        const latestClosePrices = await fetchLatestClosePrices(supabase, heldTickers);

        const assets: PortfolioAsset[] = data.portfolio_assets
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((row) => {
            const info = pickAssetInfo(row.assets, row.custom_assets);
            return {
              ticker: row.asset_ticker ?? row.custom_asset_id,
              name: info.name,
              market: info.market as Market,
              color: info.color,
              ratio: row.ratio,
              shares: row.shares,
              currentPrice: latestClosePrices.get(row.asset_ticker ?? "") ?? row.current_price,
              order: row.sort_order,
              isCustom: row.custom_asset_id !== null,
            };
          });

        return {
          id: data.id,
          name: data.name,
          memo: data.memo,
          assets,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };
      },
      staleTime: 1000 * 30,
    }),

  snapshots: (id: string, getClient: SupabaseClientGetter = createBrowserClient) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), "snapshots", id] as const,
      queryFn: async (): Promise<SnapshotAsset[]> => {
        const supabase = await getClient();
        const { data, error } = await supabase
          .from("portfolio_snapshots")
          .select("assets")
          .eq("portfolio_id", id)
          .order("saved_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        return (data?.assets as SnapshotAsset[] | undefined) ?? [];
      },
      staleTime: 1000 * 30,
    }),
};
