"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionChip } from "@portraq/ui";
import { toKrwPrice } from "@portraq/lib/utils";
import { calcSellPnl } from "@/features/trade-log/calcSellPnl";
import { useDeleteTradeLog } from "@/features/trade-log/hooks";
import { EditTradeModal } from "@/features/trade-log/components/EditTradeModal";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

type TradeLogCardProps = {
  log: EnrichedTradeLog;
  avgPrice?: number;
};

export const TradeLogCard = ({ log, avgPrice }: TradeLogCardProps) => {
  const isBuy = log.type === "buy";
  const [editOpen, setEditOpen] = useState(false);

  const deleteLog = useDeleteTradeLog();

  const priceKrw = isBuy
    ? log.price
    : toKrwPrice(log.price, log.market, log.exchangeRate ?? 1);
  const total = log.quantity * priceKrw;

  // avgPrice가 없으면(예: 전량 매도해 보유 수량이 0이 된 종목) 0으로
  // 대체하지 않는다 — 실제로는 알 수 없는 평균단가를 0으로 취급하면
  // 손익이 실제보다 부풀려져 보이므로, 이 경우 순손익 박스 자체를 숨긴다.
  const pnlAfterTax =
    isBuy || avgPrice === undefined
      ? null
      : calcSellPnl(log, log.market, avgPrice).pnlAfterTax;
  const priceDiff =
    isBuy || avgPrice === undefined ? null : priceKrw - avgPrice;

  const handleDelete = () => {
    if (!window.confirm("이 거래 기록을 삭제하시겠습니까? 되돌릴 수 없습니다."))
      return;

    deleteLog.mutate(log.id, {
      onSuccess: () => {
        toast.success("삭제되었습니다.");
      },
      onError: () => {
        toast.error("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      },
    });
  };

  return (
    <>
      <div className="rounded-2xl border border-border bg-background p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <ActionChip action={log.type} className="shrink-0" />
            <span className="truncate text-sm font-extrabold text-foreground">
              {log.name}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {log.ticker}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              aria-label={`${log.ticker} 수정`}
              onClick={() => setEditOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Pencil size={14} />
            </button>
            <button
              type="button"
              aria-label={`${log.ticker} 삭제`}
              onClick={handleDelete}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <div className="text-[10px] font-semibold text-muted-foreground">
              수량
            </div>
            <div className="text-sm font-extrabold text-foreground">
              {log.quantity}주
            </div>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <div className="text-[10px] font-semibold text-muted-foreground">
              가격
            </div>
            <div className="text-sm font-extrabold text-foreground">
              {Math.round(priceKrw).toLocaleString("ko-KR")}원
            </div>
          </div>
          <div className="rounded-lg bg-muted/60 px-3 py-2">
            <div className="text-[10px] font-semibold text-muted-foreground">
              합계
            </div>
            <div className="text-sm font-extrabold text-foreground">
              {Math.round(total).toLocaleString("ko-KR")}원
            </div>
          </div>
        </div>

        {priceDiff !== null && avgPrice !== undefined && (
          <div className="mb-2 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <div className="text-[10px] font-semibold text-muted-foreground">
                평균매수가
              </div>
              <div className="text-sm font-extrabold text-foreground">
                {Math.round(avgPrice).toLocaleString("ko-KR")}원
              </div>
            </div>
            <div className="rounded-lg bg-muted/60 px-3 py-2">
              <div className="text-[10px] font-semibold text-muted-foreground">
                차액(주당)
              </div>
              <div
                className={`text-sm font-extrabold ${
                  priceDiff >= 0
                    ? "text-[var(--portraq-success)]"
                    : "text-destructive"
                }`}
              >
                {priceDiff >= 0 ? "+" : ""}
                {Math.round(priceDiff).toLocaleString("ko-KR")}원
              </div>
            </div>
          </div>
        )}

        {pnlAfterTax !== null && (
          <div
            className={`mb-2 flex items-center justify-between rounded-lg px-3 py-2 ${
              pnlAfterTax >= 0
                ? "bg-[var(--portraq-success)]/10"
                : "bg-destructive/10"
            }`}
          >
            <span className="text-xs text-muted-foreground">
              {log.tax
                ? `세금 ${Math.round(log.tax).toLocaleString("ko-KR")}원 · `
                : ""}
              세후 순손익
            </span>
            <span
              className={`text-sm font-extrabold ${
                pnlAfterTax >= 0
                  ? "text-[var(--portraq-success)]"
                  : "text-destructive"
              }`}
            >
              {pnlAfterTax >= 0 ? "+" : ""}
              {Math.round(pnlAfterTax).toLocaleString("ko-KR")}원
            </span>
          </div>
        )}

        {log.memo && (
          <div className="rounded-lg border border-border bg-white/60 px-3 py-2">
            <div className="text-xs text-muted-foreground">{log.memo}</div>
          </div>
        )}
      </div>

      {editOpen && (
        <EditTradeModal log={log} onClose={() => setEditOpen(false)} />
      )}
    </>
  );
};
