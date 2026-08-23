# 배당/분배금 데이터 갱신 가이드

`asset_dividends`(ETF 분배금/개별주식 배당)는 매일 자동 실행되는 배치가 아니라
**가끔 사람이 SEIBRO에서 원본을 받아와 수동으로 갱신**하는 방식이다(#75) —
평균 매수 단가 대비 예상 분배율을 계산하는 게 목적이라 매일 최신일 필요는
없다고 판단했다. 자동 Cron으로 만들었던 시도(#82)는 이 이유로 되돌렸다.

개별주식 배당은 `fetch-kr-stock-dividends` Cron 배치(#76, source='DATA_GO_KR')가
매일 자동으로 갱신하므로 이 가이드는 필요 없다. 이 가이드는 그 배치가 커버하지
못하는 두 가지 — **ETF 분배금**과 **DART 배당의 pay_date 보강** — 를 다룬다.

## 1. ETF 분배금 갱신

**출처**: SEIBRO ETF 분배금 조회 페이지
`https://seibro.or.kr/websquare/control.jsp?w2xPath=/IPORTAL/user/etf/BIP_CNTS06030V.xml&menuNo=179`

기존 원본(`scripts/input/seibro-etf-distributions-raw.json`, 3,453건, 2026-08-12
수집)이 정확히 어떤 방식으로 받아졌는지는 기록이 없다. JSON 필드가
`ISIN`/`KOR_SECN_NM`/`RGT_STD_DT`/`ESTM_STDPRC`/`TH1_PAY_TERM_BEGIN_DT`/
`RGT_RSN_DTAIL_NM` 등 내부 API 응답 형태라, 페이지에 엑셀 다운로드 버튼이
있으면 그걸 쓰고, 없으면 브라우저 개발자도구 Network 탭에서 조회 시 호출되는
API 응답(JSON)을 그대로 저장하면 된다. 재갱신 시:

1. 위 페이지에서 전체 상품 분배 이력을 조회/다운로드해 아래와 동일한 필드를
   가진 JSON 배열로 `scripts/input/seibro-etf-distributions-raw.json`에 덮어쓴다.
   ```json
   { "ISIN": "KR70151P0002", "RGT_STD_DT": "20260731",
     "TH1_PAY_TERM_BEGIN_DT": "20260804", "ESTM_STDPRC": "30",
     "RGT_RSN_DTAIL_NM": "이익분배", ... }
   ```
2. `node scripts/load-etf-dividend-amounts.mjs` — 금액(INSERT) SQL 생성 →
   `scripts/output/asset-dividends-etf.sql`
3. `node scripts/backfill-seibro-dividend-details.mjs` — pay_date/dividend_reason
   (UPDATE) SQL 생성 → `scripts/output/asset-dividends-seibro-details.sql`
4. 두 SQL을 검토한 뒤 `supabase/migrations/`에 타임스탬프 파일로 복사해 마이그레이션으로 적용

## 2. 개별주식 배당 pay_date 보강 (선택)

`fetch-kr-stock-dividends`(DATA_GO_KR)가 매일 배당 이력 자체는 갱신하지만,
과거 DART 백필 행(`source='DART'`, 2026-08-12 이전 데이터)에는 여전히
`pay_date`가 없는 게 많다(원본 DART API에 지급일 개념이 없어서). 이걸
보강하고 싶을 때만 아래를 진행한다.

**출처**: SEIBRO 배당내역상세 페이지
`https://seibro.or.kr/websquare/control.jsp?w2xPath=/IPORTAL/user/company/BIP_CNTS01041V.xml&menuNo=285#`

1. 위 페이지에서 "배당내역상세"를 xls로 다운로드한다(실제로는 EUC-KR 인코딩
   HTML 테이블 파일 — 그대로 열면 한글이 깨지는 게 정상이다)
2. `node scripts/parse-seibro-stock-dividends-xls.mjs <다운로드한_xls_경로>` —
   `scripts/input/seibro-stock-dividends-raw.json`으로 파싱/저장(git 보존)
3. `node scripts/backfill-dart-dividend-pay-date.mjs` — pay_date(UPDATE) SQL 생성
   → `scripts/output/asset-dividends-dart-pay-date.sql`
   (DART의 record_date는 결산기준일, 이 원본의 record_date는 배정기준일이라
   개념이 달라 정확히 일치하는 행만 채워진다 — 전체가 채워지지 않는 게 정상)
4. SQL을 검토한 뒤 `supabase/migrations/`에 타임스탬프 파일로 복사해 마이그레이션으로 적용

## 공통 주의사항

- 두 원본 모두 `assets` 테이블에 실제 존재하는 티커만 삽입/갱신 대상이다(스크립트가 자동으로 필터링)
- `(ticker, record_date)` UNIQUE 제약 때문에 INSERT는 `ON CONFLICT DO NOTHING`으로
  안전하게 재실행 가능하다
- 생성된 SQL은 실행 전 반드시 사람이 검토한다(자동 적용 스크립트 없음)
