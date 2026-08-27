import { Card } from "@portraq/ui";

const TEMPLATE_CARD_COUNT = 4;

export const TemplateGallerySkeleton = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 h-7 w-36 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          <div className="h-8 w-40 animate-pulse rounded-md bg-muted" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: TEMPLATE_CARD_COUNT }).map((_, index) => (
          <Card key={index} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-2xl bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="mb-2 h-[17px] w-40 animate-pulse rounded bg-muted" />
              <div className="mb-3 h-1.5 w-full animate-pulse rounded bg-muted" />
              <div className="flex gap-1">
                <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
                <div className="h-5 w-14 animate-pulse rounded-full bg-muted" />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4 sm:gap-6">
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              <div className="h-8 w-12 animate-pulse rounded bg-muted" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
