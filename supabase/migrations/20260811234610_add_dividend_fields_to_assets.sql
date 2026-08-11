-- ============================================================
-- assets 배당 스케줄 필드 추가
--   dividend_frequency: 배당 주기 (월/분기/반기/연). 무배당 종목은 NULL
--   dividend_months:    배당 지급 월(배당기준일 기준). 예: 분기배당 {3,6,9,12}
-- 실제 회차별 배당금(DPS)은 별도 1:N 테이블로 후속 관리 예정이며
-- 여기서는 종목의 배당 스케줄만 다룬다.
-- ============================================================
ALTER TABLE assets
  ADD COLUMN dividend_frequency TEXT
    CHECK (dividend_frequency IN ('monthly', 'quarterly', 'semiannual', 'annual')),
  ADD COLUMN dividend_months SMALLINT[]
    CHECK (
      dividend_months IS NULL
      OR dividend_months <@ ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::smallint[]
    );
