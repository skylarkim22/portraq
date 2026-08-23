-- asset_dividends.source에 'TIGER'를 추가한다. KODEX와 같은 이유(#75/#76
-- 참고) — 미래에셋자산운용이 자사 홈페이지에 공개하는 ETF 분배 내역 파일을
-- 사용자가 직접 받아 적재한다.
ALTER TABLE asset_dividends DROP CONSTRAINT asset_dividends_source_check;
ALTER TABLE asset_dividends
  ADD CONSTRAINT asset_dividends_source_check
  CHECK (source IN ('DART', 'SEIBRO', 'DATA_GO_KR', 'KODEX', 'TIGER'));
