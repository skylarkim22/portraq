// ============================================================
// KR 배당 스케줄 백필 스크립트
//
// assets.dividend_frequency / dividend_months 를 채우기 위한 데이터를
// DART OpenAPI로부터 수집한다.
//
// 파이프라인:
//   1. seed.sql 에서 KR 티커(6자리) 목록을 읽는다.
//   2. DART corpCode.xml 을 받아 티커(stock_code) ↔ corp_code(8자리) 매핑.
//   3. 종목별 alotMatter(배당에 관한 사항) 을 조회해 "주당 현금배당금 > 0"
//      인지로 배당 지급 여부를 판별한다.
//   4. 주기(frequency)·지급 월(months)을 추론한다.
//        - DART alotMatter 는 연간 단위 금액만 주고 지급 월/주기는 주지 않는다.
//        - 국내 시장은 대다수가 연 1회 결산배당(기준일 12월 말)이므로
//          배당 지급 종목의 기본값을 annual / [12] 로 둔다.
//        - 분기·반기·월배당 종목은 아래 NON_ANNUAL_OVERRIDES 로 보정한다.
//   5. 무배당 종목은 건드리지 않는다(컬럼은 NULL 로 유지).
//   6. 적용용 UPDATE SQL 과 검토용 JSON 리포트를 출력한다.
//
// 실행:
//   node scripts/backfill-kr-dividends.mjs [--limit N] [--out <sql경로>]
//   (DART_API 는 .env 또는 환경변수에서 읽는다)
//
// 산출물(기본값):
//   scripts/output/kr-dividends.sql          ← supabase migration 으로 승격해 적용
//   scripts/output/kr-dividends-report.json  ← 종목별 매칭/배당 여부/금액 리포트
// ============================================================

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── 배당 주기 override ────────────────────────────────────────
// alotMatter 로는 주기/지급월을 알 수 없으므로, 연배당이 아닌(분기·반기·월)
// 종목은 여기에 직접 명시해 기본값(annual/[12])을 덮어쓴다.
// months 는 "배당기준일" 기준 월이다.
//
// ⚠️ 아래 목록은 예시이며 매년 바뀔 수 있다. 반드시 최신 배당 정책을 확인해
//    추가·수정할 것. (분기배당 여부는 각 사 IR / 배당결정 공시로 검증)
const NON_ANNUAL_OVERRIDES = {
  "005930": { frequency: "quarterly", months: [3, 6, 9, 12] }, // 삼성전자
  "005490": { frequency: "quarterly", months: [3, 6, 9, 12] }, // POSCO홀딩스
  "017670": { frequency: "quarterly", months: [3, 6, 9, 12] }, // SK텔레콤
  "005380": { frequency: "quarterly", months: [3, 6, 9, 12] }, // 현대차
  // 반기배당 예시: "XXXXXX": { frequency: "semiannual", months: [6, 12] },
  // 월배당 예시:   "XXXXXX": { frequency: "monthly", months: [1,2,3,4,5,6,7,8,9,10,11,12] },
};

const DART_BASE = "https://opendart.fss.or.kr/api";
const REPRT_CODE_ANNUAL = "11011"; // 사업보고서
// 조회할 사업연도: 최근 연도부터. 최신 사업보고서가 아직 없으면 이전 연도로 폴백.
const currentYear = new Date().getFullYear();
const BSNS_YEARS = [currentYear - 1, currentYear - 2];
// DART 는 버스트에 민감해 IP 단위로 연결을 끊는다(ECONNRESET). 낮은 동시성 +
// 넉넉한 지연 + 재시도로 안전하게 수집한다.
const CONCURRENCY = 2;
const REQUEST_DELAY_MS = 200; // 요청 간 지연
const MAX_RETRIES = 4; // 네트워크 오류·5xx·429 재시도 횟수

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const getArg = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const limit = getArg("--limit") ? Number(getArg("--limit")) : Infinity;
// --resume: 이전 리포트에서 성공(에러 없음)한 종목은 재사용하고, 에러난 종목만
// 다시 조회한다. IP 차단으로 중단된 실행을 이어받을 때 사용.
const resume = args.includes("--resume");
const outSqlPath = resolve(getArg("--out") ?? join(REPO_ROOT, "scripts/output/kr-dividends.sql"));
const outReportPath = join(dirname(outSqlPath), "kr-dividends-report.json");

// ── DART_API 키 로딩 (process.env → .env 탐색) ────────────────
const loadDartKey = () => {
  if (process.env.DART_API) return process.env.DART_API;
  // 현재 디렉토리부터 상위로 올라가며 .env 에서 DART_API 를 찾는다.
  let dir = REPO_ROOT;
  for (let depth = 0; depth < 6; depth += 1) {
    const envPath = join(dir, ".env");
    if (existsSync(envPath)) {
      const line = readFileSync(envPath, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith("DART_API="));
      if (line) return line.slice(line.indexOf("=") + 1).trim();
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
};

const DART_KEY = loadDartKey();
if (!DART_KEY) {
  console.error("❌ DART_API 키를 찾을 수 없습니다. .env 에 DART_API=... 를 넣거나 환경변수로 전달하세요.");
  process.exit(1);
}

// ── 유틸 ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 네트워크 오류(fetch failed/ECONNRESET)·5xx·429 는 지수 백오프로 재시도한다.
const fetchWithRetry = async (url) => {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === MAX_RETRIES) break;
      const backoff = Math.min(500 * 2 ** attempt, 8000) + Math.random() * 300;
      await sleep(backoff);
    }
  }
  throw lastErr;
};

// "1,444" / "-" / "" 같은 값을 숫자로. 파싱 불가·미배당은 0.
const parseNumber = (value) => {
  if (value == null) return 0;
  const cleaned = String(value).replace(/[,\s]/g, "");
  if (cleaned === "" || cleaned === "-") return 0;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
};

// se(구분) 문자열이 "주당 현금배당금" 항목인지 (공백/괄호 무시하고 판별)
const isCashDpsRow = (se) => String(se ?? "").replace(/\s/g, "").includes("주당현금배당금");

// ── 1. seed.sql 에서 KR 티커 읽기 ─────────────────────────────
const readKrTickers = () => {
  const seed = readFileSync(join(REPO_ROOT, "supabase/seed.sql"), "utf8");
  const tickers = [];
  // ('098120', '마이크로컨텍솔', 'KR'),
  const re = /\('([^']+)',\s*'((?:[^']|'')*)',\s*'KR'\)/g;
  let m;
  while ((m = re.exec(seed)) !== null) {
    tickers.push({ ticker: m[1], name: m[2].replace(/''/g, "'") });
  }
  return tickers;
};

// ── 2. corpCode.xml 다운로드 → stock_code ↔ corp_code 매핑 ─────
const buildCorpCodeMap = async () => {
  console.log("· corpCode.xml 다운로드 중...");
  const res = await fetchWithRetry(`${DART_BASE}/corpCode.xml?crtfc_key=${DART_KEY}`);
  if (!res.ok) throw new Error(`corpCode 다운로드 실패: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  // DART 는 에러 시 zip 대신 XML(status 코드)을 반환한다. zip 시그니처(PK) 확인.
  if (buf.slice(0, 2).toString() !== "PK") {
    throw new Error(`corpCode 응답이 zip 이 아님(키 오류 등): ${buf.slice(0, 200).toString()}`);
  }

  const zipPath = join(tmpdir(), `corpcode-${Date.now()}.zip`);
  writeFileSync(zipPath, buf);
  // zip 안의 CORPCODE.xml 을 stdout 으로 추출
  const xml = execFileSync("unzip", ["-p", zipPath, "CORPCODE.xml"], {
    maxBuffer: 200 * 1024 * 1024,
  }).toString("utf8");

  const map = new Map(); // stock_code → corp_code
  const re = /<list>([\s\S]*?)<\/list>/g;
  let block;
  while ((block = re.exec(xml)) !== null) {
    const chunk = block[1];
    const corp = /<corp_code>([^<]*)<\/corp_code>/.exec(chunk)?.[1]?.trim();
    const stock = /<stock_code>([^<]*)<\/stock_code>/.exec(chunk)?.[1]?.trim();
    if (corp && stock) map.set(stock, corp); // stock_code 있는(=상장) 항목만
  }
  console.log(`· corpCode 매핑 완료: 상장 ${map.size}건`);
  return map;
};

// 티커 → corp_code 조회. 우선주(예: 001045, 00104K)는 DART corpCode 에 없고
// 보통주 코드(끝자리 0)만 실리므로, 직접 매칭 실패 시 보통주 코드로 폴백한다.
// 반환: { corpCode, viaFallback } | null
const lookupCorp = (corpMap, ticker) => {
  const direct = corpMap.get(ticker);
  if (direct) return { corpCode: direct, viaFallback: false };
  const commonCode = `${ticker.slice(0, 5)}0`;
  if (commonCode !== ticker) {
    const fallback = corpMap.get(commonCode);
    if (fallback) return { corpCode: fallback, viaFallback: true };
  }
  return null;
};

// ── 3. alotMatter 조회 (연도 폴백 포함) ───────────────────────
// 반환: { isPayer, dps, year } | null(데이터 없음)
const fetchDividend = async (corpCode) => {
  for (const year of BSNS_YEARS) {
    const url =
      `${DART_BASE}/alotMatter.json?crtfc_key=${DART_KEY}` +
      `&corp_code=${corpCode}&bsns_year=${year}&reprt_code=${REPRT_CODE_ANNUAL}`;
    const res = await fetchWithRetry(url);
    if (!res.ok) throw new Error(`alotMatter HTTP ${res.status}`);
    const json = await res.json();

    if (json.status === "020") throw new Error("DART 사용한도 초과(020) — 중단");
    if (["010", "011", "012", "100", "101"].includes(json.status)) {
      throw new Error(`DART 키/인증 오류(${json.status}) — 중단`);
    }
    if (json.status === "013" || !Array.isArray(json.list)) continue; // 해당 연도 데이터 없음 → 폴백

    const dpsRows = json.list.filter((row) => isCashDpsRow(row.se));
    if (dpsRows.length === 0) continue;
    // 보통주/우선주 중 최대 주당현금배당금(당기)
    const dps = Math.max(...dpsRows.map((row) => parseNumber(row.thstrm)));
    return { isPayer: dps > 0, dps, year };
  }
  return null; // 모든 연도에서 데이터 없음
};

// ── 간단 동시성 풀 ────────────────────────────────────────────
const runPool = async (items, worker, concurrency) => {
  const results = new Array(items.length);
  let cursor = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await worker(items[i], i);
    }
  });
  await Promise.all(runners);
  return results;
};

// ── SQL 직렬화 ────────────────────────────────────────────────
const toSqlArray = (months) => `ARRAY[${months.join(",")}]::smallint[]`;
const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const buildSql = (rows) => {
  const values = rows
    .map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.frequency)}, ${toSqlArray(r.months)})`)
    .join(",\n");
  return `-- ============================================================
-- KR 배당 스케줄 백필 (scripts/backfill-kr-dividends.mjs 자동 생성)
-- 데이터 출처: DART alotMatter(배당 여부/주당현금배당금).
-- 주기·지급월은 추론값(기본 annual/[12], override 로 분기·반기·월 보정).
-- 배당 지급 종목만 UPDATE 하며 무배당 종목은 NULL 로 유지된다.
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

// ── 메인 ──────────────────────────────────────────────────────
const main = async () => {
  const allTickers = readKrTickers();
  const tickers = Number.isFinite(limit) ? allTickers.slice(0, limit) : allTickers;
  console.log(`· KR 티커 ${allTickers.length}개 중 ${tickers.length}개 처리`);

  // --resume: 이전 성공분 로드 (에러 없는 결과만 재사용)
  const prior = new Map();
  if (resume && existsSync(outReportPath)) {
    for (const x of JSON.parse(readFileSync(outReportPath, "utf8"))) {
      if (!x.error) prior.set(x.ticker, x);
    }
    console.log(`· resume: 이전 리포트에서 ${prior.size}건 재사용, 나머지만 재조회`);
  }

  const corpMap = await buildCorpCodeMap();

  let processed = 0;
  const report = await runPool(
    tickers,
    async ({ ticker, name }) => {
      if (prior.has(ticker)) {
        processed += 1;
        return prior.get(ticker);
      }
      if (REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS); // 실제 조회 시에만 지연
      const corp = lookupCorp(corpMap, ticker);
      const corpCode = corp?.corpCode ?? null;
      let dividend = null;
      let error = null;
      if (corpCode) {
        try {
          dividend = await fetchDividend(corpCode);
        } catch (e) {
          if (String(e.message).includes("중단")) throw e; // 한도/키 오류는 전체 중단
          error = String(e.message);
        }
      }

      const isPayer = dividend?.isPayer ?? false;
      const override = NON_ANNUAL_OVERRIDES[ticker];
      const frequency = isPayer ? (override?.frequency ?? "annual") : null;
      const months = isPayer ? (override?.months ?? [12]) : null;

      processed += 1;
      if (processed % 100 === 0) console.log(`  ... ${processed}/${tickers.length}`);

      return {
        ticker,
        name,
        corpCode,
        matched: Boolean(corpCode),
        matchedViaFallback: corp?.viaFallback ?? false,
        year: dividend?.year ?? null,
        isPayer,
        dps: dividend?.dps ?? null,
        frequency,
        months,
        overridden: Boolean(override),
        error,
      };
    },
    CONCURRENCY
  );

  // ── 결과 정리 ──
  const payers = report.filter((r) => r.isPayer);
  const unmatched = report.filter((r) => !r.matched);
  const errored = report.filter((r) => r.error);
  const overridden = report.filter((r) => r.overridden && r.isPayer);

  mkdirSync(dirname(outSqlPath), { recursive: true });
  writeFileSync(outSqlPath, buildSql(payers.map(({ ticker, frequency, months }) => ({ ticker, frequency, months }))));
  writeFileSync(outReportPath, JSON.stringify(report, null, 2));

  console.log("\n=== 요약 ===");
  console.log(`총 처리      : ${report.length}`);
  const fallbackMatched = report.filter((r) => r.matchedViaFallback);
  console.log(`corp_code 매칭: ${report.length - unmatched.length} (우선주 폴백 ${fallbackMatched.length}, 미매칭 ${unmatched.length})`);
  console.log(`배당 지급    : ${payers.length}`);
  console.log(`무배당       : ${report.length - payers.length - unmatched.length - errored.length}`);
  console.log(`override 적용 : ${overridden.length}`);
  console.log(`조회 에러    : ${errored.length}`);
  if (unmatched.length) console.log(`  미매칭 예시: ${unmatched.slice(0, 5).map((r) => r.ticker).join(", ")}`);
  console.log(`\nSQL     → ${outSqlPath}`);
  console.log(`리포트  → ${outReportPath}`);
  console.log("\n적용: 생성된 SQL 을 supabase/migrations/{timestamp}_backfill_kr_dividends.sql 로 옮긴 뒤 `supabase db push`.");
};

main().catch((e) => {
  console.error(`\n❌ 실패: ${e.message}`);
  process.exit(1);
});
