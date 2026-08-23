-- asset_dividends.source에 'DATA_GO_KR'을 추가한다. 개별주식 배당 자동 배치가
-- data.go.kr 금융위원회_주식배당정보(GetStocDiviInfoService_V2, 한국예탁결제원 제공)를
-- 쓰기 시작하면서, 기존 DART/SEIBRO 수동 백필과 구분해 출처를 남기기 위함(#76).
ALTER TABLE asset_dividends DROP CONSTRAINT asset_dividends_source_check;
ALTER TABLE asset_dividends
  ADD CONSTRAINT asset_dividends_source_check
  CHECK (source IN ('DART', 'SEIBRO', 'DATA_GO_KR'));
