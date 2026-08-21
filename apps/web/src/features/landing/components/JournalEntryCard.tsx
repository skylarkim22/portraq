import { ActionChip } from "@portraq/ui";
import type { JournalEntry } from "@/features/landing/data";

type JournalEntryCardProps = {
  entry: JournalEntry;
};

export const JournalEntryCard = ({ entry }: JournalEntryCardProps) => (
  <div style={{ border: "1.5px solid var(--border-faint)", borderRadius: 14, padding: 14 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
      }}
    >
      <ActionChip action={entry.type} />
      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>
        {entry.name}
      </span>
      <span style={{ fontSize: 12, color: "var(--text-subtle)" }}>{entry.ticker}</span>
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        gap: 6,
        marginBottom: 8,
      }}
    >
      {[
        { l: "수량", v: `${entry.quantity}주` },
        { l: "가격", v: entry.price },
        { l: "합계", v: entry.total },
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
    {entry.type === "sell" && entry.netPnl && (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          background: "#f0fdf4",
          borderRadius: 8,
          padding: "6px 10px",
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          세금 {entry.tax} · 세후 순손익
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--buy)" }}>
          {entry.netPnl}
        </span>
      </div>
    )}
    <div
      style={{
        border: "1px solid var(--border-subtle)",
        borderRadius: 8,
        background: "rgba(255,255,255,0.6)",
        padding: "8px 12px",
      }}
    >
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>{entry.memo}</p>
    </div>
  </div>
);

