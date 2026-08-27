import { Card } from "@portraq/ui";

const ASSET_ROW_COUNT = 4;

export const PortfolioEditorSkeleton = () => {
  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-2 h-6 w-40 animate-pulse rounded bg-muted" />
            <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          </div>
          <div className="h-9 w-24 shrink-0 animate-pulse rounded-md bg-muted" />
        </div>

        {Array.from({ length: ASSET_ROW_COUNT }).map((_, index) => (
          <Card key={index} className="p-3.5">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 h-[15px] w-24 animate-pulse rounded bg-muted" />
                <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              </div>
              <div className="h-9 w-16 shrink-0 animate-pulse rounded-md bg-muted" />
            </div>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <div className="mb-2.5 h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mb-3 h-2 w-full animate-pulse rounded bg-muted" />
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
            <div className="h-3 w-16 animate-pulse rounded bg-muted" />
          </div>
          <div className="flex items-center justify-between border-t border-border pt-3">
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
            <div className="h-4 w-10 animate-pulse rounded bg-muted" />
          </div>
        </Card>
        <div className="h-10 w-full animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
};
