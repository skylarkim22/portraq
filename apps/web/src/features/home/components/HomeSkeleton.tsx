import { Card } from "@portraq/ui";
import { PortfolioPreviewSkeleton } from "@/features/home/components/PortfolioPreviewSection";
import { RecentHistorySkeleton } from "@/features/home/components/RecentHistorySection";

const SUMMARY_TILE_COUNT = 2;

export const HomeSkeleton = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-6 grid grid-cols-2 gap-3">
        {Array.from({ length: SUMMARY_TILE_COUNT }).map((_, index) => (
          <Card key={index} className="p-4">
            <div className="mb-2 h-7 w-7 animate-pulse rounded-full bg-muted" />
            <div className="mb-1.5 h-2.5 w-16 animate-pulse rounded bg-muted" />
            <div className="h-5 w-20 animate-pulse rounded bg-muted" />
          </Card>
        ))}
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-[17px] w-28 animate-pulse rounded bg-muted" />
          <div className="h-[13px] w-14 animate-pulse rounded bg-muted" />
        </div>
        <PortfolioPreviewSkeleton />
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-[17px] w-36 animate-pulse rounded bg-muted" />
          <div className="h-[13px] w-14 animate-pulse rounded bg-muted" />
        </div>
        <RecentHistorySkeleton />
      </section>
    </div>
  );
};
