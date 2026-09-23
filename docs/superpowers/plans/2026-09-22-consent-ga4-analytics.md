# Consent-Based GA4 Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이용자 분석 동의 전에는 외부 분석 요청을 만들지 않고, 동의 후에만 GA4 핵심 행동 이벤트를 안전하게 전송하는 1단계 분석 기반 구축

**Architecture:** 공개 정적 페이지와 Next.js 화면이 같은 브라우저 동의 저장소와 지연 로더를 공유한다. 순수 함수와 브라우저 연결을 분리해 Node 테스트에서 동의 검증, 이벤트 허용 목록, 민감 정보 차단을 확인한다.

**Tech Stack:** JavaScript ES modules, Next.js 16, React 19, Node.js test runner, Google Analytics 4

**Spec:** `docs/superpowers/specs/2026-09-22-consent-ga4-analytics-design.md`

## Global Constraints

- 코드는 Allman 스타일을 사용한다.
- 새 코드의 각 줄에는 짧은 한글 명사형 주석을 둔다.
- 동의 전에는 GA4 스크립트 자체를 삽입하지 않는다.
- GA4 측정 ID가 비어 있으면 외부 요청 없이 정지한다.
- 허용 목록 밖 이벤트와 민감 매개변수는 전송하지 않는다.
- 기존 필수 사이트 기능은 동의 거부와 무관하게 유지한다.

## Review Focus

- 손상되거나 이전 버전인 동의 JSON은 미동의 상태로 복구
- 같은 페이지에서 초기화가 반복되어도 GA4 스크립트 한 번만 생성
- 유효하지 않은 `G-` 측정 ID는 로드 차단
- 허용 이벤트에 민감 키가 섞여도 민감 값 제거
- 동의 철회 직후 이후 이벤트 전송 중단

---

### Task 1: 동의 상태와 설정 화면

**Files:**
- Create: `public/privacy-consent.mjs`
- Create: `public/privacy-consent.css`
- Test: `tests/privacy-consent.test.mjs`

**Interfaces:**
- Consumes: 브라우저 `localStorage`, `document`, `CustomEvent`
- Produces: `readPrivacyConsent(storage)`, `writePrivacyConsent(choice, storage)`, `hasAnalyticsConsent(storage)`, `initializePrivacyConsent(root, storage)`

- [ ] **Step 1: 실패 테스트 작성**

```javascript
test("손상된 동의 값은 미동의 상태로 처리한다", () => // 손상 값 테스트
{ // 테스트 시작
    assert.equal(readPrivacyConsent(createStorage("broken")), null); // 미동의 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/privacy-consent.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: 최소 구현과 배너 스타일 작성**

```javascript
export function hasAnalyticsConsent(storage = window.localStorage) // 분석 동의 확인
{ // 함수 시작
    return readPrivacyConsent(storage)?.analytics === true; // 동의 결과 반환
} // 함수 끝
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `node --test tests/privacy-consent.test.mjs`

Expected: 모든 동의 테스트 통과

- [ ] **Step 5: 커밋**

Run: `git add public/privacy-consent.mjs public/privacy-consent.css tests/privacy-consent.test.mjs && git commit -m "feat: add privacy consent foundation"`

### Task 2: GA4 지연 로더와 안전한 이벤트 규격

**Files:**
- Create: `public/analytics-config.mjs`
- Create: `public/site-analytics.mjs`
- Test: `tests/site-analytics.test.mjs`

**Interfaces:**
- Consumes: `hasAnalyticsConsent(storage)`, `devforge:privacy-consent-changed` 이벤트, `GA_MEASUREMENT_ID`
- Produces: `isValidMeasurementId(value)`, `sanitizeAnalyticsParams(params)`, `createAnalyticsRuntime(options)`, `trackSiteEvent(name, params)`

- [ ] **Step 1: 실패 테스트 작성**

```javascript
test("민감한 분석 매개변수를 제거한다", () => // 민감 정보 테스트
{ // 테스트 시작
    const result = sanitizeAnalyticsParams({ item_id: "project-eta", email: "user@example.com" }); // 매개변수 정리
    assert.deepEqual(result, { item_id: "project-eta" }); // 허용 값 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/site-analytics.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: 로더와 이벤트 최소 구현**

```javascript
export function isValidMeasurementId(value) // 측정 ID 확인
{ // 함수 시작
    return /^G-[A-Z0-9]{6,20}$/.test(value); // 형식 결과 반환
} // 함수 끝
```

- [ ] **Step 4: 단위 테스트 통과 확인**

Run: `node --test tests/site-analytics.test.mjs`

Expected: 측정 ID, 중복 로드, 동의 철회, 이벤트 정리 테스트 통과

- [ ] **Step 5: 커밋**

Run: `git add public/analytics-config.mjs public/site-analytics.mjs tests/site-analytics.test.mjs && git commit -m "feat: add consent gated ga4 runtime"`

### Task 3: 사이트 전체 연결과 기존 분석 정리

**Files:**
- Modify: `app/layout.tsx`
- Modify: `public/**/*.html`
- Modify: `tests/site-integrity.test.mjs`
- Create: `tests/analytics-integration.test.mjs`

**Interfaces:**
- Consumes: `/privacy-consent.mjs`, `/site-analytics.mjs`, `data-analytics-event`
- Produces: 모든 공개 HTML과 Next.js 화면의 공통 동의·분석 초기화

- [ ] **Step 1: 실패 통합 테스트 작성**

```javascript
test("모든 공개 HTML은 공통 동의 모듈을 불러온다", async () => // 전체 연결 테스트
{ // 테스트 시작
    const pages = await listPublicHtmlFiles(); // 공개 문서 목록
    assert.equal(pages.every(hasConsentScripts), true); // 공통 연결 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/analytics-integration.test.mjs`

Expected: 공통 스크립트가 없는 HTML 목록과 함께 실패

- [ ] **Step 3: HTML과 Next.js 연결**

```tsx
<script type="module" src="/privacy-consent.mjs"></script> {/* 동의 화면 연결 */}
<script type="module" src="/site-analytics.mjs"></script> {/* 분석 도구 연결 */}
```

- [ ] **Step 4: Vercel Analytics 제거와 핵심 링크 이벤트 속성 추가**

Run: `rg -n "@vercel/analytics|data-analytics-event" app public`

Expected: Vercel Analytics 사용 없음, 핵심 링크에 허용 이벤트 속성 존재

- [ ] **Step 5: 통합 테스트 통과 확인**

Run: `node --test tests/analytics-integration.test.mjs tests/site-integrity.test.mjs`

Expected: 모든 통합 테스트 통과

- [ ] **Step 6: 커밋**

Run: `git add app/layout.tsx public tests/analytics-integration.test.mjs tests/site-integrity.test.mjs && git commit -m "feat: connect consent analytics across site"`

### Task 4: 전체 검증과 운영 설정 문서화

**Files:**
- Modify: `README.md`
- Test: `tests/*.test.mjs`

**Interfaces:**
- Consumes: 1~3 작업의 동의·분석 모듈
- Produces: 측정 ID 설정법, 동의 검증법, 전체 품질 확인 결과

- [ ] **Step 1: README 운영 절차 추가**

```javascript
export const GA_MEASUREMENT_ID = ""; // 운영 측정 ID 자리
```

- [ ] **Step 2: 전체 테스트 실행**

Run: `pnpm test`

Expected: 전체 테스트 통과

- [ ] **Step 3: TypeScript 검사 실행**

Run: `pnpm exec tsc --noEmit`

Expected: 종료 코드 0

- [ ] **Step 4: 프로덕션 빌드 실행**

Run: `pnpm build`

Expected: Next.js 프로덕션 빌드 성공

- [ ] **Step 5: 최종 커밋**

Run: `git add README.md docs/superpowers/specs/2026-09-22-consent-ga4-analytics-design.md docs/superpowers/plans/2026-09-22-consent-ga4-analytics.md .gitignore && git commit -m "docs: add consent analytics rollout plan"`
