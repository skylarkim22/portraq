<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 개발 프로세스

하나의 이슈 = 하나의 PR. 아래 흐름을 반드시 따른다.

```
/issue-plan          → 오픈 이슈 분석 및 개발 순서 결정
/issue-start {이슈번호}    → 브랜치 생성 + 작업 계획 수립
   ↓ 개발
/issue-complete      → 테스트 → 코드 리뷰 → 브라우저 검증 → PR 생성
```

**기본 브랜치**: `develop` (main이 아님)
**브랜치 네이밍**: `feat/#N-{short-description}` (예: `feat/#12-portfolio-list`)
**PR 대상**: `develop` 브랜치로 생성 (`--base develop`)
**PR 본문**: 반드시 `Closes #N` 포함해 이슈 자동 연결

## 커밋 컨벤션

커밋 메시지는 반드시 아래 프리픽스 중 하나를 사용한다.

- `feat:` 새로운 기능 추가
- `refact:` 기능 변경 없는 코드 리팩터링
- `docs:` 문서 수정 (AGENTS.md, README.md 등)
- `fix:` 버그 수정
- `chore:` 빌드·설정·패키지 변경

## 모노레포 패키지 역할

| 패키지 | 역할 | 금지 사항 |
|--------|------|-----------|
| `packages/ui` | 디자인 시스템 컴포넌트 (Button, Card 등) | Supabase, 라우팅, 비즈니스 로직 |
| `packages/lib` | 공유 타입·Zod 스키마·순수 유틸 함수 | 사이드 이펙트, React 의존성 |
| `apps/web` | Next.js 앱. 인증, DB 호출, 라우팅 전담 | 디자인 토큰 직접 정의 |

## apps/web 파일 배치 규칙

```
src/
  app/                        # Next.js 라우트 — page.tsx, layout.tsx만. 로직 없음
  components/                 # 앱 전역 컴포넌트 (Logo 등)
  features/[feature]/         # 피처 단위 묶음
    queries.ts                # queryOptions 정의 (Supabase 호출 위치)
    hooks.ts                  # useQuery / useMutation 훅
    components/               # 해당 피처 전용 컴포넌트
  lib/
    supabase/
      client.ts               # 브라우저용 Supabase 클라이언트
      server.ts               # 서버용 Supabase 클라이언트 (SSR)
```

피처 예시: `portfolio`, `stocks`, `trade-log`

## packages/ui 컴포넌트 작성 규칙

새 컴포넌트는 반드시 디렉토리 단위로 만들고, test + story를 함께 작성한다.

```
src/components/[ComponentName]/
  index.tsx                   # 컴포넌트 구현
  [ComponentName].test.tsx    # Vitest + @testing-library/react
  [ComponentName].stories.tsx # Storybook (tags: ['autodocs'])
```

작성 후 `src/components/index.ts`에 re-export를 추가한다.

## Tanstack Query 코드 작성 가이드

- `useQuery` 사용할 때는 `queryOptions`을 사용하여 데이터를 받아온다.
- `useMutation` 사용해서 업데이트 할때는 낙관적 업데이트를 사용한다.

### 데이터 레이어 패턴

Supabase 호출은 반드시 `features/[feature]/queries.ts`에 `queryOptions`으로 정의한다.
컴포넌트에서 Supabase를 직접 호출하지 않는다.

`queries.ts` 파일은 **Query Key Factory → queryOptions** 순서로 작성한다.

```ts
// features/portfolio/queries.ts
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// 1. Query Key Factory — 키를 한 곳에서 계층 구조로 관리
export const portfolioKeys = {
  all: ['portfolios'] as const,
  lists: () => [...portfolioKeys.all, 'list'] as const,
  detail: (id: string) => [...portfolioKeys.all, 'detail', id] as const,
  snapshots: (id: string) => [...portfolioKeys.all, 'snapshots', id] as const,
}

// 2. queryOptions — 키 팩토리에서 키를 가져와 정의
export const portfolioListQueryOptions = queryOptions({
  queryKey: portfolioKeys.lists(),
  queryFn: async () => {
    const { data, error } = await createClient()
      .from('portfolios').select('*')
    if (error) throw error
    return data
  },
  staleTime: 1000 * 60,
})

export const portfolioQueryOptions = (id: string) =>
  queryOptions({
    queryKey: portfolioKeys.detail(id),
    queryFn: async () => {
      const { data, error } = await createClient()
        .from('portfolios')
        .select('*, portfolio_assets(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
```

```ts
// features/portfolio/hooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { portfolioListQueryOptions, portfolioQueryOptions, portfolioKeys } from './queries'

export function usePortfolioList() {
  return useQuery(portfolioListQueryOptions)
}

export function usePortfolio(id: string) {
  return useQuery(portfolioQueryOptions(id))
}

export function useSavePortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => { /* Supabase upsert */ },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: portfolioKeys.all })
      const prev = queryClient.getQueryData(portfolioListQueryOptions.queryKey)
      queryClient.setQueryData(portfolioListQueryOptions.queryKey, (old: any[]) => [...old, newItem])
      return { prev }
    },
    onError: (_, __, ctx) =>
      queryClient.setQueryData(portfolioListQueryOptions.queryKey, ctx?.prev),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: portfolioKeys.all }),
  })
}
```

### Query Key Factory 무효화 범위

```ts
// 포트폴리오 전체 무효화 (목록 + 상세 + 스냅샷)
queryClient.invalidateQueries({ queryKey: portfolioKeys.all })

// 목록만 무효화
queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })

// 특정 포트폴리오 상세만 무효화
queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(id) })
```

### 피처별 Key Factory 목록

| 피처 | export 이름 | `all` 키 |
|------|-------------|----------|
| portfolio | `portfolioKeys` | `['portfolios']` |
| stocks | `stockKeys` | `['stocks']` |
| trade-log | `tradeLogKeys` | `['trade-logs']` |

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
