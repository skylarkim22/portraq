import { Card } from "@portraq/ui";

type SummaryTilesProps = {
  totalValue: number;
  portfolioCount: number;
};

export const SummaryTiles = ({ totalValue, portfolioCount }: SummaryTilesProps) => (
  <div className="grid grid-cols-2 gap-3">
    <Card className="p-4">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        총 자산
      </div>
      <div className="text-xl font-extrabold tracking-tight text-foreground">
        {Math.round(totalValue).toLocaleString("ko-KR")}원
      </div>
    </Card>
    <Card className="p-4">
      <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        포트폴리오
      </div>
      <div className="text-xl font-extrabold tracking-tight text-foreground">
        {portfolioCount}개
      </div>
    </Card>
  </div>
);
