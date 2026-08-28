import { Fragment } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { InfoPopover } from "@portraq/ui";
import { formatAssetTicker } from "@portraq/lib/utils";
import { computeDividendDeclineSignal } from "@/features/dividends/computeDividendTrend";
import { PAY_SCHEDULE_LEGEND } from "@/features/dividends/computeDividendMetrics";
import { fmtWon } from "@/features/dividends/formatDividend";
import { groupByPortfolio } from "@/features/dividends/groupByPortfolio";
import { NoData } from "@/features/dividends/components/NoData";
import type { DividendRow } from "@/features/dividends/queries";

const StatTile = ({
  label,
  title,
  children,
}: {
  label: string;
  title?: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-xl bg-[#f8f9fe] p-2.5">
    <div className="mb-[3px] flex items-center gap-1 text-[10px] font-semibold text-[#6b6b7b]">
      {label}
      {title && <InfoPopover label={`${label} 설명`}>{title}</InfoPopover>}
    </div>
    <div className="text-[13px] font-extrabold">{children}</div>
  </div>
);

const DividendCard = ({ row, onEdit }: { row: DividendRow; onEdit: () => void }) => {
  const signal = computeDividendDeclineSignal(row.manualHistory);
  const hasDeclineSignal = signal !== null;

  return (
    <div className={`mb-3 rounded-2xl border border-[#ebebef] p-4 ${hasDeclineSignal ? "border-red-200 bg-[#fef2f2]" : "bg-white"}`}>
      <div className="mb-3 flex items-start justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[15px] font-extrabold text-[#1c1c1e]">{row.name}</span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                row.market === "US" ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-[#fff1f2] text-[#be123c]"
              }`}
            >
              {row.market}
            </span>
            {signal && (
              <span title={`교체 고려 — 직전월 대비 ${signal.dropPercent}% 하락`} className="inline-flex cursor-help items-center gap-[3px]">
                <AlertTriangle size={14} className="text-red-600" />
                <span className="text-[11px] font-extrabold text-red-600">-{signal.dropPercent}%</span>
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-[#6b6b7b]">{formatAssetTicker(row.ticker, row.isCustom)}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[10px] font-semibold text-[#6b6b7b]">세팅비중</div>
          <div className="text-base font-extrabold text-[#355df9]">{row.ratio}%</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <StatTile label="기대 배당률">
          <span className="text-[#16a34a]">
            {row.expectedYield != null ? `${row.expectedYield}%` : <NoData reason={row.noDataReason} />}
          </span>
        </StatTile>
        <StatTile label="배당일" title={PAY_SCHEDULE_LEGEND}>
          {row.paySchedule ?? <NoData reason={row.noDataReason} />}
        </StatTile>
        <StatTile label="매수가 · 수량">
          {fmtWon(row.avgPrice)} · {row.shares}주
        </StatTile>
        <StatTile
          label="연 환산 수익률"
          title="입력월별 실제 보유 수량 기준 주당 배당금을 평균해 12개월로 환산 ÷ 매수 단가"
        >
          <span className="text-[#355df9]">
            {row.annualizedYield != null ? `${row.annualizedYield}%` : <NoData reason={row.noDataReason} />}
          </span>
        </StatTile>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#f4f4f5] pt-2.5">
        <div>
          <div className="text-[10px] font-semibold text-[#6b6b7b]">배당합 (최근 12개월)</div>
          <div className="text-sm font-extrabold">{fmtWon(row.dividendSum)}</div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg border border-[#e4e4e7] px-3.5 py-2 text-xs font-semibold text-[#4b4b6a] hover:border-[#355df9] hover:bg-[#eef2ff] hover:text-[#355df9]"
        >
          <Pencil size={13} />
          수정
        </button>
      </div>
    </div>
  );
};

const GroupHeader = ({ portfolioName, count }: { portfolioName: string; count: number }) => (
  <div className="mb-2 mt-1 text-xs font-extrabold text-[#355df9]">
    {portfolioName} <span className="font-semibold text-[#9ca3af]">· {count}개 종목</span>
  </div>
);

type DividendCardListProps = {
  rows: DividendRow[];
  grouped: boolean;
  onEditRow: (row: DividendRow) => void;
};

export const DividendCardList = ({ rows, grouped, onEditRow }: DividendCardListProps) => {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#ebebef] bg-white py-10 text-center text-sm text-[#9ca3af] md:hidden">
        선택한 포트폴리오에 표시할 종목이 없습니다.
      </div>
    );
  }

  const groups = grouped ? groupByPortfolio(rows) : [{ portfolioName: "", rows }];

  return (
    <div className="md:hidden">
      {groups.map((group) => (
        <Fragment key={group.rows[0] ? `${group.rows[0].portfolioId}-${group.rows[0].ticker}` : group.portfolioName}>
          {grouped && <GroupHeader portfolioName={group.portfolioName} count={group.rows.length} />}
          {group.rows.map((row) => (
            <DividendCard key={`${row.portfolioId}-${row.ticker}`} row={row} onEdit={() => onEditRow(row)} />
          ))}
        </Fragment>
      ))}
    </div>
  );
};
