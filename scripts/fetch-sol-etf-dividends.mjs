// ============================================================
// SOL(신한자산운용) ETF 분배금 배치 — 로컬 수동 실행/dry-run 전용
//
// ETF 분배금은 공식 공개 API가 없어(scripts/fetch-kr-stock-dividends.mjs
// 헤더 주석 참고) 운용사 홈페이지가 공개하는 분배 데이터를 직접
// 수집한다. SOL은 상품 목록 API가 KRX 티커와 내부 상품코드를 함께
// 제공해 이름 매칭이 필요 없다. 분배 엑셀은 상품별로 2단계(토큰 발급 →
// 토큰으로 다운로드)를 거쳐야 하고, 토큰이 120초 후 만료되므로 상품마다
// 토큰 발급 직후 곧바로 다운로드한다. 토큰 발급 엔드포인트에 IP 기준
// rate limit이 걸려 있어(실측: 동시 10개 요청 시 즉시 차단) 낮은
// 동시성을 유지하고 rate limit 응답 시 지수 백오프로 재시도한다.
// 우리 assets 카탈로그에 있는 KR 티커만 걸러 저장한다(보유 여부와
// 무관 — #75/#76).
//
// 실제 매일 배치 실행은 Vercel Cron이 담당한다
// (apps/web/src/app/api/cron/fetch-sol-etf-dividends/route.ts,
//  apps/web/vercel.json). 같은 로직을 apps/web 쪽
// TypeScript(fetchSolEtfDividends.ts)로도 복제해 뒀다 — 실행 환경이
// 달라 공유 모듈로 묶기보다 중복을 허용했다.
//
// 실행:
//   node scripts/fetch-sol-etf-dividends.mjs [--dry-run]
//   (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 .env 또는 환경변수에서 읽는다)
// ============================================================

import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const SOURCE = "SOL";
const PRODUCT_LIST_URL = "https://www.soletf.com/api/etf/pds";
const TOKEN_URL = "https://www.soletf.com/file/token/fund";
const DOWNLOAD_URL_BASE = "https://www.soletf.com/api/etf/pds/down/dividend";
const PDS_REFERER = "https://www.soletf.com/ko/fund/etf/pds";
const REQUEST_TIMEOUT_MS = 20_000;
const CONCURRENCY = 1;
const TOKEN_RETRY_LIMIT = 4;
const TOKEN_RETRY_BASE_DELAY_MS = 2_000;
const PAGE_SIZE = 1000; // Supabase(PostgREST) db-max-rows 기본값 — Range 요청을 이 크기로 나눠 보낸다
const DRY_RUN_PREVIEW_LIMIT = 10;

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

const toIsoDate = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const digits = String(value).trim();
  return /^\d{8}$/.test(digits) ? `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}` : null;
};

// PostgREST db-max-rows(기본 1000)에 걸리지 않도록 페이지 단위로 전부 모은다.
const fetchValidKrTickers = async ({ supabaseUrl, serviceRoleKey }) => {
  const tickers = new Set();
  let offset = 0;
  for (;;) {
    const url = `${supabaseUrl}/rest/v1/assets?select=ticker&market=eq.KR`;
    const res = await fetch(url, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
      },
    });
    if (!res.ok) throw new Error(`assets 조회 실패: HTTP ${res.status} ${await res.text()}`);
    const rows = await res.json();
    for (const row of rows) tickers.add(row.ticker);
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return tickers;
};

const fetchJsonWithRetry = async (url) => {
  for (let attempt = 0; attempt <= TOKEN_RETRY_LIMIT; attempt += 1) {
    const res = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    if (res.ok) return res.json();
    if (res.status !== 403 && res.status !== 429) throw new Error(`${url} HTTP ${res.status}`);
    if (attempt === TOKEN_RETRY_LIMIT) throw new Error(`${url} HTTP ${res.status} (재시도 한도 초과)`);
    await delay(TOKEN_RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
};

const fetchProductList = async () => {
  const products = [];
  let page = 1;
  for (;;) {
    const data = await fetchJsonWithRetry(`${PRODUCT_LIST_URL}?keyword=&page=${page}`);
    for (const item of data.items) products.push({ ticker: item.ETF_CD6, fundCode: item.FUND_CD });
    if (page >= data.toalPage) break;
    page += 1;
  }
  return products;
};

const fetchToken = async (fundCode) => {
  for (let attempt = 0; attempt <= TOKEN_RETRY_LIMIT; attempt += 1) {
    const res = await fetch(`${TOKEN_URL}?fundCode=${fundCode}&downloadType=dividend`, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok && res.status !== 403 && res.status !== 429) throw new Error(`${TOKEN_URL} HTTP ${res.status}`);
    const data = res.ok ? await res.json() : {};
    if (data.success && data.token) return data.token;
    if (attempt === TOKEN_RETRY_LIMIT) return null;
    await delay(TOKEN_RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  return null;
};

const downloadWithFreshToken = async (fundCode) => {
  for (let attempt = 0; attempt <= TOKEN_RETRY_LIMIT; attempt += 1) {
    const token = await fetchToken(fundCode);
    if (!token) return null;
    const downloadUrl = `${DOWNLOAD_URL_BASE}/${fundCode}?token=${token}`;
    const downloadRes = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: { Referer: PDS_REFERER, "X-Requested-With": "XMLHttpRequest" },
    });
    if (downloadRes.ok) return Buffer.from(await downloadRes.arrayBuffer());
    if (downloadRes.status !== 403 || attempt === TOKEN_RETRY_LIMIT) {
      throw new Error(`${downloadUrl} HTTP ${downloadRes.status}`);
    }
    await delay(TOKEN_RETRY_BASE_DELAY_MS * 2 ** attempt);
  }
  return null;
};

const fetchProductDividendRows = async ({ product, validTickers }) => {
  if (!validTickers.has(product.ticker)) return [];

  const buffer = await downloadWithFreshToken(product.fundCode);
  if (!buffer) return [];
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headerRowIndex = grid.findIndex((row) => row.includes("지급기준일"));
  if (headerRowIndex === -1) return [];
  const header = grid[headerRowIndex];
  const recordDateCol = header.indexOf("지급기준일");
  const payDateCol = header.indexOf("실제지급일");
  const amountCol = header.indexOf("분배금액(원)");
  if ([recordDateCol, payDateCol, amountCol].some((i) => i === -1)) return [];

  const rows = [];
  for (const row of grid.slice(headerRowIndex + 1)) {
    const recordDate = toIsoDate(row[recordDateCol]);
    if (!recordDate) continue;
    const amount = Number(row[amountCol]);
    if (!Number.isFinite(amount) || amount <= 0) continue;
    rows.push({ ticker: product.ticker, record_date: recordDate, pay_date: toIsoDate(row[payDateCol]), dividend_reason: null, amount, source: SOURCE });
  }
  return rows;
};

const fetchInBatches = async ({ items, batchSize, handler }) => {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    results.push(...(await Promise.all(batch.map(handler))));
  }
  return results;
};

const upsertAssetDividends = async ({ supabaseUrl, serviceRoleKey, rows }) => {
  if (rows.length === 0) return;
  const res = await fetch(`${supabaseUrl}/rest/v1/asset_dividends?on_conflict=ticker,record_date`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`asset_dividends upsert 실패: HTTP ${res.status} ${await res.text()}`);
};

const main = async () => {
  const supabaseUrl = loadEnvValue("SUPABASE_URL");
  const serviceRoleKey = loadEnvValue("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 찾을 수 없습니다. .env 에 설정하거나 환경변수로 전달하세요.");
    process.exit(1);
  }

  console.log("· assets 카탈로그의 KR 티커 조회 중...");
  const validTickers = await fetchValidKrTickers({ supabaseUrl, serviceRoleKey });

  console.log("· SOL 상품 목록 조회 중...");
  const products = await fetchProductList();
  console.log(`· 상품 ${products.length}개 발견, 분배 내역 다운로드 중...`);

  const rowsByProduct = await fetchInBatches({
    items: products,
    batchSize: CONCURRENCY,
    handler: (product) => fetchProductDividendRows({ product, validTickers }),
  });
  const rows = rowsByProduct.flat();

  const matchedTickers = new Set(rows.map((r) => r.ticker));
  console.log(`\n· 파싱 완료: ${matchedTickers.size}개 상품, ${rows.length}건`);

  if (isDryRun) {
    console.log(`\n[dry-run] 실제 upsert는 건너뜁니다. (${rows.length}건 upsert 예정)`);
    for (const row of rows.slice(0, DRY_RUN_PREVIEW_LIMIT)) {
      console.log(`  [dry-run] ${row.ticker} → 기준일 ${row.record_date} / 지급일 ${row.pay_date ?? "-"} 주당 ${row.amount}원`);
    }
    return;
  }

  await upsertAssetDividends({ supabaseUrl, serviceRoleKey, rows });
  console.log(`\n✅ asset_dividends upsert 완료: ${rows.length}건`);
};

main().catch((e) => {
  console.error(`\n❌ 실패: ${e.message}`);
  process.exit(1);
});
