---
name: fullstack-pipeline
description: "Portraq 풀스택 개발 팀(디자인·프론트엔드·백엔드·QA·배포)의 역할 분담과 파이프라인 순서를 설명한다. 새 기능을 와이어프레임부터 배포까지 어떤 순서로, 누가 담당해 진행하는지 물을 때, 또는 어떤 에이전트를 호출해야 할지 판단이 필요할 때 사용한다."
allowed-tools: Agent, Read, Grep, Glob, Skill
---

# Portraq 풀스택 개발 파이프라인

Portraq의 기능 개발은 하나의 이슈 = 하나의 PR 단위로, 아래 5단계 팀이 순서대로 작업을 이어받는다.
이 스킬은 **새 파이프라인을 만드는 게 아니라**, 이미 정해진 `/issue-plan → /issue-start → /issue-complete`
흐름(AGENTS.md) 안에서 각 단계가 어느 에이전트에게 위임되는지 보여주는 지도다. 실제 개발은 항상
저 세 커맨드로 시작한다 — 이 스킬을 별도 진입점으로 쓰지 않는다.

## 팀 구성

| 단계 | 담당 에이전트 | 산출물 | 위치 |
|------|--------------|--------|------|
| 1. 설계 | `ux-designer` | 신규 목업(`docs/mockups/NN-*.html`) 또는 텍스트 와이어프레임 명세 | `/issue-start` 3단계 |
| 2. 백엔드 | `backend-dev` | `features/[feature]/queries.ts`, `mutations.ts`, RLS 정책 | `/issue-start` 4단계 계획 → 개발 |
| 3. 프론트엔드 | `frontend-dev` | `hooks.ts`, `components/`, 라우트 연결 | 개발 |
| 4. QA | `qa-tester` | 브라우저 골든 패스·경계 케이스·목업 대비 시각 검증 리포트 | `/issue-complete` 7단계 |
| 5. 코드 리뷰 | `style-inspector` → `security-analyst` → `performance-analyst` → `architecture-reviewer` → `review-synthesizer` | 종합 리뷰 판정 | `/issue-complete` 5단계 (기존) |
| 6. 배포 | Vercel(GitHub 연동 자동 배포) + `deploy-to-vercel` 스킬 | Preview/Production 배포 | PR 생성 시 자동 / 필요 시 수동 |

## 파이프라인 순서

```
/issue-plan
    ↓ (이슈 우선순위 확정)
/issue-start #N
    ↓ 워크트리 생성
    ↓ 3단계: 기존 목업으로 화면이 커버되는가?
    │   No → ux-designer 호출 (신규 목업 또는 와이어프레임 명세 생성)
    │   Yes → 기존 목업 그대로 사용
    ↓ 4단계: 작업 계획 수립
    │   DB 쿼리 필요 → backend-dev가 queries.ts/mutations.ts 계획에 포함
    ↓ 사용자 계획 승인
    ↓ 개발
    │   backend-dev: queries.ts / mutations.ts 먼저 작성
    │   frontend-dev: hooks.ts / components / 라우트 (backend-dev 산출물 소비)
/issue-complete
    ↓ 1~4단계: 테스트/린트/의존성/타입체크 (기존 그대로)
    ↓ 5단계: 5개 리뷰 에이전트 순차 리뷰 (기존 그대로, backend-dev 산출물도 동일하게 리뷰 대상)
    ↓ 6단계: Storybook 확인 (기존 그대로)
    ↓ 7단계: 브라우저 검증
    │   qa-tester 먼저 호출 → 🔴 있으면 수정 후 재호출
    │   🔴 없으면 → 사용자 최종 육안 확인 (기존과 동일, 생략하지 않음)
    ↓ 8단계: PR 생성 (기존 그대로) → GitHub 연동으로 Vercel Preview 자동 배포
    ↓ 9단계: 워크트리 정리 (기존 그대로)
```

## 배포 단계 참고

- `apps/web/vercel.json`과 `.github/workflows/ci.yml`이 이미 구성되어 있다. PR을 만들면 CI(린트·타입체크·테스트·Storybook 빌드)가 먼저 돌고, Vercel GitHub 연동이 연결되어 있다면 PR마다 Preview 배포가 자동 생성된다.
- Production 배포(= `main` 머지 이후)나 수동 배포가 필요하면 `deploy-to-vercel` 스킬을 사용한다. 이 스킬 자체는 배포를 실행하지 않는다.
- Vercel 프로젝트 연동 여부가 불확실하면 배포를 실행하기 전에 사용자에게 먼저 확인한다 — 프로덕션 배포는 되돌리기 어려운 작업이다.

## 이 스킬을 쓰지 않는 경우

- 이미 이슈 작업 중이고 다음에 뭘 해야 할지는 `/issue-start`·`/issue-complete`가 이미 안내한다 — 그 흐름을 따르면 되고, 이 스킬을 다시 참조할 필요는 없다.
- 버그 수정처럼 설계·백엔드 변경이 없는 작은 작업은 1~2단계를 건너뛰고 바로 frontend-dev/backend-dev가 처리한다.
