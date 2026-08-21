// ============================================================
// ETF 분배금 금액 → asset_dividends INSERT SQL 생성
//
// 입력: scripts/input/seibro-etf-distributions-raw.json (SEIBRO 원본, 가공 전)
//   ISIN         → ticker (KR7XXXXXX00Y → XXXXXX)
//   RGT_STD_DT   → record_date (YYYY-MM-DD)  [분배기준일]
//   ESTM_STDPRC  → amount (주당분배금, 원)
//
// 출력: scripts/output/asset-dividends-etf.sql
//   assets 에 존재하는 티커만 JOIN 으로 필터(FK 위반 방지),
//   (ticker, record_date) 중복은 ON CONFLICT DO NOTHING 으로 무시(재실행 안전).
//
// 실행: node scripts/load-etf-dividend-amounts.mjs
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const INPUT = join(REPO_ROOT, "scripts/input/seibro-etf-distributions-raw.json");
const OUT_SQL = join(REPO_ROOT, "scripts/output/asset-dividends-etf.sql");

const isinToTicker = (isin) => isin.slice(3, 9);
const toDate = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const main = () => {
  const raw = JSON.parse(readFileSync(INPUT, "utf8"));

  // (ticker, record_date) 중복 제거 (원본은 회차별 1행이라 사실상 유일)
  const seen = new Set();
  const rows = [];
  for (const r of raw) {
    const ticker = isinToTicker(r.ISIN);
    const date = toDate(r.RGT_STD_DT);
    const amount = Number(r.ESTM_STDPRC);
    if (!Number.isFinite(amount) || amount < 0) continue;
    const key = `${ticker}|${date}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ ticker, date, amount });
  }

  const values = rows
    .map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.date)}, ${r.amount})`)
    .join(",\n");

  const sql = `-- ============================================================
-- ETF 분배금 금액 적재 (scripts/load-etf-dividend-amounts.mjs 자동 생성)
-- 출처: SEIBRO 분배금지급현황 원본. record_date=분배기준일, amount=주당분배금(원).
-- assets 에 있는 티커만 삽입(JOIN 필터), (ticker,record_date) 중복은 무시.
-- 총 ${rows.length}행.
-- ============================================================
BEGIN;

INSERT INTO asset_dividends (ticker, record_date, amount, source)
SELECT v.ticker, v.record_date::date, v.amount, 'SEIBRO'
FROM (VALUES
${values}
) AS v(ticker, record_date, amount)
JOIN assets a ON a.ticker = v.ticker
ON CONFLICT (ticker, record_date) DO NOTHING;

COMMIT;
`;

  mkdirSync(dirname(OUT_SQL), { recursive: true });
  writeFileSync(OUT_SQL, sql);
  console.log(`ETF 분배 금액 행: ${rows.length}`);
  console.log(`SQL → ${OUT_SQL}`);
};

main();
