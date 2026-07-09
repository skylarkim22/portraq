"use client";

import { Layers, Wallet } from "lucide-react";
import { Card } from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { deriveHomeSummary } from "@/features/home/deriveHomeSummary";

export const SummaryTiles = () => {
  const { data: portfolios } = usePortfolioList();
  const summary = deriveHomeSummary(portfolios ?? []);

  return (
    <div className="grid grid-cols-2 gap-3">
      <Card className="p-4">
        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#eef2ff]">
          <Wallet size={14} className="text-primary" />
        </div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          총 자산
        </div>
        <div className="text-xl font-extrabold tracking-tight text-foreground">
          {Math.round(summary.totalValue).toLocaleString("ko-KR")}원
        </div>
      </Card>
      <Card className="p-4">
        <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-[#fdf4ff]">
          <Layers size={14} className="text-[#7e22ce]" />
        </div>
        <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
          포트폴리오
        </div>
        <div className="text-xl font-extrabold tracking-tight text-foreground">
          {summary.portfolioCount}개
        </div>
      </Card>
    </div>
  );
};
