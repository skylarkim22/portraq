-- DART 배당 행(source='DART')의 dividend_reason을 채운다. 원본 DART
-- alotMatter API(주당현금배당금)는 "현금배당" 항목만 조회하는 API라
-- 이 소스로 적재된 행은 전부 현금배당이 확실하다(pay_date는 이
-- API에 지급일 개념 자체가 없어 채울 수 없음 — 결산기준일만 제공).
UPDATE asset_dividends
SET dividend_reason = '현금배당'
WHERE source = 'DART'
  AND dividend_reason IS NULL;
