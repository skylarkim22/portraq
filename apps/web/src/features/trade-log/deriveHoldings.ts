import type { Market } from "@portraq/lib/types";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

export type Holding = {
  ticker: string;
  name: string;
  market: Market;
  avgPrice: number;
  quantity: number;
};

// 평균단가는 매수 기록만으로 산출하고, 매도 기록이 생겨도 재계산하지 않는다(PRD 2.6.2).
// 보유 수량만 매도 수량만큼 차감한다.
export const deriveHoldings = (rows: EnrichedTradeLog[]): Holding[] => {
  const buyTotals = new Map<
    string,
    { qty: number; cost: number; name: string; market: Market }
  >();
  const soldQty = new Map<string, number>();

  for (const row of rows) {
    if (row.type === "buy") {
      const entry = buyTotals.get(row.ticker) ?? {
        qty: 0,
        cost: 0,
        name: row.name,
        market: row.market,
      };
      entry.qty += row.quantity;
      entry.cost += row.quantity * row.price;
      buyTotals.set(row.ticker, entry);
    } else {
      soldQty.set(row.ticker, (soldQty.get(row.ticker) ?? 0) + row.quantity);
    }
  }

  return Array.from(buyTotals.entries())
    .map(([ticker, { qty, cost, name, market }]) => ({
      ticker,
      name,
      market,
      avgPrice: qty > 0 ? cost / qty : 0,
      quantity: qty - (soldQty.get(ticker) ?? 0),
    }))
    .filter((holding) => holding.quantity > 0);
};
