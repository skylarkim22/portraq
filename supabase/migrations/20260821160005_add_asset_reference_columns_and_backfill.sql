-- ============================================================
-- portfolio_assets/trade_logs가 "카탈로그 종목(assets)"과 "커스텀
-- 종목(custom_assets)" 중 정확히 하나를 가리키도록 nullable 컬럼
-- 2개로 분리한다(exclusive arc). 기존 ticker 컬럼은 다음 마이그
-- 레이션에서 제거하며, 그 전까지는 참고용으로 남겨둔다.
-- ============================================================

ALTER TABLE portfolio_assets
  ADD COLUMN asset_ticker    TEXT NULL REFERENCES assets(ticker),
  ADD COLUMN custom_asset_id UUID NULL REFERENCES custom_assets(id) ON DELETE CASCADE;

ALTER TABLE trade_logs
  ADD COLUMN asset_ticker    TEXT NULL REFERENCES assets(ticker),
  ADD COLUMN custom_asset_id UUID NULL REFERENCES custom_assets(id) ON DELETE CASCADE;

-- ============================================================
-- 데이터 백필
--
-- portfolio_assets: ticker가 assets에 없는 행(커스텀 종목으로
-- "직접 추가"된 행)마다 그 행이 이미 들고 있는 name/market/color와
-- 소유 포트폴리오의 user_id로 custom_assets 행을 새로 만들고
-- custom_asset_id를 연결한다. 나머지는 asset_ticker로 이관한다.
-- ============================================================
DO $$
DECLARE
  r RECORD;
  v_custom_id UUID;
BEGIN
  FOR r IN
    SELECT pa.id, pa.name, pa.market, pa.color, p.user_id
    FROM portfolio_assets pa
    JOIN portfolios p ON p.id = pa.portfolio_id
    WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.ticker = pa.ticker)
  LOOP
    INSERT INTO custom_assets (user_id, name, market, color)
    VALUES (r.user_id, r.name, r.market, r.color)
    RETURNING id INTO v_custom_id;

    UPDATE portfolio_assets SET custom_asset_id = v_custom_id WHERE id = r.id;
  END LOOP;
END $$;

UPDATE portfolio_assets
SET asset_ticker = ticker
WHERE custom_asset_id IS NULL;

-- ============================================================
-- trade_logs: name/market 컬럼이 없어 커스텀 종목이었다면 이름을
-- 복구할 방법이 없다. 안전장치로 orphan이 있으면 실패시킨다
-- (현재 운영 데이터에는 orphan이 없음을 확인했다).
-- ============================================================
DO $$
DECLARE
  v_orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_orphan_count
  FROM trade_logs tl
  WHERE NOT EXISTS (SELECT 1 FROM assets a WHERE a.ticker = tl.ticker);

  IF v_orphan_count > 0 THEN
    RAISE EXCEPTION 'trade_logs에 assets에 없는 ticker가 %건 존재해 자동 백필이 불가능합니다. 수동으로 정리하세요.', v_orphan_count;
  END IF;
END $$;

UPDATE trade_logs SET asset_ticker = ticker;

-- ============================================================
-- 백필 완료 후 exclusive arc 제약 추가 — 정확히 하나만 채워져야 한다.
-- ============================================================
ALTER TABLE portfolio_assets
  ADD CONSTRAINT portfolio_assets_asset_reference_check
  CHECK ((asset_ticker IS NOT NULL) != (custom_asset_id IS NOT NULL));

ALTER TABLE trade_logs
  ADD CONSTRAINT trade_logs_asset_reference_check
  CHECK ((asset_ticker IS NOT NULL) != (custom_asset_id IS NOT NULL));

CREATE INDEX idx_portfolio_assets_asset_ticker ON portfolio_assets(asset_ticker);
CREATE INDEX idx_portfolio_assets_custom_asset_id ON portfolio_assets(custom_asset_id);
CREATE INDEX idx_trade_logs_asset_ticker ON trade_logs(asset_ticker);
CREATE INDEX idx_trade_logs_custom_asset_id ON trade_logs(custom_asset_id);

-- ============================================================
-- custom_asset_id는 존재만 검증하는 FK라 다른 유저의 custom_assets.id를
-- 그대로 참조해도 FK 자체는 통과한다. RLS WITH CHECK에 소유권 검증을
-- 추가해 본인 소유가 아닌 custom_asset_id로는 저장할 수 없게 막는다.
-- (portfolio_assets는 save_portfolio RPC가 SECURITY INVOKER라 이 RLS가
-- 그대로 적용되고, trade_logs는 클라이언트가 직접 insert하므로 이 RLS가
-- 유일한 검증 지점이다.)
-- ============================================================
DROP POLICY "users can manage own portfolio assets" ON portfolio_assets;
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
    AND (
      custom_asset_id IS NULL
      OR EXISTS (
        SELECT 1 FROM custom_assets ca
        WHERE ca.id = portfolio_assets.custom_asset_id
          AND ca.user_id = auth.uid()
      )
    )
  );

DROP POLICY "users can manage own trade logs" ON trade_logs;
CREATE POLICY "users can manage own trade logs"
  ON trade_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      custom_asset_id IS NULL
      OR EXISTS (
        SELECT 1 FROM custom_assets ca
        WHERE ca.id = trade_logs.custom_asset_id
          AND ca.user_id = auth.uid()
      )
    )
  );
