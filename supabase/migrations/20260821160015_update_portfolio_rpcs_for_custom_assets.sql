-- ============================================================
-- save_portfolio: portfolio_assets가 name/market/color 대신
-- asset_ticker/custom_asset_id를 쓰도록 갱신. p_assets JSONB의 각
-- 항목은 이제 assetTicker/customAssetId 중 정확히 하나만 채워서
-- 보낸다(둘 다 없거나 둘 다 있으면 CHECK 제약에서 걸린다).
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
    portfolio_id, asset_ticker, custom_asset_id, ratio, shares, current_price, sort_order
  )
  SELECT
    p_portfolio_id,
    asset->>'assetTicker',
    (asset->>'customAssetId')::uuid,
    (asset->>'ratio')::numeric,
    (asset->>'shares')::numeric,
    (asset->>'currentPrice')::numeric,
    (asset->>'order')::integer
  FROM jsonb_array_elements(p_assets) AS asset;
END;
$$;

REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION save_portfolio(UUID, TEXT, TEXT, JSONB) TO authenticated;

-- ============================================================
-- record_rebalancing_execution: p_updated_assets의 각 항목도
-- assetTicker/customAssetId로 대상 행을 특정한다.
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
    AND (
      (u->>'assetTicker' IS NOT NULL AND pa.asset_ticker = u->>'assetTicker')
      OR
      (u->>'customAssetId' IS NOT NULL AND pa.custom_asset_id = (u->>'customAssetId')::uuid)
    );

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

REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) FROM anon;
GRANT EXECUTE ON FUNCTION record_rebalancing_execution(UUID, NUMERIC, JSONB, JSONB, JSONB) TO authenticated;
