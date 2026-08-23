// ============================================================
// 기존 SEIBRO ETF 분배금 행(asset_dividends, source='SEIBRO')에
// pay_date/dividend_reason을 채우는 UPDATE SQL 생성
//
// 20260812063232_load_etf_dividend_amounts.sql이 SEIBRO 원본을 처음
// 적재할 당시엔 pay_date/dividend_reason 컬럼이 없어 NULL로 남아있다.
// 같은 원본 JSON(scripts/input/seibro-etf-distributions-raw.json)에
// 이미 두 값이 들어있으므로(TH1_PAY_TERM_BEGIN_DT=지급기간 개시일,
// RGT_RSN_DTAIL_NM=분배사유) 재수집 없이 채울 수 있다.
//
// 입력: scripts/input/seibro-etf-distributions-raw.json (SEIBRO 원본)
// 출력: scripts/output/asset-dividends-seibro-details.sql
//
// 실행: node scripts/backfill-seibro-dividend-details.mjs
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const INPUT = join(REPO_ROOT, "scripts/input/seibro-etf-distributions-raw.json");
const OUT_SQL = join(REPO_ROOT, "scripts/output/asset-dividends-seibro-details.sql");

const isinToTicker = (isin) => isin.slice(3, 9);
const toDate = (yyyymmdd) => {
  const digits = String(yyyymmdd ?? "").trim();
  return /^\d{8}$/.test(digits) ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : null;
};
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;
const sqlStrOrNull = (s) => (s === null || s === undefined ? "NULL" : sqlStr(s));

const main = () => {
  const raw = JSON.parse(readFileSync(INPUT, "utf8"));

  const seen = new Set();
  const rows = [];
  for (const r of raw) {
    const ticker = isinToTicker(r.ISIN);
    const recordDate = toDate(r.RGT_STD_DT);
    if (!recordDate) continue;
    const key = `${ticker}|${recordDate}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const payDate = toDate(r.TH1_PAY_TERM_BEGIN_DT);
    const reason = r.RGT_RSN_DTAIL_NM ? String(r.RGT_RSN_DTAIL_NM).trim() : null;
    if (!payDate && !reason) continue;
    rows.push({ ticker, recordDate, payDate, reason });
  }

  const values = rows
    .map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.recordDate)}, ${sqlStrOrNull(r.payDate)}, ${sqlStrOrNull(r.reason)})`)
    .join(",\n");

  const sql = `-- ============================================================
-- 기존 SEIBRO ETF 분배금 행에 pay_date/dividend_reason 채우기
-- (scripts/backfill-seibro-dividend-details.mjs 자동 생성)
-- 원본: scripts/input/seibro-etf-distributions-raw.json
--   TH1_PAY_TERM_BEGIN_DT → pay_date, RGT_RSN_DTAIL_NM → dividend_reason
-- source='SEIBRO' 행만 대상으로 한다(다른 소스 행 오염 방지).
-- 총 ${rows.length}행 대상.
-- ============================================================
BEGIN;

UPDATE asset_dividends AS d
SET pay_date = v.pay_date::date,
    dividend_reason = v.dividend_reason
FROM (VALUES
${values}
) AS v(ticker, record_date, pay_date, dividend_reason)
WHERE d.ticker = v.ticker
  AND d.record_date = v.record_date::date
  AND d.source = 'SEIBRO';

COMMIT;
`;

  mkdirSync(dirname(OUT_SQL), { recursive: true });
  writeFileSync(OUT_SQL, sql);
  console.log(`SEIBRO pay_date/dividend_reason 대상 행: ${rows.length}`);
  console.log(`SQL → ${OUT_SQL}`);
};

main();
