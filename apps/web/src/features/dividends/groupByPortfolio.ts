import type { DividendRow } from "@/features/dividends/queries";

export type DividendGroup = { portfolioName: string; rows: DividendRow[] };

export const groupByPortfolio = (rows: DividendRow[]): DividendGroup[] => {
  const order: string[] = [];
  const groups = new Map<string, DividendRow[]>();
  for (const row of rows) {
    if (!groups.has(row.portfolioId)) {
      groups.set(row.portfolioId, []);
      order.push(row.portfolioId);
    }
    groups.get(row.portfolioId)?.push(row);
  }
  return order.map((portfolioId) => {
    const groupRows = groups.get(portfolioId) ?? [];
    return { portfolioName: groupRows[0]?.portfolioName ?? "", rows: groupRows };
  });
};
