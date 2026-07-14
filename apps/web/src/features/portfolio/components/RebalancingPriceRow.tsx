import { AssetColorBadge, Input } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { toKrwPrice } from "@portraq/lib/utils";
import { useNumericTextInput } from "@/lib/useNumericTextInput";

type RebalancingPriceRowProps = {
  asset: PortfolioAsset;
  price: number;
  exchangeRate: number;
  onPriceChange: (ticker: string, price: number) => void;
};

export const RebalancingPriceRow = ({
  asset,
  price,
  exchangeRate,
  onPriceChange,
}: RebalancingPriceRowProps) => {
  const market = asset.market ?? "KR";
  const krwPrice = toKrwPrice(price, market, exchangeRate);

  const priceInput = useNumericTextInput({
    value: price,
    onChange: (value) => onPriceChange(asset.ticker, value),
    min: 0,
    decimalPlaces: market === "US" ? 2 : 0,
    thousandsSeparator: market !== "US",
  });

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2.5">
        <AssetColorBadge name={asset.name} ticker={asset.ticker} color={asset.color} />
        <div className="min-w-0 flex-1">
          <div className="line-clamp-2 text-sm font-extrabold text-foreground">
            {asset.name ?? asset.ticker}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {asset.ticker} · {market}
          </div>
        </div>
        <div className="relative w-32 shrink-0">
          {market === "US" && (
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              $
            </span>
          )}
          <Input
            type="text"
            inputMode="decimal"
            aria-label={`${asset.ticker} 현재가`}
            value={priceInput.text}
            onFocus={priceInput.handleFocus}
            onChange={(e) => priceInput.handleChange(e.target.value)}
            onBlur={priceInput.handleBlur}
            className={`h-9 text-right text-sm font-bold ${market === "US" ? "pl-5 pr-2" : "pr-7"}`}
          />
          {market === "KR" && (
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
              원
            </span>
          )}
        </div>
      </div>
      {market === "US" && (
        <div className="mt-1.5 text-right text-xs font-semibold text-muted-foreground">
          ={" "}
          <span className="font-extrabold text-primary">
            {Math.round(krwPrice).toLocaleString("ko-KR")}원
          </span>
        </div>
      )}
    </div>
  );
};
