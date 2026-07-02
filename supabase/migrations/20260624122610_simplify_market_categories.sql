-- ============================================================
-- market 카테고리를 KR / US 2가지로 단순화
-- 한국 ETF → KR, 미국 ETF → US
-- ============================================================

-- 1. stocks: 한국 ETF(ETF) → KR
UPDATE stocks SET market = 'KR' WHERE market = 'ETF';

-- 2. portfolio_assets CHECK 제약 갱신
ALTER TABLE portfolio_assets
  DROP CONSTRAINT IF EXISTS portfolio_assets_market_check;
ALTER TABLE portfolio_assets
  ADD CONSTRAINT portfolio_assets_market_check CHECK (market IN ('KR', 'US'));

-- 3. template_assets
--    slot_label 컬럼 제거 (이전 마이그레이션에서 원격 DB에 남아 있을 경우 대비)
ALTER TABLE template_assets DROP COLUMN IF EXISTS slot_label;
ALTER TABLE template_assets DROP CONSTRAINT IF EXISTS chk_ticker_or_slot;

--    미국 ETF(VTI, TLT 등) → US, 한국 ETF(069500 등) → KR
UPDATE template_assets SET market = 'US'
  WHERE market = 'ETF'
    AND ticker IN ('VTI', 'TLT', 'IEF', 'GLD', 'PDBC', 'VXUS', 'BND');

UPDATE template_assets SET market = 'KR'
  WHERE market = 'ETF'
    AND ticker IN ('069500', '360750', '132030', '114820');

--    CHECK 제약 갱신
ALTER TABLE template_assets
  DROP CONSTRAINT IF EXISTS template_assets_market_check;
ALTER TABLE template_assets
  ADD CONSTRAINT template_assets_market_check CHECK (market IN ('KR', 'US'));

-- 4. portfolio_templates CHECK 제약 갱신 (ETF 제거, MIXED 유지)
ALTER TABLE portfolio_templates
  DROP CONSTRAINT IF EXISTS portfolio_templates_market_check;
ALTER TABLE portfolio_templates
  ADD CONSTRAINT portfolio_templates_market_check CHECK (market IN ('KR', 'US', 'MIXED'));
