import type { TemplateStrategy } from "@portraq/lib/types";
import { STRATEGY_FILTERS } from "@/features/templates/templateStyles";

type TemplateFilterTabsProps = {
  value: "all" | TemplateStrategy;
  onChange: (value: "all" | TemplateStrategy) => void;
};

export const TemplateFilterTabs = ({ value, onChange }: TemplateFilterTabsProps) => {
  return (
    <div className="flex w-full flex-shrink-0 gap-0.5 overflow-x-auto rounded-[10px] bg-muted p-1 [scrollbar-width:none] sm:w-auto [&::-webkit-scrollbar]:hidden">
      {STRATEGY_FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          onClick={() => onChange(filter.value)}
          className={`flex-1 whitespace-nowrap rounded-lg px-3.5 py-2 text-center text-[13px] font-bold transition-colors ${
            value === filter.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-background hover:text-foreground"
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
};
