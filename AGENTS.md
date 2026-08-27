<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

## 개발 프로세스

하나의 이슈 = 하나의 PR. 아래 흐름을 반드시 따른다.

```
/issue-plan          → 오픈 이슈 분석 및 개발 순서 결정
/issue-start {이슈번호}    → 별도 워크트리에 브랜치 생성 + 작업 계획 수립
   ↓ 개발 (워크트리 내에서 진행)
/issue-complete      → 테스트 → 코드 리뷰 → 브라우저 검증 → PR 생성 → 워크트리 정리
```

**기본 브랜치**: `develop` (main이 아님)
**브랜치 네이밍**: `feat/#N-{short-description}` (예: `feat/#12-portfolio-list`)
**워크트리 격리**: 이슈 작업은 메인 작업 디렉토리에서 `git checkout -b`로 브랜치를 전환하지 않고, `git worktree add`로 `.claude/worktrees/{short-description}`에 별도 워크트리를 만들어 그 안에서 진행한다(`.claude/worktrees/`는 `.gitignore` 대상). 메인 작업 디렉토리는 항상 `develop`에 남아 있어 다른 작업과 브랜치 전환 없이 병행할 수 있다. PR 머지 후 `git worktree remove`로 정리한다.
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

## Import 컨벤션

`apps/web` 내부에서는 상대 경로(`./`, `../`) 대신 `@/` 절대 경로로 import한다.

```ts
// ❌ 지양
import { useStockSearch } from "../hooks";
import type { MarketFilter } from "../queries";

// ✅ 지향
import { useStockSearch } from "@/features/stocks/hooks";
import type { MarketFilter } from "@/features/stocks/queries";
```

같은 디렉토리 내 파일(`./index`, 컴포넌트 옆 `.test.tsx` 등)도 동일하게 `@/` 경로를 사용한다.
`packages/ui`, `packages/lib` 등 워크스페이스 패키지 import는 패키지명(`@portraq/ui`, `@portraq/lib/types`)을 그대로 사용한다.

`packages/ui` 내부(`src/components/ui/*` 등)는 예외다. 이 패키지는 자체 `tsconfig.json`/`vite.config.ts`에 `src/*` 절대경로 alias가 정의돼 있지만, 이 alias는 패키지 자신의 Vitest 실행 환경에서만 유효하고 `apps/web`처럼 소스를 직접 가져다 쓰는 소비 측 번들러/Vitest 설정에서는 해석되지 않는다. 따라서 `packages/ui` 내부 파일 간 import(예: `cn` 유틸)는 기존 관례대로 상대 경로(`../../lib/utils`)를 유지한다.

## 함수 선언 컨벤션

컴포넌트, 훅, 이벤트 핸들러 등 로컬/모듈 함수는 `function` 선언문 대신 화살표 함수(`const fn = () => {}`)로 작성한다.

```ts
// ❌ 지양
export function PortfolioHeader({ name }: PortfolioHeaderProps) {
  function handleClick() { ... }
  return ...;
}

// ✅ 지향
export const PortfolioHeader = ({ name }: PortfolioHeaderProps) => {
  const handleClick = () => { ... };
  return ...;
};
```

Next.js가 특정 형태를 요구하는 파일(`app/**/page.tsx`, `layout.tsx`의 `export default` 등)은 기존 코드와의 일관성이 더 중요하면 예외로 둘 수 있다.

## Props 타입 컨벤션

컴포넌트 내부에서만 쓰고 다른 파일이 import하지 않는 Props 타입은 `interface`가 아닌 `type`으로 선언하고 export하지 않는다.

```ts
// ❌ 지양 — 내부 전용인데 interface + export
export interface StockSearchProps {
  onSelect: (asset: Asset) => void;
}

// ✅ 지향
type StockSearchProps = {
  onSelect: (asset: Asset) => void;
};
```

다른 파일에서 재사용해야 하는 Props(예: `packages/ui`의 디자인 시스템 컴포넌트)는 기존대로 `interface` + export를 유지한다.

## 코드 품질 원칙 (Frontend Fundamentals 기반)

[Frontend Fundamentals](https://frontend-fundamentals.com/code-quality/code/)가 제시하는 "변경하기 쉬운 코드"의 4가지 기준을 따른다. 네 기준은 서로 트레이드오프 관계이므로(예: 응집도를 높이려 추상화하면 가독성이 떨어질 수 있음) 상황에 맞게 우선순위를 판단한다.

### 가독성 (Readability)

매직 넘버·복잡한 조건에는 이름을 붙인다.

```ts
// ❌ 지양
await delay(300);

// ✅ 지향
const ANIMATION_DELAY_MS = 300;
await delay(ANIMATION_DELAY_MS);
```

```ts
// ❌ 지양
const matched = products.filter((p) =>
  p.categories.some((c) => c.id === targetId && p.prices.some((price) => price >= min && price <= max))
);

// ✅ 지향
const matched = products.filter((p) => {
  const isSameCategory = p.categories.some((c) => c.id === targetId);
  const isPriceInRange = p.prices.some((price) => price >= min && price <= max);
  return isSameCategory && isPriceInRange;
});
```

중첩 삼항 연산자 대신 if문으로 위에서 아래로 읽히게 한다.

```ts
// ❌ 지양
const status = a && b ? "BOTH" : a || b ? (a ? "A" : "B") : "NONE";

// ✅ 지향
const status = (() => {
  if (a && b) return "BOTH";
  if (a) return "A";
  if (b) return "B";
  return "NONE";
})();
```

한 함수·훅이 여러 종류의 맥락을 동시에 다루지 않도록 쪼갠다. 예: 페이지의 쿼리 파라미터 5개를 한 훅(`usePageState`)에서 관리하지 않고 `useCardIdQueryParam`처럼 파라미터별로 분리한다 — 관련 없는 값이 바뀌어도 리렌더되지 않고, 이름만으로 역할을 알 수 있다.

### 예측 가능성 (Predictability)

같은 종류의 함수·훅은 반환 타입을 통일한다. `features/[feature]/hooks.ts`의 `useX` 훅들은 전부 TanStack Query 객체(`useQuery`/`useMutation` 리턴값)를 그대로 반환하거나 전부 `.data`만 반환하는 식으로 통일하고, 섞어 쓰지 않는다.

함수 이름·파라미터·반환 타입에 드러나지 않는 부수 효과(로깅 등)를 함수 안에 숨기지 않는다. 로깅·트래킹은 호출부에서 명시적으로 처리한다.

```ts
// ❌ 지양 — fetchBalance라는 이름만 보고는 로깅이 실행되는지 알 수 없음
async function fetchBalance() {
  const balance = await http.get<number>("...");
  logging.log("balance_fetched");
  return balance;
}

// ✅ 지향
async function fetchBalance() {
  return http.get<number>("...");
}
// 호출부
const balance = await fetchBalance();
logging.log("balance_fetched");
```

### 응집도 (Cohesion)

함께 수정되는 파일은 같은 디렉토리에 둔다 — `features/[feature]/` 구조가 이미 이 원칙을 따른다. 매직 넘버·상수는 사용처와 가까운 파일에 선언하고, 여러 피처에서 공유해야 할 때만 `packages/lib`로 올린다.

### 결합도 (Coupling)

하나의 훅·함수·컴포넌트는 하나의 책임만 갖는다. 여러 쿼리 파라미터를 한 훅이 다 관리하기보다, 파라미터별로 분리해 수정 영향 범위를 좁힌다.

여러 곳에서 비슷해 보인다는 이유만으로 성급하게 공통 훅·컴포넌트로 묶지 않는다. 페이지마다 로깅 값·닫기 동작·문구가 달라질 여지가 있다면, 공통화 대신 중복을 허용하는 편이 결합도를 낮춘다 — 한 페이지의 요구사항 변경이 다른 페이지에 영향을 주지 않는다.

Props Drilling이 깊어지면(3단계 이상) `children` 조합 패턴으로 중간 컴포넌트를 건너뛰거나, 필요시 Context로 전환한다.

## packages/ui 컴포넌트 작성 규칙

새 컴포넌트는 반드시 디렉토리 단위로 만들고, test + story를 함께 작성한다.

```
src/components/[ComponentName]/
  index.tsx                   # 컴포넌트 구현
  [ComponentName].test.tsx    # Vitest + @testing-library/react
  [ComponentName].stories.tsx # Storybook (tags: ['autodocs'])
```

작성 후 `src/components/index.ts`에 re-export를 추가한다.

**예외**: `src/components/ui/`의 shadcn/ui 유래 프리미티브(Button, Badge, Card, Input, Slider 등)는
위 test + story 규칙 대상이 아니다. 버그 수정·스타일링 변경 시에도 story를 새로 작성하지 않는다.

## Tanstack Query 코드 작성 가이드

- `useQuery` 사용할 때는 `queryOptions`을 사용하여 데이터를 받아온다.
- `useMutation`으로 수정(update/create/save)할 때는 낙관적 업데이트(`onMutate`에서 캐시를 미리 반영, 실패 시 `onError`에서 롤백)를 사용한다.
- 삭제(delete) mutation은 낙관적 업데이트를 사용하지 않는다. 서버가 성공을 확인한 `onSuccess`에서만 캐시를 반영한다. 단, `invalidateQueries`로 넓게 무효화하기보다 해당 항목만 캐시에서 직접 제거하는 방식을 우선한다(무한 스크롤 쿼리 등에서 불필요한 전체 재조회를 피하기 위함).
  - **예외**: 커서(keyset) 기반 무한 스크롤 쿼리에서, 삭제로 인해 페이지당 항목 수가 고정 페이지 크기 미만으로 줄어들어 목록을 다시 채워야 하는 경우에는 캐시 직접 제거 직후 `queryClient.refetchQueries({ queryKey, type: "active" })`로 이미 로드된 페이지를 재조회하는 것을 허용한다. 커서 기반이라 오프셋 밀림 없이 안전하게 다시 채워지기 때문이다. 단 오프셋 기반 페이지네이션에는 이 예외를 적용하지 않는다(삭제로 서버 데이터가 줄면 오프셋이 밀려 레코드를 건너뛰는 문제가 생긴다).

### TanStack Query를 쓸지 판단하는 기준

TanStack Query는 **클라이언트 인터랙션(뮤테이션, 다른 화면의 변경사항에 즉시
반응해야 하는 구독)이 실제로 필요한 화면**에만 쓴다. 판단 기준:

- 그 화면 **안에서** 인라인 뮤테이션(삭제·수정·추가 등 즉시 반영돼야 하는 액션)이 있다, 또는
- 그 화면이 **다른 화면에서 일어난 변경**(다른 페이지의 뮤테이션이 `invalidateQueries`로 무효화한 캐시 등)에 클라이언트에서 자동으로 반응해야 한다

둘 다 아니고 **서버에서 가져온 데이터를 그대로 보여주기만 하는 화면**이라면
TanStack Query(`useQuery`/`HydrationBoundary`) 없이 Server Component가
`queries.ts`의 fetch 함수를 직접 `await`해 결과를 props로 내려준다. 이 경우
데이터가 여러 사용자에 걸쳐 공유 가능한 공개 데이터(RLS가 누구나 읽기
허용)라면, 서버 fetch 자체를 Next.js Data Cache(`fetch`의
`next: { tags, revalidate }`, 또는 이를 주입한 전용 Supabase 클라이언트)로
캐싱해 반복 요청을 줄인다 — `features/asset-prices/getCachedAssetPriceClient.ts`가
그 예다. 반대로 RLS가 소유자로 스코프하는 사용자별 데이터라면 이런 캐싱을
적용하지 않고 매 요청 동적 렌더링에 맡긴다.

**주의**: 다른 곳(특히 항상 마운트돼 있는 레이아웃/사이드바)에 같은 데이터를
TanStack Query로 구독하는 컴포넌트가 이미 있다면, 이 화면을 TanStack Query에서
빼는 순간 그 컴포넌트가 공유하던 캐시가 끊겨 별도로 재요청하게 된다. 그
컴포넌트까지 함께 전환할 게 아니라면, 이미 가져온 데이터를
`queryClient.setQueryData(key, data)`로 캐시에 심어 `HydrationBoundary`로
넘겨(페이지 본문 자체는 여전히 props로 렌더) 그 컴포넌트가 재요청하지 않게
해준다 — `/home`이 사이드바의 `PortfolioNavItem`(`portfolioQueries.lists()`
구독)에 대해 이렇게 처리한 사례다(#86).

이 기준을 적용해 TanStack Query 없이 구현된 현재 사례: `/home`의
`SummaryTiles`(숫자만 props로 받음)/`PortfolioPreviewSection`/
`RecentHistorySection`. 나중에 어느 화면이든 인라인 뮤테이션이나 다른 화면
반응성이 필요해지면 이 기준에 따라 TanStack 기반 패턴(아래 "서버
프리페치(SSR) 패턴")으로 전환한다.

### 데이터 레이어 패턴

Supabase 호출은 반드시 `features/[feature]/queries.ts`에 `queryOptions`으로 정의한다.
컴포넌트에서 Supabase를 직접 호출하지 않는다.

`queries.ts`는 **Query Key와 queryOptions를 하나의 객체**로 묶어서 작성한다.
`all`은 키 배열만 반환하고, 그 외 항목은 `all()`을 이어붙인 키로 `queryOptions`(또는
무한 스크롤이면 `infiniteQueryOptions`)를 반환한다.

```ts
// features/portfolio/queries.ts
import { queryOptions } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export const portfolioQueries = {
  all: () => ['portfolios'] as const,

  lists: () =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), 'list'] as const,
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('portfolios').select('*')
        if (error) throw error
        return data
      },
      staleTime: 1000 * 60,
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), 'detail', id] as const,
      queryFn: async () => {
        const { data, error } = await createClient()
          .from('portfolios')
          .select('*, portfolio_assets(*)')
          .eq('id', id)
          .single()
        if (error) throw error
        return data
      },
    }),
}
```

`hooks.ts`에는 `useQuery`/`useInfiniteQuery` 훅만 둔다. `useMutation` 훅은 같은 피처 안의
별도 `mutations.ts`로 분리한다.

```ts
// features/portfolio/hooks.ts
import { useQuery } from '@tanstack/react-query'
import { portfolioQueries } from '@/features/portfolio/queries'

export const usePortfolioList = () => useQuery(portfolioQueries.lists())
export const usePortfolio = (id: string) => useQuery(portfolioQueries.detail(id))
```

```ts
// features/portfolio/mutations.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { portfolioQueries } from '@/features/portfolio/queries'

export const useSavePortfolio = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => { /* Supabase upsert */ },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: portfolioQueries.all() })
      const listQueryKey = portfolioQueries.lists().queryKey
      const prev = queryClient.getQueryData(listQueryKey)
      queryClient.setQueryData(listQueryKey, (old: any[]) => [...old, newItem])
      return { prev }
    },
    onError: (_, __, ctx) => {
      queryClient.setQueryData(portfolioQueries.lists().queryKey, ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: portfolioQueries.all() })
    },
  })
}
```

캐시를 직접 조작할 때, `all()`처럼 키만 반환하는 함수는 그대로 `queryKey`로 쓰고,
`lists()`/`detail(id)`처럼 `queryOptions`를 반환하는 함수는 `.queryKey`를 붙여 꺼낸다
(예: `portfolioQueries.detail(id).queryKey`).

### 서버 프리페치(SSR) 패턴

Server Component에서 미리 데이터를 가져와 클라이언트에 그대로 넘겨줘야 하는
라우트(현재 `/portfolio`, `/portfolio/[id]`, `/rebalancing-history`,
`/templates`)는 아래 패턴을 따른다.

`queries.ts`의 해당 항목은 Supabase 클라이언트를 주입받도록
`getClient: SupabaseClientGetter = createClient`(브라우저 클라이언트가 기본값)
파라미터를 받는다. `SupabaseClientGetter`는 `@/lib/supabase/types`에 정의돼 있으며,
브라우저용 `createClient`(동기)와 서버용 `createClient`(비동기, `cookies()` 사용)
양쪽을 모두 받을 수 있도록 `() => SupabaseClient | Promise<SupabaseClient>` 타입이다.

```ts
// features/portfolio/queries.ts
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { SupabaseClientGetter } from '@/lib/supabase/types'

export const portfolioQueries = {
  all: () => ['portfolios'] as const,

  lists: (getClient: SupabaseClientGetter = createBrowserClient) =>
    queryOptions({
      queryKey: [...portfolioQueries.all(), 'list'] as const,
      queryFn: async () => {
        const supabase = await getClient()
        const { data, error } = await supabase.from('portfolios').select('*')
        if (error) throw error
        return data
      },
    }),
}
```

라우트의 `page.tsx`는 async Server Component로 작성해 `getQueryClient()`
(`@/lib/getQueryClient`, 서버에서는 매 요청마다 새 인스턴스를 만들고 브라우저에서는
싱글턴을 재사용)로 얻은 `QueryClient`에 서버용 `createClient`(`@/lib/supabase/server`)를
주입해 prefetch한 뒤 `<HydrationBoundary>`로 감싼다. 같은 `queryFn`이 클라이언트의
`useQuery`/`useInfiniteQuery`에서는 인자 없이 호출돼 브라우저 클라이언트 기본값을
쓰므로 `queryKey`가 항상 동일하게 유지되고 hydration이 정확히 매칭된다.

```ts
// app/(app)/portfolio/page.tsx
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { PortfolioListPage } from '@/features/portfolio/components/PortfolioListPage'
import { portfolioQueries } from '@/features/portfolio/queries'
import { getQueryClient } from '@/lib/getQueryClient'
import { createClient } from '@/lib/supabase/server'

const PortfolioPage = async () => {
  const queryClient = getQueryClient()
  await queryClient.prefetchQuery(portfolioQueries.lists(createClient))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PortfolioListPage />
    </HydrationBoundary>
  )
}

export default PortfolioPage
```

한 라우트에서 여러 쿼리를 prefetch해야 하면 순차 `await` 대신 `Promise.all`로 묶는다.
아직 어떤 라우트에서도 서버 prefetch되지 않는 피처(`auth`, `stocks`, `trade-log`)는
`getClient` 파라미터를 추가하지 않는다 — 실제로 Server Component에서 prefetch가
필요해지는 시점에 이 패턴을 적용한다.

#### 참고: TanStack Query 없이 구현한 사례 — `/home`

`/home`은 위 "TanStack Query를 쓸지 판단하는 기준"에 따라 TanStack Query 없이
구현된 라우트다. `fetchPortfolioList(getClient)`/
`fetchRebalancingHistoryPage(filters, getClient, pageParam?)`(각각
`features/portfolio/queries.ts`, `features/rebalancing-history/queries.ts`)가
`portfolioQueries.lists()`/`rebalancingHistoryQueries.list()`의 `queryFn`
본체를 그대로 뽑아낸 재사용 함수라, `/portfolio`/`/rebalancing-history` 등
기존 TanStack 기반 소비자는 이 함수를 `queryFn`으로 감싸 쓰고, `/home`의
`page.tsx`는 이 함수들을 직접 `await`해 결과를 props로 넘긴다.
`portfolioQueries.lists()`/`rebalancingHistoryQueries.list()`의 사이드바
캐시 시딩(`queryClient.setQueryData`) 처리는 `home/page.tsx`를 참고.

### Query 무효화 범위

```ts
// 포트폴리오 전체 무효화 (목록 + 상세 + 스냅샷)
queryClient.invalidateQueries({ queryKey: portfolioQueries.all() })

// 목록만 무효화
queryClient.invalidateQueries({ queryKey: portfolioQueries.lists().queryKey })

// 특정 포트폴리오 상세만 무효화
queryClient.invalidateQueries({ queryKey: portfolioQueries.detail(id).queryKey })
```

### 피처별 Query 객체 목록

| 피처 | export 이름 | `all()` 키 |
|------|-------------|----------|
| auth | `authQueries` | `['auth']` |
| dividends | `dividendQueries` | `['dividends']` |
| portfolio | `portfolioQueries` | `['portfolios']` |
| rebalancing-history | `rebalancingHistoryQueries` | `['rebalancing-history']` |
| stocks | `stockQueries` | `['stocks']` |
| templates | `templateQueries` | `['templates']` |
| trade-log | `tradeLogQueries` | `['trade-logs']` |

## Supabase 데이터베이스

### 테이블 구조

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

### 공통 사항
- 모든 테이블 RLS 활성화 — 로그인 사용자는 본인 데이터만 접근
- `assets`는 누구나 읽기 가능 (SELECT), 쓰기 차단
- `asset_prices`도 `assets`와 동일하게 누구나 읽기 가능, 쓰기는 RLS로 차단(배치는 service-role 키 사용)
- 저장 버튼 1회 클릭 → `portfolios` 업데이트 + `execution_records` 생성 + `portfolio_snapshots` 생성 (트랜잭션)
