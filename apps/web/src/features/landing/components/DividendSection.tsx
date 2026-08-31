import { Coins, ListChecks, PiggyBank, TrendingUp } from "lucide-react";
import { dividendEntries, dividendSummary } from "@/features/landing/data";
import { DividendEntryCard } from "@/features/landing/components/DividendEntryCard";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const dividendFeatures = [
  {
    icon: <Coins size={18} color="var(--portraq-primary)" />,
    bg: "var(--primary-tint)",
    title: "실수령 배당금 입력",
    desc: "종목별·월별로 실제 받은 배당금을 직접 기록",
  },
  {
    icon: <PiggyBank size={18} color="#16a34a" />,
    bg: "#f0fdf4",
    title: "배당 주기 자동 표시",
    desc: "월배당·분기배당·반기배당·연배당 라벨로 구분",
  },
  {
    icon: <TrendingUp size={18} color="#c2410c" />,
    bg: "#fff7ed",
    title: "연 환산 수익률",
    desc: "실제 보유 수량 기준으로 매수 단가 대비 수익률 계산",
  },
];

const summaryStats = [
  { l: "배당합 (최근 12개월)", v: dividendSummary.totalDividend, c: "var(--ink)" },
  { l: "가중평균 연 환산 수익률", v: dividendSummary.avgYield, c: "var(--buy)" },
  { l: "배당 종목 수", v: `${dividendSummary.totalCount}개`, c: "var(--ink)" },
];

export const DividendSection = () => (
  <section
    className="py-24 md:py-32"
    style={{ borderTop: "1.5px solid var(--border-subtle)", background: "var(--surface-muted)" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="reveal">
          <SectionLabel icon={<ListChecks size={12} />}>
            배당까지 한 번에 관리
          </SectionLabel>
          <SectionHeading
            style={{
              fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            받은 배당금을
            <br />
            종목별로 정리하세요
          </SectionHeading>
          <p
            style={{
              fontSize: 16,
              color: "var(--text-muted)",
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            실수령 배당금을 입력하면 배당 주기와 배당합, 연 환산 수익률까지
            한 화면에서 확인할 수 있습니다.
          </p>
          <div className="flex flex-col gap-4">
            {dividendFeatures.map(({ icon, bg, title, desc }) => (
              <div key={title} className="flex items-center gap-4">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    background: bg,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <div>
                  <div
                    style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className="reveal"
          style={{
            animationDelay: "100ms",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div className="card" style={{ padding: 24 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontSize: 15, fontWeight: 800, color: "var(--ink)" }}
              >
                배당 현황 요약
              </span>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3,1fr)",
                gap: 10,
              }}
            >
              {summaryStats.map(({ l, v, c }) => (
                <div
                  key={l}
                  style={{
                    background: "var(--surface-muted)",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-subtle)",
                      fontWeight: 600,
                      marginBottom: 3,
                    }}
                  >
                    {l}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: c }}>
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {dividendEntries.map((entry) => (
              <DividendEntryCard key={entry.ticker} entry={entry} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);
