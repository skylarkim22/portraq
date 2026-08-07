import { ActionChip } from "@portraq/ui";
import type { JournalEntry } from "@/components/landing/data";

type JournalEntryCardProps = {
  entry: JournalEntry;
};

const JournalEntryCard = ({ entry }: JournalEntryCardProps) => (
  <div style={{ border: "1.5px solid #f4f4f5", borderRadius: 14, padding: 14 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginBottom: 10,
      }}
    >
      <ActionChip action={entry.type} />
      <span style={{ fontSize: 13, fontWeight: 800, color: "#1c1c1e" }}>
        {entry.name}
      </span>
      <span style={{ fontSize: 12, color: "#9ca3af" }}>{entry.ticker}</span>
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
          style={{ background: "#f8f9fe", borderRadius: 8, padding: "6px 8px" }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#9ca3af",
              fontWeight: 600,
              marginBottom: 1,
            }}
          >
            {l}
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1c1e" }}>
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
        <span style={{ fontSize: 12, color: "#6b6b7b" }}>
          세금 {entry.tax} · 세후 순손익
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>
          {entry.netPnl}
        </span>
      </div>
    )}
    <div
      style={{
        border: "1px solid #ebebef",
        borderRadius: 8,
        background: "rgba(255,255,255,0.6)",
        padding: "8px 12px",
      }}
    >
      <p style={{ fontSize: 12, color: "#6b6b7b", margin: 0 }}>{entry.memo}</p>
    </div>
  </div>
);

export default JournalEntryCard;
