-- ============================================================
-- dividend_inputs: 사용자가 매달 직접 입력하는 실제 수령 배당(분배)금
--   asset_dividends(자동/수동 갱신 추정치)와 달리 여기 값은 사용자가
--   실제로 받은 금액을 직접 입력한다(#75) — 분배금 확인 화면의
--   배당합/연환산수익률은 이 테이블 값만 사용하고 추정치로 폴백하지
--   않는다. 입력 없으면 0으로 표시한다.
--
-- portfolio_assets.id가 아니라 (portfolio_id, ticker)로 키를 잡는다:
-- save_portfolio()가 저장할 때마다 portfolio_assets를 전체 DELETE 후
-- 재INSERT해서 id가 안정적이지 않기 때문이다. portfolio_id+ticker는
-- 포트폴리오 편집으로 비율/수량이 바뀌어도 안정적으로 유지된다.
-- ============================================================
CREATE TABLE dividend_inputs (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id    UUID        NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
  asset_ticker    TEXT        NULL REFERENCES assets(ticker),
  custom_asset_id UUID        NULL REFERENCES custom_assets(id) ON DELETE CASCADE,
  month           DATE        NOT NULL,
  amount          NUMERIC     NOT NULL CHECK (amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dividend_inputs_asset_reference_check
    CHECK ((asset_ticker IS NOT NULL) != (custom_asset_id IS NOT NULL)),
  CONSTRAINT dividend_inputs_month_is_first_of_month
    CHECK (month = date_trunc('month', month)::date)
);

CREATE TRIGGER trg_dividend_inputs_updated_at
  BEFORE UPDATE ON dividend_inputs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE INDEX idx_dividend_inputs_portfolio ON dividend_inputs(portfolio_id);

-- exclusive arc라 asset_ticker/custom_asset_id 각각 한쪽이 항상 NULL이므로
-- 일반 UNIQUE(portfolio_id, asset_ticker, month)로는 같은 종목에 같은 달을
-- 여러 번 입력해도 막지 못한다(NULL은 서로 다른 값으로 취급됨) — 컬럼별
-- partial unique index로 나눠서 막는다.
CREATE UNIQUE INDEX dividend_inputs_ticker_month_uniq
  ON dividend_inputs(portfolio_id, asset_ticker, month) WHERE asset_ticker IS NOT NULL;
CREATE UNIQUE INDEX dividend_inputs_custom_month_uniq
  ON dividend_inputs(portfolio_id, custom_asset_id, month) WHERE custom_asset_id IS NOT NULL;

ALTER TABLE dividend_inputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can manage own dividend inputs"
  ON dividend_inputs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = dividend_inputs.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM portfolios
      WHERE portfolios.id = dividend_inputs.portfolio_id
        AND portfolios.user_id = auth.uid()
    )
    AND (
      custom_asset_id IS NULL
      OR EXISTS (
        SELECT 1 FROM custom_assets ca
        WHERE ca.id = dividend_inputs.custom_asset_id
          AND ca.user_id = auth.uid()
      )
    )
  );
