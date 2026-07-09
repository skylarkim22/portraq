"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import { useUser } from "@/features/auth/hooks";
import {
  ArrowRight,
  Award,
  BookOpen,
  Calculator,
  Calendar,
  CheckCircle,
  LayoutGrid,
  MapPin,
  MessageCircle,
  PlusCircle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

type FilterType = "all" | "passive" | "value" | "growth" | "alloc";

interface JournalEntry {
  type: "buy" | "sell";
  ticker: string;
  name: string;
  quantity: number;
  price: string;
  total: string;
  pnl?: string;
  pnlPct?: string;
  tax?: string;
  netPnl?: string;
  memo: string;
}

interface Portfolio {
  id: string;
  name: string;
  subtitle: string;
  type: Exclude<FilterType, "all">;
  badges: { label: string; cls: string }[];
  ratioBar: { flex: number; bg: string }[];
  cagr: string;
  mdd: string;
  mddGreen?: boolean;
  description: string;
}

const portfolios: Portfolio[] = [
  {
    id: "buffett",
    name: "워런 버핏",
    subtitle: "집중 투자, 우량주 중심",
    type: "value",
    badges: [{ label: "가치투자", cls: "badge-value" }, { label: "US", cls: "badge-us" }],
    ratioBar: [{ flex: 42, bg: "#355df9" }, { flex: 28, bg: "#6b8ffb" }, { flex: 12, bg: "#93c5fd" }, { flex: 10, bg: "#f59e0b" }, { flex: 8, bg: "#e4e4e7" }],
    cagr: "+10.4%",
    mdd: "-32.7%",
    description: '"위대한 기업을 합리적 가격에 산다." 장기 보유와 복리 효과를 믿는 집중 투자 전략. AAPL, BRK.B, BAC 중심의 우량주 포트폴리오.',
  },
  {
    id: "dalio",
    name: "레이 달리오",
    subtitle: "올웨더 포트폴리오",
    type: "alloc",
    badges: [{ label: "자산배분", cls: "badge-alloc" }, { label: "ETF", cls: "badge-etf" }],
    ratioBar: [{ flex: 30, bg: "#7c3aed" }, { flex: 40, bg: "#a78bfa" }, { flex: 7, bg: "#f59e0b" }, { flex: 8, bg: "#10b981" }, { flex: 15, bg: "#e4e4e7" }],
    cagr: "+7.2%",
    mdd: "-12.4%",
    mddGreen: true,
    description: '"모든 경제 환경에서 살아남는다." 주식 30%, 장기채 40%, 금 7.5% 등 자산군을 분산해 MDD를 최소화하는 전천후 전략.',
  },
  {
    id: "wood",
    name: "캐시 우드",
    subtitle: "파괴적 혁신 성장주 투자",
    type: "growth",
    badges: [{ label: "성장", cls: "badge-growth" }, { label: "US", cls: "badge-us" }],
    ratioBar: [{ flex: 10, bg: "#dc2626" }, { flex: 6, bg: "#f87171" }, { flex: 5, bg: "#fca5a5" }, { flex: 5, bg: "#fecaca" }, { flex: 74, bg: "#e4e4e7" }],
    cagr: "+13.5%",
    mdd: "-80.9%",
    description: '"미래를 바꿀 혁신에 투자한다." AI·유전체학·로보틱스 등 파괴적 혁신 기술에 집중 투자하는 고위험·고수익 성장 전략.',
  },
  {
    id: "burry",
    name: "마이클 버리",
    subtitle: "역발상 가치투자, 빅쇼트",
    type: "value",
    badges: [{ label: "가치투자", cls: "badge-value" }, { label: "US", cls: "badge-us" }],
    ratioBar: [{ flex: 66, bg: "#c2410c" }, { flex: 14, bg: "#f97316" }, { flex: 11, bg: "#fbb67a" }, { flex: 9, bg: "#e4e4e7" }],
    cagr: "+26.7%",
    mdd: "-",
    description: '"시장이 틀렸을 때가 기회다." 저평가되거나 시장이 외면한 자산에 집중 베팅하는 역발상 가치투자 전략. 서브프라임 사태를 예견한 것으로 유명하다.',
  },
  {
    id: "bogle",
    name: "존 보글",
    subtitle: "인덱스 펀드 패시브 투자",
    type: "passive",
    badges: [{ label: "패시브", cls: "badge-passive" }, { label: "ETF", cls: "badge-etf" }],
    ratioBar: [{ flex: 70, bg: "#f59e0b" }, { flex: 30, bg: "#fcd34d" }],
    cagr: "+9.8%",
    mdd: "-21.0%",
    description: '"비용을 줄이면 수익이 늘어난다." SPY 70%, BND 30%의 단순하고 강력한 인덱스 전략. 초보 투자자에게 가장 추천하는 전략.',
  },
];

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

const calDays: (number | null)[] = [
  null, 1, 2, 3, 4, 5, 6,
  7, 8, 9, 10, 11, 12, 13,
  14, 15, 16, 17, 18, 19, 20,
  21, 22, 23, 24, 25, 26, 27,
  28, 29, 30, null, null, null, null,
];
const journalDots: Record<number, "buy" | "sell" | "both"> = {
  5: "buy", 10: "sell", 15: "buy", 22: "sell", 25: "both",
};

const journalEntries: Record<number, JournalEntry[]> = {
  5: [
    { type: "buy", ticker: "AAPL", name: "Apple Inc.", quantity: 5, price: "$213.40", total: "$1,067.00", memo: "2분기 실적 발표 전 저가 매수 기회. PER 기준 역사적 하단에 위치함." },
  ],
  10: [
    { type: "sell", ticker: "TSLA", name: "Tesla Inc.", quantity: 3, price: "$221.30", total: "$663.90", pnl: "+$122.40", pnlPct: "+22.8%", tax: "15,000원", netPnl: "+149,052원", memo: "목표가 도달, 일부 익절." },
  ],
  15: [
    { type: "buy", ticker: "005930", name: "삼성전자", quantity: 10, price: "62,400원", total: "624,000원", memo: "배당 시즌 앞두고 저가 분할 매수 2차." },
  ],
  22: [
    { type: "sell", ticker: "BRK.B", name: "Berkshire Hathaway", quantity: 2, price: "$183.20", total: "$366.40", pnl: "+$48.60", pnlPct: "+15.3%", tax: "8,200원", netPnl: "+55,118원", memo: "리밸런싱, 목표 비중 초과분 정리." },
  ],
  25: [
    { type: "buy", ticker: "AAPL", name: "Apple Inc.", quantity: 3, price: "$213.40", total: "$640.20", memo: "분할 매수 3차. 물타기 아닌 목표 비중 채우기." },
    { type: "sell", ticker: "005930", name: "삼성전자", quantity: 5, price: "64,000원", total: "320,000원", pnl: "+16,000원", pnlPct: "+5.3%", tax: "3,456원", netPnl: "+12,544원", memo: "목표 비율 초과, 일부 매도." },
  ],
};

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "passive", label: "패시브" },
  { id: "value", label: "가치투자" },
  { id: "growth", label: "성장" },
  { id: "alloc", label: "자산배분" },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const { data: user, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    const els = document.querySelectorAll(".reveal");
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const bentoMap = [
      { id: "bento-1", lg: "1 / span 7" },
      { id: "bento-2", lg: "8 / span 5" },
      { id: "bento-6", lg: "1 / span 12" },
    ];
    const update = () => {
      bentoMap.forEach(({ id, lg }) => {
        const el = document.getElementById(id) as HTMLElement | null;
        if (el) el.style.gridColumn = window.innerWidth >= 1024 ? lg : "span 12";
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const filtered = portfolios.filter(
    (p) => activeFilter === "all" || p.type === activeFilter
  );

  const toggleCard = (id: string) =>
    setOpenCardId((prev) => (prev === id ? null : id));

  return (
    <>
      <div className="noise" />

      {/* ── GNB ── */}
      <header className="nav-glass sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo size="sm" />
            <nav className="hidden md:flex items-center gap-1">
              {[
                ["#features", "기능"],
                ["#portfolios", "대가 포트폴리오"],
                ["#howto", "사용법"],
              ].map(([href, label]) => (
                <a key={label} href={href} style={{ textDecoration: "none", fontWeight: 600, fontSize: 14, color: "#4b5563", padding: "8px 16px", borderRadius: 8, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f9fafb"; (e.currentTarget as HTMLAnchorElement).style.color = "#111827"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; (e.currentTarget as HTMLAnchorElement).style.color = "#4b5563"; }}>
                  {label}
                </a>
              ))}
            </nav>
            {isUserLoading ? (
              <div className="animate-pulse" style={{ width: 76, height: 32, background: "#e4e4e7", borderRadius: 8 }} />
            ) : user ? (
              <a href="/home" className="btn-ghost" style={{ height: 32, padding: "0 14px", fontSize: 12 }}>
                내 포트폴리오
              </a>
            ) : (
              <a href="/login" className="btn-primary" style={{ height: 32, padding: "0 14px", fontSize: 12 }}>
                시작하기 <ArrowRight size={14} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-bg flex items-center pt-8 pb-16 md:py-0" style={{ minHeight: "100dvh" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center" style={{ minHeight: "80vh" }}>
            <div className="flex flex-col gap-6 reveal visible" style={{ animation: "fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards" }}>
              <span className="section-label" style={{ width: "fit-content" }}>
                <Star size={12} fill="currentColor" /> 적립식 투자 포트폴리오 관리
              </span>
              <h1 style={{ fontSize: "clamp(2.4rem,5vw,3.6rem)", fontWeight: 800, lineHeight: 1.12, letterSpacing: "-0.04em", color: "#1c1c1e", margin: 0 }}>
                대가의 전략으로<br /><span style={{ color: "#355df9" }}>매달 적립</span>하세요
              </h1>
              <p style={{ fontSize: 17, lineHeight: 1.75, color: "#6b6b7b", maxWidth: "46ch", margin: 0 }}>
                워런 버핏, 레이 달리오의 검증된 포트폴리오를 그대로 따라하세요. 종목 배분부터 매달 매수 수량까지 자동으로 계산해드립니다.
              </p>
              <div className="flex flex-wrap gap-3 items-center">
                {isUserLoading ? (
                  <div className="animate-pulse" style={{ width: 160, height: 50, background: "#e4e4e7", borderRadius: 8 }} />
                ) : user ? (
                  <a href="/home" className="btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
                    내 포트폴리오로 이동 <ArrowRight size={18} />
                  </a>
                ) : (
                  <a href="/login" className="btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
                    시작하기 <ArrowRight size={18} />
                  </a>
                )}
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {["완전 무료", "대가 포트폴리오 5종"].map((t) => (
                  <div key={t} className="flex items-center gap-2" style={{ color: "#6b6b7b", fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle size={16} color="#16a34a" /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end reveal mt-10 lg:mt-0" style={{ animationDelay: "120ms" }}>
              <div className="animate-float left-0 lg:left-[-16px]" style={{ position: "absolute", top: -24, zIndex: 10, background: "#fff", border: "1.5px solid #ebebef", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 24px rgba(53,93,249,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6b6b7b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>연평균 수익률</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>+10.4%</div>
                <div style={{ fontSize: 11, color: "#6b6b7b" }}>워런 버핏 · 10년 CAGR</div>
              </div>

              <div className="animate-float" style={{ animationDelay: "1.5s", position: "absolute", bottom: -8, right: -8, zIndex: 10, background: "#fff", border: "1.5px solid #ebebef", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6b6b7b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>이번달 액션</div>
                <div className="flex gap-1">
                  <span className="chip-buy">매수 3종</span>
                  <span className="chip-hold">유지 2종</span>
                </div>
              </div>

              <div className="portfolio-preview w-full max-w-sm" style={{ animation: "float 5s ease-in-out infinite", animationDelay: "0.5s" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b7b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 3 }}>대가 포트폴리오</div>
                    <div style={{ fontSize: 17, fontWeight: 800, color: "#1c1c1e" }}>워런 버핏 전략</div>
                  </div>
                  <div className="flex gap-1">
                    <span className="badge badge-value">가치투자</span>
                    <span className="badge badge-us">US</span>
                  </div>
                </div>
                <div className="ratio-bar" style={{ marginBottom: 12 }}>
                  {portfolios[0].ratioBar.map((s, i) => <div key={i} className="ratio-seg" style={{ flex: s.flex, background: s.bg }} />)}
                </div>
                <div className="flex flex-col gap-2" style={{ marginBottom: 20 }}>
                  {[
                    { t: "AAPL", n: "Apple", p: "42%", c: "#355df9" },
                    { t: "BRK.B", n: "Berkshire", p: "28%", c: "#6b8ffb" },
                    { t: "BAC", n: "Bank of America", p: "12%", c: "#93c5fd" },
                    { t: "KO", n: "Coca-Cola", p: "10%", c: "#f59e0b" },
                    { t: "기타", n: "", p: "8%", c: "#e4e4e7" },
                  ].map((h) => (
                    <div key={h.t} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div style={{ width: 9, height: 9, borderRadius: "50%", background: h.c }} />
                        <span style={{ fontSize: 13, fontWeight: h.n ? 700 : 600, color: h.n ? "#1c1c1e" : "#6b6b7b" }}>{h.t}</span>
                        {h.n && <span style={{ fontSize: 12, color: "#6b6b7b" }}>{h.n}</span>}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: h.n ? "#1c1c1e" : "#6b6b7b" }}>{h.p}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between" style={{ background: "#f8f9fe", borderRadius: 12, padding: "14px 16px" }}>
                  {[{ l: "CAGR (10Y)", v: "+10.4%", c: "#16a34a" }, { l: "최대낙폭 MDD", v: "-32.7%", c: "#dc2626" }, { l: "월 투자금", v: "50만원", c: "#1c1c1e" }].map((s, i, arr) => (
                    <span key={s.l} style={{ display: "contents" }}>
                      <div className="text-center">
                        <div style={{ fontSize: 11, color: "#6b6b7b", fontWeight: 600, marginBottom: 2 }}>{s.l}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: s.c }}>{s.v}</div>
                      </div>
                      {i < arr.length - 1 && <div style={{ width: 1, background: "#ebebef" }} />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 md:py-32" style={{ background: "#f8f9fe" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><LayoutGrid size={12} /> 핵심 기능</span>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.15 }}>
              투자에 필요한 모든 것,<br />하나의 앱에서
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 16 }}>
            {/* Bento 1 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 32 }} id="bento-1">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1">
                  <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><Award size={12} /> 대가 포트폴리오</span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1c1c1e", marginBottom: 12, letterSpacing: "-0.02em" }}>검증된 대가의 전략을<br />그대로 따라하세요</h3>
                  <p style={{ fontSize: 15, color: "#6b6b7b", lineHeight: 1.7, maxWidth: "38ch" }}>
                    워런 버핏, 레이 달리오, 캐시 우드 등 5명의 투자 대가 포트폴리오를 탭 하나로 불러오세요. 철학, CAGR, MDD까지 한눈에 비교됩니다.
                  </p>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 20 }}>
                    <span className="badge badge-value">가치투자</span>
                    <span className="badge badge-alloc">자산배분</span>
                    <span className="badge badge-passive">패시브</span>
                    <span className="badge badge-growth">성장</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3" style={{ minWidth: 0 }}>
                  {[
                    { name: "워런 버핏", cagr: "+10.4%", bar: [{ f: 42, bg: "#355df9" }, { f: 28, bg: "#6b8ffb" }, { f: 30, bg: "#ebebef" }] },
                    { name: "레이 달리오", cagr: "+7.2%", bar: [{ f: 30, bg: "#7c3aed" }, { f: 40, bg: "#a78bfa" }, { f: 15, bg: "#f59e0b" }, { f: 15, bg: "#ebebef" }] },
                    { name: "캐시 우드", cagr: "+13.5%", bar: [{ f: 43, bg: "#dc2626" }, { f: 57, bg: "#ebebef" }] },
                    { name: "존 보글", cagr: "+9.8%", bar: [{ f: 70, bg: "#f59e0b" }, { f: 30, bg: "#fcd34d" }] },
                  ].map((p) => (
                    <div key={p.name} className="card-surface" style={{ padding: 16, borderRadius: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#6b6b7b", marginBottom: 8 }}>{p.name}</div>
                      <div className="ratio-bar" style={{ marginBottom: 8 }}>
                        {p.bar.map((s, i) => <div key={i} className="ratio-seg" style={{ flex: s.f, background: s.bg }} />)}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#16a34a" }}>{p.cagr} CAGR</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento 2 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 28 }} id="bento-2">
              <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div style={{ width: 48, height: 48, background: "#eef2ff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <RefreshCw size={24} color="#355df9" />
                </div>
                <div className="flex-1">
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e", marginBottom: 8, letterSpacing: "-0.02em" }}>스마트 리밸런싱 가이드</h3>
                  <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.65, marginBottom: 14 }}>월 투자금과 보유 주수만 입력하면 종목별 매수·매도·유지 액션과 정확한 주문 수량까지 자동으로 계산해드립니다.</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="chip-buy">매수 +3주</span>
                    <span className="chip-sell">매도 -1주</span>
                    <span className="chip-hold">유지</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 6 — 매매 일지 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 32 }} id="bento-6">
              <div className="flex flex-col md:flex-row gap-8 md:items-start">
                <div style={{ flex: "0 0 auto", maxWidth: 360 }}>
                  <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><BookOpen size={12} /> 매매 일지</span>
                  <h3 style={{ fontSize: 22, fontWeight: 800, color: "#1c1c1e", marginBottom: 12, letterSpacing: "-0.02em" }}>매수·매도 이유를<br />기록으로 남기세요</h3>
                  <p style={{ fontSize: 15, color: "#6b6b7b", lineHeight: 1.7 }}>
                    왜 샀고, 왜 팔았는지. 종목·수량·가격과 함께 이유를 적어두면 시간이 지나도 내 판단을 돌아볼 수 있습니다.
                  </p>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
                  {/* Buy card */}
                  <div className="card-surface" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span className="chip-buy">매수</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>2026.06.25</span>
                    </div>
                    {[
                      { t: "AAPL", q: "5주", p: "$213.40", tot: "$1,067" },
                      { t: "005930", q: "10주", p: "62,400원", tot: "624,000원" },
                    ].map((item) => (
                      <div key={item.t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f4f4f5" }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>{item.t}</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>{item.q} · {item.p}</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>{item.tot}</div>
                        </div>
                      </div>
                    ))}
                    <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 12, fontStyle: "italic" }}>&ldquo;2분기 실적 발표 전 저가 매수 기회&rdquo;</p>
                  </div>
                  {/* Sell card */}
                  <div className="card-surface" style={{ padding: 20, borderRadius: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                      <span className="chip-sell">매도</span>
                      <span style={{ fontSize: 12, color: "#9ca3af" }}>2026.06.22</span>
                    </div>
                    <div style={{ padding: "8px 0", borderBottom: "1px solid #f4f4f5" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>TSLA</span>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: "#9ca3af" }}>3주 · $221.30</div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>$663.90</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#9ca3af" }}>
                        <span>평균단가</span>
                        <span>$180.50</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: "#9ca3af" }}>손익</span>
                        <span style={{ color: "#16a34a", fontWeight: 700 }}>+$122.40 (+22.8%)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                        <span style={{ color: "#9ca3af" }}>세금</span>
                        <span style={{ color: "#9ca3af" }}>−15,000원</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, marginTop: 6 }}>
                        <span style={{ color: "#1c1c1e" }}>세후 순손익</span>
                        <span style={{ color: "#16a34a" }}>+149,052원</span>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: "#9ca3af", marginTop: 12, fontStyle: "italic" }}>&ldquo;목표가 도달, 일부 익절&rdquo;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Portfolio gallery ── */}
      <section id="portfolios" className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 reveal">
            <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><Users size={12} /> 대가 포트폴리오</span>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.15 }}>
              검증된 투자 전략을<br />골라서 시작하세요
            </h2>
            <p style={{ fontSize: 16, color: "#6b6b7b", marginTop: 14, lineHeight: 1.7 }}>주관적 리스크 등급 대신, CAGR과 MDD 수치로 직접 비교하세요.</p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-8 reveal">
            {FILTERS.map((f) => (
              <button key={f.id} className={`tab-btn${activeFilter === f.id ? " active" : ""}`} onClick={() => { setActiveFilter(f.id); setOpenCardId(null); }}>
                {f.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 reveal">
            {filtered.map((p) => (
              <div key={p.id} className="card" style={{ padding: 0, cursor: "pointer", borderColor: openCardId === p.id ? "#355df9" : undefined }} onClick={() => toggleCard(p.id)}>
                <div style={{ padding: 24 }}>
                  <div className="flex items-start justify-between" style={{ marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 17, fontWeight: 800, color: "#1c1c1e", marginBottom: 4 }}>{p.name}</div>
                      <div style={{ fontSize: 13, color: "#6b6b7b" }}>{p.subtitle}</div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {p.badges.map((b) => <span key={b.label} className={`badge ${b.cls}`}>{b.label}</span>)}
                    </div>
                  </div>
                  <div className="ratio-bar" style={{ marginBottom: 12 }}>
                    {p.ratioBar.map((s, i) => <div key={i} className="ratio-seg" style={{ flex: s.flex, background: s.bg }} />)}
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div style={{ fontSize: 10, color: "#6b6b7b", fontWeight: 600, marginBottom: 2 }}>CAGR 10Y</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>{p.cagr}</div>
                    </div>
                    <div className="text-right">
                      <div style={{ fontSize: 10, color: "#6b6b7b", fontWeight: 600, marginBottom: 2 }}>최대낙폭 MDD</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: p.mddGreen ? "#16a34a" : "#dc2626" }}>{p.mdd}</div>
                    </div>
                  </div>
                </div>
                {openCardId === p.id && (
                  <div style={{ padding: "0 24px 24px", borderTop: "1.5px solid #f4f4f5", animation: "slideDown 0.3s cubic-bezier(0.16,1,0.3,1) forwards" }}>
                    <div style={{ paddingTop: 16, fontSize: 13, color: "#6b6b7b", lineHeight: 1.7, marginBottom: 16 }}>{p.description}</div>
                    <a href="/login" className="btn-primary" style={{ padding: 12, fontSize: 14, display: "flex", justifyContent: "center" }}>
                      이 포트폴리오 사용하기 <ArrowRight size={14} />
                    </a>
                  </div>
                )}
              </div>
            ))}

            <div className="card" style={{ padding: 0, cursor: "pointer", borderStyle: "dashed", borderColor: "#c7d5fd" }}>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 180, textAlign: "center", gap: 12 }}>
                <div style={{ width: 52, height: 52, background: "#eef2ff", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlusCircle size={26} color="#355df9" />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#355df9", marginBottom: 4 }}>직접 구성하기</div>
                  <div style={{ fontSize: 13, color: "#6b6b7b" }}>빈 포트폴리오에서 내 전략으로 시작</div>
                </div>
              </div>
            </div>
          </div>
          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
            * CAGR·MDD는 백테스트 기반 참고값입니다. 실제 수익률과 다를 수 있으며 투자 참고 자료로만 활용하세요.
          </p>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="howto" className="py-24 md:py-32" style={{ background: "#f8f9fe" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 reveal">
            <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><MapPin size={12} /> 사용법</span>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.15 }}>
              3단계로 시작하는<br />적립식 투자
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 reveal">
            {[
              {
                n: 1, title: "대가 포트폴리오 선택",
                desc: "5명의 투자 대가 중 마음에 드는 전략을 고르세요. CAGR과 MDD로 수익과 리스크를 직접 비교할 수 있습니다.",
                extra: <div className="flex gap-2 flex-wrap" style={{ marginTop: 16 }}><span className="badge badge-value">가치투자</span><span className="badge badge-alloc">자산배분</span><span className="badge badge-passive">패시브</span></div>,
              },
              {
                n: 2, title: "월 투자금 설정 및 조정",
                desc: "월 투자 예산을 입력하고, 종목 비중을 내 입맛에 맞게 조정하세요. 드래그앤드롭으로 순서도 바꿀 수 있습니다.",
                extra: <div className="input-mock" style={{ marginTop: 16 }}><span style={{ fontSize: 13 }}>이번 달 투자금</span><span style={{ fontWeight: 800, color: "#355df9", fontSize: 14 }}>50만원</span></div>,
              },
              {
                n: 3, title: "매수·매도 가이드 확인",
                desc: "보유 주수와 현재가를 입력하면 종목별 매수·매도·유지 액션과 정확한 주수를 자동으로 계산합니다.",
                extra: <div className="flex gap-2 flex-wrap" style={{ marginTop: 16 }}><span className="chip-buy">AAPL 매수 +2주</span><span className="chip-hold">KO 유지</span><span className="chip-sell">BAC 매도 -1주</span></div>,
              },
            ].map(({ n, title, desc, extra }) => (
              <div key={n} style={{ padding: 32, background: "#fff", border: "1.5px solid #ebebef", borderRadius: 20 }}>
                <div style={{ width: 40, height: 40, background: "#355df9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: "#fff", marginBottom: 20 }}>{n}</div>
                <h3 style={{ fontSize: 19, fontWeight: 800, color: "#1c1c1e", marginBottom: 10, letterSpacing: "-0.02em" }}>{title}</h3>
                <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.7 }}>{desc}</p>
                {extra}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Rebalancing demo ── */}
      <section className="py-24 md:py-32" style={{ background: "linear-gradient(135deg,#1c1c2e,#0f0f1e)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <span className="section-label" style={{ display: "inline-flex", marginBottom: 16, background: "rgba(53,93,249,0.2)", color: "#8fa8fb" }}><RefreshCw size={12} /> 매달 실행하는 리밸런싱</span>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
                목표 비율과 실제 비율의<br />괴리를 정확히 계산
              </h2>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.6)", lineHeight: 1.75, marginBottom: 24 }}>
                단순 적립이 아닙니다. 보유 현황을 반영해 목표 비율 대비 부족한 종목은 매수하고, 초과된 종목은 매도하도록 안내합니다.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: <Wallet size={18} color="#8fa8fb" />, text: "보유 주수 × 현재가로 실제 비율 자동 계산" },
                  { icon: <TrendingUp size={18} color="#8fa8fb" />, text: "괴리 5%p 이상 시 리밸런싱 알림 배지" },
                  { icon: <ShieldCheck size={18} color="#8fa8fb" />, text: "1주 미만 거래는 자동으로 유지 처리" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div style={{ width: 36, height: 36, background: "rgba(53,93,249,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                    <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{ animationDelay: "100ms" }}>
              <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.5)", marginBottom: 16, letterSpacing: "0.05em", textTransform: "uppercase" }}>이달의 매수·매도 가이드</div>
                <div className="flex flex-col gap-3">
                  {[
                    { t: "AAPL", dot: "#355df9", from: 38, to: 42, chip: <span className="chip-buy">매수 +2주</span>, amt: "약 437,000원" },
                    { t: "BRK.B", dot: "#6b8ffb", from: 30, to: 28, chip: <span className="chip-sell">매도 -1주</span>, amt: "약 58,000원" },
                    { t: "KO", dot: "#f59e0b", from: 10, to: 10, chip: <span className="chip-hold">유지</span>, amt: null },
                    { t: "BAC", dot: "#93c5fd", from: 9, to: 12, chip: <span className="chip-buy">매수 +3주</span>, amt: "약 145,000원" },
                  ].map(({ t, dot, from, to, chip, amt }) => (
                    <div key={t} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: dot, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{t}</div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>현재 {from}% → 목표 {to}%</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {chip}
                        {amt && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{amt}</div>}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>이번달 실행 후 총 투자금</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>5,124,000원</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trade Journal Calendar ── */}
      <section className="py-24 md:py-32" style={{ borderTop: "1.5px solid #ebebef" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="reveal">
              <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><Calendar size={12} /> 달력으로 보는 투자 흐름</span>
              <h2 style={{ fontSize: "clamp(1.8rem,3.5vw,2.6rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.2, marginBottom: 16 }}>
                월별 매매 기록을<br />한눈에 확인하세요
              </h2>
              <p style={{ fontSize: 16, color: "#6b6b7b", lineHeight: 1.75, marginBottom: 28 }}>
                달력에 매수·매도를 점으로 표시하고 월별 순손익, 세금 합계까지 한 화면에 정리합니다.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { icon: <TrendingUp size={18} color="#16a34a" />, bg: "#f0fdf4", title: "매수 기록", desc: "종목·수량·가격 입력 후 이유 메모" },
                  { icon: <TrendingDown size={18} color="#dc2626" />, bg: "#fef2f2", title: "매도 기록", desc: "보유 종목 기반 선택, 평균단가 손익 자동 계산" },
                  { icon: <Calculator size={18} color="#355df9" />, bg: "#eef2ff", title: "월별 통계", desc: "순손익·거래 횟수·시장 비중 요약" },
                ].map(({ icon, bg, title, desc }) => (
                  <div key={title} className="flex items-center gap-4">
                    <div style={{ width: 40, height: 40, background: bg, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e" }}>{title}</div>
                      <div style={{ fontSize: 13, color: "#6b6b7b" }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="reveal" style={{ animationDelay: "100ms", display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card" style={{ padding: 24 }}>
                {/* Calendar header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#1c1c1e" }}>2026년 6월</span>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, fontWeight: 600, color: "#6b6b7b" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />매수</span>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#dc2626" }} />매도</span>
                  </div>
                </div>

                {/* Day labels */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
                  {["일","월","화","수","목","금","토"].map((d) => (
                    <div key={d} style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", fontWeight: 600, paddingBottom: 6 }}>{d}</div>
                  ))}
                </div>

                {/* Days */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "2px 0" }}>
                  {calDays.map((day, i) => {
                    const dot = day ? journalDots[day] : undefined;
                    const isToday = day === 25;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "5px 0" }}>
                        {day ? (
                          <>
                            <span style={{ fontSize: 13, fontWeight: isToday ? 800 : 500, color: isToday ? "#355df9" : "#1c1c1e", width: 28, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: isToday ? "#eef2ff" : "transparent" }}>{day}</span>
                            <div style={{ display: "flex", gap: 2, marginTop: 2, height: 7 }}>
                              {(dot === "buy" || dot === "both") && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />}
                              {(dot === "sell" || dot === "both") && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />}
                            </div>
                          </>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {/* Monthly stats */}
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1.5px solid #f4f4f5" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#6b6b7b", marginBottom: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>6월 통계</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {[
                      { l: "총 매수금액", v: "2,891,000원", c: "#1c1c1e" },
                      { l: "총 매도금액", v: "1,719,000원", c: "#1c1c1e" },
                      { l: "세금 합계", v: "25,556원", c: "#6b6b7b" },
                      { l: "순손익", v: "+139,444원", c: "#16a34a" },
                    ].map(({ l, v, c }) => (
                      <div key={l} style={{ background: "#f8f9fe", borderRadius: 10, padding: "10px 12px" }}>
                        <div style={{ fontSize: 11, color: "#9ca3af", fontWeight: 600, marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10, background: "#f0fdf4", borderRadius: 10, padding: "10px 14px" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1c1c1e" }}>순수익률</span>
                    <span style={{ fontSize: 18, fontWeight: 800, color: "#16a34a" }}>+8.1%</span>
                  </div>
                </div>
              </div>

              {/* Date detail mockup — June 25 */}
              <div style={{ border: "1.5px solid #c7d5fd", borderRadius: 20, padding: 20, background: "#fff", boxShadow: "0 8px 32px rgba(53,93,249,0.08)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 14, borderBottom: "1.5px solid #f4f4f5" }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#dc2626", display: "inline-block" }} />
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#1c1c1e", letterSpacing: "-0.02em" }}>6월 25일 매매 기록</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {journalEntries[25].map((entry, i) => (
                    <div key={i} style={{ border: "1.5px solid #f4f4f5", borderRadius: 14, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                        <span className={entry.type === "buy" ? "chip-buy" : "chip-sell"}>{entry.type === "buy" ? "매수" : "매도"}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#1c1c1e" }}>{entry.ticker}</span>
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>{entry.name}</span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 8 }}>
                        {[
                          { l: "수량", v: `${entry.quantity}주` },
                          { l: "가격", v: entry.price },
                          { l: "합계", v: entry.total },
                        ].map(({ l, v }) => (
                          <div key={l} style={{ background: "#f8f9fe", borderRadius: 8, padding: "6px 8px" }}>
                            <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, marginBottom: 1 }}>{l}</div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: "#1c1c1e" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                      {entry.type === "sell" && entry.netPnl && (
                        <div style={{ display: "flex", justifyContent: "space-between", background: "#f0fdf4", borderRadius: 8, padding: "6px 10px", marginBottom: 8 }}>
                          <span style={{ fontSize: 12, color: "#6b6b7b" }}>세금 {entry.tax} · 세후 순손익</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#16a34a" }}>{entry.netPnl}</span>
                        </div>
                      )}
                      <p style={{ fontSize: 12, color: "#9ca3af", fontStyle: "italic", margin: 0 }}>&ldquo;{entry.memo}&rdquo;</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 md:py-32" style={{ background: "#f8f9fe" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 reveal">
            <span className="section-label" style={{ display: "inline-flex", marginBottom: 16 }}><MessageCircle size={12} /> 사용자 후기</span>
            <h2 style={{ fontSize: "clamp(2rem,4vw,2.8rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.15 }}>
              이미 1,247명이<br />매달 적립하고 있습니다
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 reveal">
            {testimonials.map((t) => (
              <div key={t.name} className="card" style={{ padding: 28 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }, (_, i) => <Star key={i} size={16} color="#f59e0b" fill="#f59e0b" />)}
                </div>
                <p style={{ fontSize: 15, color: "#3c3c4e", lineHeight: 1.75, marginBottom: 20 }}>{t.text}</p>
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.avatar} alt={t.name} width={40} height={40} style={{ borderRadius: "50%", objectFit: "cover" }} loading="lazy" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1c1c1e" }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: "#6b6b7b" }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center reveal">
          <div style={{ background: "linear-gradient(135deg,#eef2ff,#f0f4ff)", border: "1.5px solid #c7d5fd", borderRadius: 28, padding: "56px 40px" }}>
            <span className="section-label" style={{ display: "inline-flex", marginBottom: 24 }}><Rocket size={12} /> 지금 시작하기</span>
            <h2 style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 800, letterSpacing: "-0.04em", color: "#1c1c1e", lineHeight: 1.15, marginBottom: 16 }}>
              오늘 투자 결정을<br />더 이상 미루지 마세요
            </h2>
            <p style={{ fontSize: 17, color: "#6b6b7b", lineHeight: 1.75, maxWidth: "42ch", margin: "0 auto 32px" }}>
              워런 버핏, 레이 달리오의 검증된 포트폴리오를 그대로 따라 매달 적립하세요.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="/login" className="btn-primary" style={{ padding: "16px 36px", fontSize: 16 }}>시작하기 <ArrowRight size={20} /></a>
            </div>
            <div className="flex items-center justify-center gap-6 flex-wrap" style={{ marginTop: 32 }}>
              {["완전 무료", "대가 포트폴리오 5종 무료"].map((text) => (
                <div key={text} className="flex items-center gap-2" style={{ color: "#6b6b7b", fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle size={16} color="#16a34a" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: "#f8f9fe", borderTop: "1.5px solid #ebebef" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <Logo size="sm" href="/" />
            <div className="flex flex-wrap gap-6">
              <a href="#" className="footer-link">개인정보처리방침</a>
              <a href="#" className="footer-link">이용약관</a>
            </div>
          </div>
          <div style={{ paddingTop: 12 }}>
            <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.7 }}>
              Portraq는 투자 정보 제공 서비스로, 투자 조언이나 추천을 제공하지 않습니다. 모든 투자 결정은 투자자 본인의 판단과 책임 하에 이루어져야 합니다.<br />
              CAGR·MDD는 백테스트 기반 참고값으로 실제 수익률과 다를 수 있으며, 원금 손실의 위험이 있습니다.
            </p>
            <p style={{ fontSize: 12, color: "#9ca3af", marginTop: 8 }}>© 2026 Portraq. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
