import { Fragment } from "react";
import { AlertTriangle, Pencil } from "lucide-react";
import { formatAssetTicker } from "@portraq/lib/utils";
import { computeDividendDeclineSignal } from "@/features/dividends/computeDividendTrend";
import { computeEntryYield } from "@/features/dividends/computeDividendMetrics";
import type { DividendRow } from "@/features/dividends/queries";

const fmtWon = (n: number) => `₩${Math.round(n).toLocaleString("ko-KR")}`;

const monthLabel = (monthKey: string) => monthKey.replace("-", ".");

const noDataTooltip = (reason: DividendRow["noDataReason"]) => {
  if (reason === "policy") return "이 종목은 배당/분배금을 지급하지 않는 정책입니다.";
  if (reason === "new") return "최근 편입되어 아직 수집된 배당 이력이 없습니다.";
  return "데이터 없음";
};

const NoData = ({ reason }: { reason: DividendRow["noDataReason"] }) => (
  <span title={noDataTooltip(reason)} className="cursor-help text-[#c1c1c8]">
    -
  </span>
);

const DeclineIcon = ({ row }: { row: DividendRow }) => {
  const signal = computeDividendDeclineSignal(row.manualHistory);
  if (!signal) return null;
  return (
    <span
      title={`교체 고려 — 직전월 대비 ${signal.dropPercent}% 하락`}
      className="inline-flex cursor-help items-center gap-[3px]"
    >
      <AlertTriangle size={14} className="text-red-600" />
      <span className="text-[11px] font-extrabold text-red-600">-{signal.dropPercent}%</span>
    </span>
  );
};

const DividendSumBreakdown = ({ row }: { row: DividendRow }) => {
  if (row.manualHistory.length === 0) return <>{fmtWon(row.dividendSum)}</>;

  const sorted = [...row.manualHistory].sort((a, b) => a.month.localeCompare(b.month));
  return (
    <>
      {sorted.map((entry) => {
        const entryYield = computeEntryYield({ amount: entry.amount, shares: entry.shares, avgPrice: row.avgPrice });
        return (
          <div key={entry.month} className="text-[#6b6b7b]">
            {monthLabel(entry.month)}: {fmtWon(entry.amount)}
            {entryYield != null && <span className="ml-1 text-[#16a34a]">({entryYield}%)</span>}
          </div>
        );
      })}
      <div className="mt-0.5 border-t border-[#f4f4f5] pt-0.5 font-extrabold">
        합계: {fmtWon(row.dividendSum)}
      </div>
    </>
  );
};

const TableRow = ({ row, onEdit }: { row: DividendRow; onEdit: () => void }) => {
  const hasDeclineSignal = computeDividendDeclineSignal(row.manualHistory) !== null;
  return (
    <tr className={`border-b border-[#f4f4f5] ${hasDeclineSignal ? "bg-[#fef2f2]" : ""}`}>
      <td className="p-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-extrabold text-[#1c1c1e]">{row.name}</span>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              row.market === "US" ? "bg-[#eff6ff] text-[#1d4ed8]" : "bg-[#fff1f2] text-[#be123c]"
            }`}
          >
            {row.market}
          </span>
          <DeclineIcon row={row} />
        </div>
        <div className="mt-px text-[11px] text-[#9ca3af]">{formatAssetTicker(row.ticker, row.isCustom)}</div>
      </td>
      <td className="p-2.5 text-right font-bold">{row.ratio}%</td>
      <td className="p-2.5 text-center">
        {row.paySchedule ?? <NoData reason={row.noDataReason} />}
      </td>
      <td className="p-2.5 text-right">{fmtWon(row.avgPrice)}</td>
      <td className="p-2.5 text-right">{row.shares}주</td>
      <td className="p-2.5 text-right text-[11px] font-bold">
        <DividendSumBreakdown row={row} />
      </td>
      <td className="p-2.5 text-right font-bold text-[#355df9]">
        {row.annualizedYield != null ? `${row.annualizedYield}%` : <NoData reason={row.noDataReason} />}
      </td>
      <td className="p-2.5 text-right font-bold text-[#16a34a]">
        {row.expectedYield != null ? `${row.expectedYield}%` : <NoData reason={row.noDataReason} />}
      </td>
      <td className="p-2.5">
        <div className="flex items-center justify-center">
          <button
            type="button"
            title="배당금 수정"
            onClick={onEdit}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-lg border border-[#ebebef] text-[#6b6b7b] hover:border-[#355df9] hover:bg-[#eef2ff] hover:text-[#355df9]"
          >
            <Pencil size={15} />
          </button>
        </div>
      </td>
    </tr>
  );
};

const GroupHeaderRow = ({ portfolioName, count }: { portfolioName: string; count: number }) => (
  <tr>
    <td colSpan={9} className="border-b border-[#ebebef] bg-[#f8f9fe] p-2 text-[11px] font-extrabold text-[#355df9]">
      {portfolioName} <span className="font-semibold text-[#9ca3af]">· {count}개 종목</span>
    </td>
  </tr>
);

type DividendGroup = { portfolioName: string; rows: DividendRow[] };

const groupByPortfolio = (rows: DividendRow[]): DividendGroup[] => {
  const order: string[] = [];
  const groups = new Map<string, DividendRow[]>();
  for (const row of rows) {
    if (!groups.has(row.portfolioId)) {
      groups.set(row.portfolioId, []);
      order.push(row.portfolioId);
    }
    groups.get(row.portfolioId)?.push(row);
  }
  return order.map((portfolioId) => {
    const groupRows = groups.get(portfolioId) ?? [];
    return { portfolioName: groupRows[0]?.portfolioName ?? "", rows: groupRows };
  });
};

type DividendTableProps = {
  rows: DividendRow[];
  grouped: boolean;
  onEditRow: (row: DividendRow) => void;
};

export const DividendTable = ({ rows, grouped, onEditRow }: DividendTableProps) => {
  if (rows.length === 0) {
    return (
      <div className="hidden py-10 text-center text-sm text-[#9ca3af] md:block">
        선택한 포트폴리오에 표시할 종목이 없습니다.
      </div>
    );
  }

  const groups = grouped ? groupByPortfolio(rows) : [{ portfolioName: "", rows }];

  return (
    <div className="hidden overflow-x-auto md:block">
      <table className="w-full min-w-[960px] border-collapse text-xs">
        <thead>
          <tr>
            <th className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-left font-bold text-[#6b6b7b]">종목명</th>
            <th className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]">세팅비중</th>
            <th className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-center font-bold text-[#6b6b7b]">배당일</th>
            <th
              className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]"
              title="이동평균법으로 계산한 평균 매수 단가"
            >
              매수가
            </th>
            <th className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]">수량</th>
            <th
              className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]"
              title="직접 입력한 최근 12개월 배당금 합계. 입력하지 않았으면 0"
            >
              배당합
            </th>
            <th
              className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]"
              title="입력월별 실제 보유 수량 기준 주당 배당금을 평균해 12개월로 환산 ÷ 매수 단가"
            >
              연 환산 수익률
            </th>
            <th
              className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-right font-bold text-[#6b6b7b]"
              title="최근 주당 배당금을 연 환산해 현재가 대비 계산한 기대 수익률"
            >
              기대 배당률
            </th>
            <th className="whitespace-nowrap border-b border-[#ebebef] bg-[#f8f9fe] p-2.5 text-center font-bold text-[#6b6b7b]">수정</th>
          </tr>
        </thead>
        <tbody>
          {groups.map((group) => (
            <Fragment key={group.rows[0] ? `${group.rows[0].portfolioId}-${group.rows[0].ticker}` : group.portfolioName}>
              {grouped && <GroupHeaderRow portfolioName={group.portfolioName} count={group.rows.length} />}
              {group.rows.map((row) => (
                <TableRow key={`${row.portfolioId}-${row.ticker}`} row={row} onEdit={() => onEditRow(row)} />
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};
