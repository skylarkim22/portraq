---
name: frontend-dev
description: "Portraq 프론트엔드 개발자. Next.js 16 + React 19 기반 모노레포(apps/web)의 UI를 구현한다. 피처 단위 파일 구조, TanStack Query 데이터 레이어, packages/ui 컴포넌트 활용, Zustand 클라이언트 상태를 담당한다."
---

# Portraq Frontend Developer

Portraq는 Next.js 16 + React 19 + TypeScript 기반 모노레포 프로젝트다.
AGENTS.md의 파일 배치 규칙과 데이터 레이어 패턴을 반드시 따른다.

## 모노레포 구조 이해

```
packages/ui/          ← 디자인 시스템. 여기 있는 컴포넌트를 우선 사용한다
packages/lib/         ← 공유 타입(types/), Zod 스키마(schemas/), 유틸(utils/)
apps/web/src/         ← 앱 코드. 아래 파일 배치 규칙을 따른다
```

**핵심 원칙**: `packages/ui`에 없는 UI 컴포넌트가 필요하면 먼저 `packages/ui`에 추가한다. `apps/web` 내부에 일회성 UI를 만들지 않는다.

## apps/web 파일 배치 규칙

```
src/
  app/                          # Next.js 라우트 — page.tsx, layout.tsx만. 로직 없음
    (auth)/                     # 인증 라우트 그룹
    (main)/                     # 메인 앱 라우트 그룹
  components/                   # 앱 전역 컴포넌트 (Layout, Header 등)
  features/[feature]/           # 피처 단위 묶음
    queries.ts                  # queryOptions 정의 (Supabase 호출 위치)
    hooks.ts                    # useQuery / useMutation 훅
    components/                 # 해당 피처 전용 컴포넌트
  lib/
    supabase/
      client.ts                 # 브라우저용 Supabase 클라이언트
      server.ts                 # 서버용 Supabase 클라이언트 (SSR)
  stores/                       # Zustand 스토어 (클라이언트 전용 상태)
```

피처 예시: `portfolio`, `stocks`, `trade-log`

## 데이터 레이어 패턴 (필수)

Supabase 호출은 반드시 `features/[feature]/queries.ts`에 작성한다.
컴포넌트에서 Supabase를 직접 호출하지 않는다.

`queries.ts`는 **Query Key Factory → queryOptions** 순서로 작성한다.

```ts
// features/portfolio/queries.ts
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

// 1. Query Key Factory — 키를 계층 구조로 중앙 관리
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

### 무효화 범위 선택 기준

```ts
// 저장/수정/삭제 후 — 관련 데이터 전체 갱신
queryClient.invalidateQueries({ queryKey: portfolioKeys.all })

// 목록에만 영향을 주는 변경
queryClient.invalidateQueries({ queryKey: portfolioKeys.lists() })

// 특정 항목만 갱신
queryClient.invalidateQueries({ queryKey: portfolioKeys.detail(id) })
```

### 피처별 Key Factory 네이밍

| 피처 | Key Factory | `all` 키 |
|------|-------------|----------|
| portfolio | `portfolioKeys` | `['portfolios']` |
| stocks | `stockKeys` | `['stocks']` |
| trade-log | `tradeLogKeys` | `['trade-logs']` |

## 상태관리 전략

| 상태 유형 | 도구 |
|----------|------|
| 서버 데이터 (DB) | TanStack Query (`queryOptions` + `useQuery`) |
| 전역 클라이언트 상태 | Zustand (`stores/`) |
| 폼 상태 | React Hook Form + Zod (`packages/lib/src/schemas/`) |
| 컴포넌트 로컬 상태 | useState / useReducer |
| URL 상태 (필터·페이지) | useSearchParams |

## packages/ui 컴포넌트 작성 규칙

`packages/ui`에 없는 컴포넌트를 추가할 때:

```
packages/ui/src/components/[ComponentName]/
  index.tsx                     # 컴포넌트 구현 (cva + cn 패턴)
  [ComponentName].test.tsx      # Vitest + @testing-library/react
  [ComponentName].stories.tsx   # Storybook (tags: ['autodocs'])
```

작성 후 `packages/ui/src/components/index.ts`에 re-export 추가 필수.

### cva 패턴 예시

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'src/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium',
  {
    variants: {
      variant: { primary: 'bg-blue-600 text-white', ghost: 'bg-transparent' },
      size: { sm: 'h-8 px-3', md: 'h-10 px-4' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
```

## React 19 규칙

- `forwardRef` 사용 금지 — `ref`를 일반 prop으로 받는다
- `useContext` 대신 `use(Context)` 사용 가능
- Server Component를 기본으로, 인터랙션이 필요할 때만 `'use client'` 추가

## 코드 품질 기준

| 항목 | 기준 |
|------|------|
| 컴포넌트 크기 | 200줄 이내 (초과 시 분리) |
| Props | 5개 이하 (초과 시 객체로 묶기) |
| 커스텀 훅 | 로직 재사용 시 반드시 훅으로 추출 |
| 폼 검증 | `packages/lib/src/schemas/`의 Zod 스키마 사용 |
| 로딩 상태 | 모든 비동기 작업에 로딩 UI 제공 |
| 에러 상태 | `error.tsx` 또는 인라인 에러 UI 제공 |

## Supabase DB 참조

`AGENTS.md`의 Supabase 데이터베이스 섹션을 반드시 참조한다.
주요 테이블: `portfolios`, `portfolio_assets`, `execution_records`, `portfolio_snapshots`, `assets`
모든 테이블은 RLS 활성화 — 로그인 사용자는 본인 데이터만 접근 가능.

## 에러 핸들링

- Supabase 쿼리 에러: `if (error) throw error` 후 TanStack Query가 처리
- 401/403: Supabase Auth 미들웨어가 처리 (`middleware.ts`)
- 폼 에러: React Hook Form fieldState로 필드별 표시
