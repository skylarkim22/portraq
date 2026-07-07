"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Card, Input } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";

const RATIO_TEXT_PATTERN = /^\d{0,3}(\.\d{0,2})?$/;

type AssetRowProps = {
  asset: PortfolioAsset;
  onRatioChange: (ticker: string, ratio: number) => void;
  onRemove: (ticker: string) => void;
};

export const AssetRow = memo(({ asset, onRatioChange, onRemove }: AssetRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: asset.ticker });

  const color = asset.color ?? DEFAULT_ASSET_COLOR;

  const [ratioText, setRatioText] = useState(() => String(asset.ratio));
  const isRatioFocused = useRef(false);

  useEffect(() => {
    if (!isRatioFocused.current) {
      setRatioText(String(asset.ratio));
    }
  }, [asset.ratio]);

  const handleRatioTextChange = (value: string) => {
    if (value !== "" && !RATIO_TEXT_PATTERN.test(value)) return;
    if (value !== "" && !value.endsWith(".") && Number(value) > 100) return;
    setRatioText(value);

    const parsed = Number(value);
    if (value === "" || value.endsWith(".") || Number.isNaN(parsed)) return;
    onRatioChange(asset.ticker, Math.max(0, parsed));
  };

  const handleRatioBlur = () => {
    isRatioFocused.current = false;
    setRatioText(String(asset.ratio));
  };

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

        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          {(asset.name ?? asset.ticker).split(" ")[0].slice(0, 1)}
        </span>

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
            value={ratioText}
            onFocus={() => {
              isRatioFocused.current = true;
            }}
            onChange={(e) => handleRatioTextChange(e.target.value)}
            onBlur={handleRatioBlur}
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
