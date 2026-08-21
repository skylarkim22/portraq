-- ============================================================
-- asset_dividends: 종목별 배당/분배 금액 이력 (1:N)
--   record_date: 배당·분배 기준일 (주식=결산기준일, ETF=분배기준일)
--   amount:      주당 배당금/분배금(원)
-- 예상 배당금 계산(최근 12개월 amount 합 등)을 위한 실측 이력 저장소.
-- 주기/월 스케줄은 assets.dividend_frequency/dividend_months 에 별도 보관.
-- ============================================================
CREATE TABLE asset_dividends (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker      TEXT        NOT NULL REFERENCES assets(ticker) ON DELETE CASCADE,
  record_date DATE        NOT NULL,
  amount      NUMERIC     NOT NULL CHECK (amount >= 0),
  source      TEXT        CHECK (source IN ('DART', 'SEIBRO')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (ticker, record_date)
);

CREATE INDEX idx_asset_dividends_ticker ON asset_dividends(ticker);

CREATE TRIGGER trg_asset_dividends_updated_at
  BEFORE UPDATE ON asset_dividends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- assets 와 동일하게 공개 읽기, 쓰기는 RLS 로 차단
ALTER TABLE asset_dividends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asset_dividends are publicly readable"
  ON asset_dividends FOR SELECT USING (true);
