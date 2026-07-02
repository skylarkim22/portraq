-- ============================================================
-- portfolios에서 PRD 5.1에 없는 컬럼 제거
-- monthly_budget: execution_records.total_budget으로 대체
-- template_id: 템플릿 기반 여부 추적 기능 없음
-- ============================================================
ALTER TABLE portfolios
  DROP COLUMN monthly_budget,
  DROP COLUMN template_id;
