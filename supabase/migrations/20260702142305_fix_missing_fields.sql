-- ============================================================
-- portfolios: memo 추가 (PRD 5.1)
-- ============================================================
ALTER TABLE portfolios
  ADD COLUMN memo TEXT CHECK (char_length(memo) <= 200);

-- ============================================================
-- stocks: color, is_active 추가 (PRD 5.2, 5.6)
-- color — 종목 최초 등록 시 티커 해시 기반으로 앱에서 계산 후 저장
-- is_active — 상장폐지 등 거래 불가 종목 false
-- ============================================================
ALTER TABLE stocks
  ADD COLUMN color     TEXT,
  ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- ============================================================
-- trade_logs (매매 일지, PRD 5.8)
-- 포트폴리오 서비스와 완전히 독립된 데이터
-- ============================================================
CREATE TABLE trade_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL CHECK (type IN ('buy', 'sell')),
  date       DATE        NOT NULL DEFAULT CURRENT_DATE,
  -- TradeItem[]: { ticker, quantity, price, tax, exchange_rate }
  items      JSONB       NOT NULL DEFAULT '[]',
  memo       TEXT        CHECK (char_length(memo) <= 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trade_logs_user_date ON trade_logs(user_id, date DESC);

ALTER TABLE trade_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can manage own trade logs"
  ON trade_logs FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
