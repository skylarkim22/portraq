import { Plus } from "lucide-react";
import { Button, Input } from "@portraq/ui";

type PortfolioHeaderProps = {
  name: string;
  memo: string;
  monthlyBudget: number;
  onNameChange: (name: string) => void;
  onMemoChange: (memo: string) => void;
  onMonthlyBudgetChange: (budget: number) => void;
  onAddAssetClick: () => void;
};

export function PortfolioHeader({
  name,
  memo,
  monthlyBudget,
  onNameChange,
  onMemoChange,
  onMonthlyBudgetChange,
  onAddAssetClick,
}: PortfolioHeaderProps) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <input
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="포트폴리오 이름을 입력하세요"
            className="mb-1 w-full border-b border-transparent bg-transparent text-xl font-extrabold text-foreground outline-none transition-colors hover:border-border focus:border-primary"
          />
          <textarea
            value={memo}
            onChange={(e) => onMemoChange(e.target.value)}
            placeholder="메모 (선택)"
            rows={1}
            className="w-full resize-none border-none bg-transparent text-sm text-muted-foreground outline-none"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={onAddAssetClick}
        >
          <Plus size={15} />
          종목 추가
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-muted-foreground">
          월 투자금
        </span>
        <Input
          type="number"
          min={0}
          value={monthlyBudget || ""}
          onChange={(e) => onMonthlyBudgetChange(Number(e.target.value) || 0)}
          placeholder="0"
          className="h-9 w-40"
        />
        <span className="text-sm text-muted-foreground">원</span>
      </div>
    </>
  );
}
