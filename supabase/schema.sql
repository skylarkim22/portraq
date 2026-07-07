-- ============================================================
-- Portraq DB Schema (최종본)
-- PRD v1.1 기준
-- ============================================================

-- ============================================================
-- updated_at 자동 갱신 함수
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- assets (종목 마스터, PRD 5.2)
-- 검색·자동완성 소스. 현재가 등 실시간 데이터는 API에서 직접 fetch.
-- color: 티커 해시 기반 고정 색상 (seed.sql에서 일괄 계산·삽입)
-- ============================================================
CREATE TABLE assets (
  ticker    TEXT        PRIMARY KEY,
  name      TEXT        NOT NULL,
  market    TEXT        NOT NULL CHECK (market IN ('KR', 'US')),
  color     TEXT,                          -- seed 완료 후 NOT NULL로 변경됨
  is_active BOOLEAN     NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_assets_market ON assets(market);
CREATE INDEX idx_assets_name   ON assets USING gin(to_tsvector('simple', name));
CREATE INDEX idx_assets_ticker ON assets USING gin(to_tsvector('simple', ticker));

ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets are publicly readable"
  ON assets FOR SELECT USING (true);

-- ============================================================
-- portfolios (PRD 5.1)
-- ============================================================
CREATE TABLE portfolios (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  memo       TEXT        CHECK (char_length(memo) <= 200),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);

ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- portfolio_assets (PRD 5.1 PortfolioAsset)
-- ============================================================
CREATE TABLE portfolio_assets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id  UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  ticker        TEXT        NOT NULL,
  name          TEXT        NOT NULL,
  market        TEXT        NOT NULL CHECK (market IN ('KR', 'US')),
  ratio         NUMERIC     NOT NULL DEFAULT 0 CHECK (ratio >= 0 AND ratio <= 100),
  shares        NUMERIC     NOT NULL DEFAULT 0,
  current_price NUMERIC     NOT NULL DEFAULT 0,
  color         TEXT        NOT NULL,
  sort_order    INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_portfolio_assets_updated_at
  BEFORE UPDATE ON portfolio_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_portfolio_assets_portfolio ON portfolio_assets(portfolio_id);

ALTER TABLE portfolio_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own portfolio assets"
  ON portfolio_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = portfolio_assets.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = portfolio_assets.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  );

-- ============================================================
-- save_portfolio: 이름/메모 갱신 + portfolio_assets 전체 교체 +
-- execution_records/portfolio_snapshots 신규 생성을 하나의
-- 트랜잭션으로 원자적 처리 (PRD 5.5 "저장 시 처리 흐름")
-- SECURITY INVOKER(기본값) — 호출자 권한으로 실행되어 기존 RLS 그대로 적용
-- ============================================================
CREATE OR REPLACE FUNCTION save_portfolio(
  p_portfolio_id UUID,
  p_name TEXT,
  p_memo TEXT,
  p_assets JSONB,
  p_total_budget NUMERIC,
  p_actions JSONB,
  p_snapshot_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_record_id UUID;
  v_total_value NUMERIC;
BEGIN
  UPDATE portfolios
  SET name = p_name, memo = p_memo
  WHERE id = p_portfolio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;

  DELETE FROM portfolio_assets WHERE portfolio_id = p_portfolio_id;

  INSERT INTO portfolio_assets (
    portfolio_id, ticker, name, market, ratio, shares, current_price, color, sort_order
  )
  SELECT
    p_portfolio_id,
    asset->>'ticker',
    asset->>'name',
    asset->>'market',
    (asset->>'ratio')::numeric,
    (asset->>'shares')::numeric,
    (asset->>'currentPrice')::numeric,
    asset->>'color',
    (asset->>'order')::integer
  FROM jsonb_array_elements(p_assets) AS asset;

  INSERT INTO execution_records (portfolio_id, total_budget, actions)
  VALUES (p_portfolio_id, p_total_budget, p_actions)
  RETURNING id INTO v_execution_record_id;

  SELECT COALESCE(SUM((asset->>'shares')::numeric * (asset->>'pricePerShare')::numeric), 0)
  INTO v_total_value
  FROM jsonb_array_elements(p_snapshot_assets) AS asset;

  INSERT INTO portfolio_snapshots (portfolio_id, execution_record_id, assets, total_value)
  VALUES (p_portfolio_id, v_execution_record_id, p_snapshot_assets, v_total_value);
END;
$$;

GRANT EXECUTE ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB, NUMERIC, JSONB, JSONB) TO authenticated;

-- ============================================================
-- execution_records (PRD 5.3)
-- ActionItem[]: { ticker, action: 'buy'|'sell'|'hold', quantity, price_per_share, total_amount }
-- ============================================================
CREATE TABLE execution_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_budget NUMERIC     NOT NULL DEFAULT 0,
  actions      JSONB       NOT NULL DEFAULT '[]',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_execution_records_portfolio ON execution_records(portfolio_id);

ALTER TABLE execution_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own execution records"
  ON execution_records FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = execution_records.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = execution_records.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  );

-- ============================================================
-- portfolio_snapshots (PRD 5.4)
-- SnapshotAsset[]: { ticker, name, ratio, shares, price_per_share, color }
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id        UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  execution_record_id UUID        NOT NULL REFERENCES execution_records(id) ON DELETE CASCADE,
  saved_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assets              JSONB       NOT NULL DEFAULT '[]',
  total_value         NUMERIC,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_snapshots_portfolio ON portfolio_snapshots(portfolio_id);

ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own portfolio snapshots"
  ON portfolio_snapshots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = portfolio_snapshots.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = portfolio_snapshots.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  );

-- ============================================================
-- portfolio_templates (PRD 2.1)
-- assets: TemplateAsset[] { ticker, name, market, ratio, sort_order }
--   ticker null → 미확정 슬롯
-- ============================================================
CREATE TABLE portfolio_templates (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  strategy    TEXT        NOT NULL CHECK (strategy IN ('passive', 'value', 'quant', 'asset-allocation')),
  market      TEXT        NOT NULL CHECK (market IN ('KR', 'US', 'MIXED')),
  cagr        NUMERIC,
  mdd         NUMERIC,
  description TEXT,
  source_date DATE,
  assets      JSONB       NOT NULL DEFAULT '[]',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE portfolio_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "templates are publicly readable"
  ON portfolio_templates FOR SELECT USING (true);

-- ============================================================
-- trade_logs (매매 일지, PRD 5.8)
-- TradeItem[]: { ticker, quantity, price, tax, exchange_rate }
-- ============================================================
CREATE TABLE trade_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('buy', 'sell')),
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  items      JSONB       NOT NULL DEFAULT '[]',
  memo       TEXT        CHECK (char_length(memo) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_logs_user_date ON trade_logs(user_id, date DESC);

ALTER TABLE trade_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own trade logs"
  ON trade_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 대가 포트폴리오 템플릿 데이터 (PRD 2.1)
-- ============================================================
INSERT INTO portfolio_templates (id, name, strategy, market, cagr, mdd, description, source_date, assets) VALUES
(
  'warren-buffett',
  '워런 버핏',
  'value',
  'US',
  10.4,
  -32.7,
  '우량 기업을 적정 가격에 사서 오래 보유하는 집중 투자 전략. "10년 보유할 자신 없으면 10분도 보유하지 마라"는 철학 아래 소수 종목에 대담하게 집중한다.',
  '2026-03-31',
  '[
    {"ticker": "AAPL",  "name": "Apple",                "market": "US", "ratio": 22.0, "sort_order": 1},
    {"ticker": "AXP",   "name": "American Express",     "market": "US", "ratio": 15.8, "sort_order": 2},
    {"ticker": "BAC",   "name": "Bank of America",      "market": "US", "ratio":  9.8, "sort_order": 3},
    {"ticker": "GOOGL", "name": "Alphabet",             "market": "US", "ratio":  5.9, "sort_order": 4},
    {"ticker": "KO",    "name": "Coca-Cola",            "market": "US", "ratio":  5.0, "sort_order": 5},
    {"ticker": "OXY",   "name": "Occidental Petroleum", "market": "US", "ratio":  4.8, "sort_order": 6},
    {"ticker": "CVX",   "name": "Chevron",              "market": "US", "ratio":  4.0, "sort_order": 7},
    {"ticker": null,    "name": "기타 (비공개 종목)",    "market": "US", "ratio": 32.7, "sort_order": 8}
  ]'
),
(
  'ray-dalio-all-weather',
  '레이 달리오',
  'asset-allocation',
  'MIXED',
  7.2,
  -12.4,
  '어떤 경제 환경에서도 수익을 내는 올웨더 포트폴리오. 인플레이션·디플레이션·성장·침체 4가지 국면에서 균형 잡힌 리스크를 유지하는 자산배분 전략.',
  '2025-01-01',
  '[
    {"ticker": "VTI",  "name": "Vanguard Total Stock Market ETF",     "market": "US", "ratio": 30.0, "sort_order": 1},
    {"ticker": "TLT",  "name": "iShares 20+ Year Treasury Bond ETF",  "market": "US", "ratio": 40.0, "sort_order": 2},
    {"ticker": "IEF",  "name": "iShares 7-10 Year Treasury Bond ETF", "market": "US", "ratio": 15.0, "sort_order": 3},
    {"ticker": "GLD",  "name": "SPDR Gold Shares",                    "market": "US", "ratio":  7.5, "sort_order": 4},
    {"ticker": "PDBC", "name": "Invesco Commodity ETF",               "market": "US", "ratio":  7.5, "sort_order": 5}
  ]'
),
(
  'peter-lynch',
  '피터 린치',
  'value',
  'MIXED',
  11.3,
  -28.1,
  '"아는 기업에 투자하라." 일상에서 발견한 소비재·유통·헬스케어 성장주를 발굴하는 전략. 마젤란 펀드 운용 시절 연평균 29%의 수익률을 기록했다.',
  '2025-01-01',
  '[
    {"ticker": "MCD",  "name": "McDonald''s",        "market": "US", "ratio": 15.0, "sort_order": 1},
    {"ticker": "NKE",  "name": "Nike",               "market": "US", "ratio": 15.0, "sort_order": 2},
    {"ticker": "SBUX", "name": "Starbucks",          "market": "US", "ratio": 10.0, "sort_order": 3},
    {"ticker": "HD",   "name": "Home Depot",         "market": "US", "ratio": 10.0, "sort_order": 4},
    {"ticker": null,   "name": "직접 발굴 성장주 A", "market": "US", "ratio": 25.0, "sort_order": 5},
    {"ticker": null,   "name": "직접 발굴 성장주 B", "market": "US", "ratio": 25.0, "sort_order": 6}
  ]'
),
(
  'john-bogle',
  '존 보글',
  'passive',
  'MIXED',
  9.8,
  -21.0,
  '"시장을 이기려 하지 마라." 낮은 비용의 인덱스 펀드만으로 구성하는 패시브 투자 전략. 장기적으로 대부분의 액티브 펀드를 능가한다.',
  '2025-01-01',
  '[
    {"ticker": "VTI",  "name": "Vanguard Total Stock Market ETF",        "market": "US", "ratio": 42.0, "sort_order": 1},
    {"ticker": "VXUS", "name": "Vanguard Total International Stock ETF", "market": "US", "ratio": 18.0, "sort_order": 2},
    {"ticker": "BND",  "name": "Vanguard Total Bond Market ETF",         "market": "US", "ratio": 40.0, "sort_order": 3}
  ]'
),
(
  'kang-hwan-guk',
  '강환국',
  'quant',
  'MIXED',
  12.1,
  -22.3,
  '데이터와 규칙으로만 투자하는 퀀트·팩터 전략. 저PBR·저PER 가치 팩터와 모멘텀 팩터를 결합하여 한국 시장에서 초과 수익을 추구한다.',
  '2025-01-01',
  '[
    {"ticker": "069500", "name": "KODEX 200",          "market": "KR", "ratio": 25.0, "sort_order": 1},
    {"ticker": "360750", "name": "TIGER 미국S&P500",   "market": "KR", "ratio": 20.0, "sort_order": 2},
    {"ticker": "132030", "name": "KODEX 골드선물(H)",  "market": "KR", "ratio": 10.0, "sort_order": 3},
    {"ticker": "114820", "name": "TIGER 국채3년",      "market": "KR", "ratio": 10.0, "sort_order": 4},
    {"ticker": null,     "name": "퀀트 선정 가치주 A", "market": "KR", "ratio": 17.5, "sort_order": 5},
    {"ticker": null,     "name": "퀀트 선정 가치주 B", "market": "KR", "ratio": 17.5, "sort_order": 6}
  ]'
);
