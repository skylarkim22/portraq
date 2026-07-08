"use client";

import { useState } from "react";
import { Card } from "@portraq/ui";
import { useExecutionRecordEditor } from "@/features/rebalancing-history/useExecutionRecordEditor";
import type { RebalancingHistoryRecord } from "@/features/rebalancing-history/queries";
import { RebalancingHistoryRecordHeader } from "@/features/rebalancing-history/components/RebalancingHistoryRecordHeader";
import { RebalancingHistoryRecordDetail } from "@/features/rebalancing-history/components/RebalancingHistoryRecordDetail";

type RebalancingHistoryRecordCardProps = {
  record: RebalancingHistoryRecord;
};

export const RebalancingHistoryRecordCard = ({
  record,
}: RebalancingHistoryRecordCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const editor = useExecutionRecordEditor(record);

  return (
    <Card className="overflow-hidden p-0">
      <RebalancingHistoryRecordHeader
        record={record}
        expanded={expanded}
        onToggle={() => setExpanded((prev) => !prev)}
      />

      {expanded && <RebalancingHistoryRecordDetail record={record} editor={editor} />}
    </Card>
  );
};
