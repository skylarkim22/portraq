import { Button } from "@portraq/ui";
import type { PortfolioAsset } from "@portraq/lib/types";
import { RebalancingHoldingsRow } from "@/features/portfolio/components/RebalancingHoldingsRow";

type RebalancingHoldingsStepProps = {
  assets: PortfolioAsset[];
  holdings: Record<string, number>;
  onHoldingsChange: (ticker: string, shares: number) => void;
  onNext: () => void;
};

export const RebalancingHoldingsStep = ({
  assets,
  holdings,
  onHoldingsChange,
  onNext,
}: RebalancingHoldingsStepProps) => {
  return (
    <div className="flex flex-col gap-4 p-6">
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        현재 보유 중인 각 종목의 주수를 입력해 주세요. 보유하지 않은 종목은
        0으로 두면 됩니다.
      </p>

      <div className="flex flex-col gap-3">
        {assets.map((asset) => (
          <RebalancingHoldingsRow
            key={asset.ticker}
            asset={asset}
            shares={holdings[asset.ticker] ?? 0}
            onSharesChange={onHoldingsChange}
          />
        ))}
      </div>

      <Button type="button" className="w-full" onClick={onNext}>
        투자금 설정
      </Button>
    </div>
  );
};
