# Supabase 데이터베이스

> 테이블 구조·RLS 정책·배치 히스토리가 필요할 때 읽는다. 평소에는
> `AGENTS.md`에서 이 문서를 포인터로만 참조한다.

## 테이블 구조

**portfolios** — 포트폴리오 기본 정보
- `id` UUID PK, `user_id` UUID (auth.users FK), `name` TEXT, `monthly_budget` NUMERIC, `template_id` TEXT, `created_at`, `updated_at`

**portfolio_assets** — 포트폴리오 내 종목
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `asset_ticker` TEXT NULL (`assets` FK), `custom_asset_id` UUID NULL (`custom_assets` FK), `ratio` NUMERIC (0~100), `shares` NUMERIC, `current_price` NUMERIC, `sort_order` INTEGER
- `asset_ticker`/`custom_asset_id`는 exclusive arc(정확히 하나만 채워짐) — "카탈로그 종목" vs "직접 추가한 커스텀 종목"을 구분한다. `name`/`market`/`color`는 컬럼으로 보관하지 않고 `assets`/`custom_assets` 중 채워진 쪽과 JOIN해서 읽는다
- `current_price`는 "현재 평가금액" 표시용 값이 아니다. ① 마지막 리밸런싱 실행(저장) 시 사용자가 확정한 매수/매도 실행가, ② `portfolioQueries.lists()`/`detail()`이 `asset_prices`에서 해당 티커의 최신 종가를 못 찾았을 때(오늘 막 추가돼 배치가 아직 못 돈 종목 등)의 폴백 값 — 두 가지 용도로만 쓰인다. 실제 화면에 보여줄 가격은 `asset_prices.close_price`가 있으면 그쪽이 우선이다(`fetchLatestClosePrices`, `features/portfolio/queries.ts`)

**custom_assets** — 유저별 "직접 추가" 종목 (검색에 없는 종목을 이름·시장만 입력해 등록)
- `id` UUID PK, `user_id` UUID (auth.users FK), `name` TEXT, `market` TEXT (KR/US), `color` TEXT (hex), `created_at`
- `assets`(공개 카탈로그)와 별도 테이블 — service-role 배치가 `assets` 전체를 훑는 자리라 유저별 비공개 데이터를 섞지 않는다. RLS는 본인 것만 접근 가능(공개 읽기 아님)

**trade_logs** — 매매 일지 (1행 = 1종목 거래)
- `id` UUID PK, `user_id` UUID (auth.users FK), `type` TEXT (buy/sell), `date` DATE, `asset_ticker` TEXT NULL (`assets` FK), `custom_asset_id` UUID NULL (`custom_assets` FK), `quantity` NUMERIC, `price` NUMERIC, `tax` NUMERIC, `exchange_rate` NUMERIC, `memo` TEXT, `created_at`
- `asset_ticker`/`custom_asset_id`는 `portfolio_assets`와 동일한 exclusive arc 패턴

**execution_records** — 저장 시 생성되는 실행 기록
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `executed_at` TIMESTAMPTZ, `total_budget` NUMERIC, `actions` JSONB, `memo` TEXT
- `actions` 구조: `[{ ticker, action: 'buy'|'sell'|'hold', quantity, price_per_share, total_amount }]`

**portfolio_snapshots** — 저장 시점 포트폴리오 스냅샷
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `execution_record_id` UUID (execution_records FK), `saved_at` TIMESTAMPTZ, `assets` JSONB, `total_value` NUMERIC
- `assets` 구조: `[{ ticker, name, ratio, shares, price_per_share, color }]`

**assets** — 종목 마스터 (검색·자동완성 및 포트폴리오 보유 종목의 공개 카탈로그)
- `ticker` TEXT PK, `name` TEXT, `market` TEXT (KR/US — ETF 구분 컬럼 없음), `color` TEXT, `is_active` BOOLEAN, `dividend_frequency` TEXT NULL(monthly/quarterly/semiannual/annual), `dividend_months` SMALLINT[] NULL(배당 지급 월), `created_at`, `updated_at`
- 데이터: KR 3,913개 / US 4,246개 (총 8,159개, 2026-08-23 기준)
- `features/stocks`가 검색·자동완성 UI를 담당하지만 실제로 조회하는 테이블은 이 `assets`다(별도 `stocks` 테이블은 없음 — 과거 문서가 잘못돼 있었음)

**asset_prices** — 종목별 확정 종가 이력 (1:N)
- `ticker` TEXT (`assets` FK), `price_date` DATE, `close_price` NUMERIC, `created_at`, `updated_at`
- PK는 `(ticker, price_date)` 복합키 — `id` 컬럼 없음(다른 테이블이 이 행을 FK로 참조할 일이 없어 `asset_dividends`와 다르게 의도적으로 뺐다)
- `apps/web/src/app/api/cron/fetch-kr-closing-prices/route.ts` 배치(평일 매일, Vercel Cron — `apps/web/vercel.json`)가 data.go.kr(공공데이터포털) 금융위원회 시세정보 API(ETF/개별주식 두 엔드포인트)에서 KR 종목(실제 보유 중인 티커만) 확정 종가를 upsert. service-role 키로 RLS 우회. GitHub Actions에서는 apis.data.go.kr 접속이 막혀(UND_ERR_CONNECT_TIMEOUT) Vercel로 실행 위치를 옮겼다. `scripts/fetch-kr-closing-prices.mjs`는 같은 로직의 로컬 수동 실행/dry-run용 사본
- `apps/web/src/app/api/cron/fetch-us-closing-prices/route.ts` 배치(평일 매일, Vercel Cron)가 Finnhub `/quote`에서 US 종목(실제 보유 중인 티커만) 종가를 upsert. 무료 티어는 확정 종가 캔들(`/stock/candle`)이 Premium 전용이라, 미국 장 마감 이후 `/quote`의 `c`(마지막 체결가)를 종가로 간주하고 `t`(체결 타임스탬프)를 America/New_York 기준 날짜로 변환해 저장한다. `scripts/fetch-us-closing-prices.mjs`는 같은 로직의 로컬 수동 실행/dry-run용 사본
- 두 배치 모두 실패 시 `notifyDiscordFailure`(`features/asset-prices/notifyDiscordFailure.ts`)로 `DISCORD_WEBHOOK_URL` 웹훅에 알림을 보낸다. 변수가 없으면 조용히 건너뛴다
- `portfolioQueries.lists()`/`detail()`(`features/portfolio/queries.ts`)이 보유 티커의 최신 `close_price`를 조회해 `current_price` 대신 우선 사용한다(#60). 해당 티커의 행이 없으면(신규 추가 등) `portfolio_assets.current_price`로 폴백

**asset_dividends** — 종목별 배당/분배 금액 이력 (1:N)
- `id` UUID PK, `ticker` TEXT (`assets` FK), `record_date` DATE(배당기준일 — 이 날 주주여야 배당 대상), `pay_date` DATE NULL(실제 배당금 지급일), `dividend_reason` TEXT NULL(배당사유, 예: "현금배당"), `amount` NUMERIC(주당 배당금/분배금, 원), `source` TEXT (`DART`/`SEIBRO`/`DATA_GO_KR`), `created_at`, `updated_at`
- UNIQUE (ticker, record_date)
- `record_date`(배당기준일)와 배당락일(ex-dividend date, 보통 기준일 1영업일 전)은 다른 개념이다 — 이 테이블은 배당락일을 저장하지 않는다(거래일 캘린더 없이는 정확히 계산 불가, 별도 이슈로 다룰 것)
- 초기 데이터는 DART/SEIBRO 원본을 사람이 검토해 생성한 SQL을 마이그레이션으로 적용한 일회성 백필(`scripts/backfill-kr-dividends.mjs`, `scripts/load-stock-dividend-amounts.mjs`, `scripts/load-etf-dividend-amounts.mjs` — 전부 검토용 SQL 파일만 생성하고 DB에 직접 쓰지 않음)
- ETF 분배금과 DART 배당의 `pay_date` 보강은 자동 배치 대신 **가끔 사람이 SEIBRO 원본을 받아와 수동으로 갱신**하는 방식을 유지한다(평균 매수 단가 대비 예상 분배율 계산이 목적이라 매일 자동 갱신될 필요가 없다고 판단, #75). 자동 Cron으로 만들었던 시도(#82)는 이 이유로 되돌렸다. 갱신 절차·SEIBRO 페이지 URL·사용하는 스크립트는 `docs/dividend-data-refresh.md` 참고. DART 쪽 `dividend_reason`은 `alotMatter`(주당현금배당금) API 특성상 전부 `'현금배당'`으로 고정 백필했다(`20260823150000_backfill_dart_dividend_reason.sql`) — 이 API 자체엔 지급일 개념이 없어 `pay_date`는 일부만(SEIBRO 배당내역상세와 매칭되는 2,562건 중 839건) 채워져 있고 나머지는 NULL이다
- `apps/web/src/app/api/cron/fetch-kr-stock-dividends/route.ts` 배치(매일, Vercel Cron)가 data.go.kr 금융위원회_주식배당정보(`GetStocDiviInfoService_V2`, 한국예탁결제원 제공)에서 **개별주식**(보유 중인 티커만) 배당 이력을 upsert한다(#76, source='DATA_GO_KR'). 이 API는 하루치 시세가 아니라 전체 상장사 배당 이력 전체(수만 건)를 담고 있고 티커로 서버 필터링이 안 돼, 매 실행마다 `numOfRows=10000`으로 전체를 페이지네이션 순회하며 응답의 `isinCd`에서 티커를 뽑아 보유 티커와 매칭한다. `scripts/fetch-kr-stock-dividends.mjs`는 같은 로직의 로컬 수동 실행/dry-run용 사본
- **ETF 분배금은 위 배치가 커버하지 못한다** — `GetStocDiviInfoService_V2`는 개별주식 전용이라 ETF는 응답에 없다. 자동 수집 대신 수동 갱신 방식을 쓰기로 확정했다(바로 위 항목, `docs/dividend-data-refresh.md` 참고)

**dividend_inputs** — 유저가 종목별·월별로 직접 입력한 실수령 배당금 (#75)
- `id` UUID PK, `portfolio_id` UUID (`portfolios` FK), `asset_ticker` TEXT NULL (`assets` FK), `custom_asset_id` UUID NULL (`custom_assets` FK), `month` DATE(그 달 1일로 정규화, `CHECK (month = date_trunc('month', month)::date)`), `amount` NUMERIC(`CHECK (amount >= 0)`), `created_at`, `updated_at`
- `asset_ticker`/`custom_asset_id`는 `portfolio_assets`와 동일한 exclusive arc 패턴. UNIQUE는 `(portfolio_id, asset_ticker, month)`/`(portfolio_id, custom_asset_id, month)` 두 개의 **일반**(non-partial) UNIQUE 제약이다 — 처음엔 `WHERE ... IS NOT NULL` partial unique index로 만들었다가, PostgREST/Supabase-JS의 `upsert(row, {onConflict: "col1,col2,col3"})`가 컬럼 목록만으로는 partial index를 매칭하지 못해 `42P10` 에러가 나서(`20260824100000_fix_dividend_inputs_upsert_conflict.sql`) 일반 UNIQUE로 되돌렸다. Postgres는 UNIQUE 제약에서 NULL을 서로 다른 값으로 취급하므로, 다른 쪽 컬럼이 NULL인 행끼리는 애초에 충돌하지 않아 exclusive arc는 그대로 보장된다
- RLS는 `portfolio_assets`와 동일하게 `portfolio_id → portfolios.user_id = auth.uid()` 소유권 체인으로 검사한다
- `features/dividends/queries.ts`가 이 테이블의 최근 12개월치를 읽어 배당합·연 환산 수익률을 계산한다. **`asset_dividends`(카탈로그 추정치)로 폴백하지 않는다** — 사용자가 입력하지 않은 종목은 배당합·연 환산 수익률이 0으로 표시된다. 연 환산 수익률은 각 입력월에 실제로 보유하고 있던 수량(새 컬럼이 아니라 `execution_records`를 재생해 추정, `computeSharesTimelines`/`sharesAsOfMonth`, `features/dividends/computeAveragePurchases.ts`)으로 주당 배당금을 정규화한 뒤 연환산해 매수 단가와 비교한다 — 리밸런싱으로 중간에 수량이 늘어나도 왜곡되지 않는다

## 공통 사항
- 모든 테이블 RLS 활성화 — 로그인 사용자는 본인 데이터만 접근
- `assets`는 누구나 읽기 가능 (SELECT), 쓰기 차단
- `asset_prices`도 `assets`와 동일하게 누구나 읽기 가능, 쓰기는 RLS로 차단(배치는 service-role 키 사용)
- 저장 버튼 1회 클릭 → `portfolios` 업데이트 + `execution_records` 생성 + `portfolio_snapshots` 생성 (트랜잭션)
