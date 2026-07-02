-- ============================================================
-- assets.color 값 채우기 (PRD 5.6)
-- 팔레트: 20색, 인접 색조 차이 18° 이상
-- 해시: ticker 각 문자의 ASCII 코드 합산
-- 인덱스: hash % 20
-- ============================================================

UPDATE assets
SET color = (ARRAY[
  '#E53E3E', -- 0°   red
  '#E8692A', -- 18°  red-orange
  '#E89820', -- 36°  amber
  '#C8B800', -- 54°  yellow
  '#88C800', -- 72°  yellow-green
  '#3CB84A', -- 90°  green
  '#20A87A', -- 108° sea-green
  '#1898C8', -- 126° sky-blue
  '#2060D8', -- 144° blue
  '#4030C8', -- 162° blue-indigo
  '#7020B8', -- 180° indigo
  '#A018A0', -- 198° violet
  '#C81880', -- 216° magenta
  '#E01850', -- 234° rose
  '#E8382A', -- 252° scarlet
  '#C86020', -- 270° sienna
  '#A09000', -- 288° olive
  '#409820', -- 306° lime
  '#1890A0', -- 324° teal
  '#2840A8'  -- 342° navy
])[
  (
    (SELECT SUM(ASCII(SUBSTRING(assets.ticker, gs, 1)))
     FROM generate_series(1, LENGTH(assets.ticker)) gs)
    % 20
  ) + 1
]
WHERE color IS NULL;

-- 이후 INSERT 시 color 필수 보장
ALTER TABLE assets ALTER COLUMN color SET NOT NULL;
