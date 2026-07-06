import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const actionChipVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
  {
    variants: {
      action: {
        buy: "bg-green-100 text-green-700",
        sell: "bg-red-100 text-red-700",
        hold: "bg-gray-100 text-gray-600",
      },
    },
    defaultVariants: {
      action: "hold",
    },
  }
);

const LABELS: Record<string, string> = { buy: "매수", sell: "매도", hold: "유지" };

export interface ActionChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof actionChipVariants> {}

export function ActionChip({ action, className, children, ...props }: ActionChipProps) {
  return (
    <span className={cn(actionChipVariants({ action }), className)} {...props}>
      {children ?? LABELS[action ?? "hold"]}
    </span>
  );
}
