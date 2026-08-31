import { Award, Layers, LayoutGrid, PiggyBank, RefreshCw } from "lucide-react";
import { ActionChip } from "@portraq/ui";
import { dividendEntries } from "@/features/landing/data";
import { DividendEntryCard } from "@/features/landing/components/DividendEntryCard";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const customPortfolioAssets = [
  { ticker: "AAPL", name: "Apple", ratio: 30 },
  { ticker: "SCHD", name: "Schwab US Dividend ETF", ratio: 25 },
  { ticker: "005930", name: "삼성전자", ratio: 25 },
  { ticker: "TLT", name: "iShares 20+ Year Treasury", ratio: 20 },
];

const bentoPortfolios = [
  { name: "워런 버핏", cagr: "+10.4%" },
  { name: "레이 달리오", cagr: "+7.2%" },
  { name: "캐시 우드", cagr: "+13.5%" },
  { name: "존 보글", cagr: "+9.8%" },
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
        {/* Bento 1 — 직접 구성 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:1_/_span_7]"
          style={{ padding: 32 }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
              <SectionLabel icon={<Layers size={12} />}>
                포트폴리오 직접 구성
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
                종목을 직접 고르고
                <br />
                비중까지 내 마음대로
              </h3>
              <p
                style={{
                  fontSize: 15,
                  color: "var(--text-muted)",
                  lineHeight: 1.7,
                  maxWidth: "38ch",
                }}
              >
                국내외 8,000개 넘는 종목을 검색해 담고 원하는 비중을 직접
                입력해 나만의 포트폴리오를 완성하세요. 드래그로 순서도
                자유롭게 바꿀 수 있습니다.
              </p>
            </div>
            <div className="flex-1 flex flex-col gap-2" style={{ minWidth: 0 }}>
              {customPortfolioAssets.map((a) => (
                <div
                  key={a.ticker}
                  className="flex items-center justify-between"
                  style={{
                    background: "var(--surface-muted)",
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--ink)" }}>
                      {a.ticker}
                    </span>
                    <span
                      className="truncate"
                      style={{ fontSize: 12, color: "var(--text-muted)" }}
                    >
                      {a.name}
                    </span>
                  </div>
                  <span
                    style={{ fontSize: 13, fontWeight: 800, color: "var(--portraq-primary)" }}
                  >
                    {a.ratio}%
                  </span>
                </div>
              ))}
              <div
                className="flex items-center justify-between"
                style={{ marginTop: 4, padding: "0 12px" }}
              >
                <span style={{ fontSize: 11, color: "var(--text-subtle)", fontWeight: 600 }}>
                  합계
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--buy)" }}>
                  100%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 2 — 대가 포트폴리오 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:8_/_span_5]"
          style={{ padding: 28 }}
        >
          <SectionLabel icon={<Award size={12} />}>대가 포트폴리오</SectionLabel>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: 8,
              letterSpacing: "-0.02em",
            }}
          >
            대가의 전략도
            <br />
            템플릿으로 시작하세요
          </h3>
          <p
            style={{
              fontSize: 14,
              color: "var(--text-muted)",
              lineHeight: 1.65,
              marginBottom: 14,
            }}
          >
            워런 버핏, 레이 달리오 등 5명의 투자 대가 포트폴리오를 탭 하나로
            불러와 나만의 시작점으로 삼으세요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {bentoPortfolios.map((p) => (
              <div
                key={p.name}
                className="card-surface flex items-center justify-between"
                style={{ padding: "8px 12px", borderRadius: 10 }}
              >
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                  {p.name}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "var(--buy)" }}>
                  {p.cagr}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento 3 — 리밸런싱 */}
        <div
          className="card reveal [grid-column:span_12]"
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

        {/* Bento 4 — 배당금 관리 */}
        <div
          className="card reveal [grid-column:span_12] lg:[grid-column:1_/_span_12]"
          style={{ padding: 32 }}
        >
          <div className="flex flex-col md:flex-row gap-8 md:items-start">
            <div style={{ flex: "0 0 auto", maxWidth: 360 }}>
              <SectionLabel icon={<PiggyBank size={12} />}>
                배당금 관리
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
                받은 배당금을
                <br />
                놓치지 않고 관리하세요
              </h3>
              <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7 }}>
                종목별 실수령 배당금을 입력하면 배당 주기와 최근 12개월
                배당합, 매수 단가 대비 연 환산 수익률까지 자동으로
                계산됩니다.
              </p>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              {dividendEntries.slice(0, 2).map((entry) => (
                <DividendEntryCard key={entry.ticker} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

