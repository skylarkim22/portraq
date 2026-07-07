-- ============================================================
-- save_portfolio 확장: portfolios/portfolio_assets 갱신에 더해
-- execution_records + portfolio_snapshots 신규 레코드 삽입을
-- 같은 트랜잭션에 포함한다 (PRD 5.5 "저장 시 처리 흐름").
--
-- 파라미터가 늘어나 기존 4-param 시그니처를 대체하므로 이전
-- 오버로드를 명시적으로 제거한 뒤 재생성한다.
-- ============================================================
DROP FUNCTION IF EXISTS save_portfolio(UUID, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION save_portfolio(
  p_portfolio_id UUID,
  p_name TEXT,
  p_memo TEXT,
  p_assets JSONB,
  p_total_budget NUMERIC,
  p_actions JSONB,
  p_snapshot_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_execution_record_id UUID;
  v_total_value NUMERIC;
BEGIN
  UPDATE portfolios
  SET name = p_name, memo = p_memo
  WHERE id = p_portfolio_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Portfolio not found or access denied';
  END IF;

  DELETE FROM portfolio_assets WHERE portfolio_id = p_portfolio_id;

  INSERT INTO portfolio_assets (
    portfolio_id, ticker, name, market, ratio, shares, current_price, color, sort_order
  )
  SELECT
    p_portfolio_id,
    asset->>'ticker',
    asset->>'name',
    asset->>'market',
    (asset->>'ratio')::numeric,
    (asset->>'shares')::numeric,
    (asset->>'currentPrice')::numeric,
    asset->>'color',
    (asset->>'order')::integer
  FROM jsonb_array_elements(p_assets) AS asset;

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

GRANT EXECUTE ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB, NUMERIC, JSONB, JSONB) TO authenticated;
