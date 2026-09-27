---
# 플레이풀 랩 공통 디자인 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 메인과 공용·운영 페이지를 흰색 중심의 플레이풀 랩 디자인으로 통일하면서 개별 프로젝트 페이지와 기존 기능을 그대로 보존한다.

**Architecture:** `public/playful-lab-theme.css`가 색상, 표면, 간격, 모서리, 그림자, 초점과 상태 토큰의 단일 기준이 된다. 정적 페이지는 기존 CSS 뒤에 이 파일을 연결하고, Next.js는 루트 레이아웃에서 같은 파일을 연결한 뒤 기존 CSS 모듈과 관리자 CSS가 공통 변수를 사용하도록 바꾼다. 모든 공통 규칙은 `data-theme="playful-lab"` 아래로 제한해 프로젝트 상세 페이지와 개발용 미리보기를 격리한다.

**Tech Stack:** HTML5, CSS3, JavaScript ES modules, Next.js 16, React 19, TypeScript 5.7, Node.js 내장 테스트 실행기, pnpm

**Spec:** `docs/superpowers/specs/2026-09-23-playful-lab-theme-design.md`

---
## Global Constraints

- 기본 배경 `#FFFFFF`, 보조 배경 `#F7FBFF`, 카드 배경 `#EEF3F8`
- 주요 글자 `#172A49`, 보조 글자 `#53677E`, 경계선 `#DCE7F0`
- 민트 `#43D7C3`, 바이올렛 `#7768F8`, 오렌지 `#FF9256`
- 오류 `#D94B64`, 성공 `#218A76`
- `public/project_*` 아래의 모든 프로젝트 페이지와 전용 자원은 변경 금지
- `public/device-preview.html`과 개발용 미리보기 CSS·스크립트는 변경 금지
- 링크, 필터, 캐러셀 방향 이동, 7초 자동 전환, 진행 게이지, 로그인, 연령 확인, 댓글, 관리자 동작 보존
- 캐챗 바로가기 `http://localhost:3001/` 보존
- 외부 서비스 가입, 유료 서비스 연결, 배포 주소 전환 금지
- 새 패키지와 새 런타임 의존성 추가 금지
- 새 코드와 수정 코드는 Allman 스타일 및 줄별 한글 명사형 주석 적용
- 저장소는 부모가 없는 최신 커밋 한 개만 유지하고 각 작업 저장은 `git commit --amend --no-edit` 사용
- 원격 강제 갱신은 9단계 최종 검증 후 한 번만 수행

---
## Review Focus

- 기존 인라인 CSS가 강해도 공통 테마가 적용 대상에서 최종 시각 값을 가져야 함
- 테마 이름이 프로젝트 페이지나 기기 미리보기에 한 번이라도 들어가면 회귀로 처리해야 함
- 모바일 `375px`에서 고정 버튼, 개인정보 버튼, 캐러셀 조작부가 겹치지 않아야 함
- 오류·성공·제한 상태는 색상뿐 아니라 기존 문구와 형태로도 구분되어야 함
- `prefers-reduced-motion: reduce` 환경에서는 장식 이동과 전환 시간이 사실상 제거되어야 함

---
## 파일 구조

| 파일 | 책임 |
|---|---|
| `public/playful-lab-theme.css` | 공통 토큰, 정적 페이지 구성 요소, 반응형·접근성·상태 표현 |
| `tests/playful-lab-theme.test.mjs` | 테마 계약, 적용·제외 범위, 주요 구성 요소와 반응형 회귀 검사 |
| `public/main.html` | 메인 페이지 테마 연결과 식별자 |
| `public/goods.html` | 상품 페이지 테마 연결과 식별자 |
| `public/devlog.html` | 개발 소식 페이지 테마 연결과 식별자 |
| `public/community.html` | 커뮤니티 페이지 테마 연결과 식별자 |
| `public/terms.html` | 이용약관 페이지 테마 연결과 식별자 |
| `public/privacy.html` | 개인정보처리방침 페이지 테마 연결과 식별자 |
| `app/layout.tsx` | Next.js 전체 화면의 공통 테마 연결과 식별자 |
| `app/login/member-login.module.css` | 회원 로그인 화면의 공통 토큰 소비 |
| `app/age-verification/age-verification.module.css` | 연령 확인 화면의 공통 토큰 소비 |
| `app/news/[id]/news-detail.module.css` | 뉴스 상세·댓글 화면의 공통 토큰 소비 |
| `app/admin/admin.css` | 관리자 로그인·뉴스·상품 화면의 공통 토큰 소비 |
| `tests/root-layout.test.mjs` | Next.js 루트 구조와 테마 연결 검사 |
| `README.md` | 공통 테마 적용·제외 규칙과 검증 명령 기록 |

---
### Task 1: 공통 테마 계약과 디자인 토큰

**Files:**

- Create: `public/playful-lab-theme.css`
- Create: `tests/playful-lab-theme.test.mjs`
- Reference: `docs/superpowers/specs/2026-09-23-playful-lab-theme-design.md`

**Interfaces:**

- Consumes: 설계 문서의 11개 색상 값과 `data-theme="playful-lab"` 범위 계약
- Produces: `--pl-*` CSS 사용자 정의 속성, 기본 본문·링크·초점·움직임 축소 규칙

- [ ] **Step 1: 존재하지 않는 공통 테마 파일을 요구하는 실패 테스트 작성**

구현 전 기준점을 로컬 태그로 보존하고 원격에는 올리지 않는다.

```powershell
git tag -f codex/playful-lab-baseline HEAD # 구현 전 비교 기준 저장
```

```javascript
import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 비동기 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const themeUrl = new URL("../public/playful-lab-theme.css", import.meta.url); // 공통 테마 경로

test("플레이풀 랩 테마가 승인된 공통 토큰을 제공한다", async () => // 토큰 계약 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 파일 읽기
    assert.match(css, /\[data-theme="playful-lab"\]/); // 테마 범위 확인
    assert.match(css, /--pl-canvas:\s*#FFFFFF/i); // 기본 배경 확인
    assert.match(css, /--pl-surface:\s*#F7FBFF/i); // 보조 배경 확인
    assert.match(css, /--pl-panel:\s*#EEF3F8/i); // 카드 배경 확인
    assert.match(css, /--pl-ink:\s*#172A49/i); // 주요 글자 확인
    assert.match(css, /--pl-muted:\s*#53677E/i); // 보조 글자 확인
    assert.match(css, /--pl-border:\s*#DCE7F0/i); // 경계선 확인
    assert.match(css, /--pl-mint:\s*#43D7C3/i); // 민트 확인
    assert.match(css, /--pl-violet:\s*#7768F8/i); // 바이올렛 확인
    assert.match(css, /--pl-orange:\s*#FF9256/i); // 오렌지 확인
    assert.match(css, /--pl-danger:\s*#D94B64/i); // 오류 확인
    assert.match(css, /--pl-success:\s*#218A76/i); // 성공 확인
}); // 테스트 끝
```

- [ ] **Step 2: 단일 테스트를 실행해 파일 부재 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs`

Expected: `ENOENT`와 `public/playful-lab-theme.css` 경로를 포함한 실패

- [ ] **Step 3: 최소 공통 토큰과 기본 접근성 규칙 구현**

```css
[data-theme="playful-lab"] /* 공통 테마 범위 */
{ /* 토큰 시작 */
    --pl-canvas: #FFFFFF; /* 기본 배경 */
    --pl-surface: #F7FBFF; /* 보조 배경 */
    --pl-panel: #EEF3F8; /* 카드 배경 */
    --pl-ink: #172A49; /* 주요 글자 */
    --pl-muted: #53677E; /* 보조 글자 */
    --pl-border: #DCE7F0; /* 공통 경계선 */
    --pl-mint: #43D7C3; /* 미술 강조 */
    --pl-violet: #7768F8; /* 게임 강조 */
    --pl-orange: #FF9256; /* 기계 강조 */
    --pl-danger: #D94B64; /* 오류 강조 */
    --pl-success: #218A76; /* 성공 강조 */
    --pl-radius-small: 0.75rem; /* 작은 모서리 */
    --pl-radius-medium: 1.25rem; /* 중간 모서리 */
    --pl-radius-large: 2rem; /* 큰 모서리 */
    --pl-shadow-small: 0 0.5rem 1.5rem rgba(23, 42, 73, 0.08); /* 작은 그림자 */
    --pl-shadow-medium: 0 1.25rem 3.5rem rgba(23, 42, 73, 0.12); /* 중간 그림자 */
    --pl-focus: 0 0 0 0.2rem rgba(119, 104, 248, 0.32); /* 초점 그림자 */
    --pl-duration: 220ms; /* 기본 전환 시간 */
    background: var(--pl-canvas); /* 기본 화면 배경 */
    color: var(--pl-ink); /* 기본 글자색 */
    color-scheme: light; /* 밝은 화면 체계 */
} /* 토큰 끝 */

[data-theme="playful-lab"] :focus-visible /* 키보드 초점 */
{ /* 초점 시작 */
    outline: 0.18rem solid var(--pl-violet); /* 초점 외곽선 */
    outline-offset: 0.2rem; /* 초점 간격 */
} /* 초점 끝 */

@media (prefers-reduced-motion: reduce) /* 움직임 축소 환경 */
{ /* 축소 시작 */
    [data-theme="playful-lab"] *, /* 모든 하위 요소 */
    [data-theme="playful-lab"] *::before, /* 앞 장식 요소 */
    [data-theme="playful-lab"] *::after /* 뒤 장식 요소 */
    { /* 요소 시작 */
        animation-duration: 0.01ms !important; /* 애니메이션 제거 */
        animation-iteration-count: 1 !important; /* 반복 제거 */
        scroll-behavior: auto !important; /* 즉시 이동 */
        transition-duration: 0.01ms !important; /* 전환 제거 */
    } /* 요소 끝 */
} /* 축소 끝 */
```

- [ ] **Step 4: 토큰 테스트 통과 확인**

Run: `node --test tests/playful-lab-theme.test.mjs`

Expected: `1` test, `1` pass, `0` fail

- [ ] **Step 5: 단일 커밋에 토큰 작업 저장**

```powershell
git add public/playful-lab-theme.css tests/playful-lab-theme.test.mjs # 토큰 파일 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 2: 적용 페이지 연결과 제외 경계

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `public/main.html:1980-1984`
- Modify: `public/goods.html:7-12`
- Modify: `public/devlog.html:7-11`
- Modify: `public/community.html:8-13`
- Modify: `public/terms.html:8-11`
- Modify: `public/privacy.html:8-11`
- Modify: `app/layout.tsx:1-50`
- Modify: `tests/root-layout.test.mjs`
- Verify unchanged: `public/project_*/**/*.html`
- Verify unchanged: `public/device-preview.html`

**Interfaces:**

- Consumes: `/playful-lab-theme.css`, `data-theme="playful-lab"`
- Produces: 여섯 정적 페이지와 모든 Next.js 화면의 테마 연결, 프로젝트·미리보기 비적용 보장

- [ ] **Step 1: 적용·제외 범위 실패 테스트 추가**

```javascript
import { readdir } from "node:fs/promises"; // 폴더 읽기 도구
import path from "node:path"; // 경로 조합 도구

const publicRoot = new URL("../public/", import.meta.url); // 공개 폴더 경로
const themedPages = ["main.html", "goods.html", "devlog.html", "community.html", "terms.html", "privacy.html"]; // 테마 대상 문서

test("대상 정적 페이지는 테마를 마지막 스타일로 한 번만 연결한다", async () => // 정적 연결 검사
{ // 테스트 시작
    for (const fileName of themedPages) // 대상 문서 반복
    { // 반복 시작
        const html = await readFile(new URL(fileName, publicRoot), "utf8"); // 문서 읽기
        assert.equal((html.match(/playful-lab-theme\.css/g) ?? []).length, 1, fileName); // 단일 연결 확인
        assert.match(html, /<body[^>]*data-theme="playful-lab"/, fileName); // 테마 식별자 확인
        assert.equal(html.indexOf('<link rel="stylesheet" href="/playful-lab-theme.css">'), html.lastIndexOf('<link rel="stylesheet"'), fileName); // 마지막 스타일 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 페이지와 기기 미리보기는 공통 테마에서 제외된다", async () => // 제외 범위 검사
{ // 테스트 시작
    const entries = await readdir(publicRoot, { withFileTypes: true }); // 공개 항목 읽기
    const projectFolders = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")); // 프로젝트 폴더 추출
    for (const folder of projectFolders) // 프로젝트 폴더 반복
    { // 반복 시작
        const files = await readdir(new URL(`${folder.name}/`, publicRoot)); // 프로젝트 파일 읽기
        for (const fileName of files.filter((name) => name.endsWith(".html"))) // HTML 파일 반복
        { // 파일 시작
            const html = await readFile(new URL(`${folder.name}/${fileName}`, publicRoot), "utf8"); // 프로젝트 문서 읽기
            assert.doesNotMatch(html, /playful-lab-theme|data-theme="playful-lab"/, path.join(folder.name, fileName)); // 테마 부재 확인
        } // 파일 끝
    } // 반복 끝
    const preview = await readFile(new URL("device-preview.html", publicRoot), "utf8"); // 미리보기 읽기
    assert.doesNotMatch(preview, /playful-lab-theme|data-theme="playful-lab"/); // 미리보기 제외 확인
}); // 테스트 끝
```

- [ ] **Step 2: 연결 테스트의 예상 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/root-layout.test.mjs`

Expected: 대상 페이지의 테마 연결과 Next.js 본문 식별자 누락으로 실패

- [ ] **Step 3: 정적 페이지와 Next.js 루트 연결 구현**

각 정적 페이지의 기존 공통 스타일 다음에 아래 연결을 추가하고 `body`의 기존 속성을 유지한 채 테마 속성을 추가한다.

| 파일 | 기존 페이지 값 | 테마 파일 위치 |
|---|---|---|
| `public/main.html` | `main` | `site-experience.css` 다음 |
| `public/goods.html` | `goods` | `responsive-shell.css` 다음 |
| `public/devlog.html` | `news` | `responsive-shell.css` 다음 |
| `public/community.html` | `community` | `responsive-shell.css` 다음 |
| `public/terms.html` | `legal` | `responsive-shell.css` 다음 |
| `public/privacy.html` | `legal` | `responsive-shell.css` 다음 |

```html
<link rel="stylesheet" href="/playful-lab-theme.css"> <!-- 플레이풀 랩 공통 테마 -->
<body data-responsive-page="main" data-theme="playful-lab"> <!-- 메인 테마 본문 -->
```

`app/layout.tsx`에는 명시적 `head`와 테마 본문 식별자를 추가한다.

```tsx
return ( // 전체 문서 반환
    /* 한국어 문서와 공통 테마 */ <html lang="ko"><head><link rel="stylesheet" href="/playful-lab-theme.css" /></head><body className="font-sans antialiased" data-theme="playful-lab">
            {children} {/* 현재 페이지 내용 */}
            <script type="module" src="/privacy-consent.mjs"></script> {/* 개인정보 동의 연결 */}
            <script type="module" src="/site-analytics.mjs"></script> {/* 동의 기반 분석 연결 */}
    </body></html> // 한국어 문서와 공통 테마 끝
); // 전체 문서 반환 끝
```

`tests/root-layout.test.mjs`는 새 구조와 단일 테마 연결을 검사한다.

```javascript
assert.match(layout, /<html lang="ko"><head><link rel="stylesheet" href="\/playful-lab-theme\.css" \/><\/head><body[^>]*data-theme="playful-lab"/); // 루트 테마 구조 확인
assert.match(layout, /<\/body><\/html>/); // 루트 닫기 구조 확인
assert.equal((layout.match(/playful-lab-theme\.css/g) ?? []).length, 1); // 테마 단일 연결 확인
```

- [ ] **Step 4: 연결·제외 테스트 통과 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/root-layout.test.mjs tests/responsive-integration.test.mjs`

Expected: 모든 테스트 통과, 프로젝트·미리보기 파일 변경 없음

- [ ] **Step 5: 단일 커밋에 연결 작업 저장**

```powershell
git add public/main.html public/goods.html public/devlog.html public/community.html public/terms.html public/privacy.html app/layout.tsx tests/playful-lab-theme.test.mjs tests/root-layout.test.mjs # 연결 파일 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 3: 공통 헤더·버튼·입력·카드·모달

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `public/playful-lab-theme.css`

**Interfaces:**

- Consumes: `--pl-*` 토큰, 기존 `.navbar`, `.nav-*`, `.btn-*`, `.contact-dialog`, `.modal-*`, `.goods-card` 클래스
- Produces: 정적 페이지에서 공유하는 밝은 헤더, 버튼, 입력창, 카드, 대화상자 시각 규칙

- [ ] **Step 1: 공통 구성 요소 선택자 실패 테스트 추가**

```javascript
test("공통 테마가 탐색·버튼·카드·대화상자 계약을 제공한다", async () => // 공통 구성 요소 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /\[data-theme="playful-lab"\] \.navbar/); // 상단 메뉴 확인
    assert.match(css, /\[data-theme="playful-lab"\] \.nav-logo/); // 브랜드 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.btn-nav, \.hero-action, \.filter-btn, \.dialog-link\)/); // 버튼 묶음 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(input, textarea, select\)/); // 입력 요소 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.goods-card, \.community-card, \.news-row/); // 카드 묶음 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.contact-dialog, \.modal-box\)/); // 대화상자 확인
}); // 테스트 끝
```

- [ ] **Step 2: 구성 요소 테스트 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs`

Expected: `.navbar` 또는 공통 선택자 누락으로 실패

- [ ] **Step 3: 공통 구성 요소 규칙 구현**

`public/playful-lab-theme.css`에 아래 계약을 확장하고 기존 클래스의 동작 속성은 덮어쓰지 않는다.

```css
[data-theme="playful-lab"] .navbar /* 공통 상단 메뉴 */
{ /* 메뉴 시작 */
    border-bottom: 0.0625rem solid var(--pl-border); /* 하단 경계선 */
    background: rgba(255, 255, 255, 0.92); /* 밝은 반투명 배경 */
    box-shadow: var(--pl-shadow-small); /* 낮은 그림자 */
    color: var(--pl-ink); /* 메뉴 글자색 */
} /* 메뉴 끝 */

[data-theme="playful-lab"] .nav-logo /* 브랜드 링크 */
{ /* 브랜드 시작 */
    color: var(--pl-ink); /* 브랜드 글자색 */
    text-shadow: 0.12rem 0.12rem 0 var(--pl-mint); /* 미술형 강조 */
} /* 브랜드 끝 */

[data-theme="playful-lab"] :is(.btn-nav, .hero-action, .filter-btn, .dialog-link) /* 공통 행동 요소 */
{ /* 행동 시작 */
    border: 0.0625rem solid var(--pl-violet); /* 행동 경계선 */
    border-radius: 999rem; /* 캡슐 모서리 */
    background: var(--pl-canvas); /* 행동 배경 */
    color: var(--pl-ink); /* 행동 글자색 */
    transition: background var(--pl-duration), color var(--pl-duration), transform var(--pl-duration); /* 행동 전환 */
} /* 행동 끝 */

[data-theme="playful-lab"] :is(input, textarea, select) /* 공통 입력 요소 */
{ /* 입력 시작 */
    border: 0.0625rem solid var(--pl-border); /* 입력 경계선 */
    border-radius: var(--pl-radius-small); /* 입력 모서리 */
    background: var(--pl-canvas); /* 입력 배경 */
    color: var(--pl-ink); /* 입력 글자색 */
    color-scheme: light; /* 밝은 입력 체계 */
} /* 입력 끝 */

[data-theme="playful-lab"] :is(.goods-card, .community-card, .news-row) /* 공통 카드 */
{ /* 카드 시작 */
    border-color: var(--pl-border); /* 카드 경계선 */
    border-radius: var(--pl-radius-medium); /* 카드 모서리 */
    background: var(--pl-canvas); /* 카드 배경 */
    box-shadow: var(--pl-shadow-small); /* 카드 그림자 */
    color: var(--pl-ink); /* 카드 글자색 */
} /* 카드 끝 */

[data-theme="playful-lab"] :is(.contact-dialog, .modal-box) /* 공통 대화상자 */
{ /* 대화상자 시작 */
    border: 0.0625rem solid var(--pl-border); /* 대화상자 경계선 */
    border-radius: var(--pl-radius-large); /* 대화상자 모서리 */
    background: var(--pl-canvas); /* 대화상자 배경 */
    box-shadow: var(--pl-shadow-medium); /* 대화상자 그림자 */
    color: var(--pl-ink); /* 대화상자 글자색 */
} /* 대화상자 끝 */
```

- [ ] **Step 4: 공통 구성 요소 회귀 검사**

Run: `node --test tests/playful-lab-theme.test.mjs tests/responsive-navigation.test.mjs tests/privacy-consent.test.mjs`

Expected: 모든 테스트 통과

- [ ] **Step 5: 단일 커밋에 공통 구성 요소 저장**

```powershell
git add public/playful-lab-theme.css tests/playful-lab-theme.test.mjs # 공통 구성 요소 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 4: 메인 브랜드 화면과 캐러셀

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `public/playful-lab-theme.css`
- Verify unchanged behavior: `public/hero-carousel.mjs`
- Verify unchanged content: `public/main.html:2017-3216`

**Interfaces:**

- Consumes: 기존 `.hero`, `.hero-slide`, `.hero-carousel-*`, `.hero-action`, `.hero-stat`, `.section-*`, `.game-card`, `.faq-*` 구조
- Produces: 민트 중심 브랜드 화면, 흰색 히어로, 방향 버튼·진행 게이지·게임 카드·FAQ 시각 규칙

- [ ] **Step 1: 메인 시각 계약과 캐러셀 보존 테스트 추가**

```javascript
test("메인 테마가 히어로·캐러셀·게임·질문 영역을 밝게 표현한다", async () => // 메인 시각 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    const mainHtml = await readFile(new URL("main.html", publicRoot), "utf8"); // 메인 문서 읽기
    assert.match(css, /data-responsive-page="main"[\s\S]*?\.hero/); // 메인 히어로 범위 확인
    assert.match(css, /\.hero-carousel-progress-fill[\s\S]*?var\(--pl-violet\)/); // 진행 게이지 확인
    assert.match(css, /\.hero-carousel-control[\s\S]*?var\(--pl-ink\)/); // 방향 버튼 확인
    assert.match(css, /\.game-card[\s\S]*?var\(--pl-canvas\)/); // 게임 카드 확인
    assert.match(css, /\.faq-list details[\s\S]*?var\(--pl-panel\)/); // 질문 카드 확인
    assert.match(mainHtml, /href="http:\/\/localhost:3001\/"[^>]*>ChatBot 시작하기/); // 캐챗 주소 보존 확인
}); // 테스트 끝
```

- [ ] **Step 2: 메인 테마 선택자 누락 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/local-site-experience.test.mjs`

Expected: 메인 히어로 또는 진행 게이지 테마 누락으로 실패하고 기존 캐러셀 동작 테스트는 통과

- [ ] **Step 3: 메인 브랜드 화면 규칙 구현**

```css
[data-theme="playful-lab"][data-responsive-page="main"] .hero /* 메인 히어로 */
{ /* 히어로 시작 */
    background: radial-gradient(circle at 18% 18%, rgba(67, 215, 195, 0.2), transparent 26%), radial-gradient(circle at 82% 24%, rgba(119, 104, 248, 0.16), transparent 24%), linear-gradient(145deg, var(--pl-canvas), var(--pl-surface)); /* 예술형 밝은 배경 */
    color: var(--pl-ink); /* 히어로 글자색 */
} /* 히어로 끝 */

[data-theme="playful-lab"] .hero-action.primary /* 히어로 주요 행동 */
{ /* 주요 행동 시작 */
    border-color: var(--pl-violet); /* 주요 경계선 */
    background: linear-gradient(135deg, var(--pl-mint), var(--pl-violet)); /* 주요 그라디언트 */
    color: var(--pl-canvas); /* 주요 글자색 */
} /* 주요 행동 끝 */

[data-theme="playful-lab"] .hero-carousel-progress-track /* 캐러셀 진행 바탕 */
{ /* 진행 바탕 시작 */
    background: var(--pl-border); /* 남은 시간 배경 */
} /* 진행 바탕 끝 */

[data-theme="playful-lab"] .hero-carousel-progress-fill /* 캐러셀 진행 표시 */
{ /* 진행 표시 시작 */
    background: linear-gradient(90deg, var(--pl-mint), var(--pl-violet), var(--pl-orange)); /* 시간 진행 색상 */
} /* 진행 표시 끝 */

[data-theme="playful-lab"] .hero-carousel-control /* 캐러셀 방향 버튼 */
{ /* 방향 버튼 시작 */
    border-color: var(--pl-border); /* 방향 경계선 */
    background: rgba(255, 255, 255, 0.94); /* 방향 배경 */
    color: var(--pl-ink); /* 방향 글자색 */
    box-shadow: var(--pl-shadow-small); /* 방향 그림자 */
} /* 방향 버튼 끝 */

[data-theme="playful-lab"] :is(.game-card, .hero-stat) /* 게임과 현황 카드 */
{ /* 카드 시작 */
    border-color: var(--pl-border); /* 카드 경계선 */
    background: var(--pl-canvas); /* 카드 배경 */
    box-shadow: var(--pl-shadow-small); /* 카드 그림자 */
    color: var(--pl-ink); /* 카드 글자색 */
} /* 카드 끝 */

[data-theme="playful-lab"] .faq-list details /* 질문 카드 */
{ /* 질문 시작 */
    border-color: var(--pl-border); /* 질문 경계선 */
    background: var(--pl-panel); /* 질문 배경 */
    color: var(--pl-ink); /* 질문 글자색 */
} /* 질문 끝 */
```

- [ ] **Step 4: 메인 기능·시각 계약 통과 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/local-site-experience.test.mjs tests/game-catalog.test.mjs tests/website-content.test.mjs`

Expected: 모든 테스트 통과, `public/hero-carousel.mjs` 변경 없음

- [ ] **Step 5: 단일 커밋에 메인 테마 저장**

```powershell
git add public/playful-lab-theme.css tests/playful-lab-theme.test.mjs # 메인 테마 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 5: 상품·개발 소식·커뮤니티·법적 문서

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `public/playful-lab-theme.css`
- Verify structure: `public/goods.html`, `public/devlog.html`, `public/community.html`, `public/terms.html`, `public/privacy.html`
- Verify behavior: `public/goods.mjs`, `public/devlog.mjs`, `public/community.mjs`

**Interfaces:**

- Consumes: `data-responsive-page` 값 `goods`, `news`, `community`, `legal`과 기존 카드·필터·상태 클래스
- Produces: 바이올렛 중심 콘텐츠 화면, 민트 법적 문서, 오렌지 제한·준비 상태

- [ ] **Step 1: 콘텐츠·법적 문서 시각 계약 실패 테스트 추가**

```javascript
test("콘텐츠와 법적 문서가 페이지별 공통 테마 계약을 제공한다", async () => // 하위 페이지 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    const goodsHtml = await readFile(new URL("goods.html", publicRoot), "utf8"); // 상품 문서 읽기
    assert.match(css, /data-responsive-page="goods"[\s\S]*?\.goods-card/); // 상품 카드 확인
    assert.match(css, /data-responsive-page="news"[\s\S]*?\.news-row/); // 뉴스 행 확인
    assert.match(css, /data-responsive-page="community"[\s\S]*?\.platform-section/); // 커뮤니티 카드 확인
    assert.match(css, /data-responsive-page="legal"[\s\S]*?\.legal-document/); // 법적 문서 확인
    assert.match(css, /\.state-preparing[\s\S]*?var\(--pl-orange\)/); // 준비 상태 확인
    assert.match(css, /\.load-status[\s\S]*?var\(--pl-muted\)/); // 조회 상태 확인
    assert.match(goodsHtml, /판매 준비 중/); // 상태 문구 보존 확인
}); // 테스트 끝
```

- [ ] **Step 2: 페이지별 선택자 누락 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/goods-page.test.mjs tests/development-news.test.mjs tests/community-page.test.mjs`

Expected: 콘텐츠 페이지 선택자 누락으로 실패하고 기존 데이터 동작 테스트는 통과

- [ ] **Step 3: 콘텐츠 페이지와 법적 문서 규칙 구현**

```css
[data-theme="playful-lab"][data-responsive-page="goods"] .goods-card /* 상품 카드 */
{ /* 상품 시작 */
    border-color: var(--pl-border); /* 상품 경계선 */
    background: var(--pl-canvas); /* 상품 배경 */
    box-shadow: var(--pl-shadow-small); /* 상품 그림자 */
} /* 상품 끝 */

[data-theme="playful-lab"][data-responsive-page="news"] .news-row /* 뉴스 행 */
{ /* 뉴스 시작 */
    border-color: var(--pl-border); /* 뉴스 경계선 */
    background: var(--pl-canvas); /* 뉴스 배경 */
    color: var(--pl-ink); /* 뉴스 글자색 */
} /* 뉴스 끝 */

[data-theme="playful-lab"][data-responsive-page="community"] .platform-section /* 플랫폼 카드 */
{ /* 플랫폼 시작 */
    border-color: var(--pl-border); /* 플랫폼 경계선 */
    background: linear-gradient(145deg, var(--pl-canvas), var(--pl-surface)); /* 플랫폼 배경 */
    color: var(--pl-ink); /* 플랫폼 글자색 */
} /* 플랫폼 끝 */

[data-theme="playful-lab"][data-responsive-page="legal"] .legal-document /* 법적 문서 */
{ /* 문서 시작 */
    border: 0.0625rem solid var(--pl-border); /* 문서 경계선 */
    border-radius: var(--pl-radius-large); /* 문서 모서리 */
    background: var(--pl-canvas); /* 문서 배경 */
    box-shadow: var(--pl-shadow-small); /* 문서 그림자 */
    color: var(--pl-ink); /* 문서 글자색 */
} /* 문서 끝 */

[data-theme="playful-lab"] .state-preparing /* 준비 상태 */
{ /* 준비 시작 */
    border-color: var(--pl-orange); /* 준비 경계선 */
    color: var(--pl-ink); /* 준비 글자색 */
} /* 준비 끝 */

[data-theme="playful-lab"] .load-status /* 조회 상태 */
{ /* 조회 시작 */
    color: var(--pl-muted); /* 조회 글자색 */
} /* 조회 끝 */
```

- [ ] **Step 4: 콘텐츠 데이터·필터 회귀 검사**

Run: `node --test tests/playful-lab-theme.test.mjs tests/goods-page.test.mjs tests/goods-assets.test.mjs tests/development-news.test.mjs tests/community-page.test.mjs tests/community-games.test.mjs`

Expected: 모든 테스트 통과

- [ ] **Step 5: 단일 커밋에 콘텐츠 테마 저장**

```powershell
git add public/playful-lab-theme.css tests/playful-lab-theme.test.mjs # 콘텐츠 테마 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 6: 회원 로그인과 성인 인증

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `app/login/member-login.module.css:1-116`
- Modify: `app/age-verification/age-verification.module.css:1-43`
- Verify behavior: `app/login/member-login-form.tsx`
- Verify behavior: `app/age-verification/age-verification-form.tsx`

**Interfaces:**

- Consumes: Next.js 루트의 `data-theme`, 공통 `--pl-*` 변수, 기존 CSS 모듈 클래스
- Produces: 밝은 회원 로그인 카드, 오렌지 보조 연령 확인 카드, 공통 폼·오류·초점 표현

- [ ] **Step 1: CSS 모듈의 공통 토큰 사용 실패 테스트 추가**

```javascript
test("회원 로그인과 성인 인증 CSS가 공통 토큰을 사용한다", async () => // 회원 화면 검사
{ // 테스트 시작
    const loginCss = await readFile(new URL("../app/login/member-login.module.css", import.meta.url), "utf8"); // 로그인 스타일 읽기
    const ageCss = await readFile(new URL("../app/age-verification/age-verification.module.css", import.meta.url), "utf8"); // 연령 스타일 읽기
    assert.match(loginCss, /background:\s*var\(--pl-surface\)/); // 로그인 배경 확인
    assert.match(loginCss, /color:\s*var\(--pl-ink\)/); // 로그인 글자 확인
    assert.match(loginCss, /var\(--pl-violet\)/); // 로그인 주요 행동 확인
    assert.match(ageCss, /background:\s*var\(--pl-surface\)/); // 연령 배경 확인
    assert.match(ageCss, /var\(--pl-orange\)/); // 연령 주의 강조 확인
    assert.match(ageCss, /color-scheme:\s*light/); // 밝은 날짜 입력 확인
}); // 테스트 끝
```

- [ ] **Step 2: 기존 어두운 값으로 인한 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/member-auth.test.mjs tests/age-gate-ui.test.mjs`

Expected: 공통 변수 누락으로 테마 테스트 실패, 기능 테스트 통과

- [ ] **Step 3: 로그인·연령 CSS를 공통 변수 기반으로 변환**

`member-login.module.css`의 주요 표면과 행동을 아래 계약으로 바꾼다.

```css
.shell /* 로그인 전체 영역 */
{ /* 영역 시작 */
    min-height: 100vh; /* 화면 높이 */
    padding: 40px 20px; /* 바깥 여백 */
    background: var(--pl-surface); /* 밝은 배경 */
    color: var(--pl-ink); /* 기본 글자색 */
    display: grid; /* 가운데 배치 */
    place-items: center; /* 완전 가운데 정렬 */
} /* 영역 끝 */

.panel /* 로그인 카드 */
{ /* 카드 시작 */
    width: min(520px, 100%); /* 반응형 너비 */
    padding: clamp(30px, 6vw, 54px); /* 반응형 여백 */
    border: 1px solid var(--pl-border); /* 카드 경계선 */
    border-radius: var(--pl-radius-large); /* 카드 모서리 */
    background: var(--pl-canvas); /* 카드 배경 */
    box-shadow: var(--pl-shadow-medium); /* 카드 그림자 */
} /* 카드 끝 */

.primaryButton, .googleButton /* 로그인 버튼 */
{ /* 버튼 시작 */
    border-color: var(--pl-violet); /* 버튼 경계선 */
    background: var(--pl-violet); /* 버튼 배경 */
    color: var(--pl-canvas); /* 버튼 글자색 */
} /* 버튼 끝 */
```

`age-verification.module.css`는 같은 표면 토큰을 사용하고 경고 배지와 안내선에 `var(--pl-orange)`를 사용한다. 날짜 입력은 `color-scheme: light`, 오류 메시지는 `var(--pl-danger)`, 제출 버튼은 `var(--pl-violet)`로 지정한다.

```css
.shell /* 연령 확인 전체 영역 */
{ /* 영역 시작 */
    min-height: 100vh; /* 화면 높이 */
    display: grid; /* 중앙 배치 방식 */
    place-items: center; /* 중앙 정렬 */
    padding: 2rem 1rem; /* 바깥 여백 */
    background: var(--pl-surface); /* 밝은 배경 */
    color: var(--pl-ink); /* 기본 글자색 */
} /* 영역 끝 */

.card /* 연령 확인 카드 */
{ /* 카드 시작 */
    width: min(100%, 34rem); /* 카드 너비 */
    padding: clamp(1.5rem, 5vw, 3rem); /* 카드 안쪽 여백 */
    border: 1px solid var(--pl-border); /* 카드 경계선 */
    border-radius: var(--pl-radius-medium); /* 카드 모서리 */
    background: var(--pl-canvas); /* 카드 배경 */
    box-shadow: var(--pl-shadow-medium); /* 카드 그림자 */
} /* 카드 끝 */

.badge, .notice /* 연령 주의 요소 */
{ /* 주의 시작 */
    border-color: var(--pl-orange); /* 주의 경계선 */
} /* 주의 끝 */

.input /* 날짜 입력 */
{ /* 입력 시작 */
    border-color: var(--pl-border); /* 입력 경계선 */
    background: var(--pl-canvas); /* 입력 배경 */
    color: var(--pl-ink); /* 입력 글자색 */
    color-scheme: light; /* 밝은 날짜 체계 */
} /* 입력 끝 */

.message /* 연령 확인 오류 */
{ /* 오류 시작 */
    color: var(--pl-danger); /* 오류 글자색 */
} /* 오류 끝 */

.submit /* 연령 확인 버튼 */
{ /* 버튼 시작 */
    border-color: var(--pl-violet); /* 버튼 경계선 */
    background: var(--pl-violet); /* 버튼 배경 */
    color: var(--pl-canvas); /* 버튼 글자색 */
} /* 버튼 끝 */
```

- [ ] **Step 4: 회원·연령 기능과 스타일 계약 통과 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/member-auth.test.mjs tests/member-header.test.mjs tests/age-gate.test.mjs tests/age-gate-ui.test.mjs tests/age-gate-api.test.mjs`

Expected: 모든 테스트 통과

- [ ] **Step 5: 단일 커밋에 회원 화면 테마 저장**

```powershell
git add app/login/member-login.module.css app/age-verification/age-verification.module.css tests/playful-lab-theme.test.mjs # 회원 화면 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 7: 뉴스 상세·댓글과 관리자 화면

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `app/news/[id]/news-detail.module.css:1-325`
- Modify: `app/admin/admin.css:1-486`
- Verify behavior: `app/news/[id]/comments-panel.tsx`
- Verify behavior: `app/admin/news/actions.ts`
- Verify behavior: `app/admin/products/actions.ts`

**Interfaces:**

- Consumes: 공통 `--pl-*` 변수, 기존 뉴스 CSS 모듈과 `.admin-*` 전역 클래스
- Produces: 바이올렛 뉴스·댓글 화면, 오렌지 운영 상태, 명확한 성공·오류·삭제 표현

- [ ] **Step 1: 뉴스·관리자 공통 토큰 실패 테스트 추가**

```javascript
test("뉴스 상세와 관리자 화면이 공통 토큰과 상태색을 사용한다", async () => // 운영 화면 검사
{ // 테스트 시작
    const newsCss = await readFile(new URL("../app/news/[id]/news-detail.module.css", import.meta.url), "utf8"); // 뉴스 스타일 읽기
    const adminCss = await readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"); // 관리자 스타일 읽기
    assert.match(newsCss, /background:\s*var\(--pl-surface\)/); // 뉴스 배경 확인
    assert.match(newsCss, /var\(--pl-violet\)/); // 뉴스 강조 확인
    assert.match(newsCss, /var\(--pl-danger\)/); // 댓글 오류 확인
    assert.match(adminCss, /body\[data-theme="playful-lab"\][\s\S]*?--admin-bg:\s*var\(--pl-surface\)/); // 관리자 배경 연결 확인
    assert.match(adminCss, /--admin-accent:\s*var\(--pl-orange\)/); // 관리자 강조 연결 확인
    assert.match(adminCss, /--admin-danger:\s*var\(--pl-danger\)/); // 관리자 오류 연결 확인
    assert.match(adminCss, /--admin-success:\s*var\(--pl-success\)/); // 관리자 성공 연결 확인
}); // 테스트 끝
```

- [ ] **Step 2: 기존 관리자 색상으로 인한 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/comment-domain.test.mjs tests/admin-products-ui.test.mjs`

Expected: 뉴스·관리자 공통 변수 누락으로 테마 테스트 실패

- [ ] **Step 3: 뉴스·댓글과 관리자 CSS를 토큰 기반으로 변환**

뉴스 CSS 모듈의 `.shell`, `.navigation`, `.article`, `.comments`, 폼, 댓글 카드, 오류 메시지를 공통 표면과 바이올렛 강조로 변경한다.

```css
.shell /* 뉴스 상세 전체 영역 */
{ /* 영역 시작 */
    min-height: 100vh; /* 화면 높이 */
    padding: 36px 20px 80px; /* 바깥 여백 */
    background: var(--pl-surface); /* 뉴스 배경 */
    color: var(--pl-ink); /* 뉴스 글자색 */
} /* 영역 끝 */

.article, .comments /* 뉴스와 댓글 패널 */
{ /* 패널 시작 */
    border: 1px solid var(--pl-border); /* 패널 경계선 */
    border-radius: var(--pl-radius-large); /* 패널 모서리 */
    background: var(--pl-canvas); /* 패널 배경 */
    box-shadow: var(--pl-shadow-small); /* 패널 그림자 */
} /* 패널 끝 */

.error /* 댓글 오류 */
{ /* 오류 시작 */
    color: var(--pl-danger); /* 오류 글자색 */
} /* 오류 끝 */
```

관리자 CSS의 기존 관리자 변수는 공통 변수에 연결한다.

```css
body[data-theme="playful-lab"] /* 관리자 색상 */
{ /* 색상 시작 */
    --admin-bg: var(--pl-surface); /* 관리자 배경 */
    --admin-panel: var(--pl-canvas); /* 관리자 패널 */
    --admin-panel-soft: var(--pl-panel); /* 관리자 보조 패널 */
    --admin-line: var(--pl-border); /* 관리자 경계선 */
    --admin-text: var(--pl-ink); /* 관리자 글자 */
    --admin-muted: var(--pl-muted); /* 관리자 보조 글자 */
    --admin-accent: var(--pl-orange); /* 관리자 강조 */
    --admin-danger: var(--pl-danger); /* 관리자 오류 */
    --admin-success: var(--pl-success); /* 관리자 성공 */
} /* 색상 끝 */
```

삭제 버튼은 `--admin-danger`, 공개·완료 상태는 `--admin-success`, 초안·확인 필요 상태는 `--admin-accent`를 사용한다. 흰색 패널과 남색 글자 대비를 유지한다.

- [ ] **Step 4: 뉴스·댓글·관리자 기능 회귀 검사**

Run: `node --test tests/playful-lab-theme.test.mjs tests/comment-domain.test.mjs tests/demo-news.test.mjs tests/admin-auth.test.mjs tests/admin-products-ui.test.mjs tests/admin-products-actions.test.mjs tests/admin-news-validation.test.mjs`

Expected: 모든 테스트 통과

- [ ] **Step 5: 단일 커밋에 운영 화면 테마 저장**

```powershell
git add app/news/[id]/news-detail.module.css app/admin/admin.css tests/playful-lab-theme.test.mjs # 운영 화면 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 8: 반응형·접근성·상태 화면 보강

**Files:**

- Modify: `tests/playful-lab-theme.test.mjs`
- Modify: `public/playful-lab-theme.css`

**Interfaces:**

- Consumes: 모든 테마 구성 요소와 기존 로딩·오류·빈 상태 클래스
- Produces: `375px`, `768px`, `1440px` 안전 규칙, 초점, 움직임 축소, 로딩·오류·빈 상태 표현

- [ ] **Step 1: 접근성·반응형·상태 계약 실패 테스트 추가**

```javascript
test("공통 테마가 반응형·상태·움직임 축소 계약을 제공한다", async () => // 안전 규칙 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /@media \(max-width:\s*767px\)/); // 모바일 구간 확인
    assert.match(css, /@media \(min-width:\s*768px\) and \(max-width:\s*1279px\)/); // 태블릿 구간 확인
    assert.match(css, /@media \(min-width:\s*1280px\)/); // 데스크톱 구간 확인
    assert.match(css, /:focus-visible[\s\S]*?var\(--pl-violet\)/); // 초점 표시 확인
    assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?0\.01ms/); // 움직임 축소 확인
    assert.match(css, /:is\(\.load-status, \.admin-empty-state\)/); // 로딩·빈 상태 확인
    assert.match(css, /:is\(\.error, \.admin-message-error, \.field-error\)/); // 오류 상태 확인
    assert.match(css, /min-height:\s*44px/); // 터치 높이 확인
    assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?\.hero-carousel-timer[\s\S]*?bottom:\s*4\.75rem/); // 모바일 게이지 위치 확인
    assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?:is\(\.modal-box, \.contact-dialog\)[\s\S]*?width:\s*calc\(100vw - 2rem\)/); // 모바일 대화상자 너비 확인
}); // 테스트 끝
```

- [ ] **Step 2: 누락된 상태·화면 구간 실패 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/responsive-integration.test.mjs`

Expected: 상태 묶음 또는 화면 구간 누락으로 실패

- [ ] **Step 3: 반응형·상태·접근성 규칙 구현**

```css
[data-theme="playful-lab"] :is(button, .btn-nav, .hero-action, .filter-btn, .dialog-link, .admin-primary-button, .admin-button-link, input, select) /* 상호작용 요소 */
{ /* 요소 시작 */
    min-height: 44px; /* 최소 터치 높이 */
} /* 요소 끝 */

[data-theme="playful-lab"] :is(.load-status, .admin-empty-state) /* 로딩과 빈 상태 */
{ /* 상태 시작 */
    border: 0.0625rem dashed var(--pl-border); /* 상태 경계선 */
    border-radius: var(--pl-radius-medium); /* 상태 모서리 */
    background: var(--pl-panel); /* 상태 배경 */
    color: var(--pl-muted); /* 상태 글자색 */
} /* 상태 끝 */

[data-theme="playful-lab"] :is(.error, .admin-message-error, .field-error) /* 오류 상태 */
{ /* 오류 시작 */
    color: var(--pl-danger); /* 오류 글자색 */
} /* 오류 끝 */

@media (max-width: 767px) /* 모바일 화면 */
{ /* 모바일 시작 */
    [data-theme="playful-lab"] .hero-carousel-timer /* 모바일 진행 게이지 */
    { /* 게이지 시작 */
        bottom: 4.75rem; /* 방향 버튼 위 배치 */
        width: min(15rem, calc(100vw - 6rem)); /* 안전 너비 */
    } /* 게이지 끝 */

    [data-theme="playful-lab"] :is(.modal-box, .contact-dialog) /* 모바일 대화상자 */
    { /* 대화상자 시작 */
        width: calc(100vw - 2rem); /* 화면 안쪽 너비 */
        max-height: calc(100dvh - 2rem); /* 화면 안쪽 높이 */
        overflow-y: auto; /* 세로 이동 */
    } /* 대화상자 끝 */
} /* 모바일 끝 */

@media (min-width: 768px) and (max-width: 1279px) /* 태블릿 화면 */
{ /* 태블릿 시작 */
    [data-theme="playful-lab"] :is(.goods-grid, .games-grid) /* 태블릿 카드 격자 */
    { /* 격자 시작 */
        gap: clamp(1rem, 2vw, 1.5rem); /* 카드 간격 */
    } /* 격자 끝 */
} /* 태블릿 끝 */

@media (min-width: 1280px) /* 데스크톱 화면 */
{ /* 데스크톱 시작 */
    [data-theme="playful-lab"] :is(.section, .legal-shell) /* 넓은 화면 영역 */
    { /* 영역 시작 */
        max-width: 90rem; /* 최대 콘텐츠 너비 */
        margin-inline: auto; /* 가운데 정렬 */
    } /* 영역 끝 */
} /* 데스크톱 끝 */
```

- [ ] **Step 4: 자동 검사와 세 너비 수동 확인**

Run: `node --test tests/playful-lab-theme.test.mjs tests/responsive-integration.test.mjs tests/responsive-navigation.test.mjs tests/privacy-consent.test.mjs`

Manual:

- `http://localhost:3000/main.html`을 `375px`, `768px`, `1440px`에서 확인
- `goods.html`, `devlog.html`, `community.html`, `terms.html`, `privacy.html`의 가로 넘침 확인
- `/login`, `/age-verification`, `/news/demo-echo-void`, `/admin/login`의 초점과 상태 문구 확인
- 캐러셀 진행 게이지가 방향 버튼보다 위에 있고 겹치지 않는지 확인
- 운영체제 움직임 축소 설정에서 장식과 전환이 즉시 끝나는지 확인

Expected: 자동 검사 통과, 가로 넘침·겹침·새 콘솔 오류 없음

- [ ] **Step 5: 단일 커밋에 안전 규칙 저장**

```powershell
git add public/playful-lab-theme.css tests/playful-lab-theme.test.mjs # 안전 규칙 준비
git commit --amend --no-edit # 단일 커밋 갱신
```

---
### Task 9: 전체 검증·문서화·최종 단일 커밋 동기화

**Files:**

- Modify: `README.md`
- Verify: 모든 Task 1-8 변경 파일
- Verify unchanged: `public/project_*/**/*`, `public/device-preview.*`

**Interfaces:**

- Consumes: 완성된 공통 테마, 전체 테스트 모음, TypeScript와 Next.js 빌드
- Produces: 재현 가능한 문서, 깨끗한 작업 폴더, 로컬·원격이 일치하는 부모 없는 단일 커밋

- [ ] **Step 1: README에 적용·제외 규칙과 검증 명령 추가**

```markdown
---
## 플레이풀 랩 공통 테마

공통 시각 토큰과 적용 규칙은 `public/playful-lab-theme.css`에서 관리합니다.

- 적용: 메인, 상품, 개발 소식, 커뮤니티, 약관, 개인정보, Next.js 회원·인증·뉴스·관리자 화면
- 제외: `public/project_*` 개별 프로젝트, `public/device-preview.html`
- 검증: `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm build`
```

- [ ] **Step 2: 전체 자동 검증 실행**

```powershell
pnpm test # 전체 Node 테스트
pnpm exec tsc --noEmit # 타입 검사
pnpm build # 운영 빌드
git diff --check # 공백 오류 검사
```

Expected:

- `pnpm test`: 모든 테스트 통과, 실패 `0`
- `pnpm exec tsc --noEmit`: 종료 코드 `0`
- `pnpm build`: 종료 코드 `0`
- `git diff --check`: 출력 없음

- [ ] **Step 3: 비적용 경계와 변경 파일 최종 검사**

```powershell
git diff --name-only codex/playful-lab-baseline..HEAD # 구현 기준 이후 저장 파일 확인
git diff --name-only # 아직 저장하지 않은 파일 확인
git status --short # 작업 폴더 변경 확인
rg -n "playful-lab-theme|data-theme=\"playful-lab\"" public/project_* public/device-preview.html # 제외 대상 테마 검색
```

Expected:

- 제외 대상 검색 결과 없음
- 변경 파일은 계획에 열거된 테마·대상 페이지·테스트·README로 제한
- 생성물 `.next`와 `.superpowers`는 Git 추적 대상 아님

- [ ] **Step 4: 브라우저 최종 검증과 단일 커밋 저장**

Browser:

- 메인 캐러셀 이전·다음 방향과 7초 자동 전환 확인
- 진행 게이지 재시작과 버튼 비겹침 확인
- 캐챗 `http://localhost:3001/` 링크 확인
- 상품 필터, 뉴스 상세, 커뮤니티 복사, 로그인, 연령 확인, 댓글, 관리자 폼 확인
- `375px`, `768px`, `1440px`에서 메인과 각 페이지군 확인
- 프로젝트 상세 페이지의 이전 디자인 유지 확인

```powershell
git add README.md public/playful-lab-theme.css public/main.html public/goods.html public/devlog.html public/community.html public/terms.html public/privacy.html app/layout.tsx app/login/member-login.module.css app/age-verification/age-verification.module.css app/news/[id]/news-detail.module.css app/admin/admin.css tests/playful-lab-theme.test.mjs tests/root-layout.test.mjs # 최종 파일 준비
git commit --amend -m "최신 홈페이지와 플레이풀 랩 공통 디자인 통합" # 최종 단일 커밋 저장
```

- [ ] **Step 5: 로컬·원격 단일 커밋 동기화 확인**

원격 `master`의 현재 SHA를 먼저 읽고 그 값을 명시한 `--force-with-lease`로 한 번만 갱신한다. 예상 SHA와 실제 SHA가 다르면 푸시를 중단하고 원격 변경을 확인한다.

```powershell
git rev-list --count HEAD # 로컬 커밋 수 확인
git log -1 --format="%H%n%P%n%s" # 부모와 제목 확인
$playfulLabRemoteSha = (git ls-remote origin refs/heads/master).Split("`t")[0] # 원격 기준 SHA 저장
git push --force-with-lease="refs/heads/master:$playfulLabRemoteSha" origin master # 안전한 원격 갱신
git ls-remote origin refs/heads/master # 원격 최종 SHA 확인
git tag -d codex/playful-lab-baseline # 로컬 비교 태그 정리
git status --short --branch # 최종 작업 폴더 확인
```

Expected:

- 로컬 커밋 수 `1`
- 최신 커밋 부모 값 비어 있음
- 커밋 제목 `최신 홈페이지와 플레이풀 랩 공통 디자인 통합`
- 로컬 HEAD와 원격 `master` SHA 일치
- `git status --short --branch`에 변경 파일 없음
