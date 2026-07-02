-- ============================================================
-- 1. portfolio_templates에 assets JSONB 컬럼 추가
--    TemplateAsset[]: { ticker, name, market, ratio, sort_order }
--    ticker null → 미확정 슬롯
-- ============================================================
ALTER TABLE portfolio_templates
  ADD COLUMN assets JSONB NOT NULL DEFAULT '[]';

-- ============================================================
-- 2. template_assets → portfolio_templates.assets 데이터 이전
-- ============================================================
UPDATE portfolio_templates pt
SET assets = (
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'ticker',     ta.ticker,
        'name',       ta.name,
        'market',     ta.market,
        'ratio',      ta.ratio,
        'sort_order', ta.sort_order
      )
      ORDER BY ta.sort_order
    ),
    '[]'::jsonb
  )
  FROM template_assets ta
  WHERE ta.template_id = pt.id
);

-- ============================================================
-- 3. template_assets 테이블 제거
--    (인덱스·RLS 정책 자동 삭제)
-- ============================================================
DROP TABLE template_assets;

-- ============================================================
-- 4. recent_searches 테이블 제거
--    (인덱스·RLS 정책 자동 삭제)
-- ============================================================
DROP TABLE recent_searches;
