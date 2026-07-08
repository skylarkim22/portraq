"use client";

import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionChip } from "@portraq/ui";
import { toKrwPrice } from "@portraq/lib/utils";
import { useDeleteTradeLog } from "@/features/trade-log/hooks";
import { EditTradeModal } from "@/features/trade-log/components/EditTradeModal";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

type TradeLogCardProps = {
  log: EnrichedTradeLog;
};

export const TradeLogCard = ({ log }: TradeLogCardProps) => {
  const isBuy = log.type === "buy";
  const [editOpen, setEditOpen] = useState(false);

  const deleteLog = useDeleteTradeLog();

  const priceKrw = isBuy
    ? log.price
    : toKrwPrice(log.price, log.market, log.exchangeRate ?? 1);
  const total = log.quantity * priceKrw;

  const handleDelete = () => {
    if (!window.confirm("이 거래 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;

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
      <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-3.5">
        <ActionChip action={log.type} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-foreground">{log.name}</span>
              <span className="text-xs text-muted-foreground">{log.ticker}</span>
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
          <div className="text-xs text-muted-foreground">
            {log.quantity}주 × {Math.round(priceKrw).toLocaleString("ko-KR")}원 ={" "}
            <span className="font-bold text-foreground">
              {Math.round(total).toLocaleString("ko-KR")}원
            </span>
            {!isBuy && log.tax
              ? ` · 세금 ${Math.round(log.tax).toLocaleString("ko-KR")}원`
              : ""}
          </div>
          {log.memo && (
            <div className="mt-1 text-xs text-muted-foreground/70">{log.memo}</div>
          )}
        </div>
      </div>

      {editOpen && <EditTradeModal log={log} onClose={() => setEditOpen(false)} />}
    </>
  );
};
