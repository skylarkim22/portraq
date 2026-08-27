"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { Button, Card } from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { PortfolioListItem } from "@/features/portfolio/components/PortfolioListItem";

const PORTFOLIO_PREVIEW_LIMIT = 3;

export const PortfolioPreviewSkeleton = () => (
  <div data-testid="portfolio-preview-skeleton" className="flex flex-col gap-3">
    {Array.from({ length: PORTFOLIO_PREVIEW_LIMIT }).map((_, index) => (
      <Card key={index} className="flex flex-col gap-3 p-5">
        <div>
          <div className="mb-1.5 h-[15px] w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-muted" />
        </div>
        <div className="h-[7px] w-full animate-pulse rounded bg-muted" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-12 animate-pulse rounded-full bg-muted" />
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
        </div>
      </Card>
    ))}
  </div>
);

export const PortfolioPreviewSection = () => {
  const { data: portfolios, isLoading } = usePortfolioList();
  const previewPortfolios = (portfolios ?? []).slice(0, PORTFOLIO_PREVIEW_LIMIT);

  return (
    <section className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-[17px] font-extrabold tracking-tight text-foreground">
          내 포트폴리오
        </h2>
        <Link
          href="/portfolio"
          className="flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:opacity-70"
        >
          전체 보기
          <ArrowRight size={14} />
        </Link>
      </div>

      {isLoading && <PortfolioPreviewSkeleton />}

      {!isLoading && portfolios?.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            아직 저장된 포트폴리오가 없습니다.
          </p>
          <Button asChild type="button" variant="outline" className="gap-2">
            <Link href="/templates">
              <Plus size={16} />
              대가 포트폴리오 둘러보기
            </Link>
          </Button>
        </Card>
      )}

      {!isLoading && previewPortfolios.length > 0 && (
        <div className="flex flex-col gap-3">
          {previewPortfolios.map((portfolio) => (
            <PortfolioListItem key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </section>
  );
};
