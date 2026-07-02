-- ============================================================
-- stocks (종목 마스터)
-- 검색·자동완성 소스. 현재가 등 실시간 데이터는 API에서 직접 fetch.
-- ============================================================
CREATE TABLE stocks (
  ticker     TEXT        PRIMARY KEY,
  name       TEXT        NOT NULL,
  market     TEXT        NOT NULL CHECK (market IN ('KR', 'US', 'ETF')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 자동완성 검색 성능을 위한 인덱스
CREATE INDEX idx_stocks_market  ON stocks(market);
CREATE INDEX idx_stocks_name    ON stocks USING gin(to_tsvector('simple', name));
CREATE INDEX idx_stocks_ticker  ON stocks USING gin(to_tsvector('simple', ticker));

-- stocks는 공개 데이터이므로 누구나 읽기 가능, 쓰기는 차단
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stocks are publicly readable"
  ON stocks FOR SELECT
  USING (true);

-- ============================================================
-- recent_searches (최근 검색 기록)
-- 사용자별 최근 검색 종목 최대 10개 (PRD 2.2 P1)
-- ============================================================
CREATE TABLE recent_searches (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticker      TEXT        NOT NULL REFERENCES stocks(ticker) ON DELETE CASCADE,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, ticker)
);

CREATE INDEX idx_recent_searches_user ON recent_searches(user_id, searched_at DESC);

ALTER TABLE recent_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own recent searches"
  ON recent_searches FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
