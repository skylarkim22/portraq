-- PostgreSQL은 함수 생성 시 기본적으로 PUBLIC(anon 포함 모든 role)에 EXECUTE 권한을
-- 자동 부여한다. save_portfolio/record_rebalancing_execution/delete_portfolio는 모두
-- authenticated 사용자만 호출해야 하므로, 이후 함수 로직이 느슨해지더라도 anon이
-- 애초에 호출조차 할 수 없도록 PUBLIC 권한을 명시적으로 회수한다.

REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION delete_portfolio(UUID) FROM PUBLIC;
