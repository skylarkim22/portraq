import { Trash2 } from "lucide-react";
import { Input } from "@portraq/ui";
import type { Market } from "@portraq/lib/types";
import { useNumericTextInput } from "@/lib/useNumericTextInput";

const MARKET_BADGE_CLASS: Record<"KR" | "US", string> = {
  US: "bg-[#eff6ff] text-[#1d4ed8]",
  KR: "bg-[#fff1f2] text-[#be123c]",
};

export type BuyRowDraft = {
  rowId: string;
  ticker: string;
  name: string;
  market: Market;
  color: string;
  quantity: number;
  price: number;
};

type BuyTradeRowProps = {
  row: BuyRowDraft;
  labelSuffix?: string;
  onQuantityChange: (rowId: string, quantity: number) => void;
  onPriceChange: (rowId: string, price: number) => void;
  onRemove: (rowId: string) => void;
};

export const BuyTradeRow = ({
  row,
  labelSuffix = "",
  onQuantityChange,
  onPriceChange,
  onRemove,
}: BuyTradeRowProps) => {
  const quantityInput = useNumericTextInput({
    value: row.quantity,
    onChange: (value) => onQuantityChange(row.rowId, value),
    decimalPlaces: 2,
  });

  const priceInput = useNumericTextInput({
    value: row.price,
    onChange: (value) => onPriceChange(row.rowId, value),
    decimalPlaces: 2,
    thousandsSeparator: true,
  });

  const total = row.quantity * row.price;

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-extrabold text-foreground">{row.name}</span>
          <span className="text-xs text-muted-foreground">{row.ticker}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${MARKET_BADGE_CLASS[row.market]}`}
          >
            {row.market}
          </span>
        </div>
        <button
          type="button"
          aria-label={`${row.ticker}${labelSuffix} 삭제`}
          onClick={() => onRemove(row.rowId)}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            수량
          </label>
          <Input
            type="text"
            inputMode="decimal"
            aria-label={`${row.ticker}${labelSuffix} 수량`}
            value={quantityInput.text}
            onFocus={quantityInput.handleFocus}
            onChange={(e) => quantityInput.handleChange(e.target.value)}
            onBlur={quantityInput.handleBlur}
            className="h-9"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            가격 (원화 환산)
          </label>
          <Input
            type="text"
            inputMode="decimal"
            aria-label={`${row.ticker}${labelSuffix} 가격`}
            value={priceInput.text}
            onFocus={priceInput.handleFocus}
            onChange={(e) => priceInput.handleChange(e.target.value)}
            onBlur={priceInput.handleBlur}
            className="h-9"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2">
        <span className="text-xs text-muted-foreground">합계</span>
        <span className="text-sm font-extrabold text-primary">
          {Math.round(total).toLocaleString("ko-KR")}원
        </span>
      </div>
    </div>
  );
};
