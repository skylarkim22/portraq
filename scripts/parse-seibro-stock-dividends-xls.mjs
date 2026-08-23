// ============================================================
// SEIBRO "배당내역상세" xls(실제로는 EUC-KR HTML 테이블) →
// scripts/input/seibro-stock-dividends-raw.json 변환
//
// SEIBRO 사이트에서 배당내역상세를 xls로 다운로드하면 실제로는 EUC-KR
// 인코딩의 HTML 테이블 파일이 온다(그대로 열면 한글이 깨짐). 컬럼은
// 배정기준일/현금배당 지급일/종목코드/종목명/시장구분/배당구분/
// 주당배당금(일반) 등이며, 헤더가 colspan/rowspan을 쓰고 있어 데이터
// 행의 컬럼 인덱스가 표시상의 헤더 순서와 다르다(고정 인덱스로 파싱).
//
// 재수집이 번거로워 파싱 결과를 git에 원본처럼 보존해 둔다
// (scripts/input/seibro-stock-dividends-raw.json, ETF 쪽과 동일한 방식).
// scripts/backfill-dart-dividend-pay-date.mjs가 이 파일을 읽어
// asset_dividends(source='DART')의 pay_date를 채우는 SQL을 생성한다.
//
// 실행: node scripts/parse-seibro-stock-dividends-xls.mjs <xls경로>
// ============================================================

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as cheerio from "cheerio";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_JSON = join(REPO_ROOT, "scripts/input/seibro-stock-dividends-raw.json");

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("사용법: node scripts/parse-seibro-stock-dividends-xls.mjs <xls경로>");
  process.exit(1);
}

const toIsoDate = (yyyymmdd) => {
  const d = String(yyyymmdd ?? "").trim();
  return /^\d{8}$/.test(d) ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}` : null;
};

const main = () => {
  const buf = readFileSync(inputPath);
  const html = new TextDecoder("euc-kr").decode(buf);
  const $ = cheerio.load(html);

  // 데이터 행 컬럼(colspan 펼친 기준 고정 인덱스):
  // 0 배정기준일, 1 현금배당 지급일, 4 종목코드, 5 종목명, 6 시장구분,
  // 7 배당구분, 10 주당배당금(일반)
  const rows = [];
  $("table tr")
    .slice(2)
    .each((_, tr) => {
      const cells = $(tr)
        .find("td")
        .map((__, c) => $(c).text().trim())
        .get();
      if (cells.length < 11) return;
      const ticker = cells[4];
      const recordDate = toIsoDate(cells[0]);
      if (!ticker || !recordDate) return;
      rows.push({
        ticker,
        name: cells[5],
        market: cells[6],
        recordDate,
        payDate: toIsoDate(cells[1]),
        dividendReason: cells[7] || null,
        amount: cells[10] ? Number(cells[10]) : null,
      });
    });

  mkdirSync(dirname(OUT_JSON), { recursive: true });
  writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2));
  console.log(`파싱된 행: ${rows.length}`);
  console.log(`JSON → ${OUT_JSON}`);
};

main();
