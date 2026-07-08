"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@portraq/ui";
import type { Asset } from "@portraq/lib/types";
import { StockSearch } from "@/features/stocks/components/StockSearch";
import { useCreateTradeLog } from "@/features/trade-log/hooks";
import { BuyTradeRow, type BuyRowDraft } from "@/features/trade-log/components/BuyTradeRow";
import { MEMO_MIN_LENGTH } from "@/features/trade-log/constants";

type BuyTradeModalProps = {
  defaultDate: string;
  onClose: () => void;
};

export const BuyTradeModal = ({ defaultDate, onClose }: BuyTradeModalProps) => {
  const [date, setDate] = useState(defaultDate);
  const [rows, setRows] = useState<BuyRowDraft[]>([]);
  const [memo, setMemo] = useState("");
  const createTradeLog = useCreateTradeLog();

  // 같은 종목을 서로 다른 가격에 나눠 매수할 수 있으므로 티커 중복 추가를 허용한다.
  // rowId로 각 행을 구분한다.
  const handleSelectAsset = (asset: Asset) => {
    setRows((prev) => [
      ...prev,
      {
        rowId: crypto.randomUUID(),
        ticker: asset.ticker,
        name: asset.name,
        market: asset.market,
        color: asset.color,
        quantity: 1,
        price: 0,
      },
    ]);
  };

  const handleQuantityChange = (rowId: string, quantity: number) => {
    setRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, quantity } : row))
    );
  };

  const handlePriceChange = (rowId: string, price: number) => {
    setRows((prev) => prev.map((row) => (row.rowId === rowId ? { ...row, price } : row)));
  };

  const handleRemove = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const tickerCounts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.ticker] = (acc[row.ticker] ?? 0) + 1;
    return acc;
  }, {});

  const trimmedMemo = memo.trim();
  const canSubmit = rows.length > 0 && trimmedMemo.length >= MEMO_MIN_LENGTH;

  const handleSubmit = () => {
    if (!canSubmit) return;

    createTradeLog.mutate(
      { type: "buy", date, items: rows, memo: trimmedMemo },
      {
        onSuccess: () => {
          toast.success("매수 기록이 저장되었습니다.");
          onClose();
        },
        onError: () => {
          toast.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
          <h3 className="text-[17px] font-extrabold text-foreground">매수 기록</h3>
          <button
            type="button"
            aria-label="닫기"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">날짜</label>
          <Input
            type="date"
            aria-label="날짜"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mb-5"
          />

          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            종목 검색
          </label>
          <div className="mb-5">
            <StockSearch
              onSelect={handleSelectAsset}
              existingTickers={rows.map((row) => row.ticker)}
            />
          </div>

          <label className="mb-2 block text-xs font-bold text-muted-foreground">
            추가된 종목
          </label>
          <div className="mb-5 flex flex-col gap-3">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                검색해서 종목을 추가하세요.
              </div>
            ) : (
              (() => {
                const seenCount: Record<string, number> = {};
                return rows.map((row) => {
                  const occurrence = (seenCount[row.ticker] = (seenCount[row.ticker] ?? 0) + 1);
                  const labelSuffix =
                    tickerCounts[row.ticker] > 1 ? ` ${occurrence}` : "";
                  return (
                    <BuyTradeRow
                      key={row.rowId}
                      row={row}
                      labelSuffix={labelSuffix}
                      onQuantityChange={handleQuantityChange}
                      onPriceChange={handlePriceChange}
                      onRemove={handleRemove}
                    />
                  );
                });
              })()
            )}
          </div>

          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            메모 (20자 이상, 최대 1,000자)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="매수 이유를 남겨보세요 (20자 이상)"
            className="w-full resize-none rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none focus:border-primary focus:bg-background"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {trimmedMemo.length}/1,000자
            {trimmedMemo.length < MEMO_MIN_LENGTH ? " (20자 이상 입력)" : ""}
          </div>

          <Button
            type="button"
            disabled={!canSubmit || createTradeLog.isPending}
            onClick={handleSubmit}
            className="mt-4 w-full"
          >
            매수 기록 저장
          </Button>
        </div>
      </div>
    </div>
  );
};
