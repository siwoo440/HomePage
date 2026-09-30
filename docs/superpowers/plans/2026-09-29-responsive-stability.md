---
# DEVFORGE L5 반응형 레이아웃 안정화 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공통 홈페이지와 Next.js 화면에서 320px부터 1440px, 확대 화면과 짧은 가로 방향까지 카드·대화상자·고정 요소의 잘림과 가로 넘침을 제거한다.

**Architecture:** `responsive-shell.css`가 비프로젝트 정적 화면의 최소 폭·줄바꿈·대화상자 안전 영역을 제공하고, 개인정보·메인·하위 페이지와 Next.js CSS가 소유한 레이아웃만 최소 보정한다. JavaScript 동작과 개별 프로젝트 전용 디자인은 유지한다.

**Tech Stack:** HTML, CSS, React 19.2.4, Next.js 16.2.6, Node test runner, 브라우저 실측 검사

**Spec:** `docs/superpowers/specs/2026-09-29-responsive-stability-design.md`

---
## 전역 제약

- 작업은 사용자 승인에 따라 `main`에서 진행하고 전체 변경을 마지막 단일 커밋으로 기록한다.
- 질문·중간 승인 없이 설계부터 구현·검증·커밋까지 연속 실행한다.
- 35개 개별 프로젝트 페이지, 데이터·인증 로직, 외부 API, 결제와 배포는 변경하지 않는다.
- 기존 제목과 상세 버튼의 같은 높이 배치, 모바일 메뉴, 검색·필터, 대화상자 초점과 색상 테마를 유지한다.
- 추가 패키지 없이 현재 CSS, Node 테스트와 브라우저 도구만 사용한다.
- 새 코드 줄은 Allman 스타일과 짧은 한글 명사형 주석을 지킨다.
- 완료 기준은 지정 너비 브라우저 실측 통과와 `pnpm check` 종료 코드 0이다.

---
## 리뷰 중점

- 320px에서 개인정보 선택 패널과 대화상자의 좌우 경계가 모두 화면 안에 있어야 한다.
- 844×390px에서 메뉴 서랍·대화상자·고정 패널의 마지막 조작 요소까지 내부 스크롤로 접근 가능해야 한다.
- 긴 한국어 게임명·상품명·뉴스 제목·오류 문구가 카드나 입력 화면의 가로 폭을 늘리지 않아야 한다.
- 공통 규칙이 `data-responsive-page="project"`인 35개 프로젝트 전용 디자인을 변경하지 않아야 한다.
- 1280px와 1440px에서 기존 카드 열 수와 콘텐츠 최대 폭이 유지되어야 한다.

---
### Task 1: 공통 대화상자와 고정 요소 안전 영역

**Files:**
- Modify: `public/responsive-shell.css`
- Modify: `public/privacy-consent.css`
- Modify: `tests/responsive-integration.test.mjs`

**Interfaces:**
- Consumes: `[data-responsive-page]`, `.modal-box`, `.contact-dialog`, `.privacy-consent`, `.responsive-nav-drawer`
- Produces: 비프로젝트 공통 화면의 최소 폭·긴 문자열 줄바꿈 계약
- Produces: 고정 패널과 대화상자의 포함 영역 기준 폭, `100dvh` 최대 높이와 내부 스크롤

- [ ] **Step 1: 현재 브라우저 실패 재현**

320×568px 굿즈 화면에서 개인정보 패널의 `left < 0`을 확인하고, 844×390px에서 고정 패널·대화상자의 내부 스크롤 계약을 기록한다.

Expected: 개인정보 패널이 약 3px 왼쪽으로 잘려 실패한다.

- [ ] **Step 2: 공통 안전 규칙 구현**

비프로젝트 화면의 격자·플렉스 자식 최소 폭, 긴 문구 줄바꿈, 미디어 최대 폭을 추가한다. 모바일 모달 폭은 `100vw`가 아닌 포함 영역 기준으로 계산하고 짧은 높이에서는 오버레이와 서랍에 안전 여백과 내부 스크롤을 제공한다.

- [ ] **Step 3: 개인정보 패널 구현**

패널에 `border-box`, `100dvh` 최대 높이와 내부 스크롤을 추가한다. 모바일은 좌우 inset과 자동 폭을 사용하고 버튼을 전체 너비 세로 배치한다. 설정 버튼도 화면 안전 영역을 따른다.

- [ ] **Step 4: 관련 검사**

Run: `node --test tests/responsive-integration.test.mjs tests/privacy-consent.test.mjs tests/dialog-accessibility.test.mjs`

Expected: 관련 자동 테스트 전체 통과, 320×568px 브라우저 실측에서 가로 넘침 0과 패널 좌우 경계 통과.

---
### Task 2: 메인과 공통 하위 페이지 카드 안정화

**Files:**
- Modify: `public/main.html`
- Modify: `public/site-experience.css`
- Modify: `public/goods.css`
- Modify: `public/devlog.css`
- Modify: `public/community.css`
- Modify: `public/legal.css`

**Interfaces:**
- Consumes: Task 1의 공통 최소 폭·줄바꿈·대화상자 계약
- Produces: 메인 제목 행과 상세 버튼의 같은 높이·오른쪽 배치 유지
- Produces: 상품·뉴스·커뮤니티·법적 문서 카드의 긴 문구와 좁은 폭 안정성

- [ ] **Step 1: 화면별 경계 검사**

메인·굿즈·뉴스·커뮤니티·법적 문서를 320, 390, 768, 1024, 1280, 1440px와 844×390px에서 검사한다. 각 화면의 가로 넘침과 화면 밖 가시 요소를 수집한다.

Expected: 현재 실제 데이터에서는 대부분 통과하지만 제목·가격·카드 자식에 긴 문자열 보호가 없는 위험이 확인된다.

- [ ] **Step 2: 메인 레이아웃 구현**

섹션 제목에 최소 폭 0과 긴 문구 줄바꿈을 적용하고 상세 버튼은 축소되지 않는 작은 오른쪽 버튼으로 유지한다. 히어로와 고정 피드백은 유효 폭과 짧은 높이에서 콘텐츠 기반으로 확장·스크롤되게 한다.

- [ ] **Step 3: 하위 페이지 구현**

상품 카드의 가격·상태, 뉴스 카드의 제목·본문·필터, 커뮤니티 카드의 채널·태그, 법적 문서의 긴 문자열과 표를 각 컨테이너 안에서 줄바꿈 또는 내부 가로 스크롤로 처리한다.

- [ ] **Step 4: 관련 검사**

Run: `node --test tests/responsive-integration.test.mjs tests/goods-page.test.mjs tests/development-news.test.mjs tests/community-page.test.mjs tests/website-content.test.mjs`

Expected: 관련 자동 테스트 전체 통과, 지정 화면 너비의 가로 넘침 0.

---
### Task 3: Next.js 입력·상세·관리자 화면 안정화

**Files:**
- Modify: `app/login/member-login.module.css`
- Modify: `app/age-verification/age-verification.module.css`
- Modify: `app/news/[id]/news-detail.module.css`
- Modify: `app/admin/admin.css`

**Interfaces:**
- Consumes: 기존 폼·오류·댓글·관리자 화면 구조
- Produces: 동적 뷰포트 높이, 긴 문구 줄바꿈, 좁은 화면 작업 영역 세로 배치

- [ ] **Step 1: Next.js 화면 구현**

로그인·성인 확인 화면을 `100dvh` 기준으로 바꾸고 카드·입력·오류 문구에 최소 폭과 줄바꿈을 적용한다. 뉴스 상세의 제목·댓글·버튼과 관리자 목록·편집 폼도 좁은 화면에서 폭을 밀지 않게 한다.

- [ ] **Step 2: 관련 검사**

Run: `node --test tests/accessibility-forms.test.mjs tests/member-auth.test.mjs tests/age-gate-ui.test.mjs tests/admin-products-ui.test.mjs tests/admin-news-validation.test.mjs`

Expected: 관련 Next.js 화면 테스트 전체 통과.

- [ ] **Step 3: 타입과 정적 검사**

Run: `pnpm typecheck && pnpm lint`

Expected: 타입 오류와 ESLint 경고·오류 0.

---
### Task 4: 문서 동기화, 전체 브라우저 검증과 단일 커밋

**Files:**
- Modify: `docs/DEVELOPMENT-NOTES.md`
- Modify: `docs/DEVELOPMENT-GUIDE.md`
- Include: 설계·계획·Task 1~3의 모든 구현·테스트 파일

**Interfaces:**
- Consumes: Task 1~3의 반응형 계약
- Produces: L5 로컬 구현 완료 기록과 `main`의 단일 Git 커밋

- [ ] **Step 1: 개발 문서 갱신**

L5를 `2026년 9월 29일 로컬 구현 완료`로 기록하고 권장 개발 순서에서 제거한다. 개발 가이드에 공통 폭·줄바꿈·고정 요소와 화면 검사 행렬을 기록한다.

- [ ] **Step 2: 전체 브라우저 검증**

메인·굿즈·뉴스·커뮤니티·법적 문서·로그인·성인 확인을 320, 390, 768, 1024, 1280, 1440px와 844×390px에서 다시 실측한다. 200% 확대는 1280px 기준 640px 유효 폭 재배치와 브라우저 확대 화면을 함께 확인한다.

Expected: 모든 화면에서 문서 가로 넘침 0, 가시 요소 화면 밖 이탈 0, 고정 조작 요소 접근 가능.

- [ ] **Step 3: 전체 품질 검사**

Run: `pnpm check`

Expected: 전체 Node 테스트, TypeScript, ESLint와 Next.js 운영 빌드 종료 코드 0.

- [ ] **Step 4: 변경 범위 확인**

Run: `git diff --check && git status --short`

Expected: L5 설계·계획·공통 CSS·관련 테스트·개발 문서만 표시되고 개별 프로젝트 전용 파일은 표시되지 않는다.

- [ ] **Step 5: 단일 커밋**

Run: 명시된 L5 파일만 스테이징한 뒤 `git commit -m "feat: 반응형 레이아웃 안정화"`

Expected: L5 전체 변경이 하나의 커밋으로 기록되고 Git 상태가 깨끗하다.
