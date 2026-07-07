"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Input, Slider } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";

type AssetRowProps = {
  asset: PortfolioAsset;
  monthlyBudget: number;
  onRatioChange: (ticker: string, ratio: number) => void;
  onRemove: (ticker: string) => void;
};

export const AssetRow = memo(function AssetRow({
  asset,
  monthlyBudget,
  onRatioChange,
  onRemove,
}: AssetRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: asset.ticker });

  const color = asset.color ?? DEFAULT_ASSET_COLOR;
  const amount = Math.round((asset.ratio / 100) * monthlyBudget);

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`p-3.5 ${isDragging ? "opacity-40 border-primary" : ""}`}
    >
      <div className="mb-3 flex items-center gap-3">
        <button
          type="button"
          aria-label="순서 변경"
          className="shrink-0 cursor-grab text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {asset.ticker.slice(0, 4)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold text-foreground">
            {asset.ticker}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {asset.name ?? asset.ticker} · {asset.market ?? "KR"}
            {monthlyBudget > 0 && ` · ₩${amount.toLocaleString()}`}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="number"
            min={0}
            max={100}
            value={asset.ratio}
            onChange={(e) =>
              onRatioChange(
                asset.ticker,
                Math.max(0, Math.min(100, Number(e.target.value) || 0))
              )
            }
            className="h-9 w-14 border-[#c7d5fd] bg-[#f0f4ff] text-center text-[15px] font-extrabold text-primary"
          />
          <span className="text-sm font-bold text-muted-foreground">%</span>
        </div>

        <button
          type="button"
          aria-label="종목 삭제"
          onClick={() => onRemove(asset.ticker)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <Slider
        value={[asset.ratio]}
        min={0}
        max={100}
        step={1}
        onValueChange={([value]) => onRatioChange(asset.ticker, value)}
      />
    </Card>
  );
});
