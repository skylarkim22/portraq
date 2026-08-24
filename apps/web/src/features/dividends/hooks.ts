import { useQuery } from "@tanstack/react-query";
import { dividendQueries } from "@/features/dividends/queries";

export const useDividends = () => useQuery(dividendQueries.list());
