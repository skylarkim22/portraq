import { queryOptions } from "@tanstack/react-query";
import type { PortfolioTemplate, TemplateAsset } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
};

const DISPLAY_ORDER = [
  "ray-dalio-all-weather",
  "john-bogle",
  "warren-buffett",
  "peter-lynch",
  "kang-hwan-guk",
];

export const templateListQueryOptions = () =>
  queryOptions({
    queryKey: templateKeys.lists(),
    queryFn: async (): Promise<PortfolioTemplate[]> => {
      const { data, error } = await createClient()
        .from("portfolio_templates")
        .select(
          "id, name, strategy, market, cagr, mdd, description, source_date, assets"
        );

      if (error) throw error;

      const templates: PortfolioTemplate[] = data.map((row) => ({
        id: row.id,
        name: row.name,
        strategy: row.strategy,
        market: row.market,
        cagr: row.cagr,
        mdd: row.mdd,
        description: row.description,
        sourceDate: row.source_date,
        assets: (row.assets as Array<Record<string, unknown>>)
          .map((asset) => ({
            ticker: asset.ticker as string | null,
            name: asset.name as string,
            market: asset.market,
            ratio: asset.ratio as number,
            sortOrder: asset.sort_order as number,
          }))
          .sort((a, b) => a.sortOrder - b.sortOrder) as TemplateAsset[],
      }));

      return templates.sort(
        (a, b) => DISPLAY_ORDER.indexOf(a.id) - DISPLAY_ORDER.indexOf(b.id)
      );
    },
    staleTime: 1000 * 60 * 10,
  });
