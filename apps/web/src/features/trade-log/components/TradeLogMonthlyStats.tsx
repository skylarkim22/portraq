import { Card } from "@portraq/ui";
import type { MonthlyStats } from "@/features/trade-log/deriveMonthlyStats";
import { MARKET_COLOR } from "@/features/trade-log/constants";

type TradeLogMonthlyStatsProps = {
  month: number;
  stats: MonthlyStats;
};

const formatWon = (value: number) => `${Math.round(value).toLocaleString("ko-KR")}원`;
const formatSignedWon = (value: number) =>
  `${value >= 0 ? "+" : ""}${formatWon(value)}`;
const formatSignedPercent = (value: number) =>
  `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;

export const TradeLogMonthlyStats = ({ month, stats }: TradeLogMonthlyStatsProps) => {
  const pnlColorClass = stats.netPnl >= 0 ? "text-[#16a34a]" : "text-destructive";

  return (
    <Card className="p-5">
      <div className="mb-3 text-[13px] font-extrabold text-foreground">
        {month}월 통계
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <StatTile label="총 매수금액" value={formatWon(stats.totalBuyAmount)} />
        <StatTile label="총 매도금액" value={formatWon(stats.totalSellAmount)} />
        <StatTile label="세금 합계" value={formatWon(stats.totalTax)} />
        <StatTile
          label="순손익"
          value={formatSignedWon(stats.netPnl)}
          valueClassName={pnlColorClass}
        />
        <StatTile
          label="순수익률"
          value={formatSignedPercent(stats.netPnlRate)}
          valueClassName={pnlColorClass}
        />
        <StatTile label="거래 횟수" value={`${stats.tradeCount}건`} />
      </div>

      {stats.marketShare.length > 0 && (
        <>
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
            시장별 비중 (매수금액 기준)
          </div>
          <div className="mb-2 flex h-2 gap-0.5 overflow-hidden rounded">
            {stats.marketShare.map((share) => (
              <div
                key={share.market}
                className="h-full rounded"
                style={{ flex: share.ratio, backgroundColor: MARKET_COLOR[share.market] }}
              />
            ))}
          </div>
          <div className="flex gap-4">
            {stats.marketShare.map((share) => (
              <div key={share.market} className="flex items-center gap-1">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: MARKET_COLOR[share.market] }}
                />
                <span className="text-xs font-semibold text-muted-foreground">
                  {share.market} {share.ratio.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
};

type StatTileProps = {
  label: string;
  value: string;
  valueClassName?: string;
};

const StatTile = ({ label, value, valueClassName }: StatTileProps) => (
  <div className="rounded-xl bg-muted px-3.5 py-3">
    <div className="mb-1 text-[10px] font-semibold text-muted-foreground">{label}</div>
    <div className={`text-sm font-extrabold text-foreground ${valueClassName ?? ""}`}>
      {value}
    </div>
  </div>
);
