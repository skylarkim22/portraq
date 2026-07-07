"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@portraq/ui";
import type { Asset, PortfolioAsset } from "@portraq/lib/types";
import { resolveColor } from "@portraq/lib/utils";
import { useUser } from "@/features/auth/hooks";
import {
  useCreatePortfolio,
  useDeletePortfolio,
  usePortfolio,
  useSavePortfolio,
} from "@/features/portfolio/hooks";
import { AssetList } from "@/features/portfolio/components/AssetList";
import { AllocationSummary } from "@/features/portfolio/components/AllocationSummary";
import { PortfolioHeader } from "@/features/portfolio/components/PortfolioHeader";
import { AddAssetModal } from "@/features/portfolio/components/AddAssetModal";

const DEFAULT_PORTFOLIO_NAME = "내 포트폴리오";

type PortfolioEditorProps = {
  portfolioId: string | null;
};

export const PortfolioEditor = ({ portfolioId }: PortfolioEditorProps) => {
  const isNew = portfolioId === null;
  const router = useRouter();
  const { data: user } = useUser();
  const { data: portfolio, isLoading, isError } = usePortfolio(portfolioId);
  const createPortfolio = useCreatePortfolio();
  const savePortfolio = useSavePortfolio();
  const deletePortfolio = useDeletePortfolio();

  const [hydrated, setHydrated] = useState(isNew);
  const [name, setName] = useState("");
  const [memo, setMemo] = useState("");
  const [assets, setAssets] = useState<PortfolioAsset[]>([]);
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

  const handleAddAsset = (picked: Asset) => {
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
  };

  const handleSaveSuccess = () => {
    if (showSlot) {
      toast.warning(
        "미확정 슬롯이 남아 있습니다. 저장은 완료됐지만 리밸런싱 결과가 정확하지 않을 수 있습니다."
      );
    } else {
      toast.success("포트폴리오가 저장되었습니다.");
    }
  };

  const handleSave = async () => {
    if (isNew) {
      if (!user) return;
      try {
        const newId = await createPortfolio.mutateAsync({
          userId: user.id,
          name: name || DEFAULT_PORTFOLIO_NAME,
        });
        await savePortfolio.mutateAsync({
          portfolioId: newId,
          name: name || DEFAULT_PORTFOLIO_NAME,
          memo: memo || null,
          assets,
        });
        handleSaveSuccess();
        router.replace(`/portfolio/${newId}`);
      } catch {
        toast.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      return;
    }

    savePortfolio.mutate(
      { portfolioId, name, memo: memo || null, assets },
      {
        onSuccess: handleSaveSuccess,
        onError: () => {
          toast.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!portfolioId) return;
    if (!window.confirm("정말 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;

    deletePortfolio.mutate(portfolioId, {
      onSuccess: () => {
        toast.success("포트폴리오가 삭제되었습니다.");
        router.replace("/portfolio");
      },
      onError: () => {
        toast.error("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      },
    });
  };

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
          onNameChange={setName}
          onMemoChange={setMemo}
          onAddAssetClick={() => setSearchOpen(true)}
        />

        {showSlot && (
          <div className="flex flex-col gap-0.5 rounded-[10px] border border-[#fed7aa] bg-[#fff7ed] px-3.5 py-2.5 text-[13px] font-semibold text-[#c2410c]">
            <span className="font-extrabold">미확정 슬롯이 남아 있습니다.</span>
            <span>
              종목을 채워야 &apos;이달의 매수 가이드&apos; 버튼이 나타납니다.
              저장은 가능하지만 리밸런싱은 슬롯을 모두 채운 후 진행할 수
              있습니다.
            </span>
          </div>
        )}

        <AssetList
          assets={assets}
          onRatioChange={handleRatioChange}
          onRemove={handleRemove}
          onReorder={setAssets}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => setSearchOpen(true)}
          className="h-auto w-full justify-center gap-2 rounded-lg border-dashed border-input bg-transparent px-0 py-3.5 text-sm font-semibold text-muted-foreground hover:border-primary hover:bg-transparent hover:text-primary"
        >
          <Plus size={18} />
          종목 추가하기
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <AllocationSummary assets={assets} />
        <Button
          type="button"
          className="w-full"
          disabled={savePortfolio.isPending || createPortfolio.isPending}
          onClick={handleSave}
        >
          저장
        </Button>

        {portfolioId && assets.length > 0 && !showSlot && (
          <Button asChild type="button" variant="outline" className="w-full gap-2">
            <Link href={`/portfolio/${portfolioId}/guide`}>
              <RefreshCcw size={15} />
              이달의 매수 가이드
            </Link>
          </Button>
        )}

        {portfolioId && (
          <Button
            type="button"
            variant="ghost"
            disabled={deletePortfolio.isPending}
            onClick={handleDelete}
            className="w-full gap-2 border border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 size={15} />
            포트폴리오 삭제
          </Button>
        )}
      </div>

      {searchOpen && (
        <AddAssetModal
          onClose={() => setSearchOpen(false)}
          onSelect={handleAddAsset}
          existingTickers={assets.map((asset) => asset.ticker)}
        />
      )}
    </div>
  );
};
