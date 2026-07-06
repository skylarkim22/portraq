"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Button, Card, Input } from "@portraq/ui";
import type { Asset } from "@portraq/lib/types";
import { useDebouncedValue, useStockSearch } from "@/features/stocks/hooks";
import { MARKET_TABS } from "@/features/stocks/constants";
import type { MarketFilter } from "@/features/stocks/queries";

interface StockSearchProps {
  onSelect: (asset: Asset) => void;
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results, isFetching } = useStockSearch(debouncedQuery, market);

  const showDropdown = query.trim().length > 0;

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="티커 또는 종목명 검색 (예: AAPL, 삼성전자)"
          className="bg-muted pl-9 pr-9"
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-2 flex gap-1">
        {MARKET_TABS.map((tab) => (
          <Button
            key={tab.value}
            type="button"
            size="sm"
            variant={market === tab.value ? "default" : "outline"}
            onClick={() => setMarket(tab.value)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {showDropdown && (
        <Card className="absolute z-10 mt-2 max-h-80 w-full divide-y divide-border overflow-y-auto p-0">
          {isFetching && (
            <p className="px-3 py-2 text-sm text-muted-foreground">검색 중...</p>
          )}
          {!isFetching && results?.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              검색 결과가 없습니다.
            </p>
          )}
          {!isFetching &&
            results?.map((asset) => (
              <button
                key={asset.ticker}
                type="button"
                onClick={() => onSelect(asset)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-muted"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: asset.color }}
                >
                  {asset.name.slice(0, 1)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-bold">{asset.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {asset.ticker} · {asset.market}
                  </span>
                </span>
              </button>
            ))}
        </Card>
      )}
    </div>
  );
}
