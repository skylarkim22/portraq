"use client";

import { useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button, Card, Input } from "@portraq/ui";
import type { Asset, Market } from "@portraq/lib/types";
import { generateCustomTicker, getTickerColor } from "@portraq/lib/utils";
import { useDebouncedValue, useStockSearch } from "@/features/stocks/hooks";
import { MARKET_TABS } from "@/features/stocks/constants";
import type { MarketFilter } from "@/features/stocks/queries";

const MANUAL_MARKET_OPTIONS: { label: string; value: Market }[] = [
  { label: "한국", value: "KR" },
  { label: "미국", value: "US" },
];

type StockSearchProps = {
  onSelect: (asset: Asset) => void;
  existingTickers?: string[];
  clearQueryOnSelect?: boolean;
};

export function StockSearch({
  onSelect,
  existingTickers = [],
  clearQueryOnSelect = true,
}: StockSearchProps) {
  const [query, setQuery] = useState("");
  const [market, setMarket] = useState<MarketFilter>("ALL");
  const [manualEntry, setManualEntry] = useState(false);
  const [manualMarket, setManualMarket] = useState<Market>("KR");
  const debouncedQuery = useDebouncedValue(query, 300);

  const { data: results, isFetching } = useStockSearch(
    manualEntry ? "" : debouncedQuery,
    market
  );

  const showDropdown = query.trim().length > 0;
  const noResults = !isFetching && (results?.length ?? 0) === 0;
  const nextCustomTicker = generateCustomTicker(existingTickers);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setManualEntry(false);
  };

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    if (clearQueryOnSelect) setQuery("");
  };

  const handleManualAdd = () => {
    const name = query.trim();
    if (!name) return;

    const ticker = nextCustomTicker;

    onSelect({
      ticker,
      name,
      market: manualMarket,
      color: getTickerColor(ticker),
      isActive: true,
    });
    setQuery("");
    setManualEntry(false);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="티커 또는 종목명 검색 (예: AAPL, 삼성전자)"
          className="bg-muted pl-9 pr-9"
        />
        {query.length > 0 && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => handleQueryChange("")}
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

          {noResults && !manualEntry && (
            <div className="flex flex-col gap-2 p-3">
              <p className="text-sm text-muted-foreground">
                검색 결과가 없습니다.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-1.5"
                onClick={() => setManualEntry(true)}
              >
                <Plus size={14} />
                &apos;{query}&apos; 직접 추가하기
              </Button>
            </div>
          )}

          {noResults && manualEntry && (
            <div className="flex flex-col gap-2 p-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                  종목명
                </label>
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="flex items-center justify-between rounded-md bg-muted px-2.5 py-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  자동 부여 티커
                </span>
                <span className="text-xs font-bold text-foreground">
                  {nextCustomTicker}
                </span>
              </div>
              <div className="flex gap-1">
                {MANUAL_MARKET_OPTIONS.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    size="sm"
                    aria-label={`직접 추가 시장 ${option.label}`}
                    variant={manualMarket === option.value ? "default" : "outline"}
                    onClick={() => setManualMarket(option.value)}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-1 w-full"
                disabled={!query.trim()}
                onClick={handleManualAdd}
              >
                추가
              </Button>
            </div>
          )}

          {!isFetching &&
            !noResults &&
            results?.map((asset) => (
              <button
                key={asset.ticker}
                type="button"
                onClick={() => handleSelect(asset)}
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
