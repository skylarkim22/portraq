import { Trash2 } from "lucide-react";
import { Input } from "@portraq/ui";
import type { Market } from "@portraq/lib/types";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { calcSellPnl } from "@/features/trade-log/calcSellPnl";
import type { Holding } from "@/features/trade-log/deriveHoldings";

export type SellRowDraft = {
  ticker: string;
  name: string;
  market: Market;
  color: string;
  avgPrice: number;
  maxQuantity: number;
  quantity: number;
  price: number;
  exchangeRate: number;
  tax: number;
};

export const toSellRowDraft = (holding: Holding, defaultFx: number): SellRowDraft => ({
  ticker: holding.ticker,
  name: holding.name,
  market: holding.market,
  color: holding.color,
  avgPrice: holding.avgPrice,
  maxQuantity: holding.quantity,
  quantity: 1,
  price: holding.market === "US" ? Math.round(holding.avgPrice / defaultFx) : holding.avgPrice,
  exchangeRate: defaultFx,
  tax: 0,
});

type SellTradeRowProps = {
  row: SellRowDraft;
  onChange: (ticker: string, patch: Partial<SellRowDraft>) => void;
  onRemove: (ticker: string) => void;
};

export const SellTradeRow = ({ row, onChange, onRemove }: SellTradeRowProps) => {
  const quantityInput = useNumericTextInput({
    value: row.quantity,
    onChange: (value) => onChange(row.ticker, { quantity: value }),
    max: row.maxQuantity,
    decimalPlaces: 2,
  });

  const priceInput = useNumericTextInput({
    value: row.price,
    onChange: (value) => onChange(row.ticker, { price: value }),
    decimalPlaces: 2,
    thousandsSeparator: true,
  });

  const fxInput = useNumericTextInput({
    value: row.exchangeRate,
    onChange: (value) => onChange(row.ticker, { exchangeRate: value }),
    decimalPlaces: 2,
  });

  const taxInput = useNumericTextInput({
    value: row.tax,
    onChange: (value) => onChange(row.ticker, { tax: value }),
    thousandsSeparator: true,
  });

  const { amount, pnl, pnlAfterTax } = calcSellPnl(row, row.market, row.avgPrice);

  return (
    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3.5">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="text-[13px] font-extrabold text-foreground">
            {row.ticker} <span className="text-[11px] font-semibold text-muted-foreground">{row.name}</span>
          </div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            평균단가 {Math.round(row.avgPrice).toLocaleString("ko-KR")}원 (원화 환산) 기준으로 손익이 계산됩니다
          </div>
        </div>
        <button
          type="button"
          aria-label={`${row.ticker} 매도 취소`}
          onClick={() => onRemove(row.ticker)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className={`mb-2 grid gap-2 ${row.market === "US" ? "grid-cols-3" : "grid-cols-2"}`}>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            수량 (최대 {row.maxQuantity}주)
          </label>
          <Input
            type="text"
            inputMode="decimal"
            aria-label={`${row.ticker} 매도 수량`}
            value={quantityInput.text}
            onFocus={quantityInput.handleFocus}
            onChange={(e) => quantityInput.handleChange(e.target.value)}
            onBlur={quantityInput.handleBlur}
            className="h-9"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
            매도가 ({row.market === "US" ? "$" : "원"})
          </label>
          <Input
            type="text"
            inputMode="decimal"
            aria-label={`${row.ticker} 매도가`}
            value={priceInput.text}
            onFocus={priceInput.handleFocus}
            onChange={(e) => priceInput.handleChange(e.target.value)}
            onBlur={priceInput.handleBlur}
            className="h-9"
          />
        </div>
        {row.market === "US" && (
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
              환율 (원/$)
            </label>
            <Input
              type="text"
              inputMode="decimal"
              aria-label={`${row.ticker} 환율`}
              value={fxInput.text}
              onFocus={fxInput.handleFocus}
              onChange={(e) => fxInput.handleChange(e.target.value)}
              onBlur={fxInput.handleBlur}
              className="h-9"
            />
          </div>
        )}
      </div>

      <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
        세금 (원, 증권사 지급명세서 기준 직접 입력)
      </label>
      <Input
        type="text"
        inputMode="decimal"
        aria-label={`${row.ticker} 세금`}
        value={taxInput.text}
        onFocus={taxInput.handleFocus}
        onChange={(e) => taxInput.handleChange(e.target.value)}
        onBlur={taxInput.handleBlur}
        className="mb-2 h-9"
      />

      <div className="flex flex-col gap-1 border-t border-destructive/30 pt-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">매도금액</span>
          <span className="font-bold text-foreground">
            {Math.round(amount).toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">손익</span>
          <span className={`font-bold ${pnl >= 0 ? "text-[#16a34a]" : "text-destructive"}`}>
            {pnl >= 0 ? "+" : ""}
            {Math.round(pnl).toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">세후 손익</span>
          <span className={`font-extrabold ${pnlAfterTax >= 0 ? "text-[#16a34a]" : "text-destructive"}`}>
            {pnlAfterTax >= 0 ? "+" : ""}
            {Math.round(pnlAfterTax).toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>
    </div>
  );
};
