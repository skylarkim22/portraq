import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@portraq/ui";
import { RebalancingHistoryActionRow } from "@/features/rebalancing-history/components/RebalancingHistoryActionRow";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";
import type { ExecutionRecordEditor } from "@/features/rebalancing-history/useExecutionRecordEditor";

type RebalancingHistoryRecordDetailProps = {
  record: RebalancingHistoryRecord;
  editor: ExecutionRecordEditor;
};

export const RebalancingHistoryRecordDetail = ({
  record,
  editor,
}: RebalancingHistoryRecordDetailProps) => {
  const totalBuyAmount = record.actions
    .filter((action) => action.action === "buy")
    .reduce((sum, action) => sum + action.quantity * action.pricePerShare, 0);

  const sellRecovery = -record.actions
    .filter((action) => action.action === "sell")
    .reduce((sum, action) => sum + action.quantity * action.pricePerShare, 0);

  return (
    <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-4">
      <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        종목별 실행 내역
      </div>

      <div className="flex flex-col gap-2">
        {editor.rowsToShow.map((action) => (
          <RebalancingHistoryActionRow
            key={action.ticker}
            action={action}
            editing={editor.editing}
            onQuantityChange={editor.changeQuantity}
            onPriceChange={editor.changePrice}
          />
        ))}
      </div>

      {!editor.editing && (
        <div className="flex items-center justify-between rounded-[10px] bg-[#eef2ff] px-3.5 py-2.5">
          <span className="text-xs font-bold text-primary">총 실행 금액</span>
          <span className="text-sm font-extrabold text-primary">
            {Math.round(totalBuyAmount).toLocaleString("ko-KR")}원
          </span>
        </div>
      )}

      {!editor.editing && sellRecovery > 0 && (
        <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive">
          매도 회수금 {Math.round(sellRecovery).toLocaleString("ko-KR")}원을 이번 달
          매수에 합산했습니다.
        </div>
      )}

      <div className="flex justify-end gap-2">
        {editor.editing ? (
          <>
            <Button
              type="button"
              variant="outline"
              onClick={editor.cancelEdit}
              className="h-8 gap-1 px-3 text-xs"
            >
              <X size={13} />
              취소
            </Button>
            <Button
              type="button"
              disabled={editor.isSaving}
              onClick={editor.save}
              className="h-8 gap-1 px-3 text-xs"
            >
              <Check size={13} />
              저장
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={editor.isDeleting}
              onClick={editor.remove}
              className="h-8 gap-1 border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 size={13} />
              삭제
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={editor.startEdit}
              className="h-8 gap-1 px-3 text-xs"
            >
              <Pencil size={13} />
              수정
            </Button>
          </>
        )}
      </div>
    </div>
  );
};
