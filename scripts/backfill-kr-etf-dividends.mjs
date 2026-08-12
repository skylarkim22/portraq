// ============================================================
// KR ETF 배당(분배금) 스케줄 백필 스크립트
//
// ETF 는 DART(사업보고서)로 안 잡히므로, SEIBRO 분배금지급현황에서 받은
// 분배기준일 원본(scripts/input/etf-distributions.json)으로부터
// assets.dividend_frequency / dividend_months 를 산출한다.
//
// 원본 수집 방법(재현):
//   SEIBRO > ETF > 권리행사정보 > 분배금지급현황 페이지를 브라우저 자동화로 열고,
//   callServletService.jsp(action=exerInfoDtramtPayStatPlist)를 조회기간 13개월
//   (fromRGT_STD_DT~toRGT_STD_DT)로 30행씩 페이징해 전량 수집 → ISIN/RGT_STD_DT 집계.
//
// 입력(JSON): [{ isin, name, dates:["YYYYMMDD", ...] }, ...]
// 출력:
//   scripts/output/kr-etf-dividends.sql          ← 마이그레이션으로 승격해 적용
//   scripts/output/kr-etf-dividends-report.json  ← 종목별 판별 리포트
//
// 실행: node scripts/backfill-kr-etf-dividends.mjs
// ============================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const INPUT = join(REPO_ROOT, "scripts/input/etf-distributions.json");
const OUT_SQL = join(REPO_ROOT, "scripts/output/kr-etf-dividends.sql");
const OUT_REPORT = join(REPO_ROOT, "scripts/output/kr-etf-dividends-report.json");

// 분배기준일이 많을수록 자주 분배한다. 13개월 창에서 관측된 "서로 다른 월"의
// 개수로 주기를 추정한다. (신규 상장 ETF 는 관측 기간이 짧아 과소 추정될 수 있음)
const MONTHLY_MIN_DISTINCT_MONTHS = 8; // 8개월 이상 → 매월 분배로 간주
const QUARTERLY_MIN_DISTINCT_MONTHS = 3; // 3~7개월 → 분기(정도) 분배

// ISIN(KR7XXXXXX00Y) → 6자리 티커. 예: KR7337160006 → 337160
const isinToTicker = (isin) => isin.slice(3, 9);

// "YYYYMMDD" → 월(1~12)
const monthOf = (yyyymmdd) => parseInt(yyyymmdd.slice(4, 6), 10);

const deriveSchedule = (dates) => {
  const months = [...new Set(dates.map(monthOf))].sort((a, b) => a - b);
  const n = months.length;
  if (n >= MONTHLY_MIN_DISTINCT_MONTHS) {
    // 매월 분배: 일부 달을 걸렀어도 monthly 로 보고 월은 1~12 로 정규화
    return { frequency: "monthly", months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] };
  }
  if (n >= QUARTERLY_MIN_DISTINCT_MONTHS) {
    return { frequency: "quarterly", months };
  }
  if (n === 2) {
    return { frequency: "semiannual", months };
  }
  return { frequency: "annual", months }; // n === 1
};

// ── SQL 직렬화 ──
const toSqlArray = (months) => `ARRAY[${months.join(",")}]::smallint[]`;
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const buildSql = (rows) => {
  const values = rows
    .map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.frequency)}, ${toSqlArray(r.months)})`)
    .join(",\n");
  return `-- ============================================================
-- KR ETF 배당(분배금) 스케줄 백필 (scripts/backfill-kr-etf-dividends.mjs 자동 생성)
-- 데이터 출처: SEIBRO 분배금지급현황 (분배기준일 13개월).
-- 주기/월은 관측된 분배기준일의 "서로 다른 월" 개수로 추정.
--   monthly=8개월+ / quarterly=3~7 / semiannual=2 / annual=1
-- 분배 실적이 있는 ETF 만 UPDATE (무분배·TR형은 대상 없음 → NULL 유지).
-- 총 ${rows.length}개 종목.
-- ============================================================
BEGIN;

UPDATE assets AS a SET
  dividend_frequency = v.frequency,
  dividend_months = v.months
FROM (VALUES
${values}
) AS v(ticker, frequency, months)
WHERE a.ticker = v.ticker AND a.market = 'KR';

COMMIT;
`;
};

const main = () => {
  if (!existsSync(INPUT)) {
    console.error(`❌ 입력 파일 없음: ${INPUT}`);
    process.exit(1);
  }
  const etfs = JSON.parse(readFileSync(INPUT, "utf8"));

  const report = etfs.map(({ isin, name, dates }) => {
    const ticker = isinToTicker(isin);
    const { frequency, months } = deriveSchedule(dates);
    return { isin, ticker, name, distributionCount: dates.length, frequency, months };
  });

  const rows = report.map(({ ticker, frequency, months }) => ({ ticker, frequency, months }));

  mkdirSync(dirname(OUT_SQL), { recursive: true });
  writeFileSync(OUT_SQL, buildSql(rows));
  writeFileSync(OUT_REPORT, JSON.stringify(report, null, 2));

  const byFreq = report.reduce((acc, r) => ((acc[r.frequency] = (acc[r.frequency] || 0) + 1), acc), {});
  console.log("=== KR ETF 분배 스케줄 산출 ===");
  console.log(`총 ETF        : ${report.length}`);
  console.log(`  monthly     : ${byFreq.monthly || 0}`);
  console.log(`  quarterly   : ${byFreq.quarterly || 0}`);
  console.log(`  semiannual  : ${byFreq.semiannual || 0}`);
  console.log(`  annual      : ${byFreq.annual || 0}`);
  console.log(`\nSQL     → ${OUT_SQL}`);
  console.log(`리포트  → ${OUT_REPORT}`);
  console.log("\n적용: 생성 SQL 을 supabase/migrations/{timestamp}_backfill_kr_etf_dividends.sql 로 옮긴 뒤 `supabase db push`.");
};

main();
