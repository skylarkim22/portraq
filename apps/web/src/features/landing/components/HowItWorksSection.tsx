import { MapPin } from "lucide-react";
import { ActionChip } from "@portraq/ui";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

const steps = [
  {
    n: 1,
    title: "대가 포트폴리오 선택",
    desc: "5명의 투자 대가 중 마음에 드는 전략을 고르세요. CAGR과 MDD로 수익과 리스크를 직접 비교할 수 있습니다.",
    extra: (
      <div className="flex gap-2 flex-wrap" style={{ marginTop: 16 }}>
        <span className="badge badge-value">가치투자</span>
        <span className="badge badge-alloc">자산배분</span>
        <span className="badge badge-passive">패시브</span>
      </div>
    ),
  },
  {
    n: 2,
    title: "월 투자금 설정 및 조정",
    desc: "월 투자 예산을 입력하고, 종목 비중을 내 입맛에 맞게 조정하세요. 드래그앤드롭으로 순서도 바꿀 수 있습니다.",
    extra: (
      <div className="input-mock" style={{ marginTop: 16 }}>
        <span style={{ fontSize: 13 }}>이번 달 투자금</span>
        <span style={{ fontWeight: 800, color: "var(--portraq-primary)", fontSize: 14 }}>
          50만원
        </span>
      </div>
    ),
  },
  {
    n: 3,
    title: "매수·매도 가이드 확인",
    desc: "보유 주수와 현재가를 입력하면 종목별 매수·매도·유지 액션과 정확한 주수를 자동으로 계산합니다.",
    extra: (
      <div className="flex gap-2 flex-wrap" style={{ marginTop: 16 }}>
        <ActionChip action="buy">AAPL 매수 +2주</ActionChip>
        <ActionChip action="hold">KO 유지</ActionChip>
        <ActionChip action="sell">BAC 매도 -1주</ActionChip>
      </div>
    ),
  },
];

export const HowItWorksSection = () => (
  <section id="howto" className="py-24 md:py-32" style={{ background: "var(--surface-muted)" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16 reveal">
        <SectionLabel icon={<MapPin size={12} />}>사용법</SectionLabel>
        <SectionHeading>
          3단계로 시작하는
          <br />
          적립식 투자
        </SectionHeading>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
        {steps.map(({ n, title, desc, extra }) => (
          <div
            key={n}
            style={{
              padding: 32,
              background: "#fff",
              border: "1.5px solid var(--border-subtle)",
              borderRadius: 20,
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                background: "var(--portraq-primary)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
                fontWeight: 800,
                color: "#fff",
                marginBottom: 20,
              }}
            >
              {n}
            </div>
            <h3
              style={{
                fontSize: 19,
                fontWeight: 800,
                color: "var(--ink)",
                marginBottom: 10,
                letterSpacing: "-0.02em",
              }}
            >
              {title}
            </h3>
            <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.7 }}>
              {desc}
            </p>
            {extra}
          </div>
        ))}
      </div>
    </div>
  </section>
);

