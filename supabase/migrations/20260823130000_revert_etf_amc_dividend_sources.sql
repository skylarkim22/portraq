-- ETF 운용사(KODEX/TIGER/PLUS/SOL) 자동 수집 배치를 되돌린다. 실제 필요는
-- "가끔 수동 갱신"으로 충분해(기존 SEIBRO/DART 수동 백필 방식 유지),
-- 매일 자동 실행되는 Cron까지는 필요 없다고 판단해 관련 PR을 닫았다.
-- 배치 테스트 중 실제로 upsert된 KODEX/TIGER/PLUS 행을 제거하고,
-- source CHECK 제약을 원래대로(DART/SEIBRO/DATA_GO_KR) 되돌린다.
DELETE FROM asset_dividends WHERE source IN ('KODEX', 'TIGER', 'PLUS', 'SOL');

ALTER TABLE asset_dividends DROP CONSTRAINT asset_dividends_source_check;
ALTER TABLE asset_dividends
  ADD CONSTRAINT asset_dividends_source_check
  CHECK (source IN ('DART', 'SEIBRO', 'DATA_GO_KR'));
