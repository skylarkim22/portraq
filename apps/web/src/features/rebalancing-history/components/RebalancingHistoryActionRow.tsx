import { ActionChip, AssetColorBadge, Input } from "@portraq/ui";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import type { EnrichedActionItem } from "@/features/rebalancing-history/queries";

type RebalancingHistoryActionRowProps = {
  action: EnrichedActionItem;
  editing: boolean;
  onQuantityChange: (ticker: string, quantity: number) => void;
  onPriceChange: (ticker: string, price: number) => void;
};

export const RebalancingHistoryActionRow = ({
  action,
  editing,
  onQuantityChange,
  onPriceChange,
}: RebalancingHistoryActionRowProps) => {
  const quantityInput = useNumericTextInput({
    value: action.quantity,
    onChange: (value) => onQuantityChange(action.ticker, value),
    allowNegative: true,
    decimalPlaces: 2,
  });

  const priceInput = useNumericTextInput({
    value: action.pricePerShare,
    onChange: (value) => onPriceChange(action.ticker, value),
    decimalPlaces: 2,
    thousandsSeparator: true,
  });

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-background p-3">
      <div className="flex min-w-0 items-center gap-3">
        <AssetColorBadge name={action.name} ticker={action.ticker} color={action.color} />
        <div className="min-w-0">
          <div className="line-clamp-2 text-sm font-extrabold text-foreground">
            {action.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {action.ticker}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="flex shrink-0 items-end gap-2">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">수량</span>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="decimal"
                aria-label={`${action.ticker} 수량`}
                value={quantityInput.text}
                onFocus={quantityInput.handleFocus}
                onChange={(e) => quantityInput.handleChange(e.target.value)}
                onBlur={quantityInput.handleBlur}
                className="h-8 w-16 text-center text-xs font-bold"
              />
              <span className="text-xs text-muted-foreground">주</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">가격</span>
            <Input
              type="text"
              inputMode="decimal"
              aria-label={`${action.ticker} 가격`}
              value={priceInput.text}
              onFocus={priceInput.handleFocus}
              onChange={(e) => priceInput.handleChange(e.target.value)}
              onBlur={priceInput.handleBlur}
              className="h-8 w-28 text-center text-xs font-bold"
            />
          </div>
        </div>
      ) : (
        <div className="flex shrink-0 items-center gap-3">
          <ActionChip action={action.action} />
          <div className="text-right">
            <div className="text-sm font-extrabold text-foreground">
              {action.action === "hold" ? "—" : `${Math.abs(action.quantity)}주`}
            </div>
            <div className="text-xs text-muted-foreground">
              {action.pricePerShare.toLocaleString("ko-KR")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
