-- asset_dividends.source에 'KODEX'를 추가한다. ETF 분배금은 공식 공개 API가
-- 없어(data.go.kr 미제공, SEIBRO 오픈플랫폼은 법인 회원 전용), 운용사가 자사
-- 홈페이지에 공개하는 분배 현황 파일을 사용자가 직접 받아 적재한다. 운용사가
-- 늘어날 때마다(TIGER/ACE/SOL 등) 같은 방식으로 값을 추가한다.
ALTER TABLE asset_dividends DROP CONSTRAINT asset_dividends_source_check;
ALTER TABLE asset_dividends
  ADD CONSTRAINT asset_dividends_source_check
  CHECK (source IN ('DART', 'SEIBRO', 'DATA_GO_KR', 'KODEX'));
