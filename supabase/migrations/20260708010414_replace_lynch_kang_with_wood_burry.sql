-- strategy CHECK 제약에 'growth'를 추가한다 (캐시 우드의 파괴적 혁신 성장주
-- 전략은 기존 passive/value/quant/asset-allocation 어디에도 맞지 않는다).
ALTER TABLE portfolio_templates DROP CONSTRAINT IF EXISTS portfolio_templates_strategy_check;
ALTER TABLE portfolio_templates
  ADD CONSTRAINT portfolio_templates_strategy_check
  CHECK (strategy IN ('passive', 'value', 'quant', 'asset-allocation', 'growth'));

-- 피터 린치(1990년 은퇴, 현재 포트폴리오 없음)와 강환국(공개 자료상 단일
-- 출처로 확인되지 않는 합성 모델)을 캐시 우드(ARK Invest)와 마이클 버리
-- (Scion Asset Management)로 교체한다. 둘 다 현재 활동 중이며 13F/일일
-- 공개 데이터로 검증 가능하다.
DELETE FROM portfolio_templates WHERE id IN ('peter-lynch', 'kang-hwan-guk');

INSERT INTO portfolio_templates (id, name, strategy, market, cagr, mdd, description, source_date, assets) VALUES
(
  'cathie-wood',
  '캐시 우드',
  'growth',
  'US',
  13.5,
  -80.9,
  'AI·유전체학·로보틱스·핀테크 등 파괴적 혁신 기술에 집중 투자하는 액티브 성장주 전략. ARK Invest의 대표 펀드 ARKK 기준이며, 고위험·고변동성으로 2021년 고점 대비 80% 넘게 하락한 적이 있다.',
  '2026-07-06',
  '[
    {"ticker": "TSLA", "name": "Tesla",                 "market": "US", "ratio": 9.9, "sort_order": 1},
    {"ticker": "TEM",  "name": "Tempus AI",              "market": "US", "ratio": 5.8, "sort_order": 2},
    {"ticker": "CRSP", "name": "CRISPR Therapeutics",    "market": "US", "ratio": 5.3, "sort_order": 3},
    {"ticker": "HOOD", "name": "Robinhood Markets",      "market": "US", "ratio": 5.0, "sort_order": 4},
    {"ticker": "AMD",  "name": "Advanced Micro Devices", "market": "US", "ratio": 4.4, "sort_order": 5},
    {"ticker": "SHOP", "name": "Shopify",                "market": "US", "ratio": 4.3, "sort_order": 6},
    {"ticker": "SPCX", "name": "SpaceX",                 "market": "US", "ratio": 4.2, "sort_order": 7},
    {"ticker": "COIN", "name": "Coinbase Global",        "market": "US", "ratio": 4.0, "sort_order": 8},
    {"ticker": null,   "name": "기타 ARK 보유 종목(40여개)", "market": "US", "ratio": 57.1, "sort_order": 9}
  ]'
),
(
  'michael-burry',
  '마이클 버리',
  'value',
  'US',
  26.7,
  null,
  '"빅쇼트"로 유명한 역발상 가치투자자. 저평가되거나 시장이 외면한 자산에 집중 베팅하며, 때로는 하락 자체에 베팅한다. 2000~2008년 사이온 캐피털 시절 누적 489% 수익률(연평균 약 26.7%)을 기록했다. 최근 13F는 매크로 헤지 성격의 옵션 포지션 위주라 아래 비중은 참고용 근사치이며, 공매도·해외 자산 등은 13F에 공시되지 않아 실제 전략의 일부만 드러난다.',
  null,
  '[
    {"ticker": "PLTR", "name": "Palantir Technologies (풋옵션)", "market": "US", "ratio": 66.04, "sort_order": 1},
    {"ticker": "NVDA", "name": "Nvidia (풋옵션)",                 "market": "US", "ratio": 13.51, "sort_order": 2},
    {"ticker": "PFE",  "name": "Pfizer (콜옵션)",                 "market": "US", "ratio": 11.07, "sort_order": 3},
    {"ticker": "HAL",  "name": "Halliburton (콜옵션)",            "market": "US", "ratio":  4.45, "sort_order": 4},
    {"ticker": "MOH",  "name": "Molina Healthcare",               "market": "US", "ratio":  1.73, "sort_order": 5},
    {"ticker": "LULU", "name": "Lululemon Athletica",             "market": "US", "ratio":  1.29, "sort_order": 6},
    {"ticker": null,   "name": "기타 보유 종목",                   "market": "US", "ratio":  1.91, "sort_order": 7}
  ]'
);
