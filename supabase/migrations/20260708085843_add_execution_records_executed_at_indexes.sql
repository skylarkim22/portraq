-- 리밸런싱 기록 조회(ORDER BY executed_at DESC)가 매번 전체 정렬을 하지 않도록
-- executed_at을 포함하는 인덱스를 추가한다.

-- 포트폴리오 필터 없이 전체 실행 기록을 날짜순으로 조회할 때
CREATE INDEX idx_execution_records_executed_at ON execution_records (executed_at DESC);

-- 특정 포트폴리오 + 날짜순으로 조회할 때
CREATE INDEX idx_execution_records_portfolio_executed_at ON execution_records (portfolio_id, executed_at DESC);
