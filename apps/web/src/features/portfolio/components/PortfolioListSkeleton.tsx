import { Card } from "@portraq/ui";

const PORTFOLIO_ITEM_COUNT = 4;

export const PortfolioListSkeleton = () => {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: PORTFOLIO_ITEM_COUNT }).map((_, index) => (
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
    </div>
  );
};
