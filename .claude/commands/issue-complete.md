# 개발 완료 및 PR 생성

다음 순서로 검증하고 PR을 만든다. 각 단계에서 문제가 있으면 수정 후 다음 단계로 넘어간다.

## 1. 현재 브랜치 확인

```bash
git status
git log develop..HEAD --oneline
```

어떤 이슈 작업인지, 변경된 파일 목록을 파악한다.

## 2. 단위 테스트 실행

```bash
pnpm test
```

실패한 테스트가 있으면 수정한다. 새로 추가한 기능에 테스트가 없으면 작성한다.

## 3. 타입 체크

```bash
pnpm build --filter=@portraq/web 2>&1 | head -50
```

타입 에러가 있으면 수정한다.

## 4. 코드 리뷰

변경된 파일을 대상으로 에이전트 팀이 순서대로 리뷰한다:

1. `style-inspector` — AGENTS.md 규칙 준수, TypeScript/React 컨벤션
2. `security-analyst` — Supabase RLS, 인증, 환경변수 노출
3. `performance-analyst` — N+1 쿼리, 리렌더링, TanStack Query 캐싱
4. `architecture-reviewer` — 파일 배치, 패키지 경계, 데이터 레이어 패턴
5. `review-synthesizer` — 4개 결과 종합 → 최종 판정

**🔴 항목이 있으면 수정 후 다음 단계로 넘어간다.**
🟡 항목은 PR 본문에 "다음 PR에서 개선 예정"으로 기록한다.

## 5. Storybook 확인 (UI 컴포넌트 변경 시)

`packages/ui`에 새 컴포넌트를 추가했거나 기존 컴포넌트를 수정한 경우:
- story 파일이 있는지 확인
- 없으면 작성 후 사용자에게 `pnpm storybook` 실행 후 확인을 요청

## 6. 브라우저 검증

사용자에게 다음을 요청한다:

```
pnpm dev 실행 후 변경된 화면을 브라우저에서 확인해주세요.
문제가 없으면 "확인 완료"라고 말씀해주세요.
```

사용자 확인 전까지 PR 생성을 진행하지 않는다.

## 7. PR 생성

사용자 확인 완료 후 이슈 번호를 파악해 PR을 만든다:

```bash
gh pr create \
  --base develop \
  --title "feat: {이슈 제목}" \
  --body "$(cat <<'EOF'
## 작업 내용
- {변경사항 요약}

## 테스트
- [ ] 단위 테스트 통과
- [ ] 브라우저 검증 완료

Closes #{이슈번호}
EOF
)"
```

PR URL을 사용자에게 알려준다.
