// ============================================================
// 주식 배당 금액(당기+전기) → asset_dividends INSERT SQL 생성
//
// DART alotMatter 의 주당 현금배당금 행에서
//   thstrm(당기)/frmtrm(전기) 금액과 stlm_dt(결산기준일)을 읽어
//   record_date(결산기준일)+amount(주당현금배당금) 로 적재한다.
//   - 당기: record_date = stlm_dt
//   - 전기: record_date = stlm_dt 의 (연도-1)  (직전 사업연도 결산기준일 근사)
//   - 우선주 티커는 우선주 행 금액을, 보통주는 보통주 행 금액을 사용
//
// 입력: scripts/output/kr-dividends-report.json (주식 백필 리포트, payer+corpCode)
// 출력: scripts/output/asset-dividends-stock.sql
//
// 실행: node scripts/load-stock-dividend-amounts.mjs
// ============================================================

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const REPORT = join(REPO_ROOT, "scripts/output/kr-dividends-report.json");
const OUT_SQL = join(REPO_ROOT, "scripts/output/asset-dividends-stock.sql");

const DART_BASE = "https://opendart.fss.or.kr/api";
const REPRT_ANNUAL = "11011";
const CONCURRENCY = 2;
const REQUEST_DELAY_MS = 200;
const MAX_RETRIES = 4;

const loadDartKey = () => {
  if (process.env.DART_API) return process.env.DART_API;
  let dir = REPO_ROOT;
  for (let d = 0; d < 6; d += 1) {
    const p = join(dir, ".env");
    if (existsSync(p)) {
      const line = readFileSync(p, "utf8").split("\n").find((l) => l.trim().startsWith("DART_API="));
      if (line) return line.slice(line.indexOf("=") + 1).trim();
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
};
const DART_KEY = loadDartKey();
if (!DART_KEY) { console.error("❌ DART_API 키 없음"); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fetchWithRetry = async (url) => {
  let last;
  for (let a = 0; a <= MAX_RETRIES; a += 1) {
    try {
      const res = await fetch(url);
      if (res.status === 429 || res.status >= 500) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch (e) {
      last = e;
      if (a === MAX_RETRIES) break;
      await sleep(Math.min(500 * 2 ** a, 8000) + Math.random() * 300);
    }
  }
  throw last;
};

const parseNumber = (v) => {
  if (v == null) return 0;
  const c = String(v).replace(/[,\s]/g, "");
  if (c === "" || c === "-") return 0;
  const n = Number(c);
  return Number.isFinite(n) ? n : 0;
};
const isCashDps = (se) => String(se ?? "").replace(/\s/g, "").includes("주당현금배당금");
// stlm_dt: "2025-12-31" 또는 "20251231" → "YYYY-MM-DD"
const normDate = (s) => {
  const t = String(s).replace(/[^0-9]/g, "");
  return t.length === 8 ? `${t.slice(0, 4)}-${t.slice(4, 6)}-${t.slice(6, 8)}` : null;
};
const prevYearDate = (isoDate) => `${Number(isoDate.slice(0, 4)) - 1}${isoDate.slice(4)}`;

// alotMatter 조회 → { curr, prev, recordDate } (주당현금배당금 당기/전기 + 결산기준일)
const fetchAmounts = async (corpCode, year, preferred) => {
  const url = `${DART_BASE}/alotMatter.json?crtfc_key=${DART_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=${REPRT_ANNUAL}`;
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.status === "020") throw new Error("DART 사용한도 초과(020) — 중단");
  if (["010", "011", "012", "100", "101"].includes(json.status)) throw new Error(`DART 오류(${json.status}) — 중단`);
  if (json.status !== "000" || !Array.isArray(json.list)) return null;

  const dpsRows = json.list.filter((r) => isCashDps(r.se));
  if (dpsRows.length === 0) return null;
  // 우선주 티커면 우선주 행, 아니면 보통주 행 우선 선택
  const wantPref = preferred;
  const pick =
    dpsRows.find((r) => (wantPref ? /우선/.test(r.stock_knd) : /보통/.test(r.stock_knd))) ?? dpsRows[0];
  const recordDate = normDate(pick.stlm_dt);
  if (!recordDate) return null;
  return { curr: parseNumber(pick.thstrm), prev: parseNumber(pick.frmtrm), recordDate };
};

const runPool = async (items, worker, concurrency) => {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await worker(items[idx]);
      await sleep(REQUEST_DELAY_MS);
    }
  }));
  return out;
};

const sqlStr = (s) => `'${String(s).replace(/'/g, "''")}'`;

const main = async () => {
  const report = JSON.parse(readFileSync(REPORT, "utf8"));
  const payers = report.filter((r) => r.isPayer && r.corpCode);
  console.log(`주식 payer 조회: ${payers.length}건`);

  let done = 0;
  const results = await runPool(payers, async (p) => {
    try {
      const a = await fetchAmounts(p.corpCode, p.year, p.matchedViaFallback);
      done += 1;
      if (done % 200 === 0) console.log(`  ... ${done}/${payers.length}`);
      return { ticker: p.ticker, ...a };
    } catch (e) {
      if (String(e.message).includes("중단")) throw e;
      return { ticker: p.ticker, error: String(e.message) };
    }
  }, CONCURRENCY);

  // asset_dividends 행 생성 (당기 + 전기, amount>0 만)
  const rows = [];
  for (const r of results) {
    if (!r || !r.recordDate) continue;
    if (r.curr > 0) rows.push({ ticker: r.ticker, date: r.recordDate, amount: r.curr });
    if (r.prev > 0) rows.push({ ticker: r.ticker, date: prevYearDate(r.recordDate), amount: r.prev });
  }
  // 중복 제거
  const seen = new Set();
  const uniq = rows.filter((r) => {
    const k = `${r.ticker}|${r.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const values = uniq.map((r) => `  (${sqlStr(r.ticker)}, ${sqlStr(r.date)}, ${r.amount})`).join(",\n");
  const sql = `-- ============================================================
-- 주식 배당 금액 적재 (scripts/load-stock-dividend-amounts.mjs 자동 생성)
-- 출처: DART alotMatter 주당현금배당금(당기+전기). record_date=결산기준일.
-- assets 존재 티커만 삽입, (ticker,record_date) 중복 무시. 총 ${uniq.length}행.
-- ============================================================
BEGIN;

INSERT INTO asset_dividends (ticker, record_date, amount, source)
SELECT v.ticker, v.record_date::date, v.amount, 'DART'
FROM (VALUES
${values}
) AS v(ticker, record_date, amount)
JOIN assets a ON a.ticker = v.ticker
ON CONFLICT (ticker, record_date) DO NOTHING;

COMMIT;
`;
  mkdirSync(dirname(OUT_SQL), { recursive: true });
  writeFileSync(OUT_SQL, sql);
  const errs = results.filter((r) => r && r.error).length;
  console.log(`\n생성 행: ${uniq.length} (당기+전기) | 조회 에러: ${errs}`);
  console.log(`SQL → ${OUT_SQL}`);
};

main().catch((e) => { console.error(`\n❌ 실패: ${e.message}`); process.exit(1); });
