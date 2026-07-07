-- ============================================================
-- save_portfolio: 포트폴리오 이름/메모 갱신 + portfolio_assets
-- 전체 교체(delete-then-insert)를 하나의 트랜잭션으로 원자적 처리.
-- SECURITY INVOKER(기본값)라 호출자의 권한으로 실행되며, portfolios/
-- portfolio_assets의 기존 RLS 정책이 그대로 적용된다 — 본인 소유가
-- 아닌 포트폴리오는 UPDATE가 0행에 적용되어 예외로 처리된다.
-- ============================================================
CREATE OR REPLACE FUNCTION save_portfolio(
  p_portfolio_id UUID,
  p_name TEXT,
  p_memo TEXT,
  p_assets JSONB
)
RETURNS void
LANGUAGE plpgsql
AS $$
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
END;
$$;

GRANT EXECUTE ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) TO authenticated;
