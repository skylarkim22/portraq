import { Plus } from "lucide-react";

type UndeterminedSlotCardProps = {
  remaining: number;
  onClick: () => void;
};

export function UndeterminedSlotCard({
  remaining,
  onClick,
}: UndeterminedSlotCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-dashed border-[#c7d5fd] bg-[#fafbff] p-3.5 text-left transition-colors hover:bg-[#f0f4ff]"
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
    </button>
  );
}
