"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@portraq/ui";
import {
  useTradeLogs,
  useCreateTradeLog,
  type CreateTradeLogItem,
} from "@/features/trade-log/hooks";
import { deriveHoldings, type Holding } from "@/features/trade-log/deriveHoldings";
import {
  SellTradeRow,
  toSellRowDraft,
  type SellRowDraft,
} from "@/features/trade-log/components/SellTradeRow";
import { MEMO_MIN_LENGTH, DEFAULT_EXCHANGE_RATE } from "@/features/trade-log/constants";

type SellTradeModalProps = {
  defaultDate: string;
  onClose: () => void;
};

export const SellTradeModal = ({ defaultDate, onClose }: SellTradeModalProps) => {
  const [date, setDate] = useState(defaultDate);
  const [rows, setRows] = useState<SellRowDraft[]>([]);
  const [memo, setMemo] = useState("");

  const { data: logs } = useTradeLogs();
  const createTradeLog = useCreateTradeLog();
  const holdings = deriveHoldings(logs ?? []);

  const handleAddHolding = (holding: Holding) => {
    if (rows.some((row) => row.ticker === holding.ticker)) return;
    setRows((prev) => [...prev, toSellRowDraft(holding, DEFAULT_EXCHANGE_RATE)]);
  };

  const handleRowChange = (ticker: string, patch: Partial<SellRowDraft>) => {
    setRows((prev) =>
      prev.map((row) => (row.ticker === ticker ? { ...row, ...patch } : row))
    );
  };

  const handleRemoveRow = (ticker: string) => {
    setRows((prev) => prev.filter((row) => row.ticker !== ticker));
  };

  const trimmedMemo = memo.trim();
  const canSubmit = rows.length > 0 && trimmedMemo.length >= MEMO_MIN_LENGTH;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const items: CreateTradeLogItem[] = rows.map((row) => ({
      ticker: row.ticker,
      quantity: row.quantity,
      price: row.price,
      tax: row.tax,
      exchangeRate: row.market === "US" ? row.exchangeRate : undefined,
      name: row.name,
      market: row.market,
    }));

    createTradeLog.mutate(
      { type: "sell", date, items, memo: trimmedMemo },
      {
        onSuccess: () => {
          toast.success("매도 기록이 저장되었습니다.");
          onClose();
        },
        onError: () => {
          toast.error("저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  const addedTickers = new Set(rows.map((row) => row.ticker));
  const availableHoldings = holdings.filter((holding) => !addedTickers.has(holding.ticker));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col overflow-hidden rounded-3xl bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
          <h3 className="text-[17px] font-extrabold text-foreground">매도 기록</h3>
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

          <label className="mb-2 block text-xs font-bold text-muted-foreground">
            보유 종목 (매수 기록 기반)
          </label>
          <div className="mb-5 flex flex-col gap-2">
            {availableHoldings.length === 0 && rows.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                매도 가능한 보유 종목이 없습니다.
              </div>
            )}
            {availableHoldings.map((holding) => (
              <div
                key={holding.ticker}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/40 px-3.5 py-2.5"
              >
                <div>
                  <div className="text-[13px] font-extrabold text-foreground">
                    {holding.name}{" "}
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {holding.ticker}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    평균단가 {Math.round(holding.avgPrice).toLocaleString("ko-KR")}원 · 보유{" "}
                    {holding.quantity}주
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1 px-3 text-xs"
                  onClick={() => handleAddHolding(holding)}
                >
                  <Plus size={14} />
                  추가
                </Button>
              </div>
            ))}
          </div>

          <label className="mb-2 block text-xs font-bold text-muted-foreground">매도 종목</label>
          <div className="mb-5 flex flex-col gap-3">
            {rows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                위 보유 종목에서 [추가]를 눌러 매도할 종목을 선택하세요.
              </div>
            ) : (
              rows.map((row) => (
                <SellTradeRow
                  key={row.ticker}
                  row={row}
                  onChange={handleRowChange}
                  onRemove={handleRemoveRow}
                />
              ))
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
            placeholder="매도 이유를 남겨보세요 (20자 이상)"
            className="w-full resize-none rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none focus:border-primary focus:bg-background"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {trimmedMemo.length}/1,000자
            {trimmedMemo.length < MEMO_MIN_LENGTH ? " (20자 이상 입력)" : ""}
          </div>

          <Button
            type="button"
            variant="destructive"
            disabled={!canSubmit || createTradeLog.isPending}
            onClick={handleSubmit}
            className="mt-4 w-full"
          >
            매도 기록 저장
          </Button>
        </div>
      </div>
    </div>
  );
};
