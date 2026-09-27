---
# Next.js 색상 모드 연속 적용 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 정적 페이지에서 저장한 색상 모드를 모든 Next.js 화면의 첫 렌더링부터 동일하게 적용합니다.

**Architecture:** 브라우저 의존성이 작은 일반 스크립트가 저장값과 시스템 설정으로 모드를 결정해 루트 `<html>`에 적용합니다. Next.js 루트 레이아웃은 공통 테마 범위와 스크립트 실행 순서만 책임집니다.

**Tech Stack:** Next.js 16, React 19, JavaScript, Node.js test runner

**Spec:** `docs/superpowers/specs/2026-09-26-next-color-mode-continuity-design.md`

---
## Global Constraints

- 저장 키는 `devforge-color-mode` 유지
- 허용 모드는 `light`와 `dark`만 사용
- 외부 계정·API·새 패키지 사용 금지
- Allman 스타일과 코드 각 줄의 짧은 한글 주석 유지
- 기존 정적 페이지의 테마 버튼 동작 변경 금지
- `main` 하나와 최신 커밋 하나 유지

---
## Review Focus

- 저장값이 오염된 경우 시스템 설정으로 복구
- 로컬 저장소가 예외를 던지는 경우 렌더링 계속
- `matchMedia`가 없는 환경에서 밝은 모드 사용
- 스크립트가 테마 스타일보다 늦게 실행되어 생기는 초기 깜빡임 방지
- 루트 테마 범위 이동 뒤 Next.js 화면의 토큰 상속 유지

---
### Task 1: 색상 모드 부트스트랩

**Files:**
- Create: `public/color-mode-bootstrap.js`
- Create: `tests/color-mode-bootstrap.test.mjs`

**Interfaces:**
- Consumes: `window.localStorage`, `window.matchMedia`, `document.documentElement.dataset`
- Produces: `document.documentElement.dataset.colorMode`의 `light` 또는 `dark` 값

- [ ] **Step 1: 실패하는 동작 테스트 작성**

  `tests/color-mode-bootstrap.test.mjs`에서 실제 스크립트를 격리 실행하여 저장값 우선순위, 시스템 대체, 오염값, 저장소 예외와 `matchMedia` 부재를 검증합니다.

- [ ] **Step 2: 실패 확인**

  Run: `node --test tests/color-mode-bootstrap.test.mjs`

  Expected: `public/color-mode-bootstrap.js` 파일 누락으로 FAIL

- [ ] **Step 3: 최소 부트스트랩 구현**

  즉시 실행 함수가 저장값을 안전하게 읽고 결정 규칙에 따라 루트 데이터 속성을 설정합니다.

- [ ] **Step 4: 단위 테스트 통과 확인**

  Run: `node --test tests/color-mode-bootstrap.test.mjs`

  Expected: 5 tests PASS

---
### Task 2: Next.js 루트 문서 연결

**Files:**
- Modify: `app/layout.tsx`
- Modify: `tests/root-layout.test.mjs`

**Interfaces:**
- Consumes: `/color-mode-bootstrap.js`, `/playful-lab-theme.css`
- Produces: 수화 전 테마가 적용되는 공통 Next.js HTML 문서

- [ ] **Step 1: 실패하는 문서 계약 테스트 작성**

  루트 `<html>`의 `data-theme`, `suppressHydrationWarning`, 부트스트랩 스크립트와 스타일 순서, `<body>`의 중복 테마 속성 제거를 검증합니다.

- [ ] **Step 2: 실패 확인**

  Run: `node --test tests/root-layout.test.mjs`

  Expected: 루트 테마 범위와 부트스트랩 스크립트 누락으로 FAIL

- [ ] **Step 3: 루트 레이아웃 연결**

  `app/layout.tsx`에서 `<html>`을 테마 범위로 지정하고 초기화 스크립트를 스타일보다 먼저 연결합니다.

- [ ] **Step 4: 문서 계약 테스트 통과 확인**

  Run: `node --test tests/root-layout.test.mjs`

  Expected: 2 tests PASS

---
### Task 3: 전체 회귀와 빌드 검증

**Files:**
- Modify: `docs/DEVELOPMENT-NOTES.md`

**Interfaces:**
- Consumes: Task 1과 Task 2 결과
- Produces: 1단계 완료 기록과 재현 가능한 검증 결과

- [ ] **Step 1: 개발 노트 상태 갱신**

  L1 항목에 완료 상태, 구현 파일과 검사 명령을 기록합니다.

- [ ] **Step 2: 전체 테스트 실행**

  Run: `pnpm test`

  Expected: 모든 테스트 PASS

- [ ] **Step 3: 타입 검사 실행**

  Run: `pnpm exec tsc --noEmit`

  Expected: exit code 0

- [ ] **Step 4: 운영 빌드 실행**

  Run: `pnpm build`

  Expected: exit code 0

- [ ] **Step 5: 변경 무결성 검사**

  Run: `git diff --check`

  Expected: whitespace error 없음

- [ ] **Step 6: 커밋 보류**

  10단계 전체 검증 전에는 기존 루트 커밋을 갱신하거나 원격에 푸시하지 않습니다.

