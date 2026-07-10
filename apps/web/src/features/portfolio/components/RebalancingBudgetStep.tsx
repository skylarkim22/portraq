import { Button, Card, Input } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { toKrwPrice } from "@portraq/lib/utils";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { RebalancingPriceRow } from "@/features/portfolio/components/RebalancingPriceRow";

const BUDGET_PRESETS = [100_000, 300_000, 500_000, 1_000_000];

type RebalancingBudgetStepProps = {
  assets: PortfolioAsset[];
  holdings: Record<string, number>;
  prices: Record<string, number>;
  onPriceChange: (ticker: string, price: number) => void;
  exchangeRate: number;
  onExchangeRateChange: (rate: number) => void;
  additionalBudget: number;
  onBudgetChange: (budget: number) => void;
  sellThresholdPercent: number;
  onSellThresholdPercentChange: (threshold: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export const RebalancingBudgetStep = ({
  assets,
  holdings,
  prices,
  onPriceChange,
  exchangeRate,
  onExchangeRateChange,
  additionalBudget,
  onBudgetChange,
  sellThresholdPercent,
  onSellThresholdPercentChange,
  onPrev,
  onNext,
}: RebalancingBudgetStepProps) => {
  const hasUsAsset = assets.some((asset) => asset.market === "US");

  const budgetInput = useNumericTextInput({
    value: additionalBudget,
    onChange: onBudgetChange,
    min: 0,
    thousandsSeparator: true,
  });

  const sellThresholdInput = useNumericTextInput({
    value: sellThresholdPercent,
    onChange: onSellThresholdPercentChange,
    min: 0,
    max: 100,
    decimalPlaces: 1,
  });

  const totalCurrentValue = assets.reduce((sum, asset) => {
    const shares = holdings[asset.ticker] ?? 0;
    const price = toKrwPrice(
      prices[asset.ticker] ?? 0,
      asset.market ?? "KR",
      exchangeRate
    );
    return sum + shares * price;
  }, 0);
  const totalAfterInvestment = totalCurrentValue + additionalBudget;

  return (
    <div className="flex flex-col gap-5 p-6">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        이번 달 투자금과 종목별 현재가를 입력하면 매수·매도 주수를 자동으로
        계산합니다.
      </p>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-foreground">
              매도 임계값
            </span>
            <span className="text-xs text-muted-foreground">
              괴리가 이 값 미만이면 매도 없이 유지
            </span>
          </div>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={sellThresholdInput.text}
              onFocus={sellThresholdInput.handleFocus}
              onChange={(e) => sellThresholdInput.handleChange(e.target.value)}
              onBlur={sellThresholdInput.handleBlur}
              className="h-11 pr-10 text-right text-lg font-extrabold"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              %
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            추가 투자금은 저비중 종목 매수에 우선 사용되며, 초과 비중 종목은
            괴리가 임계값 이상일 때만 매도로 계산됩니다.
          </p>
        </div>

        <div>
          <label
            htmlFor="rebalancing-budget"
            className="mb-2 block text-[13px] font-extrabold text-foreground"
          >
            이번 달 투자금
          </label>
          <div className="relative">
            <Input
              id="rebalancing-budget"
              name="rebalancing-budget"
              type="text"
              inputMode="numeric"
              value={budgetInput.text}
              onFocus={budgetInput.handleFocus}
              onChange={(e) => budgetInput.handleChange(e.target.value)}
              onBlur={budgetInput.handleBlur}
              className="h-11 pr-10 text-right text-lg font-extrabold"
            />
            <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
              원
            </span>
          </div>
          <div className="mt-2 flex gap-2">
            {BUDGET_PRESETS.map((preset) => (
              <Button
                key={preset}
                type="button"
                variant={additionalBudget === preset ? "secondary" : "outline"}
                size="sm"
                onClick={() => onBudgetChange(preset)}
              >
                {preset / 10_000}만
              </Button>
            ))}
          </div>
        </div>
      </div>

      {hasUsAsset && (
        <Card className="border-border p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[13px] font-extrabold text-foreground">
              원/달러 환율
            </span>
            <span className="text-xs text-muted-foreground">
              미국 주식 현재가 원화 환산에 사용
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                min={1}
                step={1}
                value={exchangeRate || ""}
                onChange={(e) =>
                  onExchangeRateChange(Number(e.target.value) || 0)
                }
                className="h-10 pr-14 text-base font-extrabold"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                원/$
              </span>
            </div>
            <span className="whitespace-nowrap text-sm text-muted-foreground">
              $1 = {exchangeRate.toLocaleString("ko-KR")}원
            </span>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            실시간 환율이 아닙니다. 매매 시점의 실제 환율을 직접 확인 후
            입력하세요.
          </p>
        </Card>
      )}

      <div>
        <label className="mb-2.5 block text-[13px] font-extrabold text-foreground">
          종목별 현재가{" "}
          <span className="font-medium text-muted-foreground">
            미국 주식은 달러($) 입력
          </span>
        </label>
        <div className="flex flex-col gap-2">
          {assets.map((asset) => (
            <RebalancingPriceRow
              key={asset.ticker}
              asset={asset}
              price={prices[asset.ticker] ?? 0}
              exchangeRate={exchangeRate}
              onPriceChange={onPriceChange}
            />
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
        <span className="font-semibold text-muted-foreground">
          운용 후 총액
        </span>
        <span className="font-extrabold text-foreground">
          {Math.round(totalAfterInvestment).toLocaleString("ko-KR")}원
        </span>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev}>
          이전
        </Button>
        <Button type="button" className="flex-1" onClick={onNext}>
          계산하기
        </Button>
      </div>
    </div>
  );
};
