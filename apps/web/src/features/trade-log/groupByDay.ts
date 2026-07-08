import type { EnrichedTradeLog } from "@/features/trade-log/queries";

export const filterLogsByMonth = (
  logs: EnrichedTradeLog[],
  year: number,
  month: number
): EnrichedTradeLog[] => {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  return logs.filter((log) => log.date.startsWith(prefix));
};

export const groupLogsByDate = (
  logs: EnrichedTradeLog[]
): Map<string, EnrichedTradeLog[]> => {
  const map = new Map<string, EnrichedTradeLog[]>();
  for (const log of logs) {
    const existing = map.get(log.date) ?? [];
    existing.push(log);
    map.set(log.date, existing);
  }
  return map;
};

export type DayMarker = { hasBuy: boolean; hasSell: boolean };

export const buildDayMarkers = (
  monthLogs: EnrichedTradeLog[]
): Map<number, DayMarker> => {
  const markers = new Map<number, DayMarker>();
  for (const log of monthLogs) {
    const day = Number(log.date.slice(-2));
    const marker = markers.get(day) ?? { hasBuy: false, hasSell: false };
    if (log.type === "buy") marker.hasBuy = true;
    else marker.hasSell = true;
    markers.set(day, marker);
  }
  return markers;
};
