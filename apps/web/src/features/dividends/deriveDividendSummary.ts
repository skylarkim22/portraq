import type { DividendRow } from "@/features/dividends/queries";

export type DividendSummary = {
  totalInvested: number;
  totalDividend: number;
  avgYield: number | null;
  totalCount: number;
  noDataCount: number;
};

export const deriveDividendSummary = (rows: DividendRow[]): DividendSummary => {
  const totalInvested = rows.reduce((sum, row) => sum + row.avgPrice * row.shares, 0);
  const totalDividend = rows.reduce((sum, row) => sum + row.dividendSum, 0);
  const avgYield = totalInvested > 0 ? Math.round((totalDividend / totalInvested) * 1000) / 10 : null;
  const noDataCount = rows.filter((row) => row.noDataReason).length;

  return { totalInvested, totalDividend, avgYield, totalCount: rows.length, noDataCount };
};
