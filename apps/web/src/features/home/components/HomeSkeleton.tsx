import { Card } from "@portraq/ui";

const SUMMARY_TILE_COUNT = 2;
const PORTFOLIO_PREVIEW_COUNT = 3;
const HISTORY_ROW_COUNT = 3;

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
        <div className="flex flex-col gap-3">
          {Array.from({ length: PORTFOLIO_PREVIEW_COUNT }).map((_, index) => (
            <Card key={index} className="flex flex-col gap-3 p-5">
              <div>
                <div className="mb-1.5 h-[15px] w-32 animate-pulse rounded bg-muted" />
                <div className="h-3 w-24 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-[7px] w-full animate-pulse rounded bg-muted" />
              <div className="flex items-center justify-between">
                <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
                <div className="h-4 w-16 animate-pulse rounded bg-muted" />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="h-[17px] w-36 animate-pulse rounded bg-muted" />
          <div className="h-[13px] w-14 animate-pulse rounded bg-muted" />
        </div>
        <Card className="overflow-hidden p-0">
          {Array.from({ length: HISTORY_ROW_COUNT }).map((_, index) => (
            <div
              key={index}
              className={`flex items-center justify-between gap-3 p-4 ${
                index > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 shrink-0 animate-pulse rounded-[10px] bg-muted" />
                <div className="h-[14px] w-28 animate-pulse rounded bg-muted" />
              </div>
              <div className="text-right">
                <div className="mb-1 h-3 w-16 animate-pulse rounded bg-muted" />
                <div className="h-3 w-10 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </Card>
      </section>
    </div>
  );
};
