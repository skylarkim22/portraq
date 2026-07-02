<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 커밋 컨벤션

커밋 메시지는 반드시 아래 프리픽스 중 하나를 사용한다.

- `feat:` 새로운 기능 추가
- `refact:` 기능 변경 없는 코드 리팩터링
- `docs:` 문서 수정 (AGENTS.md, README.md 등)
- `fix:` 버그 수정
- `chore:` 빌드·설정·패키지 변경

## Tanstack Query 코드 작성 가이드

- useQuery 사용할 때는 queryOptions을 사용하여 데이터를 받아온다.
- useMutation 사용해서 업데이트 할때는 낙관적 업데이트를 사용한다.

## Supabase 데이터베이스

### 테이블 구조

**portfolios** — 포트폴리오 기본 정보
- `id` UUID PK, `user_id` UUID (auth.users FK), `name` TEXT, `monthly_budget` NUMERIC, `template_id` TEXT, `created_at`, `updated_at`

**portfolio_assets** — 포트폴리오 내 종목
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `ticker` TEXT, `name` TEXT, `market` TEXT (KR/US/ETF), `ratio` NUMERIC (0~100), `shares` NUMERIC, `current_price` NUMERIC, `color` TEXT (hex), `sort_order` INTEGER, `memo` TEXT

**execution_records** — 저장 시 생성되는 실행 기록
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `executed_at` TIMESTAMPTZ, `total_budget` NUMERIC, `actions` JSONB, `memo` TEXT
- `actions` 구조: `[{ ticker, action: 'buy'|'sell'|'hold', quantity, price_per_share, total_amount }]`

**portfolio_snapshots** — 저장 시점 포트폴리오 스냅샷
- `id` UUID PK, `portfolio_id` UUID (portfolios FK), `execution_record_id` UUID (execution_records FK), `saved_at` TIMESTAMPTZ, `assets` JSONB, `total_value` NUMERIC
- `assets` 구조: `[{ ticker, name, ratio, shares, price_per_share, color }]`

**stocks** — 종목 마스터 (검색·자동완성용)
- `ticker` TEXT PK, `name` TEXT, `market` TEXT (KR/US/ETF), `created_at`, `updated_at`
- 데이터: KR 2,768개 / ETF 1,145개 / US 4,246개 (총 8,159개, 2026-06-24 기준)

**recent_searches** — 사용자 최근 검색 기록
- `id` UUID PK, `user_id` UUID (auth.users FK), `ticker` TEXT (stocks FK), `searched_at` TIMESTAMPTZ
- `(user_id, ticker)` UNIQUE 제약

### 공통 사항
- 모든 테이블 RLS 활성화 — 로그인 사용자는 본인 데이터만 접근
- `stocks`는 누구나 읽기 가능 (SELECT), 쓰기 차단
- 저장 버튼 1회 클릭 → `portfolios` 업데이트 + `execution_records` 생성 + `portfolio_snapshots` 생성 (트랜잭션)
