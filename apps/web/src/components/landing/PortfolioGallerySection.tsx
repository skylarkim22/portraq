"use client";

import { useState } from "react";
import { ArrowRight, PlusCircle, Users } from "lucide-react";
import { portfolios } from "@/components/landing/data";

const PortfolioGallerySection = () => {
  const [openCardId, setOpenCardId] = useState<string | null>(null);

  const toggleCard = (id: string) =>
    setOpenCardId((prev) => (prev === id ? null : id));

  return (
    <section id="portfolios" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 reveal">
          <span
            className="section-label"
            style={{ display: "inline-flex", marginBottom: 16 }}
          >
            <Users size={12} /> 대가 포트폴리오
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
            검증된 투자 전략을
            <br />
            골라서 시작하세요
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#6b6b7b",
              marginTop: 14,
              lineHeight: 1.7,
            }}
          >
            주관적 리스크 등급 대신, CAGR과 MDD 수치로 직접 비교하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
          {portfolios.map((p) => (
            <div
              key={p.id}
              className="card"
              style={{
                padding: 0,
                cursor: "pointer",
                borderColor: openCardId === p.id ? "#355df9" : undefined,
              }}
              onClick={() => toggleCard(p.id)}
            >
              <div style={{ padding: 24 }}>
                <div
                  className="flex items-start justify-between"
                  style={{ marginBottom: 16 }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: "#1c1c1e",
                        marginBottom: 4,
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 13, color: "#6b6b7b" }}>
                      {p.subtitle}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    {p.badges.map((b) => (
                      <span key={b.label} className={`badge ${b.cls}`}>
                        {b.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="ratio-bar" style={{ marginBottom: 12 }}>
                  {p.ratioBar.map((s, i) => (
                    <div
                      key={i}
                      className="ratio-seg"
                      style={{ flex: s.flex, background: s.bg }}
                    />
                  ))}
                </div>
                <div className="flex justify-between">
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#6b6b7b",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      CAGR 10Y
                    </div>
                    <div
                      style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}
                    >
                      {p.cagr}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{
                        fontSize: 10,
                        color: "#6b6b7b",
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      최대낙폭 MDD
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: p.mddGreen ? "#16a34a" : "#dc2626",
                      }}
                    >
                      {p.mdd}
                    </div>
                  </div>
                </div>
              </div>
              {openCardId === p.id && (
                <div
                  style={{
                    padding: "0 24px 24px",
                    borderTop: "1.5px solid #f4f4f5",
                    animation:
                      "slideDown 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
                  }}
                >
                  <div
                    style={{
                      paddingTop: 16,
                      fontSize: 13,
                      color: "#6b6b7b",
                      lineHeight: 1.7,
                      marginBottom: 16,
                    }}
                  >
                    {p.description}
                  </div>
                  <a
                    href="/login"
                    className="btn-primary"
                    style={{
                      padding: 12,
                      fontSize: 12,
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    이 포트폴리오 사용하기 <ArrowRight size={14} />
                  </a>
                </div>
              )}
            </div>
          ))}

          <div
            className="card"
            style={{
              padding: 0,
              cursor: "pointer",
              borderStyle: "dashed",
              borderColor: "#c7d5fd",
            }}
          >
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 180,
                textAlign: "center",
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  background: "#eef2ff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PlusCircle size={26} color="#355df9" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#355df9",
                    marginBottom: 4,
                  }}
                >
                  직접 구성하기
                </div>
                <div style={{ fontSize: 13, color: "#6b6b7b" }}>
                  빈 포트폴리오에서 내 전략으로 시작
                </div>
              </div>
            </div>
          </div>
        </div>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#9ca3af",
            marginTop: 20,
          }}
        >
          * CAGR·MDD는 백테스트 기반 참고값입니다. 실제 수익률과 다를 수 있으며
          투자 참고 자료로만 활용하세요.
        </p>
      </div>
    </section>
  );
};

export default PortfolioGallerySection;
