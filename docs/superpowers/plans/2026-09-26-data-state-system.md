---
# Data State System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 뉴스·상품·커뮤니티의 데이터 로딩·데모·빈 결과·오류·재시도 상태를 공통 모듈과 디자인으로 통일합니다.

**Architecture:** 프레임워크에 의존하지 않는 `data-state.mjs`가 상태 모델, 응답 분류, 시간 제한 요청과 DOM 패널을 제공합니다. 각 페이지 모듈은 기존 데모 콘텐츠를 유지하면서 공통 컨트롤러에 페이지별 문구와 재시도 함수를 전달합니다.

**Tech Stack:** JavaScript ES modules, HTML, CSS, SVG, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-26-data-state-system-design.md`

---
## Global Constraints

- 외부 계정, 비밀 키, 네트워크 의존성과 유료 자산 없음
- 개별 게임 프로젝트 페이지, ChatBot 본체와 Text-Play 제외
- 요청 시간 제한 8초
- 원격 성공 전까지 기존 데모 콘텐츠 유지
- 안전한 DOM API만 사용하고 외부 응답을 `innerHTML`로 삽입하지 않음
- 현재 `main`에서 작업하고 10단계 완료 전 중간 커밋·푸시 생략
- 모든 코드 줄에 짧은 한글 명사형 주석과 Allman 스타일 적용

---
## Review Focus

- 시간 초과 뒤 늦게 끝난 요청이 최신 상태를 덮어쓰지 않는지 확인
- 재시도 버튼을 연속 클릭해도 중복 요청이 발생하지 않는지 확인
- 설정 완료 상태의 빈 배열이 `demo`가 아니라 `empty`로 분류되는지 확인
- JSON 해석 실패가 사용자에게 안전한 오류 상태로 표시되는지 확인
- 상태 호스트가 없는 페이지에서 기존 콘텐츠 기능이 계속 동작하는지 확인

---
### Task 1: 공통 상태 계약과 벡터 자산

**Files:**
- Create: `public/data-state.mjs`
- Create: `public/data-state.css`
- Create: `public/images/states/loading.svg`
- Create: `public/images/states/demo.svg`
- Create: `public/images/states/empty.svg`
- Create: `public/images/states/error.svg`
- Create: `tests/data-state.test.mjs`
- Create: `tests/data-state-assets.test.mjs`

**Interfaces:**
- Produces: `createDataStateModel`, `resolveCollectionState`, `requestJson`, `createDataStateController`

- [ ] **Step 1: Write failing state model, request and asset tests**
- [ ] **Step 2: Run `node --test tests/data-state.test.mjs tests/data-state-assets.test.mjs` and confirm missing module/assets failure**
- [ ] **Step 3: Implement the module, shared CSS and four SVG files**
- [ ] **Step 4: Run focused tests and confirm all pass**
- [ ] **Step 5: Record completion without committing**

---
### Task 2: 뉴스·상품·커뮤니티 화면 연결

**Files:**
- Modify: `public/main.html`
- Modify: `public/devlog.html`
- Modify: `public/goods.html`
- Modify: `public/community.html`
- Modify: `public/devlog.mjs`
- Modify: `public/goods.mjs`
- Modify: `public/community.mjs`
- Create: `tests/data-state-integration.test.mjs`

**Interfaces:**
- Consumes: Task 1의 공통 상태 모듈과 CSS 클래스
- Produces: 네 페이지의 상태 호스트, 시간 제한 요청, 데모·빈 결과·오류·재시도 흐름

- [ ] **Step 1: Write failing page integration tests**
- [ ] **Step 2: Run the test and confirm missing shared links/controllers failure**
- [ ] **Step 3: Add state hosts and connect each page loader**
- [ ] **Step 4: Run state, news, goods and community tests**
- [ ] **Step 5: Record completion without committing**

---
### Task 3: 문서·브라우저·전체 검증

**Files:**
- Modify: `docs/DEVELOPMENT-NOTES.md`
- Modify: `docs/DEVELOPMENT-GUIDE.md`
- Modify: `docs/FILE-MAP.md`

**Interfaces:**
- Consumes: Task 1·2의 실제 상태 계약과 페이지 동작
- Produces: L3 로컬 완료 기록과 유지보수 설명

- [ ] **Step 1: Update the development documents**
- [ ] **Step 2: Run `pnpm test` and confirm zero failures**
- [ ] **Step 3: Run `.\node_modules\.bin\tsc.CMD --noEmit` and confirm exit 0**
- [ ] **Step 4: Run `pnpm build` and confirm exit 0**
- [ ] **Step 5: Verify light, dark and mobile states in the browser**
- [ ] **Step 6: Run `git diff --check` and repository scope checks**
- [ ] **Step 7: Request one independent final review**
