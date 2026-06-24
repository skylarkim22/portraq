"use client";

import { useEffect, useRef, useState } from "react";
import Logo from "@/components/Logo";
import {
  ArrowRight,
  Award,
  Calculator,
  CheckCircle,
  Eye,
  GripVertical,
  LayoutGrid,
  MapPin,
  Menu,
  MessageCircle,
  PlayCircle,
  PlusCircle,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";

type FilterType = "all" | "passive" | "value" | "quant" | "alloc";

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
    id: "lynch",
    name: "피터 린치",
    subtitle: "아는 기업에 투자하라",
    type: "value",
    badges: [{ label: "가치투자", cls: "badge-value" }, { label: "KR", cls: "badge-kr" }],
    ratioBar: [{ flex: 20, bg: "#c2410c" }, { flex: 18, bg: "#f97316" }, { flex: 15, bg: "#fbb67a" }, { flex: 15, bg: "#fcd9be" }, { flex: 32, bg: "#e4e4e7" }],
    cagr: "+11.3%",
    mdd: "-28.1%",
    description: '"당신이 이해하는 기업에 투자하라." 일상에서 발견한 성장주를 중심으로 한국·미국 시장을 병행하는 성장 가치 전략.',
  },
  {
    id: "kang",
    name: "강환국",
    subtitle: "퀀트 기반 팩터 투자",
    type: "quant",
    badges: [{ label: "퀀트·팩터", cls: "badge-quant" }, { label: "KR", cls: "badge-kr" }],
    ratioBar: [{ flex: 35, bg: "#10b981" }, { flex: 25, bg: "#34d399" }, { flex: 20, bg: "#6ee7b7" }, { flex: 20, bg: "#e4e4e7" }],
    cagr: "+12.1%",
    mdd: "-22.3%",
    description: '"감이 아닌 숫자로 투자한다." 저PBR·모멘텀 등 팩터 지표를 활용해 한국 시장에 최적화된 퀀트 전략. 국내 가장 높은 CAGR.',
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
    text: '"강환국 퀀트 전략이 CAGR +12.1%라는 걸 보고 처음엔 반신반의했어요. 근데 MDD까지 보여주니 리스크를 객관적으로 판단할 수 있어서 믿음이 갔습니다."',
    name: "박도현",
    role: "프론트엔드 개발자, 베리파이",
    avatar: "https://i.pravatar.cc/150?u=parkdohyun",
    stars: 5,
  },
  {
    text: '"엑셀로 포트폴리오 관리하다가 정말 지쳐서 찾아봤어요. 맛보기로 먼저 써봤는데 매수 수량 계산이 너무 정확해서 바로 가입했습니다."',
    name: "이서진",
    role: "스타트업 대표, 루미너스",
    avatar: "https://i.pravatar.cc/150?u=leeseojin",
    stars: 5,
  },
];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "passive", label: "패시브" },
  { id: "value", label: "가치투자" },
  { id: "quant", label: "퀀트·팩터" },
  { id: "alloc", label: "자산배분" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

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
      { id: "bento-3", lg: "1 / span 4" },
      { id: "bento-4", lg: "5 / span 4" },
      { id: "bento-5", lg: "9 / span 4" },
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

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    const obs = new IntersectionObserver(
      (entries) => setStickyVisible(!entries[0].isIntersecting),
      { threshold: 0.1 }
    );
    obs.observe(hero);
    return () => obs.disconnect();
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
              {[["#features", "기능"], ["#portfolios", "대가 포트폴리오"], ["#howto", "사용법"]].map(([href, label]) => (
                <a key={href} href={href} style={{ textDecoration: "none", fontWeight: 600, fontSize: 14, color: "#4b5563", padding: "8px 16px", borderRadius: 8, transition: "all 0.2s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#f9fafb"; (e.currentTarget as HTMLAnchorElement).style.color = "#111827"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = ""; (e.currentTarget as HTMLAnchorElement).style.color = "#4b5563"; }}>
                  {label}
                </a>
              ))}
            </nav>
            <div className="hidden md:flex items-center gap-3">
              <a href="#" className="btn-primary" style={{ padding: "10px 22px", fontSize: 14 }}>
                무료로 시작하기 <ArrowRight size={16} />
              </a>
            </div>
            <button onClick={() => setMobileMenuOpen(true)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 8, borderRadius: 8 }} className="md:hidden">
              <Menu size={24} color="#1c1c1e" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ── */}
      <div className={`mobile-menu${mobileMenuOpen ? " open" : ""}`}>
        <div className="flex items-center justify-between" style={{ marginBottom: 48 }}>
          <Logo size="sm" />
          <button onClick={() => setMobileMenuOpen(false)} style={{ border: "none", background: "transparent", cursor: "pointer", padding: 8 }}>
            <X size={28} color="#6b7280" />
          </button>
        </div>
        <nav className="flex flex-col gap-2 flex-1">
          {[["#features", "기능"], ["#portfolios", "대가 포트폴리오"], ["#howto", "사용법"]].map(([href, label]) => (
            <a key={href} href={href} style={{ fontSize: 24, fontWeight: 700, textDecoration: "none", color: "#1c1c1e", padding: "12px 0" }} onClick={() => setMobileMenuOpen(false)}>
              {label}
            </a>
          ))}
        </nav>
        <div className="flex flex-col gap-3" style={{ paddingBottom: 32 }}>
          <a href="#" className="btn-primary" style={{ padding: 16, justifyContent: "center" }}>
            무료로 시작하기 <ArrowRight size={16} />
          </a>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="hero-bg flex items-center pt-8 pb-16 md:py-0" style={{ minHeight: "100dvh" }} ref={heroRef}>
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
                <a href="#" className="btn-primary" style={{ fontSize: 15, padding: "14px 28px" }}>
                  맛보기 시작 <PlayCircle size={18} />
                </a>
              </div>
              <div className="flex items-center gap-5 flex-wrap">
                {["가입 없이 체험 가능", "완전 무료", "대가 포트폴리오 5종"].map((t) => (
                  <div key={t} className="flex items-center gap-2" style={{ color: "#6b6b7b", fontSize: 13, fontWeight: 600 }}>
                    <CheckCircle size={16} color="#16a34a" /> {t}
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex justify-center lg:justify-end reveal" style={{ animationDelay: "120ms" }}>
              <div className="animate-float" style={{ position: "absolute", top: -24, left: -16, zIndex: 10, background: "#fff", border: "1.5px solid #ebebef", borderRadius: 12, padding: "12px 16px", boxShadow: "0 8px 24px rgba(53,93,249,0.12)" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#6b6b7b", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>연평균 수익률</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#16a34a" }}>+12.1%</div>
                <div style={{ fontSize: 11, color: "#6b6b7b" }}>강환국 · 10년 CAGR</div>
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

      {/* ── Stats strip ── */}
      <section style={{ background: "#f8f9fe", borderTop: "1.5px solid #ebebef", borderBottom: "1.5px solid #ebebef" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center reveal">
            {[
              { v: "5개", l: "대가 포트폴리오 전략", c: "#355df9" },
              { v: "+12.1%", l: "최대 연평균 CAGR", c: "#16a34a" },
              { v: "1,247+", l: "사용 중인 투자자", c: "#1c1c1e" },
              { v: "0원", l: "가입 없이 바로 체험", c: "#1c1c1e" },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center gap-1">
                <div style={{ fontSize: 28, fontWeight: 800, color: s.c, letterSpacing: "-0.03em" }}>{s.v}</div>
                <div style={{ fontSize: 13, color: "#6b6b7b", fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 md:py-32">
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
                    워런 버핏, 레이 달리오, 피터 린치 등 5명의 투자 대가 포트폴리오를 탭 하나로 불러오세요. 철학, CAGR, MDD까지 한눈에 비교됩니다.
                  </p>
                  <div className="flex flex-wrap gap-2" style={{ marginTop: 20 }}>
                    <span className="badge badge-value">가치투자</span>
                    <span className="badge badge-alloc">자산배분</span>
                    <span className="badge badge-passive">패시브</span>
                    <span className="badge badge-quant">퀀트·팩터</span>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-3" style={{ minWidth: 0 }}>
                  {[
                    { name: "워런 버핏", cagr: "+10.4%", bar: [{ f: 42, bg: "#355df9" }, { f: 28, bg: "#6b8ffb" }, { f: 30, bg: "#ebebef" }] },
                    { name: "레이 달리오", cagr: "+7.2%", bar: [{ f: 30, bg: "#7c3aed" }, { f: 40, bg: "#a78bfa" }, { f: 15, bg: "#f59e0b" }, { f: 15, bg: "#ebebef" }] },
                    { name: "강환국", cagr: "+12.1%", bar: [{ f: 35, bg: "#10b981" }, { f: 25, bg: "#34d399" }, { f: 40, bg: "#ebebef" }] },
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
                  <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.65, marginBottom: 14 }}>보유 주수와 현재가를 입력하면 매수·매도·유지 액션을 자동으로 계산해드립니다.</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="chip-buy">매수 +3주</span>
                    <span className="chip-sell">매도 -1주</span>
                    <span className="chip-hold">유지</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento 3 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 28 }} id="bento-3">
              <div style={{ width: 48, height: 48, background: "#f0fdf4", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Calculator size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e", marginBottom: 8, letterSpacing: "-0.02em" }}>매수 수량 자동 계산</h3>
              <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.65 }}>월 투자금을 입력하면 종목별 투자 금액과 매수 주수를 자동으로 계산합니다.</p>
              <div className="input-mock" style={{ marginTop: 16 }}>
                <span>월 투자금</span>
                <span style={{ fontWeight: 800, color: "#355df9" }}>500,000원</span>
              </div>
            </div>

            {/* Bento 4 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 28 }} id="bento-4">
              <div style={{ width: 48, height: 48, background: "#fff7ed", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <GripVertical size={24} color="#c2410c" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e", marginBottom: 8, letterSpacing: "-0.02em" }}>드래그앤드롭 편집</h3>
              <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.65 }}>종목 카드를 드래그해 순서를 바꾸고, 슬라이더로 비중을 바로 조정하세요.</p>
            </div>

            {/* Bento 5 */}
            <div className="card reveal" style={{ gridColumn: "span 12", padding: 28, background: "linear-gradient(135deg,#eef2ff,#f0f4ff)" }} id="bento-5">
              <div style={{ width: 48, height: 48, background: "#fff", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: "0 2px 8px rgba(53,93,249,0.15)" }}>
                <Eye size={24} color="#355df9" />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1c1c1e", marginBottom: 8, letterSpacing: "-0.02em" }}>가입 없이 맛보기</h3>
              <p style={{ fontSize: 14, color: "#6b6b7b", lineHeight: 1.65 }}>회원가입 없이도 포트폴리오 편집과 매수 수량 계산을 모두 체험할 수 있습니다.</p>
              <a href="#" className="btn-primary" style={{ marginTop: 16, padding: "10px 20px", fontSize: 13, display: "inline-flex" }}>
                지금 체험하기 <ArrowRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Portfolio gallery ── */}
      <section id="portfolios" className="py-24 md:py-32" style={{ background: "#f8f9fe", borderTop: "1.5px solid #ebebef" }}>
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
                    <a href="#" className="btn-primary" style={{ padding: 12, fontSize: 14, display: "flex", justifyContent: "center" }}>
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
      <section id="howto" className="py-24 md:py-32">
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
              <div key={n} style={{ padding: 32, background: "#f8f9fe", border: "1.5px solid #ebebef", borderRadius: 20 }}>
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

      {/* ── Testimonials ── */}
      <section className="py-24 md:py-32" style={{ background: "#f8f9fe", borderTop: "1.5px solid #ebebef" }}>
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
              회원가입 없이 맛보기를 먼저 체험하세요. 포트폴리오를 저장할 때 가입하면 됩니다.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href="#" className="btn-primary" style={{ padding: "16px 36px", fontSize: 16 }}>무료로 맛보기 시작 <PlayCircle size={20} /></a>
            </div>
            <div className="flex items-center justify-center gap-6 flex-wrap" style={{ marginTop: 32 }}>
              {["신용카드 불필요", "가입 없이 체험", "대가 포트폴리오 5종 무료"].map((text) => (
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

      {/* ── Sticky CTA (mobile) ── */}
      <div className={`sticky-bar md:hidden${stickyVisible ? " visible" : ""}`}>
        <div className="px-4 py-3">
          <a href="#" className="btn-primary w-full" style={{ padding: 12, fontSize: 14, justifyContent: "center" }}>무료로 맛보기 시작</a>
        </div>
      </div>
    </>
  );
}
