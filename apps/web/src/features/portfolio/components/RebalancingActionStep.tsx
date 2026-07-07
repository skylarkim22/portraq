import { TriangleAlert } from "lucide-react";
import { Button } from "@portraq/ui";
import type { RebalancingActionRow } from "@/features/portfolio/deriveActionRows";
import { RebalancingActionRowCard } from "@/features/portfolio/components/RebalancingActionRowCard";

type RebalancingActionStepProps = {
  rows: RebalancingActionRow[];
  onQuantityChange: (ticker: string, quantity: number) => void;
  onPrev: () => void;
  onSave: () => void;
  isSaving: boolean;
};

export const RebalancingActionStep = ({
  rows,
  onQuantityChange,
  onPrev,
  onSave,
  isSaving,
}: RebalancingActionStepProps) => {
  const buyCount = rows.filter((r) => r.action === "buy").length;
  const sellCount = rows.filter((r) => r.action === "sell").length;
  const holdCount = rows.filter((r) => r.action === "hold").length;

  const totalBuyAmount = rows
    .filter((r) => r.action === "buy")
    .reduce((sum, r) => sum + r.quantity * r.pricePerShare, 0);
  const totalSellAmount = rows
    .filter((r) => r.action === "sell")
    .reduce((sum, r) => sum + Math.abs(r.quantity * r.pricePerShare), 0);
  const netRequired = totalBuyAmount - totalSellAmount;

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-4 text-center">
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            매수
          </div>
          <div className="text-xl font-extrabold text-[#16a34a]">
            {buyCount}종
          </div>
        </div>
        <div className="border-x border-border">
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            매도
          </div>
          <div className="text-xl font-extrabold text-[#dc2626]">
            {sellCount}종
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs font-semibold text-muted-foreground">
            유지
          </div>
          <div className="text-xl font-extrabold text-muted-foreground">
            {holdCount}종
          </div>
        </div>
      </div>

      {sellCount > 0 && (
        <div className="rounded-[10px] border border-[#c7d5fd] bg-[#f0f4ff] px-3.5 py-2.5 text-[13px] font-semibold text-primary">
          매도 회수 금액을 투자금과 합산해 매수에 활용하세요.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {rows.map((row) => (
          <RebalancingActionRowCard
            key={row.ticker}
            row={row}
            onQuantityChange={onQuantityChange}
          />
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-muted-foreground">
            이번 달 매수 금액
          </span>
          <span className="font-extrabold text-foreground">
            +{Math.round(totalBuyAmount).toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="mb-2 flex justify-between text-sm">
          <span className="font-semibold text-muted-foreground">
            매도 수령 예상
          </span>
          <span className="font-extrabold text-[#16a34a]">
            -{Math.round(totalSellAmount).toLocaleString("ko-KR")}원
          </span>
        </div>
        <div className="my-2.5 h-px bg-border" />
        <div className="flex justify-between">
          <span className="font-extrabold text-foreground">
            실제 필요 투자금
          </span>
          <span className="text-base font-extrabold text-primary">
            {Math.round(netRequired).toLocaleString("ko-KR")}원
          </span>
        </div>
      </div>

      <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
        <TriangleAlert size={13} className="mt-0.5 shrink-0" />
        제공되는 정보는 참고용이며 투자 조언이 아닙니다. 투자 결정의 책임은
        투자자 본인에게 있습니다. 실제 주문 시 현재가를 다시 확인하세요.
      </p>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onPrev}>
          이전
        </Button>
        <Button
          type="button"
          className="flex-1"
          disabled={isSaving}
          onClick={onSave}
        >
          저장하기
        </Button>
      </div>
    </div>
  );
};
