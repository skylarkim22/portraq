-- ============================================================
-- delete_portfolio: 포트폴리오와 하위 데이터(portfolio_assets,
-- execution_records, portfolio_snapshots)를 함께 삭제한다.
--
-- SECURITY DEFINER로 만든 이유: portfolio_assets 등 하위 테이블의
-- RLS 정책은 `EXISTS (SELECT 1 FROM portfolios WHERE ... user_id =
-- auth.uid())` 형태로 portfolios와의 JOIN을 통해 소유권을 검사한다.
-- 그런데 `DELETE FROM portfolios`가 ON DELETE CASCADE를 트리거하는
-- 시점에는 같은 트랜잭션 내에서 이미 portfolios 행이 삭제된 뒤이므로,
-- 그 EXISTS 서브쿼리가 아무 것도 찾지 못해 하위 테이블의 RLS가
-- cascade 삭제를 막아버린다(에러 없이 조용히 0건 삭제) — 결과적으로
-- portfolios만 지워지고 하위 행은 고아로 남는 문제가 생긴다.
--
-- SECURITY DEFINER 함수는 함수 소유자(BYPASSRLS 권한을 가진 역할)
-- 권한으로 실행되어 RLS를 우회하므로 cascade가 정상 작동한다. 대신
-- 소유권 검증은 RLS에 위임하지 않고 함수 본문에서 직접
-- `user_id = auth.uid()`로 명시적으로 수행한다.
-- ============================================================
CREATE OR REPLACE FUNCTION delete_portfolio(p_portfolio_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM portfolios
  WHERE id = p_portfolio_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION delete_portfolio(UUID) TO authenticated;
