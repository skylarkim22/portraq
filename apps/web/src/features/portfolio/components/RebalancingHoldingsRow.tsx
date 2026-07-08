import { Card, Input } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { AssetColorBadge } from "@/components/AssetColorBadge";

type RebalancingHoldingsRowProps = {
  asset: PortfolioAsset;
  shares: number;
  onSharesChange: (ticker: string, shares: number) => void;
};

export const RebalancingHoldingsRow = ({
  asset,
  shares,
  onSharesChange,
}: RebalancingHoldingsRowProps) => {
  const sharesInput = useNumericTextInput({
    value: shares,
    onChange: (value) => onSharesChange(asset.ticker, value),
    min: 0,
  });

  return (
    <Card className="flex items-center gap-3 border-none bg-muted/40 p-3.5">
      <AssetColorBadge name={asset.name} ticker={asset.ticker} color={asset.color} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-extrabold text-foreground">
          {asset.name ?? asset.ticker}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {asset.ticker} · 목표 {asset.ratio}%
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          type="text"
          inputMode="numeric"
          aria-label={`${asset.ticker} 보유 주수`}
          value={sharesInput.text}
          onFocus={sharesInput.handleFocus}
          onChange={(e) => sharesInput.handleChange(e.target.value)}
          onBlur={sharesInput.handleBlur}
          className="h-9 w-20 text-center"
        />
        <span className="text-sm font-semibold text-muted-foreground">
          주
        </span>
      </div>
    </Card>
  );
};
