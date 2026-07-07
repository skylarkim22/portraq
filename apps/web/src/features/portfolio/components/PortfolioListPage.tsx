"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button, Card } from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { PortfolioListItem } from "@/features/portfolio/components/PortfolioListItem";

export const PortfolioListPage = () => {
  const { data: portfolios, isLoading } = usePortfolioList();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
          내 포트폴리오
        </h1>
        <Button asChild type="button" className="gap-2">
          <Link href="/portfolio/new">
            <Plus size={16} />
            새로 만들기
          </Link>
        </Button>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}

      {!isLoading && portfolios?.length === 0 && (
        <Card className="flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm text-muted-foreground">
            아직 저장된 포트폴리오가 없습니다.
          </p>
          <Button asChild type="button" variant="outline" className="gap-2">
            <Link href="/portfolio/new">
              <Plus size={16} />
              포트폴리오 만들기
            </Link>
          </Button>
        </Card>
      )}

      {!isLoading && portfolios && portfolios.length > 0 && (
        <div className="flex flex-col gap-3">
          {portfolios.map((portfolio) => (
            <PortfolioListItem key={portfolio.id} portfolio={portfolio} />
          ))}
        </div>
      )}
    </div>
  );
};
