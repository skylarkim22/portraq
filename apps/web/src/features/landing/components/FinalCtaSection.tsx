import { ArrowRight, CheckCircle, Rocket } from "lucide-react";
import { SectionHeading } from "@/features/landing/components/SectionHeading";
import { SectionLabel } from "@/features/landing/components/SectionLabel";

export const FinalCtaSection = () => (
  <section className="py-24 md:py-32">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
      <div
        style={{
          background: "linear-gradient(135deg,var(--primary-tint),#f0f4ff)",
          border: "1.5px solid var(--primary-border)",
          borderRadius: 28,
          padding: "56px 40px",
        }}
      >
        <SectionLabel icon={<Rocket size={12} />} style={{ marginBottom: 24 }}>
          지금 시작하기
        </SectionLabel>
        <SectionHeading
          style={{ fontSize: "clamp(2rem,4vw,3rem)", marginBottom: 16 }}
        >
          오늘 투자 결정을
          <br />더 이상 미루지 마세요
        </SectionHeading>
        <p
          style={{
            fontSize: 17,
            color: "var(--text-muted)",
            lineHeight: 1.75,
            maxWidth: "42ch",
            margin: "0 auto 32px",
          }}
        >
          직접 구성한 포트폴리오든, 워런 버핏·레이 달리오의 검증된 전략이든
          매달 자동으로 적립하세요.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/login"
            className="btn-primary"
            style={{ padding: "16px 36px", fontSize: 16 }}
          >
            시작하기 <ArrowRight size={20} />
          </a>
        </div>
        <div
          className="flex items-center justify-center gap-6 flex-wrap"
          style={{ marginTop: 32 }}
        >
          {["완전 무료", "종목 자유 구성", "대가 템플릿 5종 무료"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-2"
              style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 600 }}
            >
              <CheckCircle size={16} color="var(--buy)" /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

