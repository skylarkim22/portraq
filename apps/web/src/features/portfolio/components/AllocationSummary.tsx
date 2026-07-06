import { TriangleAlert } from "lucide-react";
import { Card } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";

type AllocationSummaryProps = {
  assets: PortfolioAsset[];
};

export function AllocationSummary({ assets }: AllocationSummaryProps) {
  const total = assets.reduce((sum, asset) => sum + asset.ratio, 0);
  const isOver = total > 100;
  const remaining = Math.max(0, 100 - total);

  return (
    <Card className="p-5">
      <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        전체 배분 현황
      </div>

      <div className="mb-3 flex h-2 gap-0.5 overflow-hidden rounded">
        {assets.map((asset) => (
          <div
            key={asset.ticker}
            className="h-full rounded transition-[flex]"
            style={{ flex: asset.ratio, backgroundColor: asset.color ?? "#355df9" }}
          />
        ))}
        <div
          className="h-full rounded bg-border transition-[flex]"
          style={{ flex: isOver ? 0 : remaining }}
        />
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {assets.map((asset) => (
          <div key={asset.ticker} className="flex items-center gap-1">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: asset.color ?? "#355df9" }}
            />
            <span className="text-xs font-bold text-foreground">
              {asset.ticker}
            </span>
            <span className="text-xs text-muted-foreground">
              {asset.ratio}%
            </span>
          </div>
        ))}
        {!isOver && remaining > 0 && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full border border-dashed border-muted-foreground bg-border" />
            <span className="text-xs font-bold text-muted-foreground">
              미확정
            </span>
            <span className="text-xs text-muted-foreground">{remaining}%</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3 text-sm font-bold">
        <span className="text-muted-foreground">합계</span>
        <span
          className={
            isOver
              ? "text-destructive"
              : total === 100
                ? "text-[#16a34a]"
                : "text-foreground"
          }
        >
          {isOver ? `${total}% (초과 ${total - 100}%)` : `${total}%`}
        </span>
      </div>

      {isOver && (
        <div className="mt-3 flex items-center gap-2 rounded-[10px] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-[13px] font-semibold text-destructive">
          <TriangleAlert size={16} className="shrink-0" />
          비중 합계가 100%를 초과합니다. 저장 전 조정이 필요합니다.
        </div>
      )}
    </Card>
  );
}
