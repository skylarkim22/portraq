"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Input } from "@portraq/ui";
import { formatAssetTicker } from "@portraq/lib/utils";
import { useNumericTextInput } from "@/lib/useNumericTextInput";
import { useSaveDividendInput, useDeleteDividendInput } from "@/features/dividends/mutations";
import type { DividendRow } from "@/features/dividends/queries";

const fmtWon = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

const currentMonthKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (monthKey: string) => monthKey.replace("-", ".");

type DividendInputModalProps = {
  row: DividendRow;
  onClose: () => void;
};

export const DividendInputModal = ({ row, onClose }: DividendInputModalProps) => {
  const thisMonth = currentMonthKey();
  const [month, setMonth] = useState(thisMonth);
  const existing = row.manualHistory.find((entry) => entry.month === month);
  const [amount, setAmount] = useState(existing?.amount ?? 0);
  const amountInput = useNumericTextInput({ value: amount, onChange: setAmount, thousandsSeparator: true });

  const saveDividendInput = useSaveDividendInput();
  const deleteDividendInput = useDeleteDividendInput();

  const handleMonthChange = (value: string) => {
    setMonth(value);
    const found = row.manualHistory.find((entry) => entry.month === value);
    setAmount(found?.amount ?? 0);
  };

  const handleSave = () => {
    if (amount <= 0) {
      toast.error("올바른 금액을 입력해 주세요");
      return;
    }

    saveDividendInput.mutate(
      { portfolioId: row.portfolioId, ticker: row.ticker, isCustom: row.isCustom, month, amount },
      {
        onSuccess: () => {
          toast.success(`${monthLabel(month)} 배당금이 저장되었습니다`);
          onClose();
        },
        onError: () => toast.error("저장에 실패했습니다. 다시 시도해 주세요"),
      }
    );
  };

  const handleDelete = (targetMonth: string) => {
    if (!window.confirm(`${monthLabel(targetMonth)} 배당금 입력을 삭제할까요?`)) return;

    deleteDividendInput.mutate(
      { portfolioId: row.portfolioId, ticker: row.ticker, isCustom: row.isCustom, month: targetMonth },
      {
        onSuccess: () => {
          toast.success(`${monthLabel(targetMonth)} 배당금이 삭제되었습니다`);
          if (targetMonth === month) setAmount(0);
        },
        onError: () => toast.error("삭제에 실패했습니다. 다시 시도해 주세요"),
      }
    );
  };

  const recentHistory = [...row.manualHistory].sort((a, b) => b.month.localeCompare(a.month)).slice(0, 6);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[380px] rounded-3xl bg-card p-[22px]">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-[15px] font-extrabold text-foreground">{row.name} 배당금 입력</h3>
          <button type="button" aria-label="닫기" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>
        <div className="mb-4 text-xs text-muted-foreground">{formatAssetTicker(row.ticker, row.isCustom)}</div>

        <label className="mb-1.5 block text-xs font-bold text-foreground">입력할 월</label>
        <Input
          type="month"
          max={thisMonth}
          value={month}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="mb-3"
        />

        <label className="mb-1.5 block text-xs font-bold text-foreground">배당금 (원)</label>
        <Input
          type="text"
          inputMode="numeric"
          aria-label="배당금"
          value={amountInput.text}
          onFocus={amountInput.handleFocus}
          onChange={(e) => amountInput.handleChange(e.target.value)}
          onBlur={amountInput.handleBlur}
        />
        <div className="mb-4 mt-1.5 text-[11px] text-muted-foreground">
          그 달 실제로 받은 배당금 총액을 입력하세요. 같은 달을 다시 입력하면 값이 갱신됩니다.
        </div>

        <div className="mb-[18px]">
          <div className="mb-1.5 text-[11px] font-bold text-muted-foreground">최근 입력 이력</div>
          {recentHistory.length === 0 ? (
            <div className="text-[11px] text-muted-foreground">아직 입력한 이력이 없습니다.</div>
          ) : (
            <div className="flex flex-col gap-1">
              {recentHistory.map((entry) => (
                <div
                  key={entry.month}
                  className="flex items-center justify-between rounded-md bg-muted px-2 py-1.5 text-xs"
                >
                  <span className="text-muted-foreground">{monthLabel(entry.month)}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{fmtWon(entry.amount)}</span>
                    <button
                      type="button"
                      aria-label={`${monthLabel(entry.month)} 배당금 삭제`}
                      onClick={() => handleDelete(entry.month)}
                      disabled={deleteDividendInput.isPending}
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button type="button" className="flex-1" onClick={handleSave} disabled={saveDividendInput.isPending}>
            저장
          </Button>
        </div>
      </div>
    </div>
  );
};
