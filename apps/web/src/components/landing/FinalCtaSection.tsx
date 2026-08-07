import { ArrowRight, CheckCircle, Rocket } from "lucide-react";

const FinalCtaSection = () => (
  <section className="py-24 md:py-32">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
      <div
        style={{
          background: "linear-gradient(135deg,#eef2ff,#f0f4ff)",
          border: "1.5px solid #c7d5fd",
          borderRadius: 28,
          padding: "56px 40px",
        }}
      >
        <span
          className="section-label"
          style={{ display: "inline-flex", marginBottom: 24 }}
        >
          <Rocket size={12} /> 지금 시작하기
        </span>
        <h2
          style={{
            fontSize: "clamp(2rem,4vw,3rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#1c1c1e",
            lineHeight: 1.15,
            marginBottom: 16,
          }}
        >
          오늘 투자 결정을
          <br />더 이상 미루지 마세요
        </h2>
        <p
          style={{
            fontSize: 17,
            color: "#6b6b7b",
            lineHeight: 1.75,
            maxWidth: "42ch",
            margin: "0 auto 32px",
          }}
        >
          워런 버핏, 레이 달리오의 검증된 포트폴리오를 그대로 따라 매달
          적립하세요.
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
          {["완전 무료", "대가 포트폴리오 5종 무료"].map((text) => (
            <div
              key={text}
              className="flex items-center gap-2"
              style={{ color: "#6b6b7b", fontSize: 13, fontWeight: 600 }}
            >
              <CheckCircle size={16} color="#16a34a" /> {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default FinalCtaSection;
