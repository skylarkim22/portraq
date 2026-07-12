"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "@portraq/ui";
import {
  calcRebalancingActions,
  toKrwPrice,
  type RebalancingAction,
} from "@portraq/lib/utils";
import { ErrorState } from "@/components/ErrorState";
import { useLatestSnapshot, usePortfolio } from "@/features/portfolio/hooks";
import { useRecordRebalancingExecution } from "@/features/portfolio/mutations";
import { buildRebalancingExecutionPayload } from "@/features/portfolio/buildRebalancingExecutionPayload";
import { deriveActionRows } from "@/features/portfolio/deriveActionRows";
import { RebalancingGuideHeader } from "@/features/portfolio/components/RebalancingGuideHeader";
import { RebalancingStepTabs } from "@/features/portfolio/components/RebalancingStepTabs";
import { RebalancingHoldingsStep } from "@/features/portfolio/components/RebalancingHoldingsStep";
import { RebalancingBudgetStep } from "@/features/portfolio/components/RebalancingBudgetStep";
import { RebalancingActionStep } from "@/features/portfolio/components/RebalancingActionStep";

const DEFAULT_EXCHANGE_RATE = 1500;
const DEFAULT_SELL_THRESHOLD_PERCENT = 5;

type RebalancingGuideProps = {
  portfolioId: string;
};

export const RebalancingGuide = ({ portfolioId }: RebalancingGuideProps) => {
  const router = useRouter();
  const { data: portfolio, isLoading, isError } = usePortfolio(portfolioId);
  const { data: latestSnapshot } = useLatestSnapshot(portfolioId);
  const recordExecution = useRecordRebalancingExecution(portfolioId);

  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [holdings, setHoldings] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [exchangeRate, setExchangeRate] = useState(DEFAULT_EXCHANGE_RATE);
  const [additionalBudget, setAdditionalBudget] = useState(0);
  const [sellThresholdPercent, setSellThresholdPercent] = useState(
    DEFAULT_SELL_THRESHOLD_PERCENT
  );
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const assets = useMemo(
    () => (portfolio?.assets ?? []).filter((asset) => !asset.isSlot),
    [portfolio]
  );
  const hasUndeterminedSlot = (portfolio?.assets ?? []).some(
    (asset) => asset.isSlot
  );

  useEffect(() => {
    if (portfolio && !hydrated) {
      const snapshotPriceByTicker = new Map(
        (latestSnapshot ?? []).map((s) => [s.ticker, s.pricePerShare])
      );
      const initialHoldings: Record<string, number> = {};
      const initialPrices: Record<string, number> = {};
      for (const asset of portfolio.assets) {
        if (asset.isSlot) continue;
        initialHoldings[asset.ticker] = asset.shares;
        const snapshotPrice = snapshotPriceByTicker.get(asset.ticker);
        // 스냅샷 가격은 원화 환산 기준으로 저장돼 있어 KR 종목만 그대로
        // 프리필한다. US 종목은 당시 환율을 알 수 없어 재입력이 필요하다.
        initialPrices[asset.ticker] =
          asset.market !== "US" ? (snapshotPrice ?? 0) : 0;
      }
      setHoldings(initialHoldings);
      setPrices(initialPrices);
      setHydrated(true);
    }
  }, [portfolio, latestSnapshot, hydrated]);

  const actions: RebalancingAction[] = useMemo(() => {
    if (step !== 3 || hasUndeterminedSlot) return [];
    const holdingInputs = assets.map((asset) => ({
      ticker: asset.ticker,
      shares: holdings[asset.ticker] ?? 0,
      pricePerShare: toKrwPrice(
        prices[asset.ticker] ?? 0,
        asset.market ?? "KR",
        exchangeRate
      ),
    }));
    return calcRebalancingActions({
      assets,
      holdings: holdingInputs,
      additionalBudget,
      sellThresholdPercent,
    });
  }, [
    step,
    hasUndeterminedSlot,
    assets,
    holdings,
    prices,
    exchangeRate,
    additionalBudget,
    sellThresholdPercent,
  ]);

  const rows = useMemo(
    () => deriveActionRows(actions, overrides, assets),
    [actions, overrides, assets]
  );

  const handleGoStep3 = () => {
    setOverrides({});
    setStep(3);
  };

  const handleSave = () => {
    const { actions: actionItems, updatedAssets, snapshotAssets } =
      buildRebalancingExecutionPayload(rows, assets);

    recordExecution.mutate(
      {
        totalBudget: additionalBudget,
        actions: actionItems,
        updatedAssets,
        snapshotAssets,
      },
      {
        onSuccess: () => {
          toast.success("리밸런싱이 저장되었습니다.");
          router.push(`/portfolio/${portfolioId}`);
        },
        onError: () => {
          toast.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  if (isError) {
    return (
      <ErrorState
        message={
          <>
            포트폴리오를 불러오지 못했습니다.
            <br />
            잠시후 다시 시도해 주세요.
          </>
        }
      />
    );
  }

  if (isLoading || !hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        먼저 포트폴리오에 종목을 추가해주세요.
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <RebalancingGuideHeader portfolioName={portfolio?.name} />

      <Card className="overflow-hidden">
        <RebalancingStepTabs step={step} onStepChange={setStep} />

        {step === 1 && (
          <RebalancingHoldingsStep
            assets={assets}
            holdings={holdings}
            onHoldingsChange={(ticker, shares) =>
              setHoldings((prev) => ({ ...prev, [ticker]: shares }))
            }
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <RebalancingBudgetStep
            assets={assets}
            holdings={holdings}
            prices={prices}
            onPriceChange={(ticker, price) =>
              setPrices((prev) => ({ ...prev, [ticker]: price }))
            }
            exchangeRate={exchangeRate}
            onExchangeRateChange={setExchangeRate}
            additionalBudget={additionalBudget}
            onBudgetChange={setAdditionalBudget}
            sellThresholdPercent={sellThresholdPercent}
            onSellThresholdPercentChange={setSellThresholdPercent}
            onPrev={() => setStep(1)}
            onNext={handleGoStep3}
          />
        )}

        {step === 3 && hasUndeterminedSlot && (
          <div className="p-6">
            <div className="rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] font-semibold text-[#c2410c]">
              미확정 슬롯이 남아 있어 결과를 표시할 수 없습니다. 포트폴리오
              편집 화면에서 슬롯을 모두 채운 후 다시 시도해주세요.
            </div>
          </div>
        )}

        {step === 3 && !hasUndeterminedSlot && (
          <RebalancingActionStep
            rows={rows}
            onQuantityChange={(ticker, quantity) =>
              setOverrides((prev) => ({ ...prev, [ticker]: quantity }))
            }
            onPrev={() => setStep(2)}
            onSave={handleSave}
            isSaving={recordExecution.isPending}
          />
        )}
      </Card>
    </div>
  );
};
