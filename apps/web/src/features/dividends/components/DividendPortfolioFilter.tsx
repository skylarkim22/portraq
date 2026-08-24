import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@portraq/ui";
import { usePortfolioList } from "@/features/portfolio/hooks";

export const ALL_PORTFOLIOS = "all";

type DividendPortfolioFilterProps = {
  value: string;
  onChange: (value: string) => void;
};

export const DividendPortfolioFilter = ({ value, onChange }: DividendPortfolioFilterProps) => {
  const { data: portfolios } = usePortfolioList();

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_PORTFOLIOS}>전체 합산</SelectItem>
        {portfolios?.map((portfolio) => (
          <SelectItem key={portfolio.id} value={portfolio.id}>
            {portfolio.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
