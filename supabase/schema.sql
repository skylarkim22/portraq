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
-- save_portfolio: 이름/메모 갱신 + portfolio_assets 전체 교체를
-- 하나의 트랜잭션으로 원자적 처리 (delete-then-insert 비원자성 해소)
--
-- execution_records/portfolio_snapshots는 여기서 만들지 않는다.
-- 이 함수는 편집 화면에서 목표 비율을 조정·저장하는 이벤트이고,
-- 실행 기록·스냅샷은 리밸런싱 가이드에서 실제 보유 현황·투자금을
-- 입력받아 매수·매도를 확정하는 별도 이벤트(issue #19)에서 생성한다.
-- SECURITY INVOKER(기본값) — 호출자 권한으로 실행되어 기존 RLS 그대로 적용
-- ============================================================
CREATE OR REPLACE FUNCTION save_portfolio(
  p_portfolio_id UUID,
  p_name TEXT,
  p_memo TEXT,
  p_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
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
END;
$$;

REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) TO authenticated;

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
-- 리밸런싱 기록 조회(ORDER BY executed_at DESC)용 인덱스
CREATE INDEX idx_execution_records_executed_at ON execution_records(executed_at DESC);
CREATE INDEX idx_execution_records_portfolio_executed_at ON execution_records(portfolio_id, executed_at DESC);

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
-- record_rebalancing_execution: 리밸런싱 가이드(Step 1~3)에서
-- 사용자가 최종 확정한 보유 주수·현재가·매수/매도 액션을 하나의
-- 트랜잭션으로 원자적 처리한다 (PRD 5.5 "② 리밸런싱 가이드의
-- 최종 확정 저장"). 편집 화면의 save_portfolio와는 별개 이벤트다.
-- SECURITY INVOKER(기본값) — 호출자 권한으로 실행되어 기존 RLS 그대로 적용
-- ============================================================
CREATE OR REPLACE FUNCTION record_rebalancing_execution(
  p_portfolio_id UUID,
  p_total_budget NUMERIC,
  p_actions JSONB,
  p_updated_assets JSONB,
  p_snapshot_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_record_id UUID;
  v_total_value NUMERIC;
BEGIN
  PERFORM 1 FROM portfolios
  WHERE id = p_portfolio_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;

  UPDATE portfolio_assets pa
  SET shares = (u->>'shares')::numeric,
      current_price = (u->>'currentPrice')::numeric
  FROM jsonb_array_elements(p_updated_assets) AS u
  WHERE pa.portfolio_id = p_portfolio_id
    AND pa.ticker = u->>'ticker';

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

REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) TO authenticated;

-- ============================================================
-- delete_portfolio: 포트폴리오와 하위 데이터(portfolio_assets,
-- execution_records, portfolio_snapshots)를 함께 삭제한다.
--
-- SECURITY DEFINER인 이유: 하위 테이블들의 RLS 정책이 portfolios와의
-- JOIN(EXISTS 서브쿼리)으로 소유권을 검사하는데, ON DELETE CASCADE가
-- 발동하는 시점엔 같은 트랜잭션 내에서 이미 portfolios 행이 삭제된
-- 뒤라 그 서브쿼리가 아무 것도 찾지 못해 cascade가 RLS에 의해 조용히
-- 막힌다(에러 없이 0건 삭제, 하위 행이 고아로 남음). SECURITY DEFINER
-- 함수는 RLS를 우회해 cascade가 정상 작동하게 하고, 소유권 검증은
-- 함수 본문에서 `user_id = auth.uid()`로 직접 수행한다.
-- ============================================================
CREATE OR REPLACE FUNCTION delete_portfolio(p_portfolio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM portfolios
  WHERE id = p_portfolio_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION delete_portfolio(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_portfolio(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION delete_portfolio(UUID) TO authenticated;

-- ============================================================
-- portfolio_templates (PRD 2.1)
-- assets: TemplateAsset[] { ticker, name, market, ratio, sort_order }
--   ticker null → 미확정 슬롯
-- ============================================================
CREATE TABLE portfolio_templates (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  strategy    TEXT        NOT NULL CHECK (strategy IN ('passive', 'value', 'quant', 'asset-allocation', 'growth')),
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
    {"ticker": "AXP",   "name": "American Express",     "market": "US", "ratio": 17.4, "sort_order": 2},
    {"ticker": "KO",    "name": "Coca-Cola",            "market": "US", "ratio": 11.6, "sort_order": 3},
    {"ticker": "BAC",   "name": "Bank of America",      "market": "US", "ratio":  9.5, "sort_order": 4},
    {"ticker": "CVX",   "name": "Chevron",              "market": "US", "ratio":  6.6, "sort_order": 5},
    {"ticker": "OXY",   "name": "Occidental Petroleum", "market": "US", "ratio":  6.5, "sort_order": 6},
    {"ticker": "GOOGL", "name": "Alphabet",             "market": "US", "ratio":  6.3, "sort_order": 7},
    {"ticker": null,    "name": "기타 (비공개 종목)",    "market": "US", "ratio": 20.1, "sort_order": 8}
  ]'
),
(
  'ray-dalio-all-weather',
  '레이 달리오',
  'asset-allocation',
  'MIXED',
  7.4,
  -20.6,
  '어떤 경제 환경에서도 수익을 내는 올웨더 포트폴리오. 인플레이션·디플레이션·성장·침체 4가지 국면에서 균형 잡힌 리스크를 유지하는 자산배분 전략.',
  '2026-06-30',
  '[
    {"ticker": "VTI",  "name": "Vanguard Total Stock Market ETF",     "market": "US", "ratio": 30.0, "sort_order": 1},
    {"ticker": "TLT",  "name": "iShares 20+ Year Treasury Bond ETF",  "market": "US", "ratio": 40.0, "sort_order": 2},
    {"ticker": "IEF",  "name": "iShares 7-10 Year Treasury Bond ETF", "market": "US", "ratio": 15.0, "sort_order": 3},
    {"ticker": "GLD",  "name": "SPDR Gold Shares",                    "market": "US", "ratio":  7.5, "sort_order": 4},
    {"ticker": "PDBC", "name": "Invesco Commodity ETF",               "market": "US", "ratio":  7.5, "sort_order": 5}
  ]'
),
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
