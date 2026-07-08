"use client";

import { useEffect, useRef, useState } from "react";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import type {
  RebalancingHistoryFilters as Filters,
  RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";
import { RebalancingHistoryFilters } from "@/features/rebalancing-history/components/RebalancingHistoryFilters";
import { RebalancingHistoryRecordCard } from "@/features/rebalancing-history/components/RebalancingHistoryRecordCard";
import { formatMonthLabel } from "@/features/rebalancing-history/dateFormat";

const groupByMonth = (records: RebalancingHistoryRecord[]) => {
  const groups: { label: string; records: RebalancingHistoryRecord[] }[] = [];

  records.forEach((record) => {
    const label = formatMonthLabel(record.executedAt);
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.label === label) {
      lastGroup.records.push(record);
    } else {
      groups.push({ label, records: [record] });
    }
  });

  return groups;
};

export const RebalancingHistoryPage = () => {
  const [filters, setFilters] = useState<Filters>({
    portfolioId: null,
    dateFrom: null,
    dateTo: null,
  });

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useRebalancingHistory(filters);

  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const records = data?.pages.flat() ?? [];
  const groups = groupByMonth(records);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-foreground">
          리밸런싱 기록
        </h1>
        <p className="text-sm text-muted-foreground">
          포트폴리오별 리밸런싱 실행 이력을 확인하세요.
        </p>
      </div>

      <div className="mb-6">
        <RebalancingHistoryFilters value={filters} onChange={setFilters} />
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {!isLoading && !isError && records.length === 0 && (
        <p className="text-sm text-muted-foreground">
          조건에 맞는 실행 기록이 없습니다.
        </p>
      )}

      {!isLoading && !isError && groups.length > 0 && (
        <div className="flex flex-col gap-2">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-2">
              <div className="mt-4 text-xs font-bold uppercase tracking-wide text-muted-foreground first:mt-0">
                {group.label}
              </div>
              {group.records.map((record) => (
                <RebalancingHistoryRecordCard key={record.id} record={record} />
              ))}
            </div>
          ))}
        </div>
      )}

      <div ref={sentinelRef} className="h-1" />

      {isFetchingNextPage && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          더 불러오는 중...
        </p>
      )}
    </div>
  );
};
