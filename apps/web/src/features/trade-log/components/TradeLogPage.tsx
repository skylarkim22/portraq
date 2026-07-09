"use client";

import { useState } from "react";
import { useTradeLogs } from "@/features/trade-log/hooks";
import { deriveHoldings } from "@/features/trade-log/deriveHoldings";
import { deriveMonthlyStats } from "@/features/trade-log/deriveMonthlyStats";
import { filterLogsByMonth, groupLogsByDate } from "@/features/trade-log/groupByDay";
import { TradeLogCalendar } from "@/features/trade-log/components/TradeLogCalendar";
import { TradeLogMonthlyStats } from "@/features/trade-log/components/TradeLogMonthlyStats";
import { TradeLogDayFeed } from "@/features/trade-log/components/TradeLogDayFeed";
import { TradeActionBar } from "@/features/trade-log/components/TradeActionBar";
import { BuyTradeModal } from "@/features/trade-log/components/BuyTradeModal";
import { SellTradeModal } from "@/features/trade-log/components/SellTradeModal";

const todayStr = () => new Date().toISOString().slice(0, 10);

export const TradeLogPage = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [openModal, setOpenModal] = useState<"buy" | "sell" | null>(null);

  const { data: logs, isLoading, isError } = useTradeLogs();
  const allLogs = logs ?? [];

  const monthLogs = filterLogsByMonth(allLogs, year, month);
  const logsByDate = groupLogsByDate(allLogs);
  const holdings = deriveHoldings(allLogs);
  const stats = deriveMonthlyStats(monthLogs, holdings);

  const handlePrevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  const [, selectedMonth, selectedDay] = selectedDate.split("-").map(Number);
  const dateLabel = `${selectedMonth}월 ${selectedDay}일`;

  return (
    <div className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-8">
      <div className="mb-5">
        <h1 className="mb-1 text-xl font-extrabold tracking-tight text-foreground">
          매매 일지
        </h1>
        <p className="text-sm text-muted-foreground">
          실제 매수·매도를 실행한 날짜와 이유를 기록하세요. 포트폴리오 서비스와는
          독립적으로 동작합니다.
        </p>
      </div>

      {isLoading && (
        <p className="text-sm text-muted-foreground">불러오는 중...</p>
      )}

      {isError && (
        <p className="text-sm text-destructive">
          매매 일지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}

      {!isLoading && !isError && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[380px_1fr]">
          <div className="flex flex-col gap-4">
            <TradeLogCalendar
              year={year}
              month={month}
              selectedDate={selectedDate}
              monthLogs={monthLogs}
              onSelectDate={setSelectedDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
            />
            <TradeLogMonthlyStats month={month} stats={stats} />
          </div>

          <TradeLogDayFeed
            dateLabel={dateLabel}
            logs={logsByDate.get(selectedDate) ?? []}
            holdings={holdings}
          />
        </div>
      )}

      <TradeActionBar
        onOpenBuy={() => setOpenModal("buy")}
        onOpenSell={() => setOpenModal("sell")}
      />

      {openModal === "buy" && (
        <BuyTradeModal defaultDate={selectedDate} onClose={() => setOpenModal(null)} />
      )}
      {openModal === "sell" && (
        <SellTradeModal defaultDate={selectedDate} onClose={() => setOpenModal(null)} />
      )}
    </div>
  );
};
