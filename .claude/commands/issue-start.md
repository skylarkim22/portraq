# 개발 시작: 이슈 #$ARGUMENTS

다음 순서로 개발을 준비한다.

## 1. 이슈 내용 확인

```bash
gh issue view $ARGUMENTS
```

이슈의 제목, 본문, 서브이슈, 체크리스트를 파악한다.

## 2. 워크트리 및 브랜치 생성

이슈 제목을 영문 kebab-case로 요약해 별도 워크트리에 브랜치를 만든다. 메인 작업 디렉토리에서 `git checkout -b`로 브랜치를 전환하지 않고, `.claude/worktrees/`(gitignore 대상) 아래 격리된 워크트리를 만들어 그 안에서 작업한다:

```bash
git checkout develop && git pull
git worktree add .claude/worktrees/{short-description} -b feat/#$ARGUMENTS-{short-description}
cd .claude/worktrees/{short-description}
```

브랜치명 예시: `feat/#12-portfolio-list-page`, 워크트리 경로 예시: `.claude/worktrees/portfolio-list-page`

이후 개발·테스트·커밋은 모두 이 워크트리 디렉토리 안에서 진행한다.

## 3. 디자인 목업 확인

이슈가 UI 변경을 포함하면 `docs/mockups/`에서 관련 화면을 찾아 먼저 읽는다:

| 목업 | 화면 |
|------|------|
| `01-landing.html` | 랜딩 페이지 |
| `02-templates.html` | 대가 포트폴리오 템플릿 갤러리 |
| `03-edit.html` | 포트폴리오 편집 (종목 검색·비율·드래그 앤 드롭 포함) |
| `04-guide.html` | 리밸런싱 매수·매도 가이드 |
| `05-home.html` | 내 포트폴리오 홈 |
| `06-auth.html` | 로그인 |
| `07-portfolio-list.html` | 내 포트폴리오 목록 |
| `07-rebalancing-history.html` | 리밸런싱 기록 |
| `08-tradelog.html` | 매매 일지 |

목업의 색상·컴포넌트 클래스(`.card`, `.badge`, `.btn-primary` 등)·인터랙션을 실제 구현의 기준으로 삼는다. `docs/design/`은 Portraq 디자인과 무관한(Wanted 디자인 시스템) 참고자료이므로 사용하지 않는다.

## 4. 작업 계획 수립

AGENTS.md의 파일 배치 규칙을 기준으로 다음을 정리해서 사용자에게 보여준다:

- **생성·수정할 파일 목록** (경로 포함)
- **참고한 목업 파일과 반영할 디자인 요소**
- **packages/ui 컴포넌트 추가 여부** → test + story 필요 여부
- **DB 쿼리 필요 여부** → features/[feature]/queries.ts 작성 여부
- **예상 작업 범위** (간략히)

계획을 보여준 후 사용자 확인을 받고 개발을 시작한다.
