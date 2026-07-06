# 개발 시작: 이슈 #$ARGUMENTS

다음 순서로 개발을 준비한다.

## 1. 이슈 내용 확인

```bash
gh issue view $ARGUMENTS
```

이슈의 제목, 본문, 서브이슈, 체크리스트를 파악한다.

## 2. 브랜치 생성

이슈 제목을 영문 kebab-case로 요약해 브랜치를 만든다:

```bash
git checkout develop && git pull
git checkout -b feat/#$ARGUMENTS-{short-description}
```

브랜치명 예시: `feat/#12-portfolio-list-page`

## 3. 작업 계획 수립

AGENTS.md의 파일 배치 규칙을 기준으로 다음을 정리해서 사용자에게 보여준다:

- **생성·수정할 파일 목록** (경로 포함)
- **packages/ui 컴포넌트 추가 여부** → test + story 필요 여부
- **DB 쿼리 필요 여부** → features/[feature]/queries.ts 작성 여부
- **예상 작업 범위** (간략히)

계획을 보여준 후 사용자 확인을 받고 개발을 시작한다.
