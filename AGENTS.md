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

## 데이터 레이어(TanStack Query / Supabase) 컨벤션

`features/[feature]/queries.ts`·`mutations.ts`를 만들거나 수정할 때, 또는
TanStack Query를 쓸지 판단해야 할 때는 먼저 `docs/conventions/tanstack-query.md`를
읽는다 — 사용 규칙, TanStack Query를 쓸지 판단하는 기준, 데이터 레이어 패턴,
서버 프리페치(SSR) 패턴, Query 무효화 범위, 피처별 Query 객체 목록이 있다.

Supabase 테이블 구조·RLS 정책·배치 히스토리가 필요할 때는
`docs/conventions/supabase-schema.md`를 읽는다.
