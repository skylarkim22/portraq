import { Card, Input } from "@portraq/ui";
import type { ActionType } from "@portraq/lib/types";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { AssetColorBadge } from "@/components/AssetColorBadge";
import type { RebalancingActionRow } from "@/features/portfolio/deriveActionRows";

const CHIP_STYLE: Record<ActionType, string> = {
  buy: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]",
  sell: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
  hold: "bg-muted text-muted-foreground border-border",
};

const CHIP_LABEL: Record<ActionType, string> = {
  buy: "매수",
  sell: "매도",
  hold: "유지",
};

type RebalancingActionRowCardProps = {
  row: RebalancingActionRow;
  onQuantityChange: (ticker: string, quantity: number) => void;
};

export const RebalancingActionRowCard = ({
  row,
  onQuantityChange,
}: RebalancingActionRowCardProps) => {
  const ratioGap = row.currentRatio - row.targetRatio;

  const quantityInput = useNumericTextInput({
    value: row.quantity,
    onChange: (value) => onQuantityChange(row.ticker, value),
    min: -Infinity,
    allowNegative: true,
  });

  return (
    <Card
      className={`flex items-center gap-3 p-3.5 ${
        row.action === "buy"
          ? "border-[#bbf7d0] bg-[#f8fff9]"
          : row.action === "sell"
            ? "border-[#fecaca] bg-[#fff8f8]"
            : ""
      }`}
    >
      <AssetColorBadge name={row.name} ticker={row.ticker} color={row.color} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-extrabold text-foreground">
          {row.name}{" "}
          <span className="font-medium text-muted-foreground">
            {row.ticker}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          현재 {row.currentShares.toFixed(1)}주 → 목표{" "}
          {row.targetShares.toFixed(1)}주
          <span
            className={
              Math.abs(ratioGap) >= 5
                ? "ml-1.5 font-bold text-destructive"
                : "ml-1.5"
            }
          >
            (괴리 {ratioGap > 0 ? "+" : ""}
            {ratioGap.toFixed(1)}%p)
          </span>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded-full border px-2.5 py-1 text-xs font-bold ${CHIP_STYLE[row.action]}`}
          >
            {CHIP_LABEL[row.action]}
          </span>
          <Input
            type="text"
            inputMode="numeric"
            aria-label={`${row.ticker} 수량`}
            value={quantityInput.text}
            onFocus={quantityInput.handleFocus}
            onChange={(e) => quantityInput.handleChange(e.target.value)}
            onBlur={quantityInput.handleBlur}
            className="h-8 w-16 text-center text-xs font-bold"
          />
        </div>
        <div className="text-xs font-semibold text-muted-foreground">
          ≈{" "}
          {Math.round(
            Math.abs(row.quantity * row.pricePerShare)
          ).toLocaleString("ko-KR")}
          원
        </div>
      </div>
    </Card>
  );
};
