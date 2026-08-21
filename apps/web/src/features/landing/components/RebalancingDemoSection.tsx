import { RefreshCw, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { ActionChip } from "@portraq/ui";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const rebalancingFeatures = [
  {
    icon: <Wallet size={18} color="#8fa8fb" />,
    text: "보유 주수 × 현재가로 실제 비율 자동 계산",
  },
  {
    icon: <TrendingUp size={18} color="#8fa8fb" />,
    text: "괴리 5%p 이상 시 리밸런싱 알림 배지",
  },
  {
    icon: <ShieldCheck size={18} color="#8fa8fb" />,
    text: "1주 미만 거래는 자동으로 유지 처리",
  },
];

const rebalancingActions = [
  {
    t: "AAPL",
    dot: "var(--portraq-primary)",
    from: 38,
    to: 42,
    chip: <ActionChip action="buy">매수 +2주</ActionChip>,
    amt: "약 437,000원",
  },
  {
    t: "BRK.B",
    dot: "#6b8ffb",
    from: 30,
    to: 28,
    chip: <ActionChip action="sell">매도 -1주</ActionChip>,
    amt: "약 58,000원",
  },
  {
    t: "KO",
    dot: "#f59e0b",
    from: 10,
    to: 10,
    chip: <ActionChip action="hold">유지</ActionChip>,
    amt: null,
  },
  {
    t: "BAC",
    dot: "#93c5fd",
    from: 9,
    to: 12,
    chip: <ActionChip action="buy">매수 +3주</ActionChip>,
    amt: "약 145,000원",
  },
];

export const RebalancingDemoSection = () => (
  <section
    className="py-24 md:py-32"
    style={{ background: "linear-gradient(135deg,#1c1c2e,#0f0f1e)" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="reveal">
          <SectionLabel icon={<RefreshCw size={12} />} dark>
            매달 실행하는 리밸런싱
          </SectionLabel>
          <SectionHeading
            dark
            style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", marginBottom: 16 }}
          >
            목표 비율과 실제 비율의
            <br />
            괴리를 정확히 계산
          </SectionHeading>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.75,
              marginBottom: 24,
            }}
          >
            단순 적립이 아닙니다. 보유 현황을 반영해 목표 비율 대비 부족한 종목은
            매수하고, 초과된 종목은 매도하도록 안내합니다.
          </p>
          <div className="flex flex-col gap-3">
            {rebalancingFeatures.map(({ icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  style={{
                    width: 36,
                    height: 36,
                    background: "rgba(53,93,249,0.2)",
                    borderRadius: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {icon}
                </div>
                <span
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {text}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="reveal" style={{ animationDelay: "100ms" }}>
          <div
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20,
              padding: 24,
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "rgba(255,255,255,0.5)",
                marginBottom: 16,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              이달의 매수·매도 가이드
            </div>
            <div className="flex flex-col gap-3">
              {rebalancingActions.map(({ t, dot, from, to, chip, amt }) => (
                <div
                  key={t}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: dot,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}
                      >
                        {t}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                        }}
                      >
                        현재 {from}% → 목표 {to}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {chip}
                    {amt && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "rgba(255,255,255,0.4)",
                          marginTop: 3,
                        }}
                      >
                        {amt}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 16,
                paddingTop: 16,
                borderTop: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
                이번달 실행 후 총 투자금
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
                5,124,000원
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

