// ============================================================
// 기존 DART 개별주식 배당 행(asset_dividends, source='DART')에
// pay_date를 채우는 UPDATE SQL 생성
//
// DART의 alotMatter API(주당현금배당금)에는 지급일 개념이 없어
// pay_date가 계속 NULL이었다(20260823150000 참고). SEIBRO
// 배당내역상세 페이지가 현금배당 지급일을 제공하므로, 이 원본을
// (종목코드, 배정기준일) 기준으로 매칭해 채운다.
//
// 주의: DART 쪽 record_date는 결산기준일(회계연도 말일)이고 이 원본의
// record_date는 배정기준일(실제 배당 건의 주주확정일)이라 개념이
// 달라 완전히 일치하지 않는다 — (ticker, record_date)가 정확히
// 일치하는 행만 채우고, 나머지는 그대로 NULL로 남겨둔다(안전한 범위만).
//
// 입력: scripts/input/seibro-stock-dividends-raw.json
//   (SEIBRO 배당내역상세 xls를 1회 파싱해 보존한 원본 — 재수집 번거로움 때문에
//    git 보존, ETF 쪽과 동일한 방식)
// 출력: scripts/output/asset-dividends-dart-pay-date.sql
//
// 실행: node scripts/backfill-dart-dividend-pay-date.mjs
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const INPUT = join(REPO_ROOT, "scripts/input/seibro-stock-dividends-raw.json");
const OUT_SQL = join(REPO_ROOT, "scripts/output/asset-dividends-dart-pay-date.sql");

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const main = () => {
  const raw = JSON.parse(readFileSync(INPUT, "utf8"));

  const rows = raw
    .filter((r) => r.ticker && r.recordDate && r.payDate)
    .map((r) => ({ ticker: r.ticker, recordDate: r.recordDate, payDate: r.payDate }));

  const values = rows
    .map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.recordDate)}, ${sqlStr(r.payDate)})`)
    .join(",\n");

  const sql = `-- ============================================================
-- 기존 DART 개별주식 배당 행에 pay_date 채우기
-- (scripts/backfill-dart-dividend-pay-date.mjs 자동 생성)
-- 원본: scripts/input/seibro-stock-dividends-raw.json (SEIBRO 배당내역상세)
-- source='DART' 행만 대상으로 하며, (ticker,record_date)가 정확히
-- 일치하는 행만 채운다(날짜 개념 차이로 일부만 매칭됨).
-- 총 ${rows.length}행 대상.
-- ============================================================
BEGIN;

UPDATE asset_dividends AS d
SET pay_date = v.pay_date::date
FROM (VALUES
${values}
) AS v(ticker, record_date, pay_date)
WHERE d.ticker = v.ticker
  AND d.record_date = v.record_date::date
  AND d.source = 'DART';

COMMIT;
`;

  mkdirSync(dirname(OUT_SQL), { recursive: true });
  writeFileSync(OUT_SQL, sql);
  console.log(`DART pay_date 대상 행: ${rows.length}`);
  console.log(`SQL → ${OUT_SQL}`);
};

main();
