"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Upload } from "lucide-react";
import { Button } from "@portraq/ui";
import type { Asset, PortfolioAsset } from "@portraq/lib/types";
import { resolveColor } from "@portraq/lib/utils";
import {
  usePortfolio,
  useUpdatePortfolio,
  useUpdatePortfolioAssets,
} from "@/features/portfolio/hooks";
import { AssetList } from "@/features/portfolio/components/AssetList";
import { AllocationSummary } from "@/features/portfolio/components/AllocationSummary";
import { PortfolioHeader } from "@/features/portfolio/components/PortfolioHeader";
import { AddAssetModal } from "@/features/portfolio/components/AddAssetModal";
import { UndeterminedSlotCard } from "@/features/portfolio/components/UndeterminedSlotCard";

type PortfolioEditorProps = {
  portfolioId: string;
};

export function PortfolioEditor({ portfolioId }: PortfolioEditorProps) {
  const { data: portfolio, isLoading, isError } = usePortfolio(portfolioId);
  const updatePortfolio = useUpdatePortfolio(portfolioId);
  const updateAssets = useUpdatePortfolioAssets(portfolioId);

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (portfolio && !hydrated) {
      setName(portfolio.name);
      setMemo(portfolio.memo ?? "");
      setAssets(portfolio.assets);
      setHydrated(true);
    }
  }, [portfolio, hydrated]);

  const total = assets.reduce((sum, asset) => sum + asset.ratio, 0);
  const remaining = Math.max(0, 100 - total);
  const showSlot = remaining > 0 && total <= 100;

  const handleRatioChange = useCallback((ticker: string, ratio: number) => {
    setAssets((prev) =>
      prev.map((asset) => (asset.ticker === ticker ? { ...asset, ratio } : asset))
    );
  }, []);

  const handleRemove = useCallback((ticker: string) => {
    setAssets((prev) =>
      prev
        .filter((asset) => asset.ticker !== ticker)
        .map((asset, index) => ({ ...asset, order: index }))
    );
  }, []);

  function handleAddAsset(picked: Asset) {
    setSearchOpen(false);
    if (assets.some((asset) => asset.ticker === picked.ticker)) return;

    const usedColors = assets.map((asset) => asset.color ?? "");
    setAssets((prev) => [
      ...prev,
      {
        ticker: picked.ticker,
        name: picked.name,
        market: picked.market,
        color: resolveColor(undefined, picked.ticker, usedColors),
        ratio: 0,
        shares: 0,
        currentPrice: 0,
        order: prev.length,
      },
    ]);
  }

  function handleSave() {
    updatePortfolio.mutate({ name, memo: memo || null });
    updateAssets.mutate(assets);
  }

  if (isError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-destructive">
        포트폴리오를 불러오지 못했습니다. 접근 권한이 없거나 존재하지 않는 포트폴리오입니다.
      </div>
    );
  }

  if (isLoading || !hydrated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-3 lg:px-8">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <PortfolioHeader
          name={name}
          memo={memo}
          monthlyBudget={monthlyBudget}
          onNameChange={setName}
          onMemoChange={setMemo}
          onMonthlyBudgetChange={setMonthlyBudget}
          onAddAssetClick={() => setSearchOpen(true)}
        />

        {showSlot && (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] font-semibold text-[#c2410c]">
            <span className="font-extrabold">미확정 슬롯이 남아 있습니다.</span>
            종목을 채워야 리밸런싱 가이드 Step 3 결과가 표시됩니다. 저장은 가능하지만 결과가 정확하지 않을 수 있습니다.
          </div>
        )}

        <AssetList
          assets={assets}
          monthlyBudget={monthlyBudget}
          onRatioChange={handleRatioChange}
          onRemove={handleRemove}
          onReorder={setAssets}
        />

        {showSlot && (
          <UndeterminedSlotCard
            remaining={remaining}
            onClick={() => setSearchOpen(true)}
          />
        )}

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-input py-3.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus size={18} />
          종목 추가하기
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <AllocationSummary assets={assets} />
        <Button
          type="button"
          className="w-full gap-2"
          disabled={updateAssets.isPending || updatePortfolio.isPending}
          onClick={handleSave}
        >
          <Upload size={16} />
          저장
        </Button>
      </div>

      {searchOpen && (
        <AddAssetModal
          onClose={() => setSearchOpen(false)}
          onSelect={handleAddAsset}
        />
      )}
    </div>
  );
}
