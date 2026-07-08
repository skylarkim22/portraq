import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";
import type { RebalancingHistoryFilters as Filters } from "@/features/rebalancing-history/queries";

const ALL_PORTFOLIOS = "all";

type RebalancingHistoryFiltersProps = {
  value: Filters;
  onChange: (value: Filters) => void;
};

export const RebalancingHistoryFilters = ({
  value,
  onChange,
}: RebalancingHistoryFiltersProps) => {
  const { data: portfolios } = usePortfolioList();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Select
        value={value.portfolioId ?? ALL_PORTFOLIOS}
        onValueChange={(portfolioId) =>
          onChange({
            ...value,
            portfolioId: portfolioId === ALL_PORTFOLIOS ? null : portfolioId,
          })
        }
      >
        <SelectTrigger className="sm:w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_PORTFOLIOS}>전체 포트폴리오</SelectItem>
          {portfolios?.map((portfolio) => (
            <SelectItem key={portfolio.id} value={portfolio.id}>
              {portfolio.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Input
          type="date"
          aria-label="시작일"
          value={value.dateFrom ?? ""}
          onChange={(e) => {
            const dateFrom = e.target.value || null;
            const dateTo =
              dateFrom && value.dateTo && value.dateTo < dateFrom
                ? dateFrom
                : value.dateTo;
            onChange({ ...value, dateFrom, dateTo });
          }}
          className="h-9 w-auto px-2.5 text-sm"
        />
        <span className="text-sm text-muted-foreground">~</span>
        <Input
          type="date"
          aria-label="종료일"
          min={value.dateFrom ?? undefined}
          value={value.dateTo ?? ""}
          onChange={(e) =>
            onChange({ ...value, dateTo: e.target.value || null })
          }
          className="h-9 w-auto px-2.5 text-sm"
        />
      </div>
    </div>
  );
};
