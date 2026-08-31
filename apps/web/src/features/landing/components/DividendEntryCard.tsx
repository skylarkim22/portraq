import type { DividendEntry } from "@/features/landing/data";

const CYCLE_STYLE: Record<DividendEntry["cycle"], { bg: string; color: string }> = {
  월배당: { bg: "#eef2ff", color: "#355df9" },
  분기배당: { bg: "#f0fdf4", color: "#16a34a" },
  반기배당: { bg: "#fff7ed", color: "#c2410c" },
  연배당: { bg: "#f4f4f5", color: "#4b4b6a" },
};

type DividendEntryCardProps = {
  entry: DividendEntry;
};

export const DividendEntryCard = ({ entry }: DividendEntryCardProps) => {
  const cycleStyle = CYCLE_STYLE[entry.cycle];

  return (
    <div
      style={{
        border: "1.5px solid var(--border-faint)",
        borderRadius: 14,
        padding: 14,
        background: "#fff",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 999,
            background: cycleStyle.bg,
            color: cycleStyle.color,
          }}
        >
          {entry.cycle}
        </span>
        <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
          {entry.name}
        </span>
        <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>{entry.ticker}</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 6,
        }}
      >
        {[
          { l: "배당합 (최근 12개월)", v: entry.dividendSum },
          { l: "연 환산 수익률", v: entry.yield },
        ].map(({ l, v }) => (
          <div
            key={l}
            style={{ background: "var(--surface-muted)", borderRadius: 8, padding: "6px 8px" }}
          >
            <div
              style={{
                fontSize: 10,
                color: "var(--text-subtle)",
                fontWeight: 600,
                marginBottom: 1,
              }}
            >
              {l}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink)" }}>
              {v}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
