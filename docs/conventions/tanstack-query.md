# TanStack Query 코드 작성 가이드

> `features/[feature]/queries.ts`·`mutations.ts`를 만들거나 수정할 때, 또는
> TanStack Query 사용 여부를 판단해야 할 때 읽는다. 평소에는 `AGENTS.md`에서
> 이 문서를 포인터로만 참조한다.

- `useQuery` 사용할 때는 `queryOptions`을 사용하여 데이터를 받아온다.
- `useMutation`으로 수정(update/create/save)할 때는 낙관적 업데이트(`onMutate`에서 캐시를 미리 반영, 실패 시 `onError`에서 롤백)를 사용한다.
- 삭제(delete) mutation은 낙관적 업데이트를 사용하지 않는다. 서버가 성공을 확인한 `onSuccess`에서만 캐시를 반영한다. 단, `invalidateQueries`로 넓게 무효화하기보다 해당 항목만 캐시에서 직접 제거하는 방식을 우선한다(무한 스크롤 쿼리 등에서 불필요한 전체 재조회를 피하기 위함).
  - **예외**: 커서(keyset) 기반 무한 스크롤 쿼리에서, 삭제로 인해 페이지당 항목 수가 고정 페이지 크기 미만으로 줄어들어 목록을 다시 채워야 하는 경우에는 캐시 직접 제거 직후 `queryClient.refetchQueries({ queryKey, type: "active" })`로 이미 로드된 페이지를 재조회하는 것을 허용한다. 커서 기반이라 오프셋 밀림 없이 안전하게 다시 채워지기 때문이다. 단 오프셋 기반 페이지네이션에는 이 예외를 적용하지 않는다(삭제로 서버 데이터가 줄면 오프셋이 밀려 레코드를 건너뛰는 문제가 생긴다).

## TanStack Query를 쓸지 판단하는 기준

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

## 데이터 레이어 패턴

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

## 서버 프리페치(SSR) 패턴

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

### 참고: TanStack Query 없이 구현한 사례 — `/home`

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

## Query 무효화 범위

```ts
// 포트폴리오 전체 무효화 (목록 + 상세 + 스냅샷)
queryClient.invalidateQueries({ queryKey: portfolioQueries.all() })

// 목록만 무효화
queryClient.invalidateQueries({ queryKey: portfolioQueries.lists().queryKey })

// 특정 포트폴리오 상세만 무효화
queryClient.invalidateQueries({ queryKey: portfolioQueries.detail(id).queryKey })
```

## 피처별 Query 객체 목록

| 피처 | export 이름 | `all()` 키 |
|------|-------------|----------|
| auth | `authQueries` | `['auth']` |
| dividends | `dividendQueries` | `['dividends']` |
| portfolio | `portfolioQueries` | `['portfolios']` |
| rebalancing-history | `rebalancingHistoryQueries` | `['rebalancing-history']` |
| stocks | `stockQueries` | `['stocks']` |
| templates | `templateQueries` | `['templates']` |
| trade-log | `tradeLogQueries` | `['trade-logs']` |
