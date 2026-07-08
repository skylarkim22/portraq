"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@portraq/ui";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { useUpdateTradeLog } from "@/features/trade-log/hooks";
import { MEMO_MIN_LENGTH } from "@/features/trade-log/constants";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

type EditTradeModalProps = {
  log: EnrichedTradeLog;
  onClose: () => void;
};

export const EditTradeModal = ({ log, onClose }: EditTradeModalProps) => {
  const isBuy = log.type === "buy";
  const isUsSell = !isBuy && log.market === "US";

  const [date, setDate] = useState(log.date);
  const [memo, setMemo] = useState(log.memo ?? "");
  const [quantity, setQuantity] = useState(log.quantity);
  const [price, setPrice] = useState(log.price);
  const [tax, setTax] = useState(log.tax ?? 0);
  const [exchangeRate, setExchangeRate] = useState(log.exchangeRate ?? 1);

  const updateLog = useUpdateTradeLog();

  const quantityInput = useNumericTextInput({
    value: quantity,
    onChange: setQuantity,
    decimalPlaces: 2,
  });
  const priceInput = useNumericTextInput({
    value: price,
    onChange: setPrice,
    decimalPlaces: 2,
    thousandsSeparator: true,
  });
  const taxInput = useNumericTextInput({
    value: tax,
    onChange: setTax,
    thousandsSeparator: true,
  });
  const fxInput = useNumericTextInput({
    value: exchangeRate,
    onChange: setExchangeRate,
    decimalPlaces: 2,
  });

  const trimmedMemo = memo.trim();
  const canSave = trimmedMemo.length >= MEMO_MIN_LENGTH;

  const handleSubmit = () => {
    if (!canSave) return;

    updateLog.mutate(
      {
        id: log.id,
        date,
        quantity,
        price,
        tax: isBuy ? undefined : tax,
        exchangeRate: isUsSell ? exchangeRate : undefined,
        memo: trimmedMemo,
      },
      {
        onSuccess: () => {
          toast.success("수정되었습니다.");
          onClose();
        },
        onError: () => {
          toast.error("수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
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
      <div className="flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-3xl bg-card">
        <div className="flex shrink-0 items-center justify-between border-b border-border p-6">
          <h3 className="text-[17px] font-extrabold text-foreground">
            {isBuy ? "매수" : "매도"} 기록 수정
          </h3>
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

          <div className="mb-4 flex items-center gap-2 rounded-lg bg-muted px-3.5 py-2.5">
            <span className="text-sm font-extrabold text-foreground">{log.name}</span>
            <span className="text-xs text-muted-foreground">{log.ticker}</span>
          </div>

          <div className={`mb-4 grid gap-2 ${isUsSell ? "grid-cols-3" : "grid-cols-2"}`}>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                수량
              </label>
              <Input
                type="text"
                inputMode="decimal"
                aria-label="수량"
                value={quantityInput.text}
                onFocus={quantityInput.handleFocus}
                onChange={(e) => quantityInput.handleChange(e.target.value)}
                onBlur={quantityInput.handleBlur}
                className="h-9"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                {isBuy ? "가격 (원화 환산)" : `매도가 (${log.market === "US" ? "$" : "원"})`}
              </label>
              <Input
                type="text"
                inputMode="decimal"
                aria-label="가격"
                value={priceInput.text}
                onFocus={priceInput.handleFocus}
                onChange={(e) => priceInput.handleChange(e.target.value)}
                onBlur={priceInput.handleBlur}
                className="h-9"
              />
            </div>
            {isUsSell && (
              <div>
                <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                  환율 (원/$)
                </label>
                <Input
                  type="text"
                  inputMode="decimal"
                  aria-label="환율"
                  value={fxInput.text}
                  onFocus={fxInput.handleFocus}
                  onChange={(e) => fxInput.handleChange(e.target.value)}
                  onBlur={fxInput.handleBlur}
                  className="h-9"
                />
              </div>
            )}
          </div>

          {!isBuy && (
            <div className="mb-4">
              <label className="mb-1 block text-[11px] font-semibold text-muted-foreground">
                세금 (원)
              </label>
              <Input
                type="text"
                inputMode="decimal"
                aria-label="세금"
                value={taxInput.text}
                onFocus={taxInput.handleFocus}
                onChange={(e) => taxInput.handleChange(e.target.value)}
                onBlur={taxInput.handleBlur}
                className="h-9"
              />
            </div>
          )}

          <label className="mb-1.5 block text-xs font-bold text-muted-foreground">
            메모 (20자 이상, 최대 1,000자)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-lg border border-input bg-muted px-3 py-2 text-sm outline-none focus:border-primary focus:bg-background"
          />
          <div className="mt-1 text-right text-[11px] text-muted-foreground">
            {trimmedMemo.length}/1,000자
            {trimmedMemo.length < MEMO_MIN_LENGTH ? " (20자 이상 입력)" : ""}
          </div>

          <Button
            type="button"
            disabled={!canSave || updateLog.isPending}
            onClick={handleSubmit}
            className="mt-4 w-full"
          >
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};
