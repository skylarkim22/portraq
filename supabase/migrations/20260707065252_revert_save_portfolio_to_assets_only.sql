-- ============================================================
-- save_portfolio를 portfolios/portfolio_assets만 갱신하는 원래
-- 형태로 되돌린다.
--
-- 이전 마이그레이션에서 execution_records/portfolio_snapshots
-- 생성을 같은 함수에 포함시켰으나, 이는 잘못된 설계였다: 편집
-- 화면에서 비율만 조정하고 저장하는 것과, 리밸런싱 가이드를 거쳐
-- 실제 매수·매도를 확정하는 것은 서로 다른 이벤트다. 매번 저장할
-- 때마다 "보유 없음(전부 hold)" 상태의 가짜 실행 기록·스냅샷이
-- 쌓이면 실행 이력(2.4 이력 조회)이 의미 없는 데이터로 오염된다.
--
-- execution_records/portfolio_snapshots 생성은 실제 보유 현황·
-- 투자금을 입력받는 리밸런싱 가이드(issue #19)의 확정 단계에서
-- 별도 메커니즘으로 처리한다.
-- ============================================================
DROP FUNCTION IF EXISTS save_portfolio(UUID, TEXT, TEXT, JSONB, NUMERIC, JSONB, JSONB);

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
