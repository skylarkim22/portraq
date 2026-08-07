import { Calculator, Calendar, TrendingDown, TrendingUp } from "lucide-react";
import { calDays, journalDots, journalEntries } from "@/components/landing/data";
import JournalEntryCard from "@/components/landing/JournalEntryCard";

const TODAY = 25;

const journalFeatures = [
  {
    icon: <TrendingUp size={18} color="#16a34a" />,
    bg: "#f0fdf4",
    title: "매수 기록",
    desc: "종목·수량·가격 입력 후 이유 메모",
  },
  {
    icon: <TrendingDown size={18} color="#dc2626" />,
    bg: "#fef2f2",
    title: "매도 기록",
    desc: "보유 종목 기반 선택, 평균단가 손익 자동 계산",
  },
  {
    icon: <Calculator size={18} color="#355df9" />,
    bg: "#eef2ff",
    title: "월별 통계",
    desc: "순손익·거래 횟수·시장 비중 요약",
  },
];

const monthlyStats = [
  { l: "총 매수금액", v: "2,891,000원", c: "#1c1c1e" },
  { l: "총 매도금액", v: "1,719,000원", c: "#1c1c1e" },
  { l: "세금 합계", v: "25,556원", c: "#6b6b7b" },
  { l: "순손익", v: "+139,444원", c: "#16a34a" },
];

const TradeJournalSection = () => (
  <section
    className="py-24 md:py-32"
    style={{ borderTop: "1.5px solid #ebebef", background: "#f8f9fe" }}
  >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="reveal">
          <span
            className="section-label"
            style={{ display: "inline-flex", marginBottom: 16 }}
          >
            <Calendar size={12} /> 달력으로 보는 투자 흐름
          </span>
          <h2
            style={{
              fontSize: "clamp(1.8rem,3.5vw,2.6rem)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#1c1c1e",
              lineHeight: 1.2,
              marginBottom: 16,
            }}
          >
            월별 매매 기록을
            <br />
            한눈에 확인하세요
          </h2>
          <p
            style={{
              fontSize: 16,
              color: "#6b6b7b",
              lineHeight: 1.75,
              marginBottom: 28,
            }}
          >
            달력에 매수·매도를 점으로 표시하고 월별 순손익, 세금 합계까지 한
            화면에 정리합니다.
          </p>
          <div className="flex flex-col gap-4">
            {journalFeatures.map(({ icon, bg, title, desc }) => (
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
                    style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e" }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: 13, color: "#6b6b7b" }}>{desc}</div>
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
            {/* Calendar header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <span
                style={{ fontSize: 15, fontWeight: 800, color: "#1c1c1e" }}
              >
                2026년 6월
              </span>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#6b6b7b",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#16a34a",
                    }}
                  />
                  매수
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span
                    style={{
                      display: "inline-block",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#dc2626",
                    }}
                  />
                  매도
                </span>
              </div>
            </div>

            {/* Day labels */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                marginBottom: 6,
              }}
            >
              {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
                <div
                  key={d}
                  style={{
                    textAlign: "center",
                    fontSize: 11,
                    color: "#9ca3af",
                    fontWeight: 600,
                    paddingBottom: 6,
                  }}
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Days */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(7,1fr)",
                gap: "2px 0",
              }}
            >
              {calDays.map((day, i) => {
                const dot = day ? journalDots[day] : undefined;
                const isToday = day === TODAY;
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "5px 0",
                    }}
                  >
                    {day ? (
                      <>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isToday ? 800 : 500,
                            color: isToday ? "#355df9" : "#1c1c1e",
                            width: 28,
                            height: 32,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "50%",
                            background: isToday ? "#eef2ff" : "transparent",
                          }}
                        >
                          {day}
                        </span>
                        <div
                          style={{
                            display: "flex",
                            gap: 2,
                            marginTop: 2,
                            height: 7,
                          }}
                        >
                          {(dot === "buy" || dot === "both") && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#16a34a",
                                display: "inline-block",
                              }}
                            />
                          )}
                          {(dot === "sell" || dot === "both") && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: "50%",
                                background: "#dc2626",
                                display: "inline-block",
                              }}
                            />
                          )}
                        </div>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>

            {/* Monthly stats */}
            <div
              style={{
                marginTop: 20,
                paddingTop: 20,
                borderTop: "1.5px solid #f4f4f5",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#6b6b7b",
                  marginBottom: 12,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                6월 통계
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                {monthlyStats.map(({ l, v, c }) => (
                  <div
                    key={l}
                    style={{
                      background: "#f8f9fe",
                      borderRadius: 10,
                      padding: "10px 12px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
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
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: 10,
                  background: "#f0fdf4",
                  borderRadius: 10,
                  padding: "10px 14px",
                }}
              >
                <span
                  style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}
                >
                  순수익률
                </span>
                <span
                  style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}
                >
                  +8.1%
                </span>
              </div>
            </div>
          </div>

          {/* Date detail mockup — June 25 */}
          <div
            className="border-[1.5px] border-[#ebebef] transition-all duration-[0.4s] ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-[3px] hover:border-[#c7d5fd] hover:shadow-[0_12px_40px_rgba(53,93,249,0.09),0_2px_8px_rgba(0,0,0,0.04)]"
            style={{ borderRadius: 20, padding: 20, background: "#fff" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 16,
                paddingBottom: 14,
                borderBottom: "1.5px solid #f4f4f5",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  color: "#1c1c1e",
                  letterSpacing: "-0.02em",
                }}
              >
                6월 25일 매매 기록
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {journalEntries[TODAY].map((entry, i) => (
                <JournalEntryCard key={i} entry={entry} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default TradeJournalSection;
