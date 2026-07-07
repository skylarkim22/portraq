-- Supabase 프로젝트는 초기 설정 시 ALTER DEFAULT PRIVILEGES로 public 스키마의
-- 신규 함수에 anon/authenticated 권한을 자동 부여한다. 이는 PUBLIC 가상 role이
-- 아니라 anon role에 직접 부여되는 grant라서, 이전 마이그레이션의
-- REVOKE ALL ... FROM PUBLIC 만으로는 anon의 실행 권한이 회수되지 않는다
-- (anon 키로 delete_portfolio를 호출하면 여전히 함수 본문까지 도달해
-- 'Portfolio not found or access denied' 예외가 발생하는 것으로 확인됨).
-- anon role에서 직접 REVOKE해야 실제로 익명 호출을 차단할 수 있다.

REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM anon;
REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM anon;
REVOKE ALL ON FUNCTION delete_portfolio(UUID) FROM anon;
