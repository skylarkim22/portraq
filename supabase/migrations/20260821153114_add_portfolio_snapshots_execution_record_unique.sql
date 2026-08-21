-- ============================================================
-- portfolio_snapshots.execution_record_id는 항상 execution_records와
-- 1:1로 생성되지만(record_rebalancing_execution RPC), 이 불변식이
-- UNIQUE 제약으로 DB에 명시돼 있지 않았다. 명시적으로 강제한다.
-- ============================================================

ALTER TABLE portfolio_snapshots
  ADD CONSTRAINT portfolio_snapshots_execution_record_id_key
  UNIQUE (execution_record_id);
