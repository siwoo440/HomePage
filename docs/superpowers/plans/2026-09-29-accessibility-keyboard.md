---
# DEVFORGE 공통 접근성·키보드 조작 보강 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 공통 홈페이지와 Next.js 입력 화면의 대화상자, 초점, 키보드 이동과 오류 상태를 일관된 접근성 계약으로 완성한다.

**Architecture:** 정적 페이지는 `public/dialog-accessibility.mjs`의 단일 제어기로 사용자 정의 오버레이와 네이티브 `<dialog>`를 함께 관리한다. 개인정보 선택 패널과 Next.js 폼은 현재 흐름을 유지하면서 설명·오류·제출 상태만 명시적으로 연결한다.

**Tech Stack:** HTML, CSS, JavaScript ES Modules, React 19.2.4, Next.js 16.2.6, TypeScript 5.7.3, Node test runner

**Spec:** `docs/superpowers/specs/2026-09-29-accessibility-keyboard-design.md`

---
## 전역 제약

- 작업은 `main`에서 진행하고 설계·계획·구현·테스트·문서를 마지막 단일 커밋으로 기록한다.
- 35개 개별 게임 페이지, Supabase 스키마, 외부 API, 결제, 배포와 디자인은 변경하지 않는다.
- 기존 라이트·다크 모드, 반응형 메뉴, 검색·필터, 댓글과 데이터 상태 동작을 유지한다.
- 추가 패키지 없이 브라우저 기본 API와 현재 테스트 도구만 사용한다.
- 작성하는 JavaScript와 TypeScript는 Allman 스타일과 줄별 짧은 한글 명사형 주석을 지킨다.
- 전체 완료 기준은 `pnpm check` 종료 코드 0이다.

---
## 리뷰 중점

- 대화상자를 연 실행 요소가 닫기 전에 제거되면 초점 복원을 생략하고 오류 없이 종료해야 한다. Task 1의 제거된 실행 요소 테스트로 고정한다.
- 초점 가능한 자식이 없는 대화상자는 본체가 대체 초점을 받아야 한다. Task 1의 빈 대화상자 테스트로 고정한다.
- 같은 대화상자를 반복 초기화하거나 연속해서 열어도 이벤트와 스크롤 잠금이 중복되지 않아야 한다. Task 1의 중복 초기화·연속 열기 테스트로 고정한다.
- 네이티브 `<dialog>` API가 없는 환경에서도 `open` 속성과 초점 복원 계약이 유지되어야 한다. Task 1의 대체 동작 테스트로 고정한다.
- 로그인 통신 오류나 서버 설정 오류는 입력값 오류로 잘못 표시하지 않아야 한다. Task 3의 오류 종류별 정적 계약 테스트로 고정한다.

---
## 파일 구조

- 생성 `public/dialog-accessibility.mjs`: 공통 대화상자 검색, 열기, 닫기, 초점 순환·복원과 정리
- 생성 `tests/helpers/dialog-environment.mjs`: 브라우저 대화상자 동작을 검증하는 최소 문서·요소 대역
- 생성 `tests/dialog-accessibility.test.mjs`: 공통 제어기의 실제 상태 전환과 키보드 계약
- 생성 `tests/accessibility-forms.test.mjs`: Next.js 폼의 오류·제출 접근성 계약
- 수정 `public/main.html`: 네 사용자 정의 모달의 시맨틱과 데이터 속성, 공통 모듈 연결
- 수정 `public/goods.html`, `public/devlog.html`, `public/community.html`: 네이티브 문의창 데이터 계약과 공통 모듈 연결
- 수정 `public/goods.mjs`, `public/devlog.mjs`, `public/community.mjs`: 중복 문의창 초기화 제거
- 수정 `public/privacy-consent.mjs`, `tests/privacy-consent.test.mjs`: 설명 연결과 설정 재개방 초점·복원
- 수정 `app/login/member-login-form.tsx`, `app/admin/login/login-form.tsx`, `app/age-verification/age-verification-form.tsx`: 오류·제출 상태 연결
- 수정 `app/admin/news/news-editor.tsx`, `app/admin/products/product-editor.tsx`: 서버 액션 제출 상태 연결
- 수정 `docs/DEVELOPMENT-NOTES.md`, `docs/DEVELOPMENT-GUIDE.md`: L4 완료 상태와 접근성 계약

---
### Task 1: 공통 대화상자 제어기

**Files:**
- Create: `public/dialog-accessibility.mjs`
- Create: `tests/helpers/dialog-environment.mjs`
- Create: `tests/dialog-accessibility.test.mjs`

**Interfaces:**
- Consumes: `[data-dialog]`, `[data-dialog-open="<id>"]`, `[data-dialog-close]`, `document.activeElement`
- Produces: `initializeDialogAccessibility(root = document): DialogController`
- Produces: `DialogController.open(dialogId: string, trigger?: Element): boolean`
- Produces: `DialogController.close(dialogId?: string, restoreFocus?: boolean): boolean`
- Produces: `DialogController.destroy(): void`
- Produces: `root.__devforgeDialogController`에 같은 제어기 참조

- [ ] **Step 1: 공통 제어기의 실패 테스트 작성**

`tests/dialog-accessibility.test.mjs`에 열기 시 역할·표시·스크롤 잠금·첫 요소 초점, 단일 활성 창, Escape, 배경 클릭, 닫기 버튼, 정·역방향 Tab 순환, 실행 요소 초점 복원, 제거된 실행 요소, 빈 대화상자 대체 초점, 네이티브 대화상자, API 미지원 대체 동작, 중복 초기화와 `destroy`를 각각 검증한다.

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/dialog-accessibility.test.mjs`

Expected: FAIL. `dialog-accessibility.mjs`가 없어 모듈 불러오기가 실패한다.

- [ ] **Step 3: 최소 브라우저 대역 구현**

`tests/helpers/dialog-environment.mjs`에 요소 생성, 속성·클래스·숨김 상태, 포함 관계, `querySelector`·`querySelectorAll`, 이벤트 등록·해제·전달, `focus`, `showModal`, `close`와 문서 `activeElement`만 구현한다.

- [ ] **Step 4: `initializeDialogAccessibility` 구현**

위 공개 인터페이스와 데이터 속성 계약을 구현한다. 사용자 정의 창은 `hidden`과 `open` 클래스를 함께 동기화하고, 네이티브 창은 `showModal`·`close`를 우선하되 API가 없으면 `open` 속성을 사용한다. 현재 실행 요소는 대화상자별 `WeakMap`에 저장한다.

- [ ] **Step 5: 관련 테스트 통과 확인**

Run: `node --test tests/dialog-accessibility.test.mjs`

Expected: 모든 공통 대화상자 테스트 통과.

---
### Task 2: 공통 정적 페이지와 개인정보 패널 연결

**Files:**
- Modify: `public/main.html`
- Modify: `public/goods.html`
- Modify: `public/devlog.html`
- Modify: `public/community.html`
- Modify: `public/goods.mjs`
- Modify: `public/devlog.mjs`
- Modify: `public/community.mjs`
- Modify: `public/privacy-consent.mjs`
- Modify: `tests/privacy-consent.test.mjs`
- Modify: `tests/responsive-integration.test.mjs`
- Modify: `tests/goods-page.test.mjs`
- Modify: `tests/community-page.test.mjs`
- Modify: `tests/development-news.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `initializeDialogAccessibility`와 데이터 속성 계약
- Produces: 네 공통 페이지에서 같은 대화상자·초점 동작
- Produces: 개인정보 패널의 `aria-describedby`, `tabindex="-1"`, 설정 재개방과 선택 뒤 초점 복원

- [ ] **Step 1: 정적 페이지 계약 실패 테스트 작성**

메인 네 모달에 `data-dialog`, `role="dialog"`, `aria-modal="true"`, 고유 제목 ID와 `data-dialog-close`가 있는지 검사한다. 문의 실행 요소는 `data-dialog-open="contact-modal"`을 사용하고, 네 공통 HTML이 `/dialog-accessibility.mjs`를 한 번 연결하며 기존 `classList.add('open')`·`classList.remove('open')` 인라인 동작을 사용하지 않는지 검사한다.

- [ ] **Step 2: 개인정보 초점 실패 테스트 작성**

`tests/privacy-consent.test.mjs`의 문서 대역을 이벤트·초점까지 확장하고 제목·설명 연결, 패널 대체 초점, 설정 버튼 재개방, 선택 저장 뒤 설정 버튼 초점 복원을 검사한다.

- [ ] **Step 3: 실패 확인**

Run: `node --test tests/dialog-accessibility.test.mjs tests/privacy-consent.test.mjs tests/responsive-integration.test.mjs tests/goods-page.test.mjs tests/community-page.test.mjs tests/development-news.test.mjs`

Expected: FAIL. 정적 페이지 데이터 계약과 개인정보 설명·초점 계약이 누락되어 있다.

- [ ] **Step 4: 메인 사용자 정의 모달 연결**

네 모달에 고유 제목 ID와 데이터 속성을 추가하고 닫기 버튼에 접근성 이름을 부여한다. 문의 실행 요소는 데이터 속성으로 교체하고, `openGameModal`은 내용을 채운 뒤 `document.__devforgeDialogController.open("game-modal", document.activeElement)`을 호출한다. 기존 오버레이 클릭 반복 처리기를 제거한다.

- [ ] **Step 5: 네이티브 문의창 연결**

굿즈·개발 뉴스·커뮤니티 HTML의 실행 버튼과 `<dialog>`에 데이터 속성을 추가하고 공통 모듈을 연결한다. 각 페이지 모듈의 `initializeContactDialog` 또는 직접 `showModal` 처리만 제거하고 나머지 페이지 기능은 유지한다.

- [ ] **Step 6: 개인정보 선택 패널 연결**

설명 ID와 `aria-describedby`, 패널 `tabIndex = -1`을 추가한다. 설정 버튼으로 열 때 패널에 초점을 주고, 선택 저장 뒤 패널을 숨긴 다음 설정 버튼에 초점을 돌려준다. 첫 자동 표시는 초점을 이동하지 않는다.

- [ ] **Step 7: 관련 테스트 통과 확인**

Run: `node --test tests/dialog-accessibility.test.mjs tests/privacy-consent.test.mjs tests/responsive-integration.test.mjs tests/goods-page.test.mjs tests/community-page.test.mjs tests/development-news.test.mjs`

Expected: 모든 정적 페이지와 개인정보 접근성 테스트 통과.

---
### Task 3: Next.js 입력 오류와 제출 상태 연결

**Files:**
- Create: `tests/accessibility-forms.test.mjs`
- Modify: `app/login/member-login-form.tsx`
- Modify: `app/admin/login/login-form.tsx`
- Modify: `app/age-verification/age-verification-form.tsx`
- Modify: `app/admin/news/news-editor.tsx`
- Modify: `app/admin/products/product-editor.tsx`

**Interfaces:**
- Consumes: 기존 `message`, `isSubmitting`, `submitting`, `isPending` 상태
- Produces: 오류 ID `member-login-error`, `admin-login-error`, `age-verification-error`
- Produces: 로그인 자격 증명 오류만 이메일·비밀번호에 `aria-invalid="true"`로 연결
- Produces: 성인 확인의 HTTP 400·403 응답만 날짜·동의 입력에 잘못된 상태로 연결
- Produces: 다섯 폼의 `aria-busy` 제출 상태

- [ ] **Step 1: Next.js 폼 실패 테스트 작성**

`tests/accessibility-forms.test.mjs`에서 세 오류 문구 ID, 오류 입력의 `aria-describedby`·`aria-invalid`, 폼의 `aria-busy`, 통신·설정 오류가 입력 오류 상태를 켜지 않는 분기와 두 관리자 편집기의 `aria-busy={isPending}`을 소스 계약으로 검사한다.

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/accessibility-forms.test.mjs`

Expected: FAIL. 오류 ID와 폼 제출 상태 속성이 누락되어 있다.

- [ ] **Step 3: 회원·관리자 로그인 폼 구현**

각 폼에 자격 증명 오류 전용 불리언 상태를 추가한다. 이메일 로그인 응답의 인증 실패에서만 값을 `true`로 바꾸고 제출 시작·성공·통신 실패·OAuth 실패에서는 `false`를 유지한다. 실제 자격 증명 오류일 때만 이메일·비밀번호에 오류 ID와 잘못된 상태를 연결한다.

- [ ] **Step 4: 성인 확인 폼 구현**

응답 HTTP 상태가 400 또는 403일 때만 입력 오류 상태를 켠다. 날짜 입력과 동의 체크박스에 `aria-invalid`와 `age-verification-error` 설명을 연결하고, 네트워크 오류와 HTTP 503은 입력 오류로 표시하지 않는다.

- [ ] **Step 5: 관리자 편집기 제출 상태 구현**

뉴스·상품 편집기 `<form>`에 `aria-busy={isPending}`을 추가한다. 기존 필드 오류와 폼 수준 `role="alert"` 계약은 변경하지 않는다.

- [ ] **Step 6: 관련 테스트 통과 확인**

Run: `node --test tests/accessibility-forms.test.mjs tests/member-header.test.mjs tests/admin-products-ui.test.mjs tests/age-gate-ui.test.mjs`

Expected: 모든 Next.js 폼 접근성·기존 UI 테스트 통과.

- [ ] **Step 7: 타입과 ESLint 검사**

Run: `pnpm typecheck && pnpm lint`

Expected: 타입 오류와 ESLint 경고·오류 0.

---
### Task 4: 문서 동기화, 전체 검증과 단일 커밋

**Files:**
- Modify: `docs/DEVELOPMENT-NOTES.md`
- Modify: `docs/DEVELOPMENT-GUIDE.md`
- Include: `docs/superpowers/specs/2026-09-29-accessibility-keyboard-design.md`
- Include: `docs/superpowers/plans/2026-09-29-accessibility-keyboard.md`
- Include: Task 1~3의 모든 구현·테스트 파일

**Interfaces:**
- Consumes: Task 1~3의 검증된 접근성 계약
- Produces: L4 로컬 구현 완료 기록과 단일 Git 커밋

- [ ] **Step 1: 개발 문서 갱신**

`docs/DEVELOPMENT-NOTES.md`의 L4를 `2026년 9월 29일 로컬 구현 완료`로 기록하고 권장 개발 순서에서 제거한다. 다음 순서는 L5, L6, L7, L8, L10으로 유지한다. `docs/DEVELOPMENT-GUIDE.md`에 공통 대화상자 키보드·초점 계약과 Next.js 입력 오류 연결을 기록한다.

- [ ] **Step 2: 관련 회귀 검사**

Run: `node --test tests/dialog-accessibility.test.mjs tests/privacy-consent.test.mjs tests/responsive-navigation.test.mjs tests/responsive-integration.test.mjs tests/accessibility-forms.test.mjs`

Expected: 관련 접근성·키보드 테스트 전체 통과.

- [ ] **Step 3: 전체 품질 검사**

Run: `pnpm check`

Expected: 전체 Node 테스트, TypeScript, ESLint와 Next.js 운영 빌드 종료 코드 0.

- [ ] **Step 4: 변경 범위 확인**

Run: `git diff --check && git status --short`

Expected: 설계·계획·L4 구현·테스트·문서 파일만 표시되고 `ChatBot/`, `Text-Play/`, `next-env.d.ts`, `.next/`, `node_modules/`은 표시되지 않는다.

- [ ] **Step 5: 단일 커밋**

Run: `git add`로 Task 1~4의 명시된 파일만 스테이징한 뒤 `git commit -m "feat: 공통 접근성과 키보드 조작 보강"`

Expected: L4 전체 변경이 하나의 커밋으로 기록되고 Git 상태가 깨끗하다.
