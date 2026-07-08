import type { ActionItem, ActionType } from "@portraq/lib/types";

const deriveActionType = (quantity: number): ActionType => {
  if (quantity > 0) return "buy";
  if (quantity < 0) return "sell";
  return "hold";
};

export type UpdateActionInput = {
  ticker: string;
  quantity: number;
  pricePerShare: number;
};

export const recomputeActions = (edits: UpdateActionInput[]): ActionItem[] =>
  edits.map((edit) => ({
    ticker: edit.ticker,
    quantity: edit.quantity,
    pricePerShare: edit.pricePerShare,
    action: deriveActionType(edit.quantity),
    totalAmount: edit.quantity * edit.pricePerShare,
  }));
