import { useQuery } from "@tanstack/react-query";
import { tradeLogQueries } from "@/features/trade-log/queries";

export const useTradeLogs = () => useQuery(tradeLogQueries.list());
