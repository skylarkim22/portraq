import { ChevronDown, ChevronRight } from "lucide-react";
import { ActionTypeChip } from "@/features/rebalancing-history/components/ActionTypeChip";
import { formatExecutedDate } from "@/lib/dateFormat";
import type {
  EnrichedActionItem,
  RebalancingHistoryRecord,
} from "@/features/rebalancing-history/queries";

const countByAction = (actions: EnrichedActionItem[]) => {
  return actions.reduce(
    (acc, action) => {
      acc[action.action] += 1;
      return acc;
    },
    { buy: 0, sell: 0, hold: 0 }
  );
};

type RebalancingHistoryRecordHeaderProps = {
  record: RebalancingHistoryRecord;
  expanded: boolean;
  onToggle: () => void;
};

export const RebalancingHistoryRecordHeader = ({
  record,
  expanded,
  onToggle,
}: RebalancingHistoryRecordHeaderProps) => {
  const counts = countByAction(record.actions);

  return (
    <button
      type="button"
      onClick={onToggle}
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
  );
};
