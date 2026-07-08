"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button, Card } from "@portraq/ui";
import {
  useDeleteExecutionRecord,
  useUpdateExecutionRecord,
  recomputeActions,
} from "@/features/rebalancing-history/hooks";
import type {
  EnrichedActionItem,
  RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";
import { RebalancingHistoryActionRow } from "@/features/rebalancing-history/components/RebalancingHistoryActionRow";
import { ActionTypeChip } from "@/features/rebalancing-history/components/ActionTypeChip";
import { formatExecutedDate } from "@/features/rebalancing-history/dateFormat";

type RebalancingHistoryRecordCardProps = {
  record: RebalancingHistoryRecord;
};

const countByAction = (actions: EnrichedActionItem[]) => {
  return actions.reduce(
    (acc, action) => {
      acc[action.action] += 1;
      return acc;
    },
    { buy: 0, sell: 0, hold: 0 }
  );
};

export const RebalancingHistoryRecordCard = ({
  record,
}: RebalancingHistoryRecordCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draftActions, setDraftActions] = useState<EnrichedActionItem[]>(record.actions);

  const updateExecutionRecord = useUpdateExecutionRecord();
  const deleteExecutionRecord = useDeleteExecutionRecord();

  const counts = countByAction(record.actions);

  const totalBuyAmount = record.actions
    .filter((action) => action.action === "buy")
    .reduce((sum, action) => sum + action.totalAmount, 0);

  const sellRecovery = -record.actions
    .filter((action) => action.action === "sell")
    .reduce((sum, action) => sum + action.totalAmount, 0);

  const handleStartEdit = () => {
    setDraftActions(record.actions);
    setEditing(true);
  };

  const handleCancelEdit = () => {
    setDraftActions(record.actions);
    setEditing(false);
  };

  const handleQuantityChange = (ticker: string, quantity: number) => {
    setDraftActions((prev) =>
      prev.map((action) => (action.ticker === ticker ? { ...action, quantity } : action))
    );
  };

  const handlePriceChange = (ticker: string, pricePerShare: number) => {
    setDraftActions((prev) =>
      prev.map((action) =>
        action.ticker === ticker ? { ...action, pricePerShare } : action
      )
    );
  };

  const handleSave = () => {
    const actions = recomputeActions(
      draftActions.map((action) => ({
        ticker: action.ticker,
        quantity: action.quantity,
        pricePerShare: action.pricePerShare,
      }))
    );

    updateExecutionRecord.mutate(
      { id: record.id, actions },
      {
        onSuccess: () => {
          toast.success("실행 기록이 수정되었습니다.");
          setEditing(false);
        },
        onError: () => {
          toast.error("수정에 실패했습니다. 잠시 후 다시 시도해주세요.");
        },
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm("이 실행 기록을 삭제하시겠습니까? 되돌릴 수 없습니다.")) return;

    deleteExecutionRecord.mutate(record.id, {
      onSuccess: () => {
        toast.success("실행 기록이 삭제되었습니다.");
      },
      onError: () => {
        toast.error("삭제에 실패했습니다. 잠시 후 다시 시도해주세요.");
      },
    });
  };

  const rowsToShow = editing ? draftActions : record.actions;

  return (
    <Card className="overflow-hidden p-0">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="flex w-full flex-col gap-3 p-4 text-left transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold text-foreground">
                {record.portfolioName}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatExecutedDate(record.executedAt)}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-semibold text-muted-foreground">투자금</div>
              <div className="text-sm font-extrabold text-foreground">
                {Math.round(record.totalBudget).toLocaleString("ko-KR")}원
              </div>
            </div>
            {expanded ? (
              <ChevronDown size={18} className="shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight size={18} className="shrink-0 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {counts.buy > 0 && <ActionTypeChip action="buy" suffix={` ${counts.buy}종`} />}
          {counts.sell > 0 && <ActionTypeChip action="sell" suffix={` ${counts.sell}종`} />}
          {counts.hold > 0 && <ActionTypeChip action="hold" suffix={` ${counts.hold}종`} />}
        </div>
      </button>

      {expanded && (
        <div className="flex flex-col gap-3 border-t border-border bg-muted/30 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            종목별 실행 내역
          </div>

          <div className="flex flex-col gap-2">
            {rowsToShow.map((action) => (
              <RebalancingHistoryActionRow
                key={action.ticker}
                action={action}
                editing={editing}
                onQuantityChange={handleQuantityChange}
                onPriceChange={handlePriceChange}
              />
            ))}
          </div>

          {!editing && (
            <div className="flex items-center justify-between rounded-[10px] bg-[#eef2ff] px-3.5 py-2.5">
              <span className="text-xs font-bold text-primary">총 실행 금액</span>
              <span className="text-sm font-extrabold text-primary">
                {Math.round(totalBuyAmount).toLocaleString("ko-KR")}원
              </span>
            </div>
          )}

          {!editing && sellRecovery > 0 && (
            <div className="rounded-[10px] border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-semibold text-destructive">
              매도 회수금 {Math.round(sellRecovery).toLocaleString("ko-KR")}원을 이번 달
              매수에 합산했습니다.
            </div>
          )}

          <div className="flex justify-end gap-2">
            {editing ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="h-8 gap-1 px-3 text-xs"
                >
                  <X size={13} />
                  취소
                </Button>
                <Button
                  type="button"
                  disabled={updateExecutionRecord.isPending}
                  onClick={handleSave}
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
                  disabled={deleteExecutionRecord.isPending}
                  onClick={handleDelete}
                  className="h-8 gap-1 border-destructive/40 px-3 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 size={13} />
                  삭제
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleStartEdit}
                  className="h-8 gap-1 px-3 text-xs"
                >
                  <Pencil size={13} />
                  수정
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};
