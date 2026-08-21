-- ============================================================
-- asset_ticker/custom_asset_id로 완전히 대체된 레거시 컬럼을 제거한다.
-- portfolio_assets의 name/market/color는 assets/custom_assets 중
-- 채워진 쪽과 JOIN해서 읽는다(#58에서 보류했던 정규화를 여기서 완성).
-- ============================================================

DROP INDEX IF EXISTS idx_trade_logs_user_ticker;

ALTER TABLE portfolio_assets
  DROP COLUMN ticker,
  DROP COLUMN name,
  DROP COLUMN market,
  DROP COLUMN color;

ALTER TABLE trade_logs
  DROP COLUMN ticker;
