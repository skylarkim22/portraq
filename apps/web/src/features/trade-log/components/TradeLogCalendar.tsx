import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "@portraq/ui";
import { buildDayMarkers, type DayMarker } from "@/features/trade-log/groupByDay";
import type { EnrichedTradeLog } from "@/features/trade-log/queries";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

type TradeLogCalendarProps = {
  year: number;
  month: number;
  selectedDate: string;
  monthLogs: EnrichedTradeLog[];
  onSelectDate: (date: string) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

export const TradeLogCalendar = ({
  year,
  month,
  selectedDate,
  monthLogs,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
}: TradeLogCalendarProps) => {
  const markers = buildDayMarkers(monthLogs);
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const todayStr = new Date().toISOString().slice(0, 10);

  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="이전 달"
          onClick={onPrevMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ChevronLeft size={17} />
        </button>
        <div className="text-base font-extrabold text-foreground">
          {year}년 {month}월
        </div>
        <button
          type="button"
          aria-label="다음 달"
          onClick={onNextMonth}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((weekday, i) => (
          <div
            key={weekday}
            className={`py-1.5 text-center text-[11px] font-bold ${
              i === 0
                ? "text-destructive"
                : i === 6
                  ? "text-primary"
                  : "text-muted-foreground"
            }`}
          >
            {weekday}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, index) => {
          if (day === null) return <div key={`empty-${index}`} />;

          const dateStr = `${year}-${pad(month)}-${pad(day)}`;
          const marker: DayMarker = markers.get(day) ?? {
            hasBuy: false,
            hasSell: false,
          };
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;

          return (
            <button
              key={dateStr}
              type="button"
              aria-label={`${month}월 ${day}일`}
              aria-pressed={isSelected}
              onClick={() => onSelectDate(dateStr)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[10px] border text-[13px] font-semibold transition-colors ${
                isSelected
                  ? "border-transparent bg-[#eef2ff] font-extrabold text-primary"
                  : "border-transparent text-foreground hover:bg-muted"
              } ${isToday ? "border-primary" : ""}`}
            >
              <span>{day}</span>
              <span className="flex h-[5px] gap-[3px]">
                {marker.hasBuy && (
                  <span className="h-[5px] w-[5px] rounded-full bg-primary" />
                )}
                {marker.hasSell && (
                  <span className="h-[5px] w-[5px] rounded-full bg-[#dc2626]" />
                )}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-4 border-t border-border pt-3.5">
        <div className="flex items-center gap-2">
          <span className="h-[5px] w-[5px] rounded-full bg-primary" />
          <span className="text-xs font-semibold text-muted-foreground">매수</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-[5px] w-[5px] rounded-full bg-[#dc2626]" />
          <span className="text-xs font-semibold text-muted-foreground">매도</span>
        </div>
      </div>
    </Card>
  );
};
