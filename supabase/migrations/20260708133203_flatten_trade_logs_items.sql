-- trade_logs를 "1행 = 여러 종목을 담은 JSONB 배열"에서 "1행 = 1종목 거래"로
-- 평탄화한다. 종목별 수정/삭제 기능이 생기면서 items 배열 안의 한 원소만
-- 고치는 구조가 read-modify-write(전체 배열 재작성)로 처리돼야 했고,
-- date/memo가 행(배열 전체) 단위라 종목이 여러 개인 기록은 날짜/메모를
-- 개별 수정할 수 없었다. 종목마다 독립된 행으로 만들면 이 제약이 전부
-- 사라지고, 표준 컬럼·인덱스·CHECK 제약을 그대로 쓸 수 있다.

CREATE TABLE trade_logs_new (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL CHECK (type IN ('buy', 'sell')),
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  ticker        TEXT        NOT NULL,
  quantity      NUMERIC     NOT NULL CHECK (quantity > 0),
  price         NUMERIC     NOT NULL CHECK (price > 0),
  tax           NUMERIC     CHECK (tax >= 0),
  exchange_rate NUMERIC     CHECK (exchange_rate > 0),
  memo          TEXT        CHECK (char_length(memo) <= 1000),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- memo는 예전 스키마에서 items 배열 원소가 아니라 행(t) 단위 컬럼이었으므로
-- t.memo에서 가져온다 (item->>'memo'는 항상 NULL이라 이전에는 백필 시
-- 메모가 유실되는 버그가 있었다).
INSERT INTO trade_logs_new
  (user_id, type, date, ticker, quantity, price, tax, exchange_rate, memo, created_at)
SELECT
  t.user_id,
  t.type,
  t.date,
  item->>'ticker',
  (item->>'quantity')::numeric,
  (item->>'price')::numeric,
  (item->>'tax')::numeric,
  (item->>'exchangeRate')::numeric,
  t.memo,
  t.created_at
FROM trade_logs t, LATERAL jsonb_array_elements(t.items) AS item;

DROP TABLE trade_logs;
ALTER TABLE trade_logs_new RENAME TO trade_logs;

CREATE INDEX idx_trade_logs_user_date ON trade_logs(user_id, date DESC);
CREATE INDEX idx_trade_logs_user_ticker ON trade_logs(user_id, ticker);

ALTER TABLE trade_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own trade logs"
  ON trade_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
