import type { ActionType } from "@portraq/lib/types";

export const ACTION_CHIP_STYLE: Record<ActionType, string> = {
  buy: "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]",
  sell: "bg-[#fef2f2] text-[#dc2626] border-[#fecaca]",
  hold: "bg-muted text-muted-foreground border-border",
};

export const ACTION_CHIP_LABEL: Record<ActionType, string> = {
  buy: "매수",
  sell: "매도",
  hold: "유지",
};

type ActionTypeChipProps = {
  action: ActionType;
  suffix?: string;
};

export const ActionTypeChip = ({ action, suffix }: ActionTypeChipProps) => (
  <span
    className={`rounded-full border px-2.5 py-1 text-xs font-bold ${ACTION_CHIP_STYLE[action]}`}
  >
    {ACTION_CHIP_LABEL[action]}
    {suffix}
  </span>
);
