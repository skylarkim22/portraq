import { queryOptions } from "@tanstack/react-query";
import type { Asset, Market } from "@portraq/lib/types";
import { createClient } from "@/lib/supabase/client";

export type MarketFilter = Market | "ALL";

// ilike는 대소문자 구분 없이 매칭한다. 티커는 앞에서부터(접두어)만, 종목명은
// 단어 중간에 포함된 검색어까지 매칭한다. PostgREST or() 구문(쉼표·괄호)이나
// LIKE 와일드카드로 오인될 문자는 제거해 필터 구문이 깨지거나 의도치 않은
// 와일드카드로 동작하지 않게 한다. PostgREST는 URL에 쓸 수 없는 %의 대체
// 표기로 *도 %와 동일하게 취급하므로 함께 제거한다.
const toIlikeSearchTerm = (input: string) => {
  return input.trim().replace(/[%_,()*]/g, "");
};

export const stockQueries = {
  all: () => ["stocks"] as const,

  search: (query: string, market: MarketFilter) =>
    queryOptions({
      queryKey: [...stockQueries.all(), "search", query, market] as const,
      queryFn: async (): Promise<Asset[]> => {
        const term = toIlikeSearchTerm(query);
        if (!term) return [];

        let request = createClient()
          .from("assets")
          .select("ticker, name, market, color, is_active")
          .eq("is_active", true)
          .or(`ticker.ilike.${term}%,name.ilike.%${term}%`)
          .order("ticker")
          .limit(20);

        if (market !== "ALL") {
          request = request.eq("market", market);
        }

        const { data, error } = await request;
        if (error) throw error;

        return data.map((row) => ({
          ticker: row.ticker,
          name: row.name,
          market: row.market as Market,
          color: row.color,
          isActive: row.is_active,
        }));
      },
      enabled: query.trim().length > 0,
    }),
};
