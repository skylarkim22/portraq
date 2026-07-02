-- ============================================================
-- stocks → assets 테이블 리네임 (PRD 5.2 Asset 명세 일치)
-- PostgreSQL이 recent_searches의 FK 참조를 자동 갱신함
-- ============================================================
ALTER TABLE stocks RENAME TO assets;

-- 인덱스 이름 정리
ALTER INDEX idx_stocks_market  RENAME TO idx_assets_market;
ALTER INDEX idx_stocks_name    RENAME TO idx_assets_name;
ALTER INDEX idx_stocks_ticker  RENAME TO idx_assets_ticker;

-- RLS 정책 이름 정리
ALTER POLICY "stocks are publicly readable" ON assets
  RENAME TO "assets are publicly readable";
