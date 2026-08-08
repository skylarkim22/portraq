import { Fragment } from "react";
import { ArrowRight, CheckCircle, Star } from "lucide-react";
import { ActionChip } from "@portraq/ui";
import { portfolios } from "@/features/landing/data";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const heroPortfolio =
  portfolios.find((p) => p.id === "buffett") ?? portfolios[0];

const heroHoldings = [
  { t: "AAPL", n: "Apple", p: "42%", c: "var(--portraq-primary)" },
  { t: "BRK.B", n: "Berkshire", p: "28%", c: "#6b8ffb" },
  { t: "BAC", n: "Bank of America", p: "12%", c: "#93c5fd" },
  { t: "KO", n: "Coca-Cola", p: "10%", c: "#f59e0b" },
  { t: "기타", n: "", p: "8%", c: "#e4e4e7" },
];

const heroStats = [
  { l: "CAGR (10Y)", v: "+10.4%", c: "var(--buy)" },
  { l: "최대낙폭 MDD", v: "-32.7%", c: "var(--sell)" },
  { l: "월 투자금", v: "50만원", c: "var(--ink)" },
];

export const HeroSection = () => {
  return (
    <section
      className="hero-bg flex items-center pt-8 pb-16 md:py-0"
      style={{ minHeight: "100dvh" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center"
          style={{ minHeight: "80vh" }}
        >
          <div
            className="flex flex-col gap-6 reveal visible"
            style={{
              animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
            }}
          >
            <SectionLabel
              icon={<Star size={12} fill="currentColor" />}
              style={{ marginBottom: 0, width: "fit-content" }}
            >
              적립식 투자 포트폴리오 관리
            </SectionLabel>
            <h1
              style={{
                fontSize: "clamp(2.4rem,5vw,3.6rem)",
                fontWeight: 800,
                lineHeight: 1.12,
                letterSpacing: "-0.04em",
                color: "var(--ink)",
                margin: 0,
              }}
            >
              대가의 전략으로
              <br />
              <span style={{ color: "var(--portraq-primary)" }}>매달 적립</span>하세요
            </h1>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.75,
                color: "var(--text-muted)",
                maxWidth: "46ch",
                margin: 0,
              }}
            >
              워런 버핏, 레이 달리오의 검증된 포트폴리오를 그대로 따라하세요.
              종목 배분부터 매달 매수 수량까지 자동으로 계산해드립니다.
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <a
                href="/login"
                className="btn-primary"
                style={{ fontSize: 15, padding: "14px 28px" }}
              >
                시작하기 <ArrowRight size={18} />
              </a>
            </div>
            <div className="flex items-center gap-5 flex-wrap">
              {["완전 무료", "대가 포트폴리오 5종"].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2"
                  style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}
                >
                  <CheckCircle size={16} color="var(--buy)" /> {t}
                </div>
              ))}
            </div>
          </div>

          <div
            className="relative flex justify-center lg:justify-end reveal mt-10 lg:mt-0"
            style={{ animationDelay: "120ms" }}
          >
            <div
              className="animate-float left-0 lg:left-[-16px]"
              style={{
                position: "absolute",
                top: -24,
                zIndex: 10,
                background: "#fff",
                border: "1.5px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "12px 16px",
                boxShadow: "0 8px 24px rgba(53,93,249,0.12)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                연평균 수익률
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "var(--buy)" }}>
                +10.4%
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                워런 버핏 · 10년 CAGR
              </div>
            </div>

            <div
              className="animate-float"
              style={{
                animationDelay: "1.5s",
                position: "absolute",
                bottom: -8,
                right: -8,
                zIndex: 10,
                background: "#fff",
                border: "1.5px solid var(--border-subtle)",
                borderRadius: 12,
                padding: "12px 16px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--text-muted)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  marginBottom: 2,
                }}
              >
                이번달 액션
              </div>
              <div className="flex gap-1">
                <ActionChip action="buy">매수 3종</ActionChip>
                <ActionChip action="hold">유지 2종</ActionChip>
              </div>
            </div>

            <div
              className="portfolio-preview w-full max-w-sm"
              style={{
                animation: "float 5s ease-in-out infinite",
                animationDelay: "0.5s",
              }}
            >
              <div
                className="flex items-center justify-between"
                style={{ marginBottom: 16 }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-muted)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      marginBottom: 3,
                    }}
                  >
                    대가 포트폴리오
                  </div>
                  <div
                    style={{ fontSize: 17, fontWeight: 800, color: "var(--ink)" }}
                  >
                    워런 버핏 전략
                  </div>
                </div>
                <div className="flex gap-1">
                  <span className="badge badge-value">가치투자</span>
                  <span className="badge badge-us">US</span>
                </div>
              </div>
              <div className="ratio-bar" style={{ marginBottom: 12 }}>
                {heroPortfolio.ratioBar.map((s, i) => (
                  <div
                    key={i}
                    className="ratio-seg"
                    style={{ flex: s.flex, background: s.bg }}
                  />
                ))}
              </div>
              <div className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
                {heroHoldings.map((h) => (
                  <div key={h.t} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        style={{
                          width: 9,
                          height: 9,
                          borderRadius: "50%",
                          background: h.c,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: h.n ? 700 : 600,
                          color: h.n ? "var(--ink)" : "var(--text-muted)",
                        }}
                      >
                        {h.t}
                      </span>
                      {h.n && (
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {h.n}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: h.n ? "var(--ink)" : "var(--text-muted)",
                      }}
                    >
                      {h.p}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="flex justify-between"
                style={{
                  background: "var(--surface-muted)",
                  borderRadius: 12,
                  padding: "14px 16px",
                }}
              >
                {heroStats.map((s, i, arr) => (
                  <Fragment key={s.l}>
                    <div className="text-center">
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          fontWeight: 600,
                          marginBottom: 2,
                        }}
                      >
                        {s.l}
                      </div>
                      <div
                        style={{ fontSize: 16, fontWeight: 800, color: s.c }}
                      >
                        {s.v}
                      </div>
                    </div>
                    {i < arr.length - 1 && (
                      <div
                        style={{ width: 1, background: "var(--border-subtle)" }}
                      />
                    )}
                  </Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

