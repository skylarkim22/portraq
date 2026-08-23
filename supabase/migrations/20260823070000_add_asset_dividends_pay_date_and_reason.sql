-- asset_dividends에 pay_date(실제 지급일)·dividend_reason(배당사유)을 추가한다.
-- record_date(배당기준일, dvdnBasDt)와 pay_date(현금배당지급일, cashDvdnPayDt)는
-- 서로 다른 날짜다 — 기준일은 "이 날 주주여야 배당 대상"이고, 지급일은
-- "실제 돈이 입금되는 날"이다. #76(data.go.kr 금융위원회_주식배당정보)부터
-- 두 값을 함께 받아올 수 있어 컬럼을 분리한다.
ALTER TABLE asset_dividends
  ADD COLUMN pay_date DATE,
  ADD COLUMN dividend_reason TEXT;

COMMENT ON COLUMN asset_dividends.record_date IS '배당기준일(dividend record date) — 이 날 주주명부에 등재돼야 배당 대상';
COMMENT ON COLUMN asset_dividends.pay_date IS '실제 배당금 지급일. 소스에 값이 없으면 NULL';
COMMENT ON COLUMN asset_dividends.dividend_reason IS '배당사유(예: 현금배당). 소스에 값이 없으면 NULL';
