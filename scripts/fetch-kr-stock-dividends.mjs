// ============================================================
// KR 개별주식 배당 이력 — 로컬 수동 실행/dry-run 전용
//
// data.go.kr(공공데이터포털) 금융위원회_주식배당정보(GetStocDiviInfoService_V2,
// 한국예탁결제원 제공)에서 배당 이력을 가져와 asset_dividends 테이블에 upsert한다.
//
// 이 API는 "그날의 시세"가 아니라 전체 상장사의 배당 이력 전체(수만 건)를
// 담고 있고, 티커/ISIN으로 서버 필터링하는 파라미터가 없다(법인등록번호·
// 회사명만 가능) — 그래서 매 실행마다 numOfRows=10000 페이지로 전체를
// 순회하며 응답의 isinCd(예: KR7000020008)에서 티커(6자리, isin.slice(3, 9))를
// 뽑아 보유 티커와 일치하는 행만 골라낸다. ETF는 이 API에 아예 없다(개별주식
// 배당 전용 — ETF 분배금은 별도 후속 이슈).
//
// 실제 매일 배치 실행은 Vercel Cron이 담당한다
// (apps/web/src/app/api/cron/fetch-kr-stock-dividends/route.ts,
//  apps/web/vercel.json). 이 스크립트는 로컬에서 수동 실행하거나
// --dry-run으로 점검할 때만 쓴다. 같은 로직을 apps/web 쪽
// TypeScript(fetchKrStockDividends.ts)로도 복제해 뒀다 — 실행 환경
// (Node CLI vs Next.js 라우트)이 달라 공유 모듈로 묶기보다 중복을 허용했다.
//
// 실행:
//   node scripts/fetch-kr-stock-dividends.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY 는
//    .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const DATA_GO_KR_DIVIDEND_ENDPOINT = "https://apis.data.go.kr/1160100/GetStocDiviInfoService_V2/getDiviInfo_V2";
const PAGE_SIZE = 10_000; // 전체 약 7~8만 건을 이 크기로 나눠 순회
const MAX_RETRIES = 4;
const REQUEST_TIMEOUT_MS = 30_000; // Vercel(미국 리전) → data.go.kr 경로가 로컬보다 훨씬 느려 넉넉하게 잡는다
const DIVIDEND_TYPE_CASH = "02"; // stckDvdnRcd: 현금배당만 취급(주식배당 등 제외)
const SUPABASE_QUERY_RANGE = "0-9999";

// ── CLI 인자 ──────────────────────────────────────────────────
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

// ── 환경변수 로딩 (process.env → .env 탐색) ──
const loadEnvValue = (name) => {
  if (process.env[name]) return process.env[name];
  let dir = REPO_ROOT;
  for (let depth = 0; depth < 6; depth += 1) {
    const envPath = join(dir, ".env");
    if (existsSync(envPath)) {
      const line = readFileSync(envPath, "utf8")
        .split("\n")
        .find((l) => l.trim().startsWith(`${name}=`));
      if (line) return line.slice(line.indexOf("=") + 1).trim();
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return undefined;
};

// ── 유틸 ──────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const fetchWithRetry = async (url, options = {}) => {
  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const res = await fetch(url, { ...options, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
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

const isinToTicker = (isinCd) => isinCd.slice(3, 9);
const toIsoDate = (yyyymmdd) => `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
// cashDvdnPayDt는 값이 없으면 빈 문자열로 온다(예: stckHndvDt와 동일 패턴).
const toIsoDateOrNull = (yyyymmdd) => (yyyymmdd && yyyymmdd.length === 8 ? toIsoDate(yyyymmdd) : null);

// ── 1. portfolio_assets 에서 실제 보유 중인 KR 티커 조회 ───────
const fetchHeldKrTickers = async ({ supabaseUrl, serviceRoleKey }) => {
  const url = `${supabaseUrl}/rest/v1/portfolio_assets?select=asset_ticker,assets!inner(market)&assets.market=eq.KR`;
  const res = await fetchWithRetry(url, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Range: SUPABASE_QUERY_RANGE,
      "Range-Unit": "items",
    },
  });
  if (!res.ok) {
    throw new Error(`portfolio_assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
  }
  const rows = await res.json();
  return new Set(rows.map((r) => r.asset_ticker).filter(Boolean));
};

const buildPageUrl = ({ apiKey, pageNo }) =>
  `${DATA_GO_KR_DIVIDEND_ENDPOINT}?serviceKey=${apiKey}&numOfRows=${PAGE_SIZE}&pageNo=${pageNo}&resultType=json`;

const fetchDividendPage = async ({ apiKey, pageNo }) => {
  const res = await fetchWithRetry(buildPageUrl({ apiKey, pageNo }));
  if (!res.ok) throw new Error(`${DATA_GO_KR_DIVIDEND_ENDPOINT} HTTP ${res.status}`);
  const json = await res.json();
  const header = json?.response?.header;
  if (header?.resultCode !== "00") {
    throw new Error(`${DATA_GO_KR_DIVIDEND_ENDPOINT} 응답 오류: ${header?.resultCode} ${header?.resultMsg}`);
  }
  return json.response.body;
};

const toRows = (items, heldTickers) => {
  const rows = [];
  for (const item of items) {
    if (!item.isinCd || !item.dvdnBasDt || item.stckDvdnRcd !== DIVIDEND_TYPE_CASH) continue;
    const ticker = isinToTicker(item.isinCd);
    if (!heldTickers.has(ticker)) continue;
    const amount = Number(item.stckGenrDvdnAmt ?? 0);
    if (amount <= 0) continue;
    rows.push({
      ticker,
      record_date: toIsoDate(item.dvdnBasDt),
      pay_date: toIsoDateOrNull(item.cashDvdnPayDt),
      dividend_reason: item.stckDvdnRcdNm ?? null,
      amount,
      source: "DATA_GO_KR",
    });
  }
  return rows;
};

// ── 2. 전체 배당 이력 페이지네이션 순회 + 보유 티커 매칭 ────────
// Vercel(미국 리전)에서 data.go.kr까지 왕복 지연이 로컬보다 훨씬 커서
// 순차 조회는 함수 실행 제한을 넘기기 쉽다 — 1페이지로 totalCount·페이지
// 수를 먼저 확인한 뒤 나머지는 전부 병렬로 요청한다.
const fetchMatchingDividendRows = async ({ apiKey, heldTickers }) => {
  const firstPage = await fetchDividendPage({ apiKey, pageNo: 1 });
  const totalCount = Number(firstPage.totalCount ?? 0);
  const rows = toRows(firstPage.items?.item ?? [], heldTickers);
  console.log(`  · 1페이지 처리(누적 매칭 ${rows.length}건, 전체 ${totalCount}건 중)`);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  if (totalPages > 1) {
    const remainingPageNumbers = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
    const remainingPages = await Promise.all(remainingPageNumbers.map((pageNo) => fetchDividendPage({ apiKey, pageNo })));
    for (let i = 0; i < remainingPages.length; i += 1) {
      const pageRows = toRows(remainingPages[i].items?.item ?? [], heldTickers);
      rows.push(...pageRows);
      console.log(`  · ${remainingPageNumbers[i]}페이지 처리(누적 매칭 ${rows.length}건, 전체 ${totalCount}건 중)`);
    }
  }
  return rows;
};

// ── 3. asset_dividends upsert ─────────────────────────────────
// asset_dividends는 id(UUID)가 PK라 on_conflict 없이는 merge-duplicates가
// PK 기준으로 시도돼 항상 새 행으로 취급된다 — 실제 유니크 제약인
// (ticker, record_date)를 명시해야 한다.
const upsertAssetDividends = async ({ supabaseUrl, serviceRoleKey, rows }) => {
  const res = await fetchWithRetry(`${supabaseUrl}/rest/v1/asset_dividends?on_conflict=ticker,record_date`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`asset_dividends upsert 실패: HTTP ${res.status} ${await res.text()}`);
  }
};

// ── 메인 ──────────────────────────────────────────────────────
const main = async () => {
  const supabaseUrl = loadEnvValue("SUPABASE_URL");
  const serviceRoleKey = loadEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  const dataGoKrApiKey = loadEnvValue("DATA_GO_KR_API_KEY");
  if (!supabaseUrl || !serviceRoleKey || !dataGoKrApiKey) {
    console.error(
      "❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / DATA_GO_KR_API_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요."
    );
    process.exit(1);
  }

  console.log("· 보유 중인 KR 종목 조회 중...");
  const heldTickers = await fetchHeldKrTickers({ supabaseUrl, serviceRoleKey });
  if (heldTickers.size === 0) {
    console.log("· 보유 중인 KR 종목이 없습니다. 종료합니다.");
    return;
  }
  console.log(`· 대상 티커 ${heldTickers.size}개: ${[...heldTickers].sort().join(", ")}`);

  console.log("· 전체 배당 이력 조회 중(페이지네이션)...");
  const rows = await fetchMatchingDividendRows({ apiKey: dataGoKrApiKey, heldTickers });

  const matchedTickers = new Set(rows.map((r) => r.ticker));
  const missing = [...heldTickers].filter((t) => !matchedTickers.has(t)).sort();

  console.log(`\n· 조회 완료: 매칭 ${matchedTickers.size}종목 / 미매칭 ${missing.length}종목 (총 ${heldTickers.size}종목), 배당 레코드 ${rows.length}건`);
  if (missing.length > 0) console.log(`  미매칭(ETF 등 이 API에 없는 종목일 수 있음): ${missing.join(", ")}`);

  if (isDryRun) {
    console.log(`\n[dry-run] 실제 upsert는 건너뜁니다. (${rows.length}건 upsert 예정)`);
    for (const row of rows.slice(0, 10)) {
      console.log(
        `  [dry-run] ${row.ticker} → 기준일 ${row.record_date} / 지급일 ${row.pay_date ?? "-"} 주당 ${row.amount}원 (${row.dividend_reason ?? "-"})`
      );
    }
    return;
  }

  if (rows.length > 0) {
    await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  }
  console.log(`\n✅ asset_dividends upsert 완료: ${rows.length}건`);
};

main().catch((e) => {
  const causeMessage = e.cause ? ` (원인: ${e.cause.code ?? e.cause.message ?? e.cause})` : "";
  console.error(`\n❌ 실패: ${e.message}${causeMessage}`);
  process.exit(1);
});
