import Link from "next/link";
import { Button } from "@portraq/ui";
import { ArrowRight } from "lucide-react";
import { InfoPopover } from "@portraq/ui";
import type { PortfolioTemplate } from "@portraq/lib/types";
import {
  CAGR_EXPLANATION,
  MDD_EXPLANATION,
  resolveTemplateAssetColors,
} from "@/features/templates/templateStyles";

const MDD_SCALE = 50;

type TemplateDetailProps = {
  template: PortfolioTemplate;
};

export const TemplateDetail = ({ template }: TemplateDetailProps) => {
  const mddWidth = template.mdd
    ? Math.min(100, (Math.abs(template.mdd) / MDD_SCALE) * 100)
    : 0;

  const holdings = resolveTemplateAssetColors(template.assets);

  return (
    <div className="flex flex-col gap-5 border-t border-border bg-muted/30 p-5">
      {template.description && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">
          {template.description}
        </p>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            10Y CAGR
            <InfoPopover label="10Y CAGR 설명" align="left">
              {CAGR_EXPLANATION}
            </InfoPopover>
          </div>
          <div className="text-xl font-extrabold text-[var(--portraq-success)]">
            {template.cagr !== null ? `+${template.cagr}%` : "-"}
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            MDD
            <InfoPopover label="MDD 설명">{MDD_EXPLANATION}</InfoPopover>
          </div>
          <div className="text-xl font-extrabold text-destructive">
            {template.mdd !== null ? `${template.mdd}%` : "-"}
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded bg-border">
            <div
              className="h-full rounded bg-destructive"
              style={{ width: `${mddWidth}%` }}
            />
          </div>
        </div>
      </div>

      <div>
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          종목 구성
        </div>
        <div className="mb-3 flex h-2 gap-0.5 overflow-hidden rounded">
          {holdings.map((asset) => (
            <div
              key={asset.ticker ?? `slot-${asset.sortOrder}`}
              className="h-full rounded transition-[flex]"
              style={{ flex: asset.ratio, backgroundColor: asset.color }}
            />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {holdings.map((asset) => (
            <div
              key={asset.ticker ?? `slot-${asset.sortOrder}`}
              className="flex items-center gap-1"
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: asset.color }}
              />
              <span className="text-xs font-bold text-foreground">
                {asset.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {asset.ratio}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          asChild
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Link href={`/portfolio/new?template=${template.id}`}>
            이 포트폴리오 사용하기
            <ArrowRight size={14} />
          </Link>
        </Button>
      </div>
    </div>
  );
};
