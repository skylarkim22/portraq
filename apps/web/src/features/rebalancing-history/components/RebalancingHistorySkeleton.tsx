import { Card } from "@portraq/ui";

const RECORD_COUNT = 3;

export const RebalancingHistorySkeleton = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="mb-2 h-7 w-32 animate-pulse rounded bg-muted" />
        <div className="h-4 w-56 animate-pulse rounded bg-muted" />
      </div>

      <div className="mb-6 h-9 w-full animate-pulse rounded-md bg-muted" />

      <div className="mb-2 h-3 w-16 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: RECORD_COUNT }).map((_, index) => (
          <Card key={index} className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="mb-1.5 h-[14px] w-28 animate-pulse rounded bg-muted" />
                <div className="h-3 w-20 animate-pulse rounded bg-muted" />
              </div>
              <div className="text-right">
                <div className="mb-1 h-[11px] w-12 animate-pulse rounded bg-muted" />
                <div className="h-[14px] w-16 animate-pulse rounded bg-muted" />
              </div>
            </div>
            <div className="flex gap-1.5">
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
