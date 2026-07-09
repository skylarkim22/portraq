import { MessageCircle, Star } from "lucide-react";

const testimonials = [
  {
    text: '"레이 달리오 올웨더 포트폴리오를 직접 구성하려고 했는데, Portraq 덕분에 5분 만에 설정 완료했어요. 매달 얼마씩 사야 하는지 딱 나오니까 너무 편해요."',
    name: "하윤서",
    role: "마케팅 리드, 스텔라랩스",
    avatar: "https://i.pravatar.cc/150?u=hanyunseo",
    stars: 5,
  },
  {
    text: '"캐시 우드 전략이 CAGR +13.5%라는 걸 보고 처음엔 반신반의했어요. 근데 MDD까지 보여주니 리스크를 객관적으로 판단할 수 있어서 믿음이 갔습니다."',
    name: "박도현",
    role: "프론트엔드 개발자, 베리파이",
    avatar: "https://i.pravatar.cc/150?u=parkdohyun",
    stars: 5,
  },
  {
    text: '"엑셀로 포트폴리오 관리하다가 정말 지쳐서 찾아봤어요. 가입하고 바로 써봤는데 매수 수량 계산이 너무 정확해서 계속 쓰고 있습니다."',
    name: "이서진",
    role: "스타트업 대표, 루미너스",
    avatar: "https://i.pravatar.cc/150?u=leeseojin",
    stars: 5,
  },
];

export const TestimonialsSection = () => (
  <section className="py-24 md:py-32" style={{ background: "#f8f9fe" }}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-14 reveal">
        <span
          className="section-label"
          style={{ display: "inline-flex", marginBottom: 16 }}
        >
          <MessageCircle size={12} /> 사용자 후기
        </span>
        <h2
          style={{
            fontSize: "clamp(2rem,4vw,2.8rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            color: "#1c1c1e",
            lineHeight: 1.15,
          }}
        >
          이미 1,247명이
          <br />
          매달 적립하고 있습니다
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal">
        {testimonials.map((t) => (
          <div key={t.name} className="card" style={{ padding: 28 }}>
            <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} size={16} color="#f59e0b" fill="#f59e0b" />
              ))}
            </div>
            <p
              style={{
                fontSize: 15,
                color: "#3c3c4e",
                lineHeight: 1.75,
                marginBottom: 20,
              }}
            >
              {t.text}
            </p>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.avatar}
                alt={t.name}
                width={40}
                height={40}
                style={{ borderRadius: "50%", objectFit: "cover" }}
                loading="lazy"
              />
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1c1c1e",
                  }}
                >
                  {t.name}
                </div>
                <div style={{ fontSize: 12, color: "#6b6b7b" }}>{t.role}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);
