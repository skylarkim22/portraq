import { TradeLogCard } from "@/features/trade-log/components/TradeLogCard";
import { toAvgPriceMap, type Holding } from "@/features/trade-log/deriveHoldings";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

type TradeLogDayFeedProps = {
  dateLabel: string;
  logs: EnrichedTradeLog[];
  holdings?: Holding[];
};

export const TradeLogDayFeed = ({
  dateLabel,
  logs,
  holdings = [],
}: TradeLogDayFeedProps) => {
  const avgPriceByTicker = toAvgPriceMap(holdings);

  return (
    <section>
      <h2 className="mb-3 text-[15px] font-extrabold text-foreground">
        {dateLabel} 거래 내역
      </h2>
      <div className="flex flex-col gap-2">
        {logs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background px-4 py-8 text-center text-xs text-muted-foreground">
            해당 날짜에 등록된 거래가 없습니다.
          </div>
        ) : (
          logs.map((log) => (
            <TradeLogCard
              key={log.id}
              log={log}
              avgPrice={avgPriceByTicker.get(log.ticker)}
            />
          ))
        )}
      </div>
    </section>
  );
};
