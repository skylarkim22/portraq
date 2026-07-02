-- ============================================================
-- portfolios
-- ============================================================
CREATE TABLE portfolios (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT        NOT NULL,
  monthly_budget NUMERIC     NOT NULL DEFAULT 0,
  template_id    TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- portfolio_assets
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
  memo          TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- execution_records
-- ============================================================
CREATE TABLE execution_records (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  executed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_budget NUMERIC     NOT NULL DEFAULT 0,
  -- ActionItem[]: { ticker, action: 'buy'|'sell'|'hold', quantity, price_per_share, total_amount }
  actions      JSONB       NOT NULL DEFAULT '[]',
  memo         TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- portfolio_snapshots
-- ============================================================
CREATE TABLE portfolio_snapshots (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id        UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  execution_record_id UUID        NOT NULL REFERENCES execution_records(id) ON DELETE CASCADE,
  saved_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- SnapshotAsset[]: { ticker, name, ratio, shares, price_per_share, color }
  assets              JSONB       NOT NULL DEFAULT '[]',
  total_value         NUMERIC,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- updated_at 자동 갱신 트리거
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_portfolio_assets_updated_at
  BEFORE UPDATE ON portfolio_assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 인덱스
-- ============================================================
CREATE INDEX idx_portfolios_user_id          ON portfolios(user_id);
CREATE INDEX idx_portfolio_assets_portfolio  ON portfolio_assets(portfolio_id);
CREATE INDEX idx_execution_records_portfolio ON execution_records(portfolio_id);
CREATE INDEX idx_snapshots_portfolio         ON portfolio_snapshots(portfolio_id);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================
ALTER TABLE portfolios          ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_assets    ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own portfolios"
  ON portfolios FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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
