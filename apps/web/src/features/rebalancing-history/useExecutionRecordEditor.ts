"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  useDeleteExecutionRecord,
  useUpdateExecutionRecord,
} from "@/features/rebalancing-history/mutations";
import { recomputeActions } from "@/features/rebalancing-history/recomputeActions";
import type {
  EnrichedActionItem,
  RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";

export const useExecutionRecordEditor = (record: RebalancingHistoryRecord) => {
  const [editing, setEditing] = useState(false);
  const [draftActions, setDraftActions] = useState<EnrichedActionItem[]>(record.actions);

  const updateExecutionRecord = useUpdateExecutionRecord();
  const deleteExecutionRecord = useDeleteExecutionRecord();

  const startEdit = () => {
    setDraftActions(record.actions);
    setEditing(true);
  };

  const cancelEdit = () => {
    setDraftActions(record.actions);
    setEditing(false);
  };

  const changeQuantity = (ticker: string, quantity: number) => {
    setDraftActions((prev) =>
      prev.map((action) => (action.ticker === ticker ? { ...action, quantity } : action))
    );
  };

  const changePrice = (ticker: string, pricePerShare: number) => {
    setDraftActions((prev) =>
      prev.map((action) =>
        action.ticker === ticker ? { ...action, pricePerShare } : action
      )
    );
  };

  const save = () => {
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

  const remove = () => {
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

  return {
    editing,
    rowsToShow: editing ? draftActions : record.actions,
    isSaving: updateExecutionRecord.isPending,
    isDeleting: deleteExecutionRecord.isPending,
    startEdit,
    cancelEdit,
    changeQuantity,
    changePrice,
    save,
    remove,
  };
};

export type ExecutionRecordEditor = ReturnType<typeof useExecutionRecordEditor>;
