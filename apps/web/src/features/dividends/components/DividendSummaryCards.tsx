import { Wallet, Banknote, TrendingUp, ListChecks } from "lucide-react";
import type { DividendSummary } from "@/features/dividends/deriveDividendSummary";

const fmtWon = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

type DividendSummaryCardsProps = {
  summary: DividendSummary;
};

export const DividendSummaryCards = ({ summary }: DividendSummaryCardsProps) => {
  const cards = [
    { icon: Wallet, label: "총 투자금", value: fmtWon(summary.totalInvested) },
    { icon: Banknote, label: "배당합 (최근 12개월)", value: fmtWon(summary.totalDividend) },
    {
      icon: TrendingUp,
      label: "가중평균 연환산수익률",
      value: summary.avgYield != null ? `${summary.avgYield}%` : "-",
    },
    {
      icon: ListChecks,
      label: "종목 수 · 데이터 없음",
      value: `${summary.totalCount}개 · ${summary.noDataCount}개`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-[#ebebef] bg-white p-4">
          <div className="mb-2 flex items-center gap-2">
            <card.icon size={15} className="text-[#355df9]" />
            <div className="text-[10px] font-bold text-[#6b6b7b]">{card.label}</div>
          </div>
          <div className="text-[17px] font-extrabold tracking-tight text-[#1c1c1e]">{card.value}</div>
        </div>
      ))}
    </div>
  );
};
