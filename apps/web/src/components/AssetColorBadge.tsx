import { DEFAULT_ASSET_COLOR } from "@portraq/lib/utils";

type AssetColorBadgeProps = {
  name?: string;
  ticker: string;
  color?: string;
};

export const AssetColorBadge = ({ name, ticker, color }: AssetColorBadgeProps) => {
  const resolvedColor = color ?? DEFAULT_ASSET_COLOR;

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[11px] font-extrabold"
      style={{ backgroundColor: `${resolvedColor}1a`, color: resolvedColor }}
    >
      {(name ?? ticker).split(" ")[0].slice(0, 1)}
    </span>
  );
};
