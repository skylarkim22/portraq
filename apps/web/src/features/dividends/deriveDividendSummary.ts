import type { DividendRow } from "@/features/dividends/queries";

export type DividendSummary = {
  totalInvested: number;
  totalDividend: number;
  avgYield: number | null;
  totalCount: number;
};

export const deriveDividendSummary = (rows: DividendRow[]): DividendSummary => {
  const totalInvested = rows.reduce((sum, row) => sum + row.avgPrice * row.shares, 0);
  const totalDividend = rows.reduce((sum, row) => sum + row.dividendSum, 0);
  const avgYield = totalInvested > 0 ? Math.round((totalDividend / totalInvested) * 1000) / 10 : null;

  return { totalInvested, totalDividend, avgYield, totalCount: rows.length };
};
