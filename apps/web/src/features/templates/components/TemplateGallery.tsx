"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@portraq/ui";
import type { TemplateStrategy } from "@portraq/lib/types";
import { useTemplateList } from "@/features/templates/hooks";
import { TemplateFilterTabs } from "@/features/templates/components/TemplateFilterTabs";
import { TemplateCard } from "@/features/templates/components/TemplateCard";

export const TemplateGallery = () => {
  const { data: templates, isLoading, isError } = useTemplateList();
  const [filter, setFilter] = useState<"all" | TemplateStrategy>("all");

  const filtered = templates?.filter(
    (template) => filter === "all" || template.strategy === filter
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mb-1.5 text-2xl font-extrabold tracking-tight text-foreground">
            대가 포트폴리오
          </h1>
          <p className="text-sm text-muted-foreground">
            카드를 클릭해 전략을 확인하고 포트폴리오 편집으로 바로 이동할 수 있습니다.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <Button asChild type="button" variant="outline" size="sm" className="gap-2">
            <Link href="/portfolio/new">
              <Plus size={14} />
              직접 구성
            </Link>
          </Button>
          <TemplateFilterTabs value={filter} onChange={setFilter} />
        </div>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          템플릿을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="flex flex-col gap-3">
          {filtered?.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
};
