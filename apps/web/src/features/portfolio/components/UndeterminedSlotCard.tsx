import { Plus } from "lucide-react";
import { Button } from "@portraq/ui";

type UndeterminedSlotCardProps = {
  remaining: number;
  onClick: () => void;
};

export const UndeterminedSlotCard = ({
  remaining,
  onClick,
}: UndeterminedSlotCardProps) => {
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className="h-auto justify-start gap-3 rounded-xl border border-dashed border-[#c7d5fd] bg-[#fafbff] p-3.5 text-left font-normal hover:bg-[#f0f4ff]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-dashed border-[#c7d5fd] bg-[#eef2ff]">
        <Plus size={18} className="text-primary" />
      </span>
      <span className="flex-1">
        <span className="block text-sm font-extrabold text-primary">
          종목을 직접 추가하세요
        </span>
        <span className="block text-xs text-muted-foreground">
          미확정 슬롯 · 비중 {remaining}% 남음
        </span>
      </span>
    </Button>
  );
};
