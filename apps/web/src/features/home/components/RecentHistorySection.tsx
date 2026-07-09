"use client";

import Link from "next/link";
import { RefreshCcw, ArrowRight } from "lucide-react";
import { Card } from "@portraq/ui";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import { formatExecutedDate } from "@/lib/dateFormat";

const RECENT_HISTORY_LIMIT = 3;

export const RecentHistorySection = () => {
  const { data: historyPages, isLoading } = useRebalancingHistory({
    portfolioId: null,
    dateFrom: null,
    dateTo: null,
  });
  const records = (historyPages?.pages[0] ?? []).slice(0, RECENT_HISTORY_LIMIT);

  if (!isLoading && records.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold tracking-tight text-foreground">
          최근 리밸런싱 기록
        </h2>
        <Link
          href="/rebalancing-history"
          className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:opacity-70"
        >
          전체 보기
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      ) : (
        <Card className="overflow-hidden p-0">
          {records.map((record, index) => (
            <div
              key={record.id}
              className={`flex items-center justify-between gap-3 p-4 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eef2ff]">
                  <RefreshCcw size={16} className="text-primary" />
                </div>
                <div className="min-w-0 truncate text-sm font-extrabold text-foreground">
                  {record.portfolioName}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-semibold text-muted-foreground">
                  {formatExecutedDate(record.executedAt)}
                </div>
                <div className="mt-0.5 text-xs font-bold text-[var(--portraq-success)]">
                  완료
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}
    </section>
  );
};
