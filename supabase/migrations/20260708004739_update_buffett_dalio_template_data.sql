-- 워런 버핏(Berkshire Hathaway) 2026 Q1 13F(2026-05-15 제출, SEC EDGAR) 기준으로
-- 종목 비중을 갱신한다. 코카콜라(KO) 비중이 기존 5.0%에서 11.56%로 크게
-- 늘어난 것이 가장 큰 변화이며, AXP/CVX/OXY도 소폭 상향한다.
UPDATE portfolio_templates
SET
  source_date = '2026-03-31',
  assets = '[
    {"ticker": "AAPL",  "name": "Apple",                "market": "US", "ratio": 22.0, "sort_order": 1},
    {"ticker": "AXP",   "name": "American Express",     "market": "US", "ratio": 17.4, "sort_order": 2},
    {"ticker": "KO",    "name": "Coca-Cola",            "market": "US", "ratio": 11.6, "sort_order": 3},
    {"ticker": "BAC",   "name": "Bank of America",      "market": "US", "ratio":  9.5, "sort_order": 4},
    {"ticker": "CVX",   "name": "Chevron",              "market": "US", "ratio":  6.6, "sort_order": 5},
    {"ticker": "OXY",   "name": "Occidental Petroleum", "market": "US", "ratio":  6.5, "sort_order": 6},
    {"ticker": "GOOGL", "name": "Alphabet",             "market": "US", "ratio":  6.3, "sort_order": 7},
    {"ticker": null,    "name": "기타 (비공개 종목)",    "market": "US", "ratio": 20.1, "sort_order": 8}
  ]'
WHERE id = 'warren-buffett';

-- 레이 달리오 올웨더 포트폴리오의 MDD를 실제 백테스트 수치로 갱신한다.
-- 기존 -12.4%는 2022년 금리 급등기 이전 구간만 반영된 값으로, 채권 비중이
-- 큰(TLT 40%) 이 포트폴리오는 2022년에 실제로 -20.6%까지 하락했다.
UPDATE portfolio_templates
SET
  cagr = 7.4,
  mdd = -20.6,
  source_date = '2026-06-30'
WHERE id = 'ray-dalio-all-weather';
