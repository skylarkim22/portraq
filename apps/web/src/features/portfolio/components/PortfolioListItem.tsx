"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Pencil } from "lucide-react";
import { Button, Card } from "@portraq/ui";
import type { PortfolioListItem as PortfolioListItemType } from "@/features/portfolio/queries";
import { usePortfolio } from "@/features/portfolio/hooks";
import { AllocationSummary } from "@/features/portfolio/components/AllocationSummary";

type PortfolioListItemProps = {
  portfolio: PortfolioListItemType;
};

export const PortfolioListItem = ({ portfolio }: PortfolioListItemProps) => {
  const [expanded, setExpanded] = useState(false);
  const { data, isLoading } = usePortfolio(expanded ? portfolio.id : null);

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between p-4 text-left text-sm font-bold text-foreground transition-colors hover:bg-muted/50"
      >
        {portfolio.name}
        {expanded ? (
          <ChevronDown size={16} className="shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="shrink-0 text-muted-foreground" />
        )}
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border p-4">
          {isLoading && (
            <p className="text-xs text-muted-foreground">불러오는 중...</p>
          )}
          {data && <AllocationSummary assets={data.assets} />}
          <div className="flex justify-end">
            <Button
              asChild
              type="button"
              variant="outline"
              className="h-7 gap-1 px-2.5 text-xs"
            >
              <Link href={`/portfolio/${portfolio.id}`}>
                <Pencil size={12} />
                편집하기
              </Link>
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
