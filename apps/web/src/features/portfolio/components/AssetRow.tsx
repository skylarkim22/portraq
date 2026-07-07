"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Input } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { useNumericTextInput } from "@/features/portfolio/useNumericTextInput";
import { AssetColorBadge } from "@/features/portfolio/components/AssetColorBadge";

type AssetRowProps = {
  asset: PortfolioAsset;
  onRatioChange: (ticker: string, ratio: number) => void;
  onRemove: (ticker: string) => void;
};

export const AssetRow = memo(({ asset, onRatioChange, onRemove }: AssetRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: asset.ticker });

  const ratioInput = useNumericTextInput({
    value: asset.ratio,
    onChange: (ratio) => onRatioChange(asset.ticker, ratio),
    min: 0,
    max: 100,
    decimalPlaces: 2,
  });

  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`p-3.5 ${isDragging ? "opacity-40 border-primary" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="순서 변경"
          className="shrink-0 cursor-grab text-muted-foreground touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={18} />
        </button>

        <AssetColorBadge name={asset.name} ticker={asset.ticker} color={asset.color} />

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-extrabold text-foreground">
            {asset.name ?? asset.ticker}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {asset.ticker} · {asset.market ?? "KR"}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Input
            type="text"
            inputMode="decimal"
            value={ratioInput.text}
            onFocus={ratioInput.handleFocus}
            onChange={(e) => ratioInput.handleChange(e.target.value)}
            onBlur={ratioInput.handleBlur}
            className="h-9 w-16 border-[#c7d5fd] bg-[#f0f4ff] text-center text-[15px] font-extrabold text-primary"
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
    </Card>
  );
});
AssetRow.displayName = "AssetRow";
