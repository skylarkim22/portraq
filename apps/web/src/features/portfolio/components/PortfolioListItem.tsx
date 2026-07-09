import Link from "next/link";
import { RefreshCcw } from "lucide-react";
import { ActionChip, Button, Card } from "@portraq/ui";
import type { PortfolioSummary } from "@/features/portfolio/queries";
import {
  derivePortfolioCardValue,
  deriveAssetsMarket,
} from "@/features/portfolio/derivePortfolioCardMetrics";
import { MARKET_BADGE_CLASS, MARKET_LABELS } from "@/features/templates/templateStyles";
import { formatExecutedDate } from "@/lib/dateFormat";

type PortfolioListItemProps = {
  portfolio: PortfolioSummary;
};

export const PortfolioListItem = ({ portfolio }: PortfolioListItemProps) => {
  const totalValue = derivePortfolioCardValue(portfolio.assets);
  const hasAssets = portfolio.assets.length > 0;
  const market = deriveAssetsMarket(portfolio.assets.map((asset) => asset.market));
  const execution = portfolio.latestExecution;
  const onlyHolds = execution ? execution.buyCount === 0 && execution.sellCount === 0 : false;

  return (
    <Card className="overflow-hidden p-0">
      <Link
        href={`/portfolio/${portfolio.id}`}
        className="flex flex-col gap-3 p-5 transition-colors hover:bg-muted/50"
      >
        <div className="min-w-0">
          <div className="truncate text-[15px] font-extrabold text-foreground">
            {portfolio.name}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            마지막 수정: {formatExecutedDate(portfolio.updatedAt)}
          </div>
        </div>

        {hasAssets && (
          <>
            <div className="flex h-[7px] gap-0.5 overflow-hidden rounded">
              {portfolio.assets.map((asset) => (
                <div
                  key={asset.ticker}
                  className="h-full rounded"
                  style={{ flex: asset.ratio, backgroundColor: asset.color }}
                />
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MARKET_BADGE_CLASS[market]}`}
              >
                {MARKET_LABELS[market]}
              </span>
              <div className="text-right">
                <div className="text-[10px] font-semibold text-muted-foreground">
                  평가금액
                </div>
                <div className="text-sm font-extrabold text-foreground">
                  {Math.round(totalValue).toLocaleString("ko-KR")}원
                </div>
              </div>
            </div>
          </>
        )}
      </Link>

      {execution && (
        <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/30 px-5 py-3">
          <div className="flex flex-wrap gap-1.5">
            {execution.buyCount > 0 && (
              <ActionChip action="buy">매수 {execution.buyCount}종</ActionChip>
            )}
            {execution.sellCount > 0 && (
              <ActionChip action="sell">매도 {execution.sellCount}종</ActionChip>
            )}
            {execution.holdCount > 0 && (
              <ActionChip action="hold">
                {onlyHolds ? "전 종목 유지" : `유지 ${execution.holdCount}종`}
              </ActionChip>
            )}
          </div>
          <Button asChild type="button" variant="outline" className="h-8 shrink-0 gap-1.5 text-xs">
            <Link href={`/portfolio/${portfolio.id}/guide`}>
              <RefreshCcw size={12} />
              리밸런싱
            </Link>
          </Button>
        </div>
      )}
    </Card>
  );
};
