# 📊 Portraq

적립식 투자 포트폴리오 관리 서비스

Portraq는 두 가지 서비스를 제공합니다.

- **포트폴리오 관리** — 종목을 직접 검색해 비중까지 구성하거나 검증된 대가의 전략을 템플릿으로 불러오고, 보유 현황을 반영한 리밸런싱 매수·매도 가이드로 매달 투자 실행을 안내합니다.
- **배당금 관리** — 종목별 실수령 배당금을 입력하면 월배당·분기배당·반기배당·연배당 주기와 최근 12개월 배당합, 매수 단가 대비 연 환산 수익률을 자동으로 계산합니다.

두 서비스는 완전히 독립적으로 동작하며 각각 별도로 활용할 수 있습니다. 자세한 기획 배경과 기능 명세는 [`docs/PRD.md`](docs/PRD.md)를 참고하세요.

## 기술 스택

| 영역 | 스택 |
|------|------|
| 프레임워크 | Next.js 16 (App Router), React 19 |
| 데이터 | Supabase (Auth, Postgres, RLS), TanStack Query v5 |
| 상태 관리 | Zustand |
| 폼·검증 | React Hook Form, Zod |
| UI 인터랙션 | Radix UI, dnd-kit (드래그앤드롭), sonner (토스트) |
| 스타일 | Tailwind CSS v4, shadcn/ui 기반 디자인 시스템 |
| 모노레포 | pnpm workspaces + Turborepo |
| 테스트 | Vitest, @testing-library/react |
| 문서화 | Storybook |

## 프로젝트 구조

```
apps/
  web/                 # Next.js 앱 — 인증, DB 호출, 라우팅
packages/
  ui/                  # 디자인 시스템 컴포넌트 (Button, Card 등)
  lib/                 # 공유 타입 · Zod 스키마 · 순수 유틸 함수
supabase/              # DB 스키마, 마이그레이션
docs/                  # PRD, 목업, 디자인 참고 자료
```

각 패키지의 역할과 파일 배치 규칙은 [`AGENTS.md`](AGENTS.md)에 정리되어 있습니다.

## 시작하기

### 요구 사항

- Node.js 20+
- pnpm 11+

### 설치 및 개발 서버 실행

```bash
pnpm install
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

`apps/web`에 Supabase 프로젝트 URL과 anon key를 담은 `.env.local`이 필요합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

### 그 외 명령어

```bash
pnpm build              # 전체 워크스페이스 빌드
pnpm test                # 전체 워크스페이스 테스트 (Vitest)
pnpm lint                # 전체 워크스페이스 린트
pnpm storybook            # packages/ui 컴포넌트 문서 (Storybook)
```

## 개발 프로세스 (AI 활용)

이 프로젝트는 [Claude Code](https://claude.com/claude-code)를 개발 파트너로 삼아, PRD 기반 이슈 우선순위 판단부터 구현·코드 리뷰·PR 생성까지 아래 흐름으로 진행했습니다.

1. **PRD → 이슈 우선순위 분석** (`/issue-plan`)
   [`docs/PRD.md`](docs/PRD.md)의 기능 명세를 P0(필수)/P1/P2 우선순위로 나눠 GitHub 이슈로 변환하고, DB 스키마 변경·공유 패키지(`packages/lib`, `packages/ui`) 변경 여부, 이슈 간 의존 관계를 기준으로 개발 순서를 정했습니다. P0 이슈(대가 포트폴리오 템플릿, 포트폴리오 편집, 리밸런싱 가이드 등 핵심 기능)를 먼저, 의존성이 없는 독립적인 이슈를 뒤로 배치했습니다.

2. **이슈 착수** (`/issue-start {이슈번호}`)
   이슈 하나당 브랜치 하나(`feat/#N-{설명}`)를 `develop`에서 생성하고, UI가 포함된 이슈는 `docs/mockups/`의 목업을 먼저 확인해 색상·컴포넌트 클래스·인터랙션 기준으로 구현 범위를 정리했습니다.

3. **구현**
   `AGENTS.md`에 정의된 파일 배치 규칙(`app/`은 라우팅 전담, `features/[feature]`는 `queries.ts`/`hooks.ts`/`components/` 계층, Query Key Factory 기반 TanStack Query 패턴)을 일관되게 따르며 기능을 구현했습니다.

4. **완료 및 검증** (`/issue-complete`)
   단위 테스트(Vitest) → 타입 체크 → 4개 전문 에이전트(스타일·보안·성능·아키텍처) 병렬 코드 리뷰 → 브라우저 검증 순으로 검증한 뒤, `Closes #N`을 포함한 PR을 `develop`으로 생성했습니다. 하나의 이슈가 하나의 PR로 이어지는 구조를 유지해 리뷰와 롤백 단위를 명확히 했습니다.

이 흐름과 브랜치·커밋·PR 컨벤션의 세부 규칙은 [`AGENTS.md`](AGENTS.md)에 정리되어 있습니다.

### 에이전트 하네스

위 프로세스를 반복 가능하게 만들기 위해 `.claude/`에 커스텀 커맨드와 서브에이전트를 구성했습니다.

**커맨드** (`.claude/commands/`)

| 커맨드 | 역할 |
|--------|------|
| `/issue-plan` | 오픈 이슈를 DB·공유 패키지 영향 범위와 의존 관계 기준으로 분류해 개발 순서 제안 |
| `/issue-start` | 이슈 내용 확인 → 브랜치 생성 → 관련 목업 확인 → 작업 계획 수립 |
| `/issue-complete` | 테스트 → 타입 체크 → 코드 리뷰 → 브라우저 검증 → PR 생성까지 완료 흐름 실행 |
| `/sync-prd` | 코드베이스와 `docs/PRD.md`의 내용이 어긋나지 않았는지 검증 |

**서브에이전트** (`.claude/agents/`)

`/issue-complete`의 코드 리뷰 단계에서 아래 4개 리뷰 에이전트가 각자의 관점으로 병렬 리뷰하고, `review-synthesizer`가 결과를 종합해 머지 가능 여부를 판정합니다.

| 에이전트 | 역할 |
|----------|------|
| `style-inspector` | TypeScript/React 컨벤션, 네이밍, `AGENTS.md` 규칙 준수 여부 검사 |
| `security-analyst` | OWASP Top 10, Supabase RLS 누락, 인증/인가 결함, 환경변수 노출 분석 |
| `performance-analyst` | React 리렌더링, TanStack Query 캐싱, 번들 크기, N+1 쿼리 분석 |
| `architecture-reviewer` | 파일 배치 규칙, 패키지 경계, 데이터 레이어 패턴, 의존성 방향 검증 |
| `review-synthesizer` | 4개 리뷰 결과 종합, 최종 머지 가능 여부 판정 |

이 외에도 UI 구현을 맡는 `frontend-dev`, Supabase 데이터 레이어·RLS를 맡는 `backend-dev`, 와이어프레임 설계를 맡는 `ux-designer`, 테스트 작성을 맡는 `unit-tester`, 브라우저 기반 검증을 맡는 `qa-tester` 에이전트를 필요에 따라 호출해 작업을 위임했습니다.

## 종가·배당 자동 배치

`apps/web/vercel.json`에 등록된 Vercel Cron이 평일마다 보유 중인 종목의 확정 종가와 배당 정보를 자동으로 갱신합니다. GitHub Actions에서는 data.go.kr 접속이 차단되어 있어 실행 위치를 Vercel Cron으로 정했습니다.

| 배치 | 실행 시각 (KST) | 데이터 소스 | 설명 |
|------|------|------|------|
| `fetch-kr-closing-prices` | 평일 09:30 | data.go.kr (공공데이터포털 금융위원회 시세정보) | 보유 중인 국내 종목의 확정 종가를 `asset_prices`에 upsert |
| `fetch-us-closing-prices` | 평일 21:30 | Finnhub `/quote` | 보유 중인 미국 종목의 마지막 체결가를 확정 종가로 upsert |
| `fetch-kr-stock-dividends` | 매일 22:00 | data.go.kr | 보유 중인 국내 종목의 배당 정보를 갱신 |

각 배치는 `apps/web/src/app/api/cron/fetch-*/route.ts`에 구현되어 있으며, `CRON_SECRET`으로 인증하고 실패 시 Discord로 알림을 보냅니다. 로컬에서 수동 실행·dry-run이 필요하면 `scripts/fetch-kr-closing-prices.mjs`, `scripts/fetch-us-closing-prices.mjs`를 사용하세요.

## 주식 데이터 현황

| 시장 | 종목 수 |
|------|---------|
| KR (KOSPI + KOSDAQ) | 2,768개 |
| ETF (국내) | 1,145개 |
| US (미국) | 4,246개 |
| **합계** | **8,159개** |

> 출처: KRX 정보데이터시스템 (한국), Nasdaq Stock Screener (미국) — 2026년 6월 24일 기준
