import { Plus } from "lucide-react";
import { Button, Input, Textarea } from "@portraq/ui";

type PortfolioHeaderProps = {
  name: string;
  memo: string;
  onNameChange: (name: string) => void;
  onMemoChange: (memo: string) => void;
  onAddAssetClick: () => void;
};

export const PortfolioHeader = ({
  name,
  memo,
  onNameChange,
  onMemoChange,
  onAddAssetClick,
}: PortfolioHeaderProps) => {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <Input
          id="portfolio-name"
          name="portfolio-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="포트폴리오 이름을 입력하세요"
          className="mb-1 h-auto border-none bg-transparent px-0 text-2xl font-extrabold text-foreground shadow-none focus-visible:ring-0 md:text-2xl"
        />
        <Textarea
          id="portfolio-memo"
          name="portfolio-memo"
          value={memo}
          onChange={(e) => onMemoChange(e.target.value)}
          placeholder="메모 (선택)"
          rows={1}
          className="min-h-0 resize-none border-none bg-transparent px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
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
  );
};
