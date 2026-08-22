-- ============================================================
-- asset_prices: 종목별 확정 종가 이력 (1:N)
--   price_date:  종가 기준일 (거래일, T+1 확정치)
--   close_price: 종가(원)
-- 매일 배치(scripts/fetch-kr-closing-prices.mjs)가 aikstockdata에서
-- 가져온 KR 종목 확정 종가를 적재하는 저장소.
-- id 컬럼 없음 — (ticker, price_date)를 복합 PK로 직접 사용한다.
-- asset_dividends와 달리 다른 테이블이 이 행을 FK로 참조할 일이 없다.
-- ============================================================
CREATE TABLE asset_prices (
  ticker      TEXT        NOT NULL REFERENCES assets(ticker) ON DELETE CASCADE,
  price_date  DATE        NOT NULL,
  close_price NUMERIC     NOT NULL CHECK (close_price >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ticker, price_date)
);

CREATE TRIGGER trg_asset_prices_updated_at
  BEFORE UPDATE ON asset_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- assets와 동일하게 공개 읽기, 쓰기는 RLS로 차단(배치는 service-role 키로 우회)
ALTER TABLE asset_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "asset_prices are publicly readable"
  ON asset_prices FOR SELECT USING (true);
