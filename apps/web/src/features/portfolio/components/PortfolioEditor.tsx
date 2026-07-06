"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Upload, X } from "lucide-react";
import { Button, Input } from "@portraq/ui";
import type { Asset, PortfolioAsset } from "@portraq/lib/types";
import { resolveColor } from "@portraq/lib/utils";
import {
  usePortfolio,
  useUpdatePortfolioAssets,
} from "@/features/portfolio/hooks";
import { AssetRow } from "@/features/portfolio/components/AssetRow";
import { AllocationSummary } from "@/features/portfolio/components/AllocationSummary";
import { StockSearch } from "@/features/stocks/components/StockSearch";

type PortfolioEditorProps = {
  portfolioId: string;
};

export function PortfolioEditor({ portfolioId }: PortfolioEditorProps) {
  const { data: portfolio, isLoading } = usePortfolio(portfolioId);
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

  const sensors = useSensors(useSensor(PointerSensor));

  const total = assets.reduce((sum, asset) => sum + asset.ratio, 0);
  const remaining = Math.max(0, 100 - total);
  const showSlot = remaining > 0 && total <= 100;

  function handleRatioChange(ticker: string, ratio: number) {
    setAssets((prev) =>
      prev.map((asset) => (asset.ticker === ticker ? { ...asset, ratio } : asset))
    );
  }

  function handleRemove(ticker: string) {
    setAssets((prev) =>
      prev
        .filter((asset) => asset.ticker !== ticker)
        .map((asset, index) => ({ ...asset, order: index }))
    );
  }

  function handleAddAsset(picked: Asset) {
    setSearchOpen(false);
    if (assets.some((asset) => asset.ticker === picked.ticker)) return;

    const usedColors = assets.map((asset) => asset.color ?? "#355df9");
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setAssets((prev) => {
      const oldIndex = prev.findIndex((a) => a.ticker === active.id);
      const newIndex = prev.findIndex((a) => a.ticker === over.id);
      return arrayMove(prev, oldIndex, newIndex).map((asset, index) => ({
        ...asset,
        order: index,
      }));
    });
  }

  function handleSave() {
    updateAssets.mutate(assets);
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
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="포트폴리오 이름을 입력하세요"
              className="mb-1 w-full border-b border-transparent bg-transparent text-xl font-extrabold text-foreground outline-none transition-colors hover:border-border focus:border-primary"
            />
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="메모 (선택)"
              rows={1}
              className="w-full resize-none border-none bg-transparent text-sm text-muted-foreground outline-none"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5"
            onClick={() => setSearchOpen(true)}
          >
            <Plus size={15} />
            종목 추가
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            월 투자금
          </span>
          <Input
            type="number"
            min={0}
            value={monthlyBudget || ""}
            onChange={(e) => setMonthlyBudget(Number(e.target.value) || 0)}
            placeholder="0"
            className="h-9 w-40"
          />
          <span className="text-sm text-muted-foreground">원</span>
        </div>

        {showSlot && (
          <div className="flex items-center gap-2 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] font-semibold text-[#c2410c]">
            <span className="font-extrabold">미확정 슬롯이 남아 있습니다.</span>
            종목을 채워야 리밸런싱 가이드 Step 3 결과가 표시됩니다. 저장은 가능하지만 결과가 정확하지 않을 수 있습니다.
          </div>
        )}

        <DndContext
          id="portfolio-asset-list"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={assets.map((a) => a.ticker)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3">
              {assets.map((asset) => (
                <AssetRow
                  key={asset.ticker}
                  asset={asset}
                  monthlyBudget={monthlyBudget}
                  onRatioChange={handleRatioChange}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {showSlot && (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 rounded-xl border border-dashed border-[#c7d5fd] bg-[#fafbff] p-3.5 text-left transition-colors hover:bg-[#f0f4ff]"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#c7d5fd] bg-[#eef2ff]">
              <Plus size={18} className="text-primary" />
            </span>
            <span className="flex-1">
              <span className="block text-sm font-extrabold text-primary">
                종목을 직접 추가하세요
              </span>
              <span className="block text-xs text-muted-foreground">
                미확정 슬롯 · 비중 {remaining}% 남음
              </span>
            </span>
          </button>
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
          disabled={updateAssets.isPending}
          onClick={handleSave}
        >
          <Upload size={16} />
          저장
        </Button>
      </div>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-[480px] rounded-3xl bg-card p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[17px] font-extrabold text-foreground">
                종목 추가
              </h3>
              <button
                type="button"
                aria-label="닫기"
                onClick={() => setSearchOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={22} />
              </button>
            </div>
            <StockSearch onSelect={handleAddAsset} />
          </div>
        </div>
      )}
    </div>
  );
}
