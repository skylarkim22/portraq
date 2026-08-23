-- asset_dividends.source에 ETF 운용사 4곳을 추가한다. ETF 분배금은 공식
-- 공개 API가 없어(data.go.kr 미제공, SEIBRO 오픈플랫폼은 법인 회원 전용)
-- 각 운용사가 자사 홈페이지에 공개하는 분배 데이터를 무인증 HTTP 호출로
-- 직접 수집한다(#75/#76 참고).
ALTER TABLE asset_dividends DROP CONSTRAINT asset_dividends_source_check;
ALTER TABLE asset_dividends
  ADD CONSTRAINT asset_dividends_source_check
  CHECK (source IN ('DART', 'SEIBRO', 'DATA_GO_KR', 'KODEX', 'TIGER', 'PLUS', 'SOL'));
