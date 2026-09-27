# DEVFORGE Responsive Navigation and Device Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Preserve the current PC presentation while adding usable tablet-landscape and mobile layouts, an accessible drawer menu, and a developer-only device preview page.

**Architecture:** Existing static pages keep their page-specific visual systems and load one shared responsive stylesheet plus one shared navigation module. The navigation module creates a single mobile drawer from a stable data-attribute mount point, while a separate iframe-based preview page changes the real child viewport to approved desktop, tablet-landscape, and mobile dimensions.

**Tech Stack:** HTML5, CSS media queries, native JavaScript ES modules, Node.js test runner, Next.js 16 build

**Spec:** docs/superpowers/specs/2026-09-22-responsive-navigation-preview-design.md

## Global Constraints

- Mobile range: 0px through 767px.
- Tablet content range: 768px through 1279px.
- Drawer navigation range: below 960px.
- Desktop range: 1280px and above.
- Preview presets: desktop 1440×900, tablet landscape 1024×768, mobile 390×844.
- Keep the existing DEVFORGE navy, cyan, and purple visual language.
- Do not expose device preview controls in the public site header.
- Do not change Google Ads, Google Analytics, Supabase, game content, or age-gate behavior.
- Use no new runtime dependency.
- Every new code line follows Allman style and includes a short Korean noun-style comment.

## Review Focus

- Repeated initialization must create one toggle, one drawer, and one overlay only; Task 1 pins this with an idempotency test.
- Nested project pages must use root-absolute links and preserve a safe return path for login; Task 1 pins both paths.
- Crossing from 959px to 960px while the drawer is open must close it and remove the body scroll lock; Task 1 pins the resize behavior.
- Missing header roots or missing contact dialogs must not throw an exception; Task 1 pins both safe fallback behaviors.
- Preview queries containing external URLs, javascript schemes, encoded traversal, or unknown pages must fall back to the main page; Task 4 pins each input class.

---

### Task 1: Shared responsive navigation behavior

**Files:**
- Create: public/responsive-nav.mjs
- Create: public/responsive-shell.css
- Create: tests/helpers/navigation-environment.mjs
- Create: tests/responsive-navigation.test.mjs

**Interfaces:**
- Consumes: document-compatible root, window-compatible view, current pathname.
- Produces: DRAWER_MAX_WIDTH, RESPONSIVE_NAV_ITEMS, isDrawerViewport(width), getLoginUrl(pathname), initializeResponsiveNavigation(root, view).
- initializeResponsiveNavigation returns null when data-responsive-nav-root is missing; otherwise it returns an object with open(), close(), and destroy().
- tests/helpers/navigation-environment.mjs produces createNavigationEnvironment(options), createdByRole(role), resizeTo(width), pressKey(key, shiftKey), root, view, drawer, and toggle.

- [ ] **Step 1: Write the failing breakpoint and route tests**

Add the following initial tests to tests/responsive-navigation.test.mjs:

    import assert from "node:assert/strict"; // 엄격 비교 도구
    import test from "node:test"; // 테스트 실행 도구
    import { getLoginUrl, isDrawerViewport, RESPONSIVE_NAV_ITEMS } from "../public/responsive-nav.mjs"; // 내비게이션 도구
    
    test("960px 미만에서만 서랍 메뉴를 사용한다", () => // 화면 구간 테스트
    { // 테스트 시작
        assert.equal(isDrawerViewport(767), true); // 모바일 서랍 확인
        assert.equal(isDrawerViewport(959), true); // 좁은 태블릿 서랍 확인
        assert.equal(isDrawerViewport(960), false); // 가로 메뉴 전환 확인
        assert.equal(isDrawerViewport(1280), false); // PC 가로 메뉴 확인
    }); // 테스트 끝
    
    test("중첩 페이지도 루트 절대 메뉴 주소를 사용한다", () => // 메뉴 주소 테스트
    { // 테스트 시작
        assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "goods")?.href, "/goods.html"); // 굿즈 주소 확인
        assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "games")?.href, "/main.html#games"); // 게임 주소 확인
        assert.equal(getLoginUrl("/project_eta/ProjectEta_Main.html"), "/login?returnTo=%2Fproject_eta%2FProjectEta_Main.html"); // 로그인 복귀 주소 확인
    }); // 테스트 끝

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

    node --test tests/responsive-navigation.test.mjs # 신규 내비게이션 테스트

Expected: FAIL because public/responsive-nav.mjs does not exist.

- [ ] **Step 3: Implement the pure navigation contract**

Create public/responsive-nav.mjs with these exported values and exact breakpoint behavior:

    export const DRAWER_MAX_WIDTH = 959; // 서랍 최대 너비
    
    export const RESPONSIVE_NAV_ITEMS = Object.freeze( // 공통 메뉴 목록
    [ // 목록 시작
        { id: "home", label: "홈", href: "/main.html" }, // 홈 메뉴
        { id: "games", label: "게임", href: "/main.html#games" }, // 게임 메뉴
        { id: "goods", label: "굿즈", href: "/goods.html" }, // 굿즈 메뉴
        { id: "news", label: "개발 뉴스", href: "/devlog.html" }, // 뉴스 메뉴
        { id: "community", label: "커뮤니티", href: "/community.html" }, // 커뮤니티 메뉴
        { id: "contact", label: "문의하기", href: "/main.html#contact" }, // 문의 메뉴
    ]); // 목록 끝
    
    export function isDrawerViewport(width) // 서랍 화면 판정
    { // 함수 시작
        return Number.isFinite(width) && width <= DRAWER_MAX_WIDTH; // 화면 판정 반환
    } // 함수 끝
    
    export function getLoginUrl(pathname) // 로그인 주소 생성
    { // 함수 시작
        const safePath = typeof pathname === "string" && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/main.html"; // 안전 복귀 경로
        return "/login?returnTo=" + encodeURIComponent(safePath); // 로그인 주소 반환
    } // 함수 끝

- [ ] **Step 4: Run the focused test and confirm GREEN**

Run:

    node --test tests/responsive-navigation.test.mjs # 내비게이션 단위 테스트

Expected: PASS for the breakpoint and root-absolute route tests.

- [ ] **Step 5: Add failing DOM behavior tests**

Create tests/helpers/navigation-environment.mjs with a fake document that supports querySelector(), createElement(), append(), remove(), classList, focus(), setAttribute(), getAttribute(), hidden, dataset, and event listeners. Its view must provide innerWidth, location, history.replaceState(), addEventListener(), removeEventListener(), and resizeTo(width). Export createNavigationEnvironment(options = {}) and store every generated element so createdByRole(role) can filter data-responsive-role values.

Import the helper and extend tests/responsive-navigation.test.mjs with these assertions:

    import { createNavigationEnvironment } from "./helpers/navigation-environment.mjs"; // 내비게이션 문서 대역

    test("반복 초기화에도 메뉴 요소를 한 번만 만든다", () => // 중복 초기화 테스트
    { // 테스트 시작
        const environment = createNavigationEnvironment(); // 문서 대역 생성
        const first = initializeResponsiveNavigation(environment.root, environment.view); // 첫 초기화
        const second = initializeResponsiveNavigation(environment.root, environment.view); // 반복 초기화
        assert.equal(first, second); // 제어기 재사용 확인
        assert.equal(environment.createdByRole("toggle").length, 1); // 버튼 한 개 확인
        assert.equal(environment.createdByRole("drawer").length, 1); // 메뉴 한 개 확인
        assert.equal(environment.createdByRole("overlay").length, 1); // 배경 한 개 확인
    }); // 테스트 끝
    
    test("960px 전환 시 메뉴와 스크롤 잠금을 해제한다", () => // 너비 변경 테스트
    { // 테스트 시작
        const environment = createNavigationEnvironment({ width: 390 }); // 모바일 환경 생성
        const controller = initializeResponsiveNavigation(environment.root, environment.view); // 메뉴 초기화
        controller.open(); // 메뉴 열기
        environment.resizeTo(960); // 태블릿 가로 전환
        assert.equal(environment.root.body.classList.contains("responsive-nav-open"), false); // 스크롤 잠금 해제 확인
        assert.equal(environment.drawer.hidden, true); // 메뉴 닫힘 확인
    }); // 테스트 끝

Also assert Escape closes the drawer, close() restores focus to the toggle, Tab wraps between first and last focusable controls, a missing data-responsive-nav-root returns null without creating nodes, and #contact on a document without #contact-modal does not throw or remove the hash.

- [ ] **Step 6: Implement accessible drawer behavior**

Complete initializeResponsiveNavigation(root, view):

- Find [data-responsive-nav-root] and return null when absent.
- Reuse root.__devforgeResponsiveNav when already initialized.
- Create one button with data-responsive-role="toggle", aria-controls="responsive-site-drawer", and aria-expanded="false".
- Create one aside with id="responsive-site-drawer", data-responsive-role="drawer", aria-hidden="true", and hidden=true.
- Create the six navigation links, a login link with data-member-action, and a close button.
- Create one overlay button with data-responsive-role="overlay" and an accessible name.
- open() reveals the drawer and overlay, sets aria-expanded to true, adds responsive-nav-open to body, and focuses the first drawer link.
- close() hides the drawer and overlay, removes responsive-nav-open, sets aria-expanded to false, and optionally restores toggle focus.
- Handle Escape, overlay selection, close button selection, internal menu selection, and focus wrapping.
- Register a resize listener that closes the drawer at 960px and above.
- destroy() removes listeners, generated nodes, the body class, and the cached controller reference.
- When location.hash is #contact on main.html, open the existing #contact-modal and then replace the URL hash with # using history.replaceState.

- [ ] **Step 7: Add the shared visual rules**

Create public/responsive-shell.css with:

- Box sizing limited to generated responsive navigation elements.
- Hidden toggle, drawer, and overlay by default.
- @media (max-width: 959px) rules that show the toggle and provide a fixed right drawer.
- @media (min-width: 960px) and (max-width: 1279px) compact header spacing.
- @media (min-width: 1280px) existing desktop density.
- 44px minimum interactive targets below 960px.
- Visible :focus-visible outlines using the site cyan accent.
- Body scroll locking with body.responsive-nav-open.
- Reduced transition duration under prefers-reduced-motion: reduce.

- [ ] **Step 8: Run Task 1 tests and commit**

Run:

    node --test tests/responsive-navigation.test.mjs # 내비게이션 전체 테스트
    git diff --check # 공백 오류 검사

Expected: all Task 1 tests PASS and git diff --check returns no errors.

Commit:

    git add public/responsive-nav.mjs public/responsive-shell.css tests/helpers/navigation-environment.mjs tests/responsive-navigation.test.mjs # 작업 파일 추가
    git commit -m "feat: add responsive navigation foundation" # 기반 기능 커밋

---

### Task 2: Connect the shared navigation to the five core pages

**Files:**
- Create: tests/responsive-integration.test.mjs
- Modify: public/main.html
- Modify: public/goods.html
- Modify: public/devlog.html
- Modify: public/community.html
- Modify: public/project_eta/ProjectEta_Main.html

**Interfaces:**
- Consumes: public/responsive-shell.css and public/responsive-nav.mjs from Task 1.
- Produces: data-responsive-nav-root mounts and ordered shared resource loading on each core page.

- [ ] **Step 1: Write failing core-page integration tests**

Create tests/responsive-integration.test.mjs:

    import assert from "node:assert/strict"; // 엄격 비교 도구
    import fs from "node:fs"; // 파일 읽기 도구
    import path from "node:path"; // 경로 처리 도구
    import test from "node:test"; // 테스트 실행 도구
    
    const CORE_PAGES = // 핵심 페이지 목록
    [ // 목록 시작
        "main.html", // 메인 페이지
        "goods.html", // 굿즈 페이지
        "devlog.html", // 뉴스 페이지
        "community.html", // 커뮤니티 페이지
        "project_eta/ProjectEta_Main.html", // 에타 페이지
    ]; // 목록 끝
    
    test("핵심 페이지가 공통 반응형 자원을 한 번씩 불러온다", () => // 공통 연결 테스트
    { // 테스트 시작
        for (const relativePath of CORE_PAGES) // 페이지 반복
        { // 반복 시작
            const html = fs.readFileSync(path.join("public", relativePath), "utf8"); // HTML 읽기
            assert.equal((html.match(/responsive-shell\\.css/g) ?? []).length, 1); // CSS 한 번 확인
            assert.equal((html.match(/responsive-nav\\.mjs/g) ?? []).length, 1); // 모듈 한 번 확인
            assert.match(html, /data-responsive-nav-root/); // 헤더 마운트 확인
        } // 반복 끝
    }); // 테스트 끝

Add assertions that the shared stylesheet appears after each page's existing stylesheet, the module appears before privacy-consent.mjs, and main.html contains a contact-modal compatible with #contact.

- [ ] **Step 2: Run the integration test and confirm RED**

Run:

    node --test tests/responsive-integration.test.mjs # 공통 연결 테스트

Expected: FAIL because the five pages do not yet load the shared resources.

- [ ] **Step 3: Connect resources and mount points**

For each core page:

- Add data-responsive-page with values main, goods, news, community, or eta to body.
- Add data-responsive-nav-root to its existing primary nav element.
- Add /responsive-shell.css after the page's current CSS.
- Add /responsive-nav.mjs before /privacy-consent.mjs.
- Keep existing desktop links and page-specific navigation unchanged.
- On main.html, update the logo link from # to /main.html and preserve the existing contact modal id.

The final resource order must be:

    <link rel="stylesheet" href="/responsive-shell.css"> <!-- 공통 반응형 스타일 -->
    <script type="module" src="/responsive-nav.mjs"></script> <!-- 공통 반응형 메뉴 -->
    <script type="module" src="/privacy-consent.mjs"></script> <!-- 개인정보 선택 화면 -->
    <script type="module" src="/site-analytics.mjs"></script> <!-- 사이트 분석 실행기 -->

- [ ] **Step 4: Run integration and existing navigation tests**

Run:

    node --test tests/responsive-integration.test.mjs tests/member-auth.test.mjs tests/development-news.test.mjs tests/goods-page.test.mjs tests/community-page.test.mjs # 핵심 연결 회귀 검사

Expected: all selected tests PASS.

- [ ] **Step 5: Commit core integration**

    git add public/main.html public/goods.html public/devlog.html public/community.html public/project_eta/ProjectEta_Main.html tests/responsive-integration.test.mjs # 핵심 페이지 추가
    git commit -m "feat: connect responsive navigation to core pages" # 핵심 연결 커밋

---

### Task 3: Build device-specific layouts for the core pages

**Files:**
- Modify: public/responsive-shell.css
- Modify: public/main.html
- Modify: public/goods.css
- Modify: public/devlog.css
- Modify: public/community.css
- Modify: public/project_eta/ProjectEta_Style.css
- Modify: tests/responsive-integration.test.mjs

**Interfaces:**
- Consumes: data-responsive-page values from Task 2.
- Produces: stable card, header, modal, and special-content layouts at 390, 767, 768, 1024, 1279, 1280, and 1440 pixel widths.

- [ ] **Step 1: Add failing layout contract tests**

Extend tests/responsive-integration.test.mjs to read the six stylesheets and assert:

- responsive-shell.css contains max-width: 767px, min-width: 768px, max-width: 959px, min-width: 960px, max-width: 1279px, and min-width: 1280px.
- main.html contains responsive rules for one-column mobile games and two-or-three-column tablet games.
- goods.css contains one-column mobile and two-or-three-column tablet goods grids.
- devlog.css contains one-column mobile news rows.
- community.css contains two-column mobile and three-column tablet platform grids.
- ProjectEta_Style.css keeps #fusion-tree horizontally scrollable below 1280px.
- All modal and consent-related containers use a viewport-safe maximum width below 768px.

- [ ] **Step 2: Run the layout contract test and confirm RED**

Run:

    node --test tests/responsive-integration.test.mjs # 화면 규칙 테스트

Expected: FAIL on missing breakpoint-specific selectors.

- [ ] **Step 3: Implement mobile layout rules**

At max-width 767px:

- Main: one game card per row, one news card per row, one goods card per row, two community cards per row, full-width detail buttons.
- Goods: one product card per row with the price and action stacked without overflow.
- News: each article becomes a single vertical row and filter controls wrap.
- Community: two platform cards per row and a single column below 420px.
- Project Eta: reduce hero type scale, make local section navigation horizontally scrollable, preserve invitation controls, and make the fusion tree independently scrollable.
- Modals: width calc(100vw - 32px), max-height calc(100dvh - 32px), overflow auto.
- Disable hover-only translations and reveal the action label permanently on coarse pointers.

- [ ] **Step 4: Implement tablet-landscape layout rules**

At 768px through 1279px:

- Main games and goods use repeat(2, minmax(0, 1fr)) below 1024px and repeat(3, minmax(0, 1fr)) from 1024px.
- Goods page follows the same two-to-three-column transition.
- Community uses exactly three columns.
- News keeps horizontal article composition at 1024px and switches to vertical below 900px.
- Project Eta retains its wide presentation while reducing side padding and allowing the fusion columns to scroll.
- At 960px through 1279px, compact existing header gaps and font sizes without hiding links.

- [ ] **Step 5: Preserve desktop behavior**

At min-width 1280px:

- Keep the current nav menu visible and the generated drawer toggle hidden.
- Keep current PC hero proportions.
- Keep main games at the existing desktop density.
- Keep goods at four columns and community at six cards.
- Do not change Project Eta invitation animation timing or fusion relationships.

- [ ] **Step 6: Run focused and full tests**

Run:

    node --test tests/responsive-integration.test.mjs tests/project-eta-page.test.mjs tests/goods-page.test.mjs tests/community-page.test.mjs tests/development-news.test.mjs # 반응형 회귀 검사
    node --test tests/*.test.mjs # 전체 테스트

Expected: all tests PASS.

- [ ] **Step 7: Commit device-specific layouts**

    git add public/responsive-shell.css public/main.html public/goods.css public/devlog.css public/community.css public/project_eta/ProjectEta_Style.css tests/responsive-integration.test.mjs # 화면 구성 추가
    git commit -m "feat: add mobile and tablet core layouts" # 화면 구성 커밋

---

### Task 4: Add the developer-only device preview

**Files:**
- Create: public/device-preview.html
- Create: public/device-preview.css
- Create: public/device-preview.mjs
- Create: tests/device-preview.test.mjs

**Interfaces:**
- Consumes: root-absolute public HTML paths.
- Produces: DEVICE_PRESETS, PREVIEW_PAGES, normalizePreviewPath(value), resolveDevicePreset(value), buildPreviewUrl(path, device), initializeDevicePreview(root, view).

- [ ] **Step 1: Write failing preset and path safety tests**

Create tests/device-preview.test.mjs:

    import assert from "node:assert/strict"; // 엄격 비교 도구
    import test from "node:test"; // 테스트 실행 도구
    import { buildPreviewUrl, DEVICE_PRESETS, normalizePreviewPath, resolveDevicePreset } from "../public/device-preview.mjs"; // 미리보기 도구
    
    test("세 기기 프리셋은 고정된 크기를 사용한다", () => // 기기 크기 테스트
    { // 테스트 시작
        assert.deepEqual(DEVICE_PRESETS.desktop, { width: 1440, height: 900, label: "PC" }); // PC 크기 확인
        assert.deepEqual(DEVICE_PRESETS.tablet, { width: 1024, height: 768, label: "태블릿 가로" }); // 태블릿 크기 확인
        assert.deepEqual(DEVICE_PRESETS.mobile, { width: 390, height: 844, label: "모바일" }); // 모바일 크기 확인
    }); // 테스트 끝
    
    test("외부 주소와 경로 이동은 메인 페이지로 되돌린다", () => // 주소 안전성 테스트
    { // 테스트 시작
        assert.equal(normalizePreviewPath("https://example.com"), "/main.html"); // 외부 주소 차단
        assert.equal(normalizePreviewPath("javascript:alert(1)"), "/main.html"); // 스크립트 주소 차단
        assert.equal(normalizePreviewPath("/../secret"), "/main.html"); // 상위 경로 차단
        assert.equal(normalizePreviewPath("/%2e%2e/secret"), "/main.html"); // 인코딩 경로 차단
        assert.equal(normalizePreviewPath("/unknown.html"), "/main.html"); // 미등록 페이지 차단
        assert.equal(normalizePreviewPath("/goods.html"), "/goods.html"); // 등록 페이지 허용
    }); // 테스트 끝
    
    test("잘못된 기기 이름은 PC로 되돌린다", () => // 기기 복구 테스트
    { // 테스트 시작
        assert.equal(resolveDevicePreset("watch"), "desktop"); // 기본 기기 확인
        assert.equal(buildPreviewUrl("/goods.html", "mobile"), "/device-preview.html?page=%2Fgoods.html&device=mobile"); // 공유 주소 확인
    }); // 테스트 끝

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

    node --test tests/device-preview.test.mjs # 미리보기 단위 테스트

Expected: FAIL because public/device-preview.mjs does not exist.

- [ ] **Step 3: Implement the preview data contract**

Create public/device-preview.mjs:

- Freeze DEVICE_PRESETS with the exact desktop, tablet, and mobile dimensions.
- Freeze PREVIEW_PAGES with main, goods, news, community, Project Eta, and every registered project HTML path.
- normalizePreviewPath decodes at most once inside try/catch, requires a leading single slash, rejects backslashes, double slashes, colon characters, and .. segments, and returns only an exact PREVIEW_PAGES match.
- resolveDevicePreset returns desktop for any unknown value.
- buildPreviewUrl uses URLSearchParams and normalized values.
- initializeDevicePreview reads page and device from location.search, updates the iframe and active button, updates history.replaceState, reports iframe load errors, and keeps controls active after an error.
- The new-window link receives rel="noopener" and only the normalized internal page.

- [ ] **Step 4: Build the preview page**

Create public/device-preview.html with:

- A noindex robots meta tag.
- A toolbar containing an accessible page select.
- Four buttons: PC, tablet landscape, mobile, and fit.
- A current-size status with aria-live="polite".
- A new-window link.
- A scrollable stage containing one titled iframe.
- Links to device-preview.css and device-preview.mjs only; do not include site analytics.

Create public/device-preview.css with:

- DEVFORGE navy, cyan, and purple variables.
- A sticky toolbar.
- A centered fixed-size frame using CSS custom properties --preview-width and --preview-height.
- A fit mode that scales the frame visually without changing the iframe viewport.
- Horizontal and vertical stage scrolling.
- Wrapped controls below 720px.
- Visible keyboard focus and reduced-motion support.

- [ ] **Step 5: Add DOM integration tests**

Extend tests/device-preview.test.mjs with a fake select, iframe, buttons, status, history, and location. Assert that:

- mobile sets iframe width 390 and height 844.
- tablet sets iframe width 1024 and height 768.
- fit changes only the outer transform and preserves the active preset size.
- page selection updates iframe.src and the query.
- iframe error sets a Korean error message without disabling the toolbar.
- repeated initialization reuses one controller.

- [ ] **Step 6: Run focused tests and commit**

Run:

    node --test tests/device-preview.test.mjs # 미리보기 전체 테스트
    git diff --check # 공백 오류 검사

Expected: all preview tests PASS.

Commit:

    git add public/device-preview.html public/device-preview.css public/device-preview.mjs tests/device-preview.test.mjs # 미리보기 파일 추가
    git commit -m "feat: add responsive device preview" # 미리보기 기능 커밋

---

### Task 5: Expand shared navigation to every public HTML page

**Files:**
- Modify: all existing public/**/*.html except public/device-preview.html
- Modify: tests/responsive-integration.test.mjs
- Modify: README.md

**Interfaces:**
- Consumes: shared navigation and responsive shell from Tasks 1 through 3.
- Produces: identical mobile access to core routes from all 42 existing public HTML pages.

- [ ] **Step 1: Add a failing all-page integration test**

Extend tests/responsive-integration.test.mjs:

    function collectPublicHtmlFiles(directory = "public") // 공개 HTML 수집
    { // 함수 시작
        return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 폴더 항목 반복
        { // 반복 시작
            const entryPath = path.join(directory, entry.name); // 항목 경로 생성
            return entry.isDirectory() ? collectPublicHtmlFiles(entryPath) : entry.name.endsWith(".html") ? [entryPath] : []; // HTML 경로 반환
        }); // 반복 끝
    } // 함수 끝

    test("모든 공개 HTML이 공통 모바일 메뉴를 제공한다", () => // 전체 페이지 연결 테스트
    { // 테스트 시작
        const files = collectPublicHtmlFiles().filter((file) => !file.endsWith("device-preview.html")); // 공개 페이지 수집
        assert.equal(files.length, 42); // 기존 페이지 수 확인
        for (const file of files) // 페이지 반복
        { // 반복 시작
            const html = fs.readFileSync(file, "utf8"); // HTML 읽기
            assert.match(html, /data-responsive-nav-root/); // 메뉴 마운트 확인
            assert.equal((html.match(/responsive-shell\\.css/g) ?? []).length, 1); // CSS 중복 방지
            assert.equal((html.match(/responsive-nav\\.mjs/g) ?? []).length, 1); // 모듈 중복 방지
        } // 반복 끝
    }); // 테스트 끝

Also assert device-preview.html is excluded from the public drawer and that all nested project pages use root-absolute shared asset paths.

- [ ] **Step 2: Run the all-page test and confirm RED**

Run:

    node --test tests/responsive-integration.test.mjs # 전체 연결 테스트

Expected: FAIL on project pages not yet connected.

- [ ] **Step 3: Connect all remaining pages**

For each remaining public HTML page:

- Mark the existing top-level nav or header nav with data-responsive-nav-root.
- Add /responsive-shell.css once after existing page CSS.
- Add /responsive-nav.mjs once before /privacy-consent.mjs.
- Preserve every page's internal project navigation.
- Use the generated drawer only for site-wide routes.
- Do not change adult content markup, project content, or existing page-specific scripts.

Update README.md with:

- device-preview.html local URL.
- the three preset sizes.
- the 960px drawer threshold.
- instructions that the preview page is a development tool and should not be linked in the public header.

- [ ] **Step 4: Run the complete automated verification**

Run:

    node --test tests/*.test.mjs # 전체 Node 테스트
    node node_modules/typescript/bin/tsc --noEmit # 타입 검사
    node node_modules/next/dist/bin/next build # 운영 빌드
    git diff --check # 공백 오류 검사

Expected: all tests PASS, TypeScript exits 0, Next.js build succeeds, and git diff --check returns no errors.

- [ ] **Step 5: Perform viewport verification**

Start the existing development server:

    node node_modules/next/dist/bin/next dev # 개발 서버 시작

Use device-preview.html and direct browser resizing to verify these exact widths:

- 390×844 mobile.
- 767px mobile upper boundary.
- 768px tablet content lower boundary.
- 959px drawer upper boundary.
- 960px inline-header lower boundary.
- 1024×768 tablet landscape.
- 1279px tablet upper boundary.
- 1280px desktop lower boundary.
- 1440×900 desktop.

Check main, goods, news, community, Project Eta, one standard project page, and one adult project page. Confirm no unintentional body horizontal scrolling, all menu items work, Escape closes the drawer, focus returns to the toggle, contact opens, adult mosaics remain covered, and Project Eta invitation and fusion tree remain usable.

- [ ] **Step 6: Commit the full rollout**

    git add public tests/responsive-integration.test.mjs README.md # 전체 연결 파일 추가
    git commit -m "feat: roll out responsive navigation across site" # 전체 적용 커밋

- [ ] **Step 7: Final repository verification**

Run:

    git status -sb # 작업 상태 확인
    git log --oneline --decorate -6 # 최근 커밋 확인

Expected: clean worktree on the current working branch with five implementation commits after the approved design and plan commits.
