# DEVFORGE Local Visitor Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 계정 없이 공개 사이트의 테스트 흔적을 제거하고, 로컬 프로젝트 탐색·보관·법률 문서·접근성 경험을 완성한다.

**Architecture:** `game-projects.mjs`를 프로젝트 정보의 단일 기준으로 유지하고 새 `site-experience.mjs`가 현황 집계와 브라우저 로컬 상태를 담당한다. 새 화면 스타일은 `site-experience.css`, 법률 문서는 독립 HTML과 `legal.css`, 외부 상담 로딩은 `support-widget.mjs`로 분리한다.

**Tech Stack:** HTML5, CSS, native JavaScript ES modules, localStorage, Node.js test runner, Next.js 16

**Spec:** docs/superpowers/specs/2026-09-23-local-visitor-experience-design.md

## Global Constraints

- Supabase, YouTube, SNS, 판매처, ChannelIO와 배포 서비스를 실제 연결하지 않는다.
- 확인되지 않은 출시일, 사업자 정보, 구성원 정보와 외부 주소를 작성하지 않는다.
- 새 런타임 의존성을 추가하지 않는다.
- 기존 DEVFORGE 네이비·시안·보라 시각 체계를 유지한다.
- 모든 새 코드 줄은 Allman 스타일과 짧은 한글 명사형 주석을 사용한다.
- 운영 전 법률 문서는 반드시 `운영 전 검토용 초안`으로 표시한다.
- 저장소에 Git 메타데이터가 없으므로 작업별 커밋 단계는 실행하지 않고 파일과 검증 결과를 기록한다.

## Review Focus

- 손상된 localStorage JSON은 예외 없이 빈 목록으로 복구되어야 하며 Task 5가 검사한다.
- 존재하지 않는 프로젝트 식별자는 즐겨찾기와 최근 목록에서 제거되어야 하며 Task 5가 검사한다.
- 설정되지 않거나 잘못된 상담 키는 외부 스크립트를 만들지 않아야 하며 Task 1이 검사한다.
- 공개 메인 페이지에는 기기 미리보기 제어기와 `href="#"` 외부 링크가 없어야 하며 Task 1과 Task 7이 검사한다.
- 모바일 핵심 버튼은 44px 미만으로 축소되지 않아야 하며 Task 8이 검사한다.

---

### Task 1: 공개 운영 흔적 정리

**Files:**
- Create: `public/support-widget.mjs`
- Modify: `public/main.html`
- Modify: `tests/responsive-integration.test.mjs`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `isValidSupportPluginKey(value): boolean`
- Produces: `initializeSupportWidget(root, view): HTMLScriptElement | null`

- [ ] **Step 1: 실패 테스트 작성**

```javascript
test("공개 메인에서 개발 제어기와 테스트 상담 정보를 제거한다", async () => // 운영 흔적 테스트
{ // 테스트 시작
    assert.doesNotMatch(mainHtml, /data-site-device-picker|TestService1234|519f1b4c/); // 테스트 정보 제외 확인
    assert.doesNotMatch(mainHtml, /<a[^>]+href="#"[^>]*>(Steam 페이지|itch\.io|[^<]*Discord)/); // 빈 외부 링크 제외 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs tests/responsive-integration.test.mjs`

Expected: 기존 기기 선택기와 상담 코드 때문에 FAIL.

- [ ] **Step 3: 최소 구현**

`main.html`에서 공개 기기 선택기와 하드코딩 ChannelIO 블록을 제거한다. 미설정 스토어·Discord 링크는 `span`과 `aria-disabled="true"`로 교체하고, 푸터 연도 마운트와 `support-widget.mjs`를 연결한다.

```javascript
export function isValidSupportPluginKey(value) // 상담 키 판정
{ // 함수 시작
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); // UUID 형식 반환
} // 함수 끝
```

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs tests/responsive-integration.test.mjs`

Expected: PASS.

---

### Task 2: 히어로 행동 버튼과 현황 추가

**Files:**
- Create: `public/site-experience.css`
- Create: `public/site-experience.mjs`
- Modify: `public/main.html`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Consumes: `GAME_PROJECTS`, `FEATURED_PROJECT_IDS`
- Produces: `getProjectStatusCounts(projects): { total, featured, developing, planning, paused }`
- Produces: `initializeSiteExperience(root, view): object | null`

- [ ] **Step 1: 현황 집계 실패 테스트 작성**

```javascript
test("프로젝트 현황을 공개 데이터에서 계산한다", () => // 현황 집계 테스트
{ // 테스트 시작
    const counts = getProjectStatusCounts(GAME_PROJECTS); // 현황 계산
    assert.equal(counts.total, 35); // 전체 개수 확인
    assert.equal(counts.developing + counts.planning + counts.paused, 35); // 상태 합계 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: `site-experience.mjs` 또는 함수 누락으로 FAIL.

- [ ] **Step 3: 히어로와 집계 구현**

`main.html` 히어로에 `#games`, `/devlog.html` 링크와 세 개의 현황 값을 추가한다. `site-experience.mjs`가 공개 데이터로 숫자를 채우고 `site-experience.css`가 PC·모바일 배치를 제공한다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 3: 스튜디오 소개와 FAQ 추가

**Files:**
- Modify: `public/main.html`
- Modify: `public/site-experience.css`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `#studio`, `#faq` 문서 구역

- [ ] **Step 1: 문서 구조 실패 테스트 작성**

```javascript
test("메인 페이지가 스튜디오 소개와 FAQ를 제공한다", () => // 콘텐츠 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /id="studio"/); // 스튜디오 구역 확인
    assert.match(mainHtml, /id="faq"/); // 질문 구역 확인
    assert.match(mainHtml, /출시 일정은 확정되지 않았습니다/); // 일정 안내 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: 신규 구역 누락으로 FAIL.

- [ ] **Step 3: 검증 가능한 콘텐츠 구현**

스튜디오 소개에는 장르 실험, 공개 정보 우선, 개발 중 상태를 작성한다. FAQ에는 프로젝트 상태, 상품 판매, 시연 계정, 외부 채널과 출시 일정의 미확정 상태를 작성한다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 4: 프로젝트 개발 현황판 추가

**Files:**
- Modify: `public/main.html`
- Modify: `public/site-experience.css`
- Modify: `public/site-experience.mjs`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Consumes: `getProjectStatusCounts(projects)`
- Produces: `[data-project-status="developing|planning|paused"]` 표시 값

- [ ] **Step 1: 현황판 실패 테스트 작성**

```javascript
test("메인 페이지가 세 개발 상태를 표시한다", () => // 상태판 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /data-project-status="developing"/); // 개발 중 표시 확인
    assert.match(mainHtml, /data-project-status="planning"/); // 기획 표시 확인
    assert.match(mainHtml, /data-project-status="paused"/); // 보류 표시 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: 상태판 누락으로 FAIL.

- [ ] **Step 3: 현황판 구현**

스튜디오 소개 뒤에 상태별 카드와 일정 미확정 안내를 추가한다. 값은 DOM에 고정하지 않고 `site-experience.mjs`가 공개 데이터에서 채운다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 5: 즐겨찾기와 최근 본 프로젝트 추가

**Files:**
- Modify: `public/site-experience.mjs`
- Modify: `public/main.html`
- Modify: `public/site-experience.css`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `FAVORITE_PROJECTS_KEY`, `RECENT_PROJECTS_KEY`, `MAX_RECENT_PROJECTS`
- Produces: `sanitizeProjectIds(value, projects): string[]`
- Produces: `readProjectIds(storage, key, projects): string[]`
- Produces: `toggleFavoriteProject(storage, id, projects): string[]`
- Produces: `recordRecentProject(storage, id, projects): string[]`
- Produces: `clearProjectPreferences(storage): void`

- [ ] **Step 1: 저장값 실패 테스트 작성**

```javascript
test("손상값과 미등록 프로젝트를 제거하고 최근 목록을 여섯 개로 제한한다", () => // 저장값 안전 테스트
{ // 테스트 시작
    assert.deepEqual(sanitizeProjectIds(["project-a", "missing", "project-a"], GAME_PROJECTS), ["project-a"]); // 안전 목록 확인
    assert.deepEqual(readProjectIds({ getItem: () => "{" }, FAVORITE_PROJECTS_KEY, GAME_PROJECTS), []); // 손상 JSON 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: 저장 도구 누락으로 FAIL.

- [ ] **Step 3: 로컬 보관함 구현**

게임 카드에 즐겨찾기 버튼을 추가하고 카드 이동 전에 최근 프로젝트를 기록한다. 메인에 즐겨찾기·최근 본 목록과 전체 삭제 버튼을 추가하며 식별자 외 값은 저장하지 않는다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 6: 굿즈·커뮤니티 준비 상태 개선

**Files:**
- Modify: `public/goods.html`
- Modify: `public/community.html`
- Modify: `public/community.mjs`
- Modify: `public/site-experience.css`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `copyCommunityHashtag(value, clipboard): Promise<boolean>`

- [ ] **Step 1: 준비 상태 실패 테스트 작성**

```javascript
test("굿즈와 커뮤니티가 외부 연결 전 상태를 설명한다", () => // 준비 상태 테스트
{ // 테스트 시작
    assert.match(goodsHtml, /실제 판매가 시작되기 전에는 결제되지 않습니다/); // 판매 안내 확인
    assert.match(communityHtml, /해시태그 복사/); // 로컬 복사 기능 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: 안내와 복사 기능 누락으로 FAIL.

- [ ] **Step 3: 준비 상태와 복사 기능 구현**

굿즈에는 결제 불가 안내를 추가한다. 커뮤니티에는 현재 선택한 게임의 해시태그 텍스트와 복사 버튼을 추가하고, 클립보드 실패 시 텍스트를 유지한다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 7: 법률 초안 독립 페이지 추가

**Files:**
- Create: `public/terms.html`
- Create: `public/privacy.html`
- Create: `public/legal.css`
- Modify: `public/main.html`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `/terms.html`, `/privacy.html`

- [ ] **Step 1: 법률 페이지 실패 테스트 작성**

```javascript
test("푸터가 독립 법률 초안 문서로 연결된다", () => // 법률 연결 테스트
{ // 테스트 시작
    assert.match(mainHtml, /href="\/terms\.html"/); // 약관 주소 확인
    assert.match(mainHtml, /href="\/privacy\.html"/); // 방침 주소 확인
    assert.match(termsHtml, /운영 전 검토용 초안/); // 약관 초안 확인
    assert.match(privacyHtml, /운영 전 검토용 초안/); // 방침 초안 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: 독립 문서 누락으로 FAIL.

- [ ] **Step 3: 독립 문서 구현**

기존 확인 가능한 사이트 기능만 설명하는 짧은 초안 문서를 작성하고 푸터 링크를 변경한다. 법률 확정 정보와 사업자 정보를 추측하지 않는다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs`

Expected: PASS.

---

### Task 8: 모바일·접근성 보강

**Files:**
- Modify: `public/main.html`
- Modify: `public/site-experience.css`
- Modify: `public/privacy-consent.css`
- Modify: `tests/responsive-integration.test.mjs`
- Test: `tests/local-site-experience.test.mjs`

**Interfaces:**
- Produces: `.skip-link`, 44px 필터·행동 버튼, 단독 개인정보 설정 버튼 위치

- [ ] **Step 1: 접근성 실패 테스트 작성**

```javascript
test("메인 페이지가 본문 바로가기와 44px 조작 기준을 제공한다", () => // 접근성 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /class="skip-link"/); // 바로가기 확인
    assert.match(experienceCss, /min-height:\s*44px/); // 터치 높이 확인
}); // 테스트 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/local-site-experience.test.mjs tests/responsive-integration.test.mjs`

Expected: 바로가기와 단독 버튼 위치 누락으로 FAIL.

- [ ] **Step 3: 모바일·접근성 구현**

본문 바로가기, `main` 마운트, 포커스 표시, 히어로 대비, 44px 필터와 모바일 간격을 추가한다. 개인정보 설정 버튼의 오른쪽 위치를 `1rem`으로 변경한다.

- [ ] **Step 4: 집중 테스트 통과 확인**

Run: `node --test tests/local-site-experience.test.mjs tests/responsive-integration.test.mjs`

Expected: PASS.

---

### Task 9: 전체 검증과 문서 갱신

**Files:**
- Modify: `README.md`
- Modify: `TRANSFER-GUIDE.md`
- Test: `tests/*.test.mjs`

**Interfaces:**
- Produces: 로컬 기능과 검증 명령 설명

- [ ] **Step 1: 전체 자동 테스트 실행**

Run: `node --test tests/*.test.mjs`

Expected: 전체 PASS.

- [ ] **Step 2: TypeScript 검사 실행**

Run: `pnpm exec tsc --noEmit --incremental false`

Expected: 종료 코드 0.

- [ ] **Step 3: 운영 빌드 실행**

Run: `node node_modules/next/dist/bin/next build`

Expected: 종료 코드 0.

- [ ] **Step 4: HTTP 확인**

Run: `Invoke-WebRequest http://localhost:3000/main.html`, `Invoke-WebRequest http://localhost:3000/terms.html`, `Invoke-WebRequest http://localhost:3000/privacy.html`

Expected: 세 주소 모두 HTTP 200.

- [ ] **Step 5: 브라우저 화면 확인**

PC 1440×900, 태블릿 1024×768, 모바일 390×844에서 헤더, 히어로, 스튜디오 소개, 상태판, 보관함, FAQ와 푸터를 확인한다.

- [ ] **Step 6: 전달 문서 갱신**

README와 TRANSFER-GUIDE에 로컬 보관함, 법률 초안, 상담 비활성 상태와 기기 미리보기 주소를 기록한다.
