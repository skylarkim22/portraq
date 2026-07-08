"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card } from "@portraq/ui";
import type { PortfolioTemplate } from "@portraq/lib/types";
import { resolveColor } from "@portraq/lib/utils";
import {
  MARKET_BADGE_CLASS,
  MARKET_LABELS,
  resolveTemplateAssetColors,
  STRATEGY_BADGE_CLASS,
  STRATEGY_LABELS,
} from "@/features/templates/templateStyles";
import { TemplateDetail } from "@/features/templates/components/TemplateDetail";

type TemplateCardProps = {
  template: PortfolioTemplate;
};

export const TemplateCard = ({ template }: TemplateCardProps) => {
  const [expanded, setExpanded] = useState(false);

  const previewSegments = resolveTemplateAssetColors(template.assets).map((asset) => ({
    key: asset.ticker ?? `slot-${asset.sortOrder}`,
    ratio: asset.ratio,
    color: asset.color,
  }));

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-muted/50 sm:flex-row sm:items-center"
      >
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
          style={{ backgroundColor: resolveColor(undefined, template.id, []) }}
        >
          {template.name.charAt(0)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 text-[17px] font-extrabold text-foreground">
            {template.name}
          </div>
          <div className="mb-2 flex flex-wrap gap-1">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${STRATEGY_BADGE_CLASS[template.strategy]}`}
            >
              {STRATEGY_LABELS[template.strategy]}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${MARKET_BADGE_CLASS[template.market]}`}
            >
              {MARKET_LABELS[template.market]}
            </span>
          </div>
          <div className="flex h-1.5 max-w-[280px] gap-0.5 overflow-hidden rounded">
            {previewSegments.map((segment) => (
              <div
                key={segment.key}
                className="h-full rounded"
                style={{ flex: segment.ratio, backgroundColor: segment.color }}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4 sm:gap-6">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              10Y CAGR
            </div>
            <div className="text-lg font-extrabold text-[var(--portraq-success)]">
              {template.cagr !== null ? `+${template.cagr}%` : "-"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              MDD
            </div>
            <div className="text-base font-bold text-destructive">
              {template.mdd !== null ? `${template.mdd}%` : "-"}
            </div>
          </div>
          {expanded ? (
            <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && <TemplateDetail template={template} />}
    </Card>
  );
};
