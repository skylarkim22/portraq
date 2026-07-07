-- ============================================================
-- record_rebalancing_execution: 리밸런싱 가이드(Step 1~3)에서
-- 사용자가 최종 확정한 보유 주수·현재가·매수/매도 액션을 하나의
-- 트랜잭션으로 원자적 처리한다 (PRD 5.5 "② 리밸런싱 가이드의
-- 최종 확정 저장").
--
-- 포트폴리오 편집 화면의 저장(save_portfolio)과는 별개의 이벤트다.
-- 편집 화면 저장은 목표 비중만 바꾸고 실제 매수·매도가 없으므로
-- 실행 기록/스냅샷을 남기지 않는다.
--
-- SECURITY INVOKER(기본값)라 호출자의 권한으로 실행되며, 각 대상
-- 테이블(portfolio_assets/execution_records/portfolio_snapshots)의
-- 기존 RLS 정책이 그대로 적용된다.
-- ============================================================
CREATE OR REPLACE FUNCTION record_rebalancing_execution(
  p_portfolio_id UUID,
  p_total_budget NUMERIC,
  p_actions JSONB,
  p_updated_assets JSONB,
  p_snapshot_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_record_id UUID;
  v_total_value NUMERIC;
BEGIN
  PERFORM 1 FROM portfolios
  WHERE id = p_portfolio_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;

  UPDATE portfolio_assets pa
  SET shares = (u->>'shares')::numeric,
      current_price = (u->>'currentPrice')::numeric
  FROM jsonb_array_elements(p_updated_assets) AS u
  WHERE pa.portfolio_id = p_portfolio_id
    AND pa.ticker = u->>'ticker';

  INSERT INTO execution_records (portfolio_id, total_budget, actions)
  VALUES (p_portfolio_id, p_total_budget, p_actions)
  RETURNING id INTO v_execution_record_id;

  SELECT COALESCE(SUM((asset->>'shares')::numeric * (asset->>'pricePerShare')::numeric), 0)
  INTO v_total_value
  FROM jsonb_array_elements(p_snapshot_assets) AS asset;

  INSERT INTO portfolio_snapshots (portfolio_id, execution_record_id, assets, total_value)
  VALUES (p_portfolio_id, v_execution_record_id, p_snapshot_assets, v_total_value);
END;
$$;

GRANT EXECUTE ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) TO authenticated;
