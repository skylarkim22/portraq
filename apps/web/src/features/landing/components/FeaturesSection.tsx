import { Award, BookOpen, LayoutGrid, RefreshCw } from "lucide-react";
import { ActionChip } from "@portraq/ui";
import { journalEntries } from "@/features/landing/data";
import { JournalEntryCard } from "@/features/landing/components/JournalEntryCard";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const bentoPortfolios = [
  {
    name: "워런 버핏",
    cagr: "+10.4%",
    bar: [
      { f: 42, bg: "var(--portraq-primary)" },
      { f: 28, bg: "#6b8ffb" },
      { f: 30, bg: "var(--border-subtle)" },
    ],
  },
  {
    name: "레이 달리오",
    cagr: "+7.2%",
    bar: [
      { f: 30, bg: "#7c3aed" },
      { f: 40, bg: "#a78bfa" },
      { f: 15, bg: "#f59e0b" },
      { f: 15, bg: "var(--border-subtle)" },
    ],
  },
  {
    name: "캐시 우드",
    cagr: "+13.5%",
    bar: [
      { f: 43, bg: "var(--sell)" },
      { f: 57, bg: "var(--border-subtle)" },
    ],
  },
  {
    name: "존 보글",
    cagr: "+9.8%",
    bar: [
      { f: 70, bg: "#f59e0b" },
      { f: 30, bg: "#fcd34d" },
    ],
  },
];

export const FeaturesSection = () => (
  <section id="features" className="py-24 md:py-32" style={{ background: "var(--surface-muted)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 reveal">
        <SectionLabel icon={<LayoutGrid size={12} />}>핵심 기능</SectionLabel>
        <SectionHeading>
          투자에 필요한 모든 것,
          <br />
          하나의 앱에서
        </SectionHeading>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12,1fr)",
          gap: 16,
        }}
      >
        {/* Bento 1 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:1_/_span_7]"
          style={{ padding: 32 }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <SectionLabel icon={<Award size={12} />}>
                대가 포트폴리오
              </SectionLabel>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                검증된 대가의 전략을
                <br />
                그대로 따라하세요
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  maxWidth: "38ch",
                }}
              >
                워런 버핏, 레이 달리오, 캐시 우드 등 5명의 투자 대가 포트폴리오를
                탭 하나로 불러오세요. 철학, CAGR, MDD까지 한눈에 비교됩니다.
              </p>
              <div className="flex flex-wrap gap-2" style={{ marginTop: 20 }}>
                <span className="badge badge-value">가치투자</span>
                <span className="badge badge-alloc">자산배분</span>
                <span className="badge badge-passive">패시브</span>
                <span className="badge badge-growth">성장</span>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-3" style={{ minWidth: 0 }}>
              {bentoPortfolios.map((p) => (
                <div
                  key={p.name}
                  className="card-surface"
                  style={{ padding: 16, borderRadius: 14 }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      marginBottom: 8,
                    }}
                  >
                    {p.name}
                  </div>
                  <div className="ratio-bar" style={{ marginBottom: 8 }}>
                    {p.bar.map((s, i) => (
                      <div
                        key={i}
                        className="ratio-seg"
                        style={{ flex: s.f, background: s.bg }}
                      />
                    ))}
                  </div>
                  <div
                    style={{ fontSize: 13, fontWeight: 800, color: "var(--buy)" }}
                  >
                    {p.cagr} CAGR
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bento 2 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:8_/_span_5]"
          style={{ padding: 28 }}
        >
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div
              style={{
                width: 48,
                height: 48,
                background: "var(--primary-tint)",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <RefreshCw size={24} color="var(--portraq-primary)" />
            </div>
            <div className="flex-1">
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: 8,
                  letterSpacing: "-0.02em",
                }}
              >
                스마트 리밸런싱 가이드
              </h3>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                  marginBottom: 14,
                }}
              >
                월 투자금과 보유 주수만 입력하면 종목별 매수·매도·유지 액션과
                정확한 주문 수량까지 자동으로 계산해드립니다.
              </p>
              <div className="flex gap-2 flex-wrap">
                <ActionChip action="buy">매수 +3주</ActionChip>
                <ActionChip action="sell">매도 -1주</ActionChip>
                <ActionChip action="hold">유지</ActionChip>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 6 — 매매 일지 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:1_/_span_12]"
          style={{ padding: 32 }}
        >
          <div className="flex flex-col md:flex-row gap-8 md:items-start">
            <div style={{ flex: "0 0 auto", maxWidth: 360 }}>
              <SectionLabel icon={<BookOpen size={12} />}>
                매매 일지
              </SectionLabel>
              <h3
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "var(--ink)",
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                매수·매도 이유를
                <br />
                기록으로 남기세요
              </h3>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>
                왜 샀고, 왜 팔았는지. 종목·수량·가격과 함께 이유를 적어두면
                시간이 지나도 내 판단을 돌아볼 수 있습니다.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              {[journalEntries[5][0], journalEntries[10][0]].map((entry) => (
                <JournalEntryCard key={entry.ticker} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

