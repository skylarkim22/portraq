import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const actionChipVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold",
  {
    variants: {
      action: {
        buy: "border-buy-border bg-buy-tint text-buy",
        sell: "border-sell-border bg-sell-tint text-sell",
        hold: "border-border bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      action: "hold",
    },
  }
);

type ActionChipAction = NonNullable<VariantProps<typeof actionChipVariants>["action"]>;

const LABELS: Record<ActionChipAction, string> = {
  buy: "매수",
  sell: "매도",
  hold: "유지",
};

export interface ActionChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof actionChipVariants> {}

export const ActionChip = ({ action, className, children, ...props }: ActionChipProps) => (
  <span className={cn(actionChipVariants({ action }), className)} {...props}>
    {children ?? LABELS[action ?? "hold"]}
  </span>
);
