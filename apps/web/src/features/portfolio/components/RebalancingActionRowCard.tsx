import { ActionChip, Card, Input } from "@portraq/ui";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { AssetColorBadge } from "@/components/AssetColorBadge";
import type { RebalancingActionRow } from "@/features/portfolio/deriveActionRows";

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
          ? "border-buy-border bg-buy-tint"
          : row.action === "sell"
            ? "border-sell-border bg-sell-tint"
            : ""
      }`}
    >
      <AssetColorBadge name={row.name} ticker={row.ticker} color={row.color} />
      <div className="min-w-0 flex-1">
        <div className="line-clamp-2 text-sm font-extrabold text-foreground">
          {row.name}{" "}
          <span className="font-medium text-muted-foreground">
            {row.ticker}
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          현재 {row.currentShares.toFixed(1)}주 → 목표{" "}
          {row.targetShares.toFixed(1)}주
        </div>
        <div
          className={
            Math.abs(ratioGap) >= 5
              ? "text-xs font-bold text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          (괴리 {ratioGap > 0 ? "+" : ""}
          {ratioGap.toFixed(1)}%p)
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1">
        <div className="flex items-center gap-1.5">
          <ActionChip action={row.action} />
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
            Math.abs(row.quantity * row.pricePerShare),
          ).toLocaleString("ko-KR")}
          원
        </div>
      </div>
    </Card>
  );
};
