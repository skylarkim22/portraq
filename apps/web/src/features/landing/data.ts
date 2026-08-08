export type JournalEntry = {
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
};

export type Portfolio = {
  id: string;
  name: string;
  subtitle: string;
  badges: { label: string; cls: string }[];
  ratioBar: { flex: number; bg: string }[];
  cagr: string;
  mdd: string;
  mddGreen?: boolean;
  description: string;
};

export const portfolios: Portfolio[] = [
  {
    id: "buffett",
    name: "워런 버핏",
    subtitle: "집중 투자, 우량주 중심",
    badges: [
      { label: "가치투자", cls: "badge-value" },
      { label: "US", cls: "badge-us" },
    ],
    ratioBar: [
      { flex: 42, bg: "#355df9" },
      { flex: 28, bg: "#6b8ffb" },
      { flex: 12, bg: "#93c5fd" },
      { flex: 10, bg: "#f59e0b" },
      { flex: 8, bg: "#e4e4e7" },
    ],
    cagr: "+10.4%",
    mdd: "-32.7%",
    description:
      '"위대한 기업을 합리적 가격에 산다." 장기 보유와 복리 효과를 믿는 집중 투자 전략. AAPL, BRK.B, BAC 중심의 우량주 포트폴리오.',
  },
  {
    id: "dalio",
    name: "레이 달리오",
    subtitle: "올웨더 포트폴리오",
    badges: [
      { label: "자산배분", cls: "badge-alloc" },
      { label: "US", cls: "badge-us" },
    ],
    ratioBar: [
      { flex: 30, bg: "#7c3aed" },
      { flex: 40, bg: "#a78bfa" },
      { flex: 7, bg: "#f59e0b" },
      { flex: 8, bg: "#10b981" },
      { flex: 15, bg: "#e4e4e7" },
    ],
    cagr: "+7.2%",
    mdd: "-12.4%",
    mddGreen: true,
    description:
      '"모든 경제 환경에서 살아남는다." 주식 30%, 장기채 40%, 금 7.5% 등 자산군을 분산해 MDD를 최소화하는 전천후 전략.',
  },
  {
    id: "wood",
    name: "캐시 우드",
    subtitle: "파괴적 혁신 성장주 투자",
    badges: [
      { label: "성장", cls: "badge-growth" },
      { label: "US", cls: "badge-us" },
    ],
    ratioBar: [
      { flex: 10, bg: "#dc2626" },
      { flex: 6, bg: "#f87171" },
      { flex: 5, bg: "#fca5a5" },
      { flex: 5, bg: "#fecaca" },
      { flex: 74, bg: "#e4e4e7" },
    ],
    cagr: "+13.5%",
    mdd: "-80.9%",
    description:
      '"미래를 바꿀 혁신에 투자한다." AI·유전체학·로보틱스 등 파괴적 혁신 기술에 집중 투자하는 고위험·고수익 성장 전략.',
  },
  {
    id: "burry",
    name: "마이클 버리",
    subtitle: "역발상 가치투자, 빅쇼트",
    badges: [
      { label: "가치투자", cls: "badge-value" },
      { label: "US", cls: "badge-us" },
    ],
    ratioBar: [
      { flex: 66, bg: "#c2410c" },
      { flex: 14, bg: "#f97316" },
      { flex: 11, bg: "#fbb67a" },
      { flex: 9, bg: "#e4e4e7" },
    ],
    cagr: "+26.7%",
    mdd: "-",
    description:
      '"시장이 틀렸을 때가 기회다." 저평가되거나 시장이 외면한 자산에 집중 베팅하는 역발상 가치투자 전략. 서브프라임 사태를 예견한 것으로 유명하다.',
  },
  {
    id: "bogle",
    name: "존 보글",
    subtitle: "인덱스 펀드 패시브 투자",
    badges: [
      { label: "패시브", cls: "badge-passive" },
      { label: "US", cls: "badge-us" },
    ],
    ratioBar: [
      { flex: 70, bg: "#f59e0b" },
      { flex: 30, bg: "#fcd34d" },
    ],
    cagr: "+9.8%",
    mdd: "-21.0%",
    description:
      '"비용을 줄이면 수익이 늘어난다." SPY 70%, BND 30%의 단순하고 강력한 인덱스 전략. 초보 투자자에게 가장 추천하는 전략.',
  },
];

export const calDays: (number | null)[] = [
  null,
  ...Array.from({ length: 30 }, (_, i) => i + 1),
  null,
  null,
  null,
  null,
];

export const journalDots: Record<number, "buy" | "sell" | "both"> = {
  5: "buy",
  10: "sell",
  15: "buy",
  22: "sell",
  25: "both",
};

export const journalEntries: Record<number, JournalEntry[]> = {
  5: [
    {
      type: "buy",
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 5,
      price: "$213.40",
      total: "$1,067.00",
      memo: "2분기 실적 발표 전 저가 매수 기회. PER 기준 역사적 하단에 위치함.",
    },
  ],
  10: [
    {
      type: "sell",
      ticker: "TSLA",
      name: "Tesla Inc.",
      quantity: 3,
      price: "$221.30",
      total: "$663.90",
      pnl: "+$122.40",
      pnlPct: "+22.8%",
      tax: "15,000원",
      netPnl: "+149,052원",
      memo: "목표가 도달, 일부 익절.",
    },
  ],
  15: [
    {
      type: "buy",
      ticker: "005930",
      name: "삼성전자",
      quantity: 10,
      price: "62,400원",
      total: "624,000원",
      memo: "배당 시즌 앞두고 저가 분할 매수 2차.",
    },
  ],
  22: [
    {
      type: "sell",
      ticker: "BRK.B",
      name: "Berkshire Hathaway",
      quantity: 2,
      price: "$183.20",
      total: "$366.40",
      pnl: "+$48.60",
      pnlPct: "+15.3%",
      tax: "8,200원",
      netPnl: "+55,118원",
      memo: "리밸런싱, 목표 비중 초과분 정리.",
    },
  ],
  25: [
    {
      type: "buy",
      ticker: "AAPL",
      name: "Apple Inc.",
      quantity: 3,
      price: "$213.40",
      total: "$640.20",
      memo: "분할 매수 3차. 물타기 아닌 목표 비중 채우기.",
    },
    {
      type: "sell",
      ticker: "005930",
      name: "삼성전자",
      quantity: 5,
      price: "64,000원",
      total: "320,000원",
      pnl: "+16,000원",
      pnlPct: "+5.3%",
      tax: "3,456원",
      netPnl: "+12,544원",
      memo: "목표 비율 초과, 일부 매도.",
    },
  ],
};
