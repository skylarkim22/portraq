"use client";

import Link from "next/link";
import { Plus, ArrowRight } from "lucide-react";
import { Button, Card } from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";
import { PortfolioListItem } from "@/features/portfolio/components/PortfolioListItem";
import { useRebalancingHistory } from "@/features/rebalancing-history/hooks";
import { useUser } from "@/features/auth/hooks";
import { deriveHomeSummary } from "@/features/home/deriveHomeSummary";
import { SummaryTiles } from "@/features/home/components/SummaryTiles";
import { RecentHistorySection } from "@/features/home/components/RecentHistorySection";

const RECENT_HISTORY_LIMIT = 3;
const PORTFOLIO_PREVIEW_LIMIT = 4;

export const HomePage = () => {
  const { data: user } = useUser();
  const { data: portfolios, isLoading } = usePortfolioList();
  const { data: historyPages } = useRebalancingHistory({
    portfolioId: null,
    dateFrom: null,
    dateTo: null,
  });

  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.email?.split("@")[0] ??
    "사용자";

  const summary = deriveHomeSummary(portfolios ?? []);
  const recentRecords = (historyPages?.pages[0] ?? []).slice(
    0,
    RECENT_HISTORY_LIMIT,
  );
  const previewPortfolios = (portfolios ?? []).slice(
    0,
    PORTFOLIO_PREVIEW_LIMIT,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="mb-6">
        <h1 className="mb-4 text-xl font-extrabold tracking-tight text-foreground">
          안녕하세요, {name}님
        </h1>
        <SummaryTiles
          totalValue={summary.totalValue}
          portfolioCount={summary.portfolioCount}
        />
      </section>

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

        {isLoading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}

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

      <RecentHistorySection records={recentRecords} />
    </div>
  );
};
