import type { Market } from "@portraq/lib/types";
import { calcSellPnl } from "@/features/trade-log/calcSellPnl";
import { toAvgPriceMap, type Holding } from "@/features/trade-log/deriveHoldings";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

export type MonthlyStats = {
  totalBuyAmount: number;
  totalSellAmount: number;
  totalTax: number;
  netPnl: number;
  netPnlRate: number;
  tradeCount: number;
  marketShare: { market: Market; ratio: number }[];
};

export const deriveMonthlyStats = (
  monthLogs: EnrichedTradeLog[],
  holdings: Holding[]
): MonthlyStats => {
  const avgPriceByTicker = toAvgPriceMap(holdings);

  let totalBuyAmount = 0;
  let totalSellAmount = 0;
  let totalTax = 0;
  let netPnl = 0;
  let sellCostBasis = 0;
  const buyAmountByMarket = new Map<Market, number>();

  for (const row of monthLogs) {
    if (row.type === "buy") {
      const amount = row.quantity * row.price;
      totalBuyAmount += amount;
      buyAmountByMarket.set(
        row.market,
        (buyAmountByMarket.get(row.market) ?? 0) + amount
      );
    } else {
      const avgPrice = avgPriceByTicker.get(row.ticker) ?? 0;
      const { amount, pnlAfterTax } = calcSellPnl(row, row.market, avgPrice);
      totalSellAmount += amount;
      totalTax += row.tax ?? 0;
      netPnl += pnlAfterTax;
      sellCostBasis += avgPrice * row.quantity;
    }
  }

  const totalBuyForShare = Array.from(buyAmountByMarket.values()).reduce(
    (sum, value) => sum + value,
    0
  );
  const marketShare = Array.from(buyAmountByMarket.entries()).map(
    ([market, amount]) => ({
      market,
      ratio: totalBuyForShare > 0 ? (amount / totalBuyForShare) * 100 : 0,
    })
  );

  return {
    totalBuyAmount,
    totalSellAmount,
    totalTax,
    netPnl,
    netPnlRate: sellCostBasis > 0 ? (netPnl / sellCostBasis) * 100 : 0,
    tradeCount: monthLogs.length,
    marketShare,
  };
};
