import { queryOptions } from "@tanstack/react-query";
import type { ActionItem, Market } from "@portraq/lib/types";
import { createClient as createBrowserClient } from "@/lib/supabase/client";
import { fetchLatestClosePrices } from "@/features/portfolio/queries";
import type { SupabaseClientGetter } from "@/lib/supabase/types";
import {
  computeAveragePurchases,
  reconcileWithActualHoldings,
  computeSharesTimelines,
  sharesAsOfMonth,
} from "@/features/dividends/computeAveragePurchases";
import type { DividendInputEntry } from "@/features/dividends/computeDividendTrend";
import {
  computeDividendSum,
  computeAnnualizedYield,
  computeExpectedYield,
  formatPaySchedule,
  deriveNoDataReason,
  type AssetDividendRecord,
  type DividendNoDataReason,
} from "@/features/dividends/computeDividendMetrics";

export type DividendRow = {
  portfolioId: string;
  portfolioName: string;
  ticker: string;
  name: string;
  market: Market;
  color: string;
  isCustom: boolean;
  ratio: number;
  avgPrice: number;
  shares: number;
  paySchedule: string | null;
  dividendSum: number;
  annualizedYield: number | null;
  expectedYield: number | null;
  manualHistory: DividendInputEntry[];
  noDataReason: DividendNoDataReason | null;
};

// asset_ticker/custom_asset_id는 exclusive arc라 assets(...)/custom_assets(...)
// 중 채워진 쪽 하나만 실제로 존재한다(portfolio/queries.ts와 동일 패턴).
type AssetJoinInfo = {
  name: string;
  market: string;
  color: string;
  dividend_frequency?: string | null;
  dividend_months?: number[] | null;
};

const pickAssetInfo = (catalogAsset: unknown, customAsset: unknown): AssetJoinInfo =>
  (catalogAsset ?? customAsset) as unknown as AssetJoinInfo;

// dividend_inputs/asset_dividends 조회 결과를 (portfolio_id, ticker) 또는
// ticker 단위로 그룹핑할 때 쓰는 키.
const holdingKey = (portfolioId: string, ticker: string) => `${portfolioId}|${ticker}`;

export const dividendQueries = {
  all: () => ["dividends"] as const,

  list: (getClient: SupabaseClientGetter = createBrowserClient) =>
    queryOptions({
      queryKey: [...dividendQueries.all(), "list"] as const,
      queryFn: async (): Promise<DividendRow[]> => {
        const supabase = await getClient();

        const { data: portfolios, error: portfoliosError } = await supabase.from("portfolios").select(
          "id, name, portfolio_assets(asset_ticker, custom_asset_id, ratio, shares, current_price, assets(name, market, color, dividend_frequency, dividend_months), custom_assets(name, market, color))"
        );
        if (portfoliosError) throw portfoliosError;

        const portfolioIds = portfolios.map((p) => p.id);
        const heldTickers = [
          ...new Set(
            portfolios.flatMap((p) =>
              p.portfolio_assets.map((a) => a.asset_ticker).filter((t): t is string => t !== null)
            )
          ),
        ];

        if (portfolioIds.length === 0) return [];

        const [executionResult, dividendInputsResult, assetDividendsResult, latestClosePrices] = await Promise.all([
          supabase
            .from("execution_records")
            .select("portfolio_id, executed_at, actions")
            .in("portfolio_id", portfolioIds)
            .order("executed_at", { ascending: true }),
          supabase
            .from("dividend_inputs")
            .select("portfolio_id, asset_ticker, custom_asset_id, month, amount")
            .in("portfolio_id", portfolioIds),
          heldTickers.length > 0
            ? supabase.from("asset_dividends").select("ticker, record_date, amount").in("ticker", heldTickers)
            : Promise.resolve({ data: [], error: null }),
          fetchLatestClosePrices(supabase, heldTickers),
        ]);

        if (executionResult.error) throw executionResult.error;
        if (dividendInputsResult.error) throw dividendInputsResult.error;
        if (assetDividendsResult.error) throw assetDividendsResult.error;

        const executionsByPortfolio = new Map<string, { executedAt: string; actions: ActionItem[] }[]>();
        for (const record of executionResult.data) {
          const list = executionsByPortfolio.get(record.portfolio_id) ?? [];
          list.push({ executedAt: record.executed_at, actions: record.actions as ActionItem[] });
          executionsByPortfolio.set(record.portfolio_id, list);
        }

        // shares는 아직 모른다(티커별 timeline이 필요) — 여기서는 월/금액만
        // 모아두고, 아래 rows 루프에서 종목별 timeline을 만들어 채운다.
        const rawManualHistoryByHolding = new Map<string, { month: string; amount: number }[]>();
        for (const row of dividendInputsResult.data) {
          const ticker = row.asset_ticker ?? row.custom_asset_id;
          if (!ticker) continue;
          const key = holdingKey(row.portfolio_id, ticker);
          const list = rawManualHistoryByHolding.get(key) ?? [];
          list.push({ month: String(row.month).slice(0, 7), amount: row.amount });
          rawManualHistoryByHolding.set(key, list);
        }

        const dividendRecordsByTicker = new Map<string, AssetDividendRecord[]>();
        for (const row of assetDividendsResult.data) {
          const list = dividendRecordsByTicker.get(row.ticker) ?? [];
          list.push({ recordDate: row.record_date, amount: row.amount });
          dividendRecordsByTicker.set(row.ticker, list);
        }

        const rows: DividendRow[] = [];
        for (const portfolio of portfolios) {
          const executionRecords = executionsByPortfolio.get(portfolio.id) ?? [];
          const averagePurchases = computeAveragePurchases(executionRecords);
          // 포트폴리오당 한 번만 execution_records를 재생해 모든 보유
          // 종목의 timeline을 동시에 만든다(종목마다 반복 재생하지 않음).
          const sharesTimelines = computeSharesTimelines(executionRecords);

          for (const holding of portfolio.portfolio_assets) {
            const ticker = holding.asset_ticker ?? holding.custom_asset_id;
            if (!ticker) continue;

            const info = pickAssetInfo(holding.assets, holding.custom_assets);
            // buy/sell로 추적된 이동평균 결과가 실제 보유 수량(portfolio_assets.shares)에
            // 못 미치면(이 앱에 등록하기 전부터 보유하던 종목 등, buy 액션이
            // 아예 없을 수도 있음) 그 차이를 등록 시점 가격(current_price,
            // 마지막 실행가)에 매수한 것으로 간주해 평균 단가에 반영한다.
            const purchase = reconcileWithActualHoldings({
              computed: averagePurchases.get(ticker),
              actualShares: holding.shares,
              fallbackPrice: holding.current_price,
            });

            // 새 스키마 없이 execution_records만 재생해 입력월마다 실제
            // 보유 수량을 추정한다(연 환산 수익률이 중간 증좌로 왜곡되는
            // 문제 대응). timeline 이전 달은 현재 보유 수량으로 폴백한다.
            // timeline은 buy/sell만 재생하므로 앱 등록 전부터 보유하던
            // 수량(reconcileWithActualHoldings가 채운 차이)은 빠져 있다 —
            // 체크포인트가 있는 달에도 그 수량은 더해줘야 한다(#91).
            const sharesTimeline = sharesTimelines.get(ticker) ?? [];
            const preExistingOffset = Math.max(0, purchase.shares - (averagePurchases.get(ticker)?.shares ?? 0));
            const rawManualHistory = rawManualHistoryByHolding.get(holdingKey(portfolio.id, ticker)) ?? [];
            const manualHistory: DividendInputEntry[] = rawManualHistory.map((entry) => ({
              ...entry,
              shares: sharesAsOfMonth(sharesTimeline, entry.month, purchase.shares, preExistingOffset),
            }));

            const dividendSum = computeDividendSum(manualHistory);
            const annualizedYield = computeAnnualizedYield({
              manualHistory,
              avgPrice: purchase.avgPrice,
            });

            const currentPrice = holding.asset_ticker ? (latestClosePrices.get(holding.asset_ticker) ?? 0) : 0;
            const dividendRecords = holding.asset_ticker
              ? (dividendRecordsByTicker.get(holding.asset_ticker) ?? [])
              : [];
            const expectedYield = computeExpectedYield({ dividendRecords, currentPrice });
            const dividendFrequency = info.dividend_frequency ?? null;

            rows.push({
              portfolioId: portfolio.id,
              portfolioName: portfolio.name,
              ticker,
              name: info.name,
              market: info.market as Market,
              color: info.color,
              isCustom: holding.custom_asset_id !== null,
              ratio: holding.ratio,
              avgPrice: purchase.avgPrice,
              shares: purchase.shares,
              paySchedule: formatPaySchedule(info.dividend_months ?? null),
              dividendSum,
              annualizedYield,
              expectedYield,
              manualHistory,
              noDataReason: deriveNoDataReason({ dividendFrequency, expectedYield }),
            });
          }
        }

        return rows;
      },
      staleTime: 1000 * 30,
    }),
};
