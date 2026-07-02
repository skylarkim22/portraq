-- ============================================================
-- portfolio_templates (대가 포트폴리오 템플릿)
-- ============================================================
CREATE TABLE portfolio_templates (
  id          TEXT        PRIMARY KEY,  -- 'warren-buffett', 'ray-dalio-all-weather'
  name        TEXT        NOT NULL,
  strategy    TEXT        NOT NULL CHECK (strategy IN ('passive', 'value', 'quant', 'asset-allocation')),
  market      TEXT        NOT NULL CHECK (market IN ('KR', 'US', 'MIXED')),
  cagr        NUMERIC,                  -- 10년 연평균 수익률 (%)
  mdd         NUMERIC,                  -- 최대낙폭 (%) — 음수
  description TEXT,
  source_date DATE,                     -- 포트폴리오 기준 시점
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- template_assets (템플릿 종목 구성)
-- ticker NULL → 미확정 슬롯, name을 라벨로 표시
-- ============================================================
CREATE TABLE template_assets (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT    NOT NULL REFERENCES portfolio_templates(id) ON DELETE CASCADE,
  ticker      TEXT,
  name        TEXT    NOT NULL,
  market      TEXT    NOT NULL CHECK (market IN ('KR', 'US')),
  ratio       NUMERIC NOT NULL CHECK (ratio > 0 AND ratio <= 100),
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ============================================================
-- portfolios.template_id FK 연결
-- ============================================================
ALTER TABLE portfolios
  ADD CONSTRAINT fk_portfolios_template
  FOREIGN KEY (template_id) REFERENCES portfolio_templates(id) ON DELETE SET NULL;

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_template_assets_template ON template_assets(template_id);

-- ============================================================
-- RLS — 템플릿은 비로그인 포함 누구나 읽기 가능
-- ============================================================
ALTER TABLE portfolio_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_assets     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "templates are publicly readable"
  ON portfolio_templates FOR SELECT USING (true);

CREATE POLICY "template_assets are publicly readable"
  ON template_assets FOR SELECT USING (true);

-- ============================================================
-- 대가 포트폴리오 시드 데이터
-- ============================================================

INSERT INTO portfolio_templates (id, name, strategy, market, cagr, mdd, description, source_date) VALUES
(
  'warren-buffett',
  '워런 버핏',
  'value',
  'US',
  10.4,
  -32.7,
  '우량 기업을 적정 가격에 사서 오래 보유하는 집중 투자 전략. "10년 보유할 자신 없으면 10분도 보유하지 마라"는 철학 아래 소수 종목에 대담하게 집중한다.',
  '2026-03-31'
),
(
  'ray-dalio-all-weather',
  '레이 달리오',
  'asset-allocation',
  'MIXED',
  7.2,
  -12.4,
  '어떤 경제 환경에서도 수익을 내는 올웨더 포트폴리오. 인플레이션·디플레이션·성장·침체 4가지 국면에서 균형 잡힌 리스크를 유지하는 자산배분 전략.',
  '2025-01-01'
),
(
  'peter-lynch',
  '피터 린치',
  'value',
  'MIXED',
  11.3,
  -28.1,
  '"아는 기업에 투자하라." 일상에서 발견한 소비재·유통·헬스케어 성장주를 발굴하는 전략. 마젤란 펀드 운용 시절 연평균 29%의 수익률을 기록했다.',
  '2025-01-01'
),
(
  'john-bogle',
  '존 보글',
  'passive',
  'MIXED',
  9.8,
  -21.0,
  '"시장을 이기려 하지 마라." 낮은 비용의 인덱스 펀드만으로 구성하는 패시브 투자 전략. 장기적으로 대부분의 액티브 펀드를 능가한다.',
  '2025-01-01'
),
(
  'kang-hwan-guk',
  '강환국',
  'quant',
  'MIXED',
  12.1,
  -22.3,
  '데이터와 규칙으로만 투자하는 퀀트·팩터 전략. 저PBR·저PER 가치 팩터와 모멘텀 팩터를 결합하여 한국 시장에서 초과 수익을 추구한다.',
  '2025-01-01'
);

-- 워런 버핏 종목 구성 (2026 1Q 13F 기준)
INSERT INTO template_assets (template_id, ticker, name, market, ratio, sort_order) VALUES
('warren-buffett', 'AAPL',  'Apple',                'US', 22.0, 1),
('warren-buffett', 'AXP',   'American Express',     'US', 15.8, 2),
('warren-buffett', 'BAC',   'Bank of America',      'US',  9.8, 3),
('warren-buffett', 'GOOGL', 'Alphabet',             'US',  5.9, 4),
('warren-buffett', 'KO',    'Coca-Cola',            'US',  5.0, 5),
('warren-buffett', 'OXY',   'Occidental Petroleum', 'US',  4.8, 6),
('warren-buffett', 'CVX',   'Chevron',              'US',  4.0, 7),
('warren-buffett', NULL,    '기타 (비공개 종목)',    'US', 32.7, 8);

-- 레이 달리오 올웨더 종목 구성
INSERT INTO template_assets (template_id, ticker, name, market, ratio, sort_order) VALUES
('ray-dalio-all-weather', 'VTI',  'Vanguard Total Stock Market ETF',     'US', 30.0, 1),
('ray-dalio-all-weather', 'TLT',  'iShares 20+ Year Treasury Bond ETF',  'US', 40.0, 2),
('ray-dalio-all-weather', 'IEF',  'iShares 7-10 Year Treasury Bond ETF', 'US', 15.0, 3),
('ray-dalio-all-weather', 'GLD',  'SPDR Gold Shares',                    'US',  7.5, 4),
('ray-dalio-all-weather', 'PDBC', 'Invesco Commodity ETF',               'US',  7.5, 5);

-- 피터 린치 종목 구성 (아는 기업 중심 대표 예시 + 미확정 슬롯)
INSERT INTO template_assets (template_id, ticker, name, market, ratio, sort_order) VALUES
('peter-lynch', 'MCD',  'McDonald''s',        'US', 15.0, 1),
('peter-lynch', 'NKE',  'Nike',               'US', 15.0, 2),
('peter-lynch', 'SBUX', 'Starbucks',          'US', 10.0, 3),
('peter-lynch', 'HD',   'Home Depot',         'US', 10.0, 4),
('peter-lynch', NULL,   '직접 발굴 성장주 A', 'US', 25.0, 5),
('peter-lynch', NULL,   '직접 발굴 성장주 B', 'US', 25.0, 6);

-- 존 보글 3펀드 포트폴리오
INSERT INTO template_assets (template_id, ticker, name, market, ratio, sort_order) VALUES
('john-bogle', 'VTI',  'Vanguard Total Stock Market ETF',        'US', 42.0, 1),
('john-bogle', 'VXUS', 'Vanguard Total International Stock ETF', 'US', 18.0, 2),
('john-bogle', 'BND',  'Vanguard Total Bond Market ETF',         'US', 40.0, 3);

-- 강환국 퀀트·팩터 포트폴리오 (대표 ETF + 팩터 선정 미확정 슬롯)
INSERT INTO template_assets (template_id, ticker, name, market, ratio, sort_order) VALUES
('kang-hwan-guk', '069500', 'KODEX 200',               'KR', 25.0, 1),
('kang-hwan-guk', '360750', 'TIGER 미국S&P500',        'KR', 20.0, 2),
('kang-hwan-guk', '132030', 'KODEX 골드선물(H)',        'KR', 10.0, 3),
('kang-hwan-guk', '114820', 'TIGER 국채3년',           'KR', 10.0, 4),
('kang-hwan-guk', NULL,     '퀀트 선정 가치주 A',      'KR', 17.5, 5),
('kang-hwan-guk', NULL,     '퀀트 선정 가치주 B',      'KR', 17.5, 6);
