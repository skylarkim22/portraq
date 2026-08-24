-- dividend_inputs 저장(upsert) 시 42P10(ON CONFLICT 매칭 실패) 에러 수정.
--
-- PostgREST/Supabase JS의 upsert onConflict 옵션은 컬럼 목록만 보낼 뿐
-- WHERE절을 함께 보내지 않는데, Postgres는 partial unique index(직전
-- 마이그레이션의 WHERE asset_ticker IS NOT NULL 등)를 WHERE절 없는
-- ON CONFLICT (컬럼목록)으로는 추론하지 못한다(42P10).
--
-- 사실 partial 조건은 애초에 불필요했다 — 일반 UNIQUE(portfolio_id,
-- asset_ticker, month)도 NULL은 서로 다른 값으로 취급되는 Postgres
-- 기본 동작 덕분에 exclusive arc(둘 중 하나만 채워짐) 구조를 그대로
-- 지원한다. partial index를 일반 UNIQUE 제약으로 교체한다.
DROP INDEX IF EXISTS dividend_inputs_ticker_month_uniq;
DROP INDEX IF EXISTS dividend_inputs_custom_month_uniq;

ALTER TABLE dividend_inputs
  ADD CONSTRAINT dividend_inputs_ticker_month_uniq UNIQUE (portfolio_id, asset_ticker, month);
ALTER TABLE dividend_inputs
  ADD CONSTRAINT dividend_inputs_custom_month_uniq UNIQUE (portfolio_id, custom_asset_id, month);
