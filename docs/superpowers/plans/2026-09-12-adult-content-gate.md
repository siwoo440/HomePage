---

# DEVFORGE 성인 콘텐츠 접근 제한 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 H, U, V의 실제 이미지와 상세 자료를 인증 전에는 전달하지 않고, 개발용 만 19세 자기 확인 후 12시간 동안만 열람하게 만든다.

**Architecture:** 서버의 단일 성인 게임 허용 목록과 HMAC 서명 쿠키를 기준으로 프록시가 상세 HTML·내부 자료·원본 대표 이미지 요청을 차단한다. 메인과 커뮤니티는 초기 HTML에서 실제 이미지를 사용하지 않고 안전한 모자이크 SVG를 표시하며, 서버 상태 API가 인증을 확인한 뒤에만 원본 이미지 요청을 시작한다.

**Tech Stack:** Next.js 16 Proxy·Route Handlers, React 19, Web Crypto HMAC-SHA-256, 정적 HTML·CSS·ES Modules, Node.js test runner

**Spec:** `docs/superpowers/specs/2026-09-12-adult-content-gate-design.md`

---

## Global Constraints

- 성인 게임은 프로젝트 H, U, V 세 개로 고정
- 인증 유효시간은 12시간
- 생년월일은 저장·기록·쿠키 포함 금지
- 쿠키는 `HttpOnly`, `SameSite=Lax`, 운영 환경 `Secure`
- 운영 환경의 `AGE_GATE_SECRET` 누락 시 실패 닫힘 처리
- 인증 전 실제 성인 게임 이미지 URL을 `src`에 포함 금지
- 보호 콘텐츠 응답은 `Cache-Control: private, no-store`
- 외부 주소와 `//`로 시작하는 복귀 주소 거부
- 개발용 자기 확인을 실제 본인인증으로 표현 금지
- 새 코드 Allman 스타일과 각 줄의 짧은 한글 주석 유지
- 기존 `WORK-HANDOFF.md`와 관계없는 사용자 변경 보존

---

## 파일 구조

- `lib/age-gate/config.ts`: 성인 게임과 보호 경로 단일 설정
- `lib/age-gate/verification.ts`: 생년월일 계산, 복귀 주소, HMAC 쿠키 생성·검증
- `lib/age-gate/request.ts`: 인증 요청을 HTTP와 분리해 검증하는 순수 처리 함수
- `app/api/age/verify/route.ts`: 인증 쿠키 발급 API
- `app/api/age/status/route.ts`: 현재 인증 여부 API
- `app/age-verification/page.tsx`: 성인 확인 페이지
- `app/age-verification/age-verification-form.tsx`: 생년월일 입력과 오류 처리
- `app/age-verification/age-verification.module.css`: DEVFORGE 성인 확인 화면 스타일
- `proxy.ts`: 관리자 세션 갱신과 성인 경로 보호 조합
- `public/images/games/age-restricted.svg`: 실제 게임 정보를 포함하지 않는 모자이크 대체 화면
- `public/age-gate.mjs`: 메인 카드의 인증 상태와 이미지 전환
- `public/main.html`: H, U, V 카드의 안전한 초기 마크업
- `public/community-data.mjs`: 성인 게임 시연 이미지 선택 규칙
- `public/community.mjs`: 커뮤니티 인증 상태 조회와 안전한 렌더링
- `tests/age-gate.test.mjs`: 나이·쿠키·경로 단위 검사
- `tests/age-gate-api.test.mjs`: 인증 요청 결과와 API 계약 검사
- `tests/age-gate-proxy.test.mjs`: 직접 경로 차단 계약 검사
- `tests/age-gate-ui.test.mjs`: 메인·커뮤니티 모자이크 회귀 검사

---

### Task 1: 성인 게임 설정과 서명 쿠키 규칙

**Files:**

- Create: `lib/age-gate/config.ts`
- Create: `lib/age-gate/verification.ts`
- Create: `tests/age-gate.test.mjs`
- Modify: `.env.example`

**Interfaces:**

- Produces: `ADULT_GAMES`, `isAdultGameId(gameId: string): boolean`, `isProtectedAdultPath(pathname: string): boolean`
- Produces: `AGE_GATE_COOKIE_NAME`, `AGE_GATE_MAX_AGE_SECONDS`, `AGE_GATE_MAX_AGE_MS`
- Produces: `isAdultBirthDate(birthDate: string, today: Date): boolean`
- Produces: `sanitizeAgeReturnTo(value: string | null): string`
- Produces: `createAgeVerificationToken(nowMs: number, secret: string): Promise<string>`
- Produces: `verifyAgeVerificationToken(token: string | undefined, nowMs: number, secret: string): Promise<boolean>`
- Produces: `resolveAgeGateSecret(nodeEnv: string | undefined, configuredSecret: string | undefined): string | null`

- [ ] **Step 1: 실패하는 설정·나이·쿠키 테스트 작성**

```javascript
test("성인 게임과 보호 경로를 정확히 판정한다", () => // 보호 목록 검증
{ // 테스트 시작
    assert.equal(isAdultGameId("project-h"), true); // H 판정 확인
    assert.equal(isAdultGameId("project-u"), true); // U 판정 확인
    assert.equal(isAdultGameId("project-v"), true); // V 판정 확인
    assert.equal(isAdultGameId("project-a"), false); // 일반 게임 확인
    assert.equal(isProtectedAdultPath("/project_h/ProjectH_Main.html"), true); // 상세 경로 확인
    assert.equal(isProtectedAdultPath("/images/games/project-h.png"), true); // 원본 이미지 확인
}); // 테스트 끝

test("생년월일로 만 19세를 계산한다", () => // 연령 경계 검증
{ // 테스트 시작
    const today = new Date("2026-09-12T00:00:00.000Z"); // 기준 날짜
    assert.equal(isAdultBirthDate("2007-09-12", today), true); // 생일 지난 성인 확인
    assert.equal(isAdultBirthDate("2007-09-13", today), false); // 생일 전 미성년 확인
    assert.equal(isAdultBirthDate("잘못된값", today), false); // 잘못된 날짜 확인
}); // 테스트 끝

test("서명 쿠키의 정상·위조·만료를 판정한다", async () => // 쿠키 검증
{ // 테스트 시작
    const token = await createAgeVerificationToken(1000, "test-secret"); // 정상 토큰 생성
    assert.equal(await verifyAgeVerificationToken(token, 1001, "test-secret"), true); // 정상 토큰 확인
    assert.equal(await verifyAgeVerificationToken(`${token}x`, 1001, "test-secret"), false); // 위조 토큰 확인
    assert.equal(await verifyAgeVerificationToken(token, 1000 + AGE_GATE_MAX_AGE_MS + 1, "test-secret"), false); // 만료 토큰 확인
}); // 테스트 끝
```

- [ ] **Step 2: 단위 테스트 실패 확인**

Run: `node --test tests/age-gate.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` 또는 내보낸 함수 누락으로 실패

- [ ] **Step 3: 성인 게임 단일 설정 구현**

```typescript
export const ADULT_GAMES = Object.freeze( // 성인 게임 목록
[ // 목록 시작
    { id: "project-h", directory: "/project_h/", imagePath: "/images/games/project-h.png" }, // 프로젝트 H
    { id: "project-u", directory: "/project_u/", imagePath: "/images/games/project-u.png" }, // 프로젝트 U
    { id: "project-v", directory: "/project_v/", imagePath: "/images/games/project-v.png" }, // 프로젝트 V
]); // 목록 끝
```

- [ ] **Step 4: 나이 계산·복귀 주소·HMAC 토큰 구현**

```typescript
export function sanitizeAgeReturnTo(value: string | null): string // 복귀 주소 정리
{ // 함수 시작
    if (!value || !value.startsWith("/") || value.startsWith("//") || /[\u0000-\u001f]/.test(value)) // 위험 주소 확인
    { // 조건 시작
        return "/main.html#games"; // 안전한 기본 주소
    } // 조건 끝
    return value; // 내부 주소 반환
} // 함수 끝

export function resolveAgeGateSecret(nodeEnv: string | undefined, configuredSecret: string | undefined): string | null // 서명 키 선택
{ // 함수 시작
    if (configuredSecret?.trim()) // 설정 키 확인
    { // 조건 시작
        return configuredSecret.trim(); // 설정 키 반환
    } // 조건 끝
    return nodeEnv === "production" ? null : "devforge-local-age-gate-only"; // 개발 전용 키 반환
} // 함수 끝
```

HMAC 구현은 `crypto.subtle.importKey`, `crypto.subtle.sign`, `crypto.subtle.verify`를 사용하고 토큰을 `v1.{expiresAt}.{signature}` 형식으로 만든다.

- [ ] **Step 5: 환경 변수 예시 추가**

```dotenv
# 성인 확인 쿠키 서명 키 설정
AGE_GATE_SECRET=
```

- [ ] **Step 6: 단위 테스트 통과 확인**

Run: `node --test tests/age-gate.test.mjs`

Expected: 모든 성인 설정·날짜·서명 테스트 통과

- [ ] **Step 7: 작업 단위 저장**

```powershell
git add -- .env.example lib/age-gate/config.ts lib/age-gate/verification.ts tests/age-gate.test.mjs # 관련 파일 추가
git commit -m "feat: 성인 콘텐츠 인증 규칙 추가" # 작업 단위 저장
```

---

### Task 2: 인증 API와 성인 확인 화면

**Files:**

- Create: `lib/age-gate/request.ts`
- Create: `app/api/age/verify/route.ts`
- Create: `app/api/age/status/route.ts`
- Create: `app/age-verification/page.tsx`
- Create: `app/age-verification/age-verification-form.tsx`
- Create: `app/age-verification/age-verification.module.css`
- Create: `tests/age-gate-api.test.mjs`

**Interfaces:**

- Consumes: Task 1의 나이 계산·주소 정리·서명 토큰 함수
- Produces: `createAgeVerificationResult(input, now, secret)`
- Produces: `POST /api/age/verify`, `GET /api/age/status`, `/age-verification`

- [ ] **Step 1: 실패하는 인증 요청 테스트 작성**

```javascript
test("동의한 성인에게만 인증 결과를 제공한다", async () => // 인증 요청 검증
{ // 테스트 시작
    const adult = await createAgeVerificationResult({ birthDate: "2000-01-01", agreement: true, returnTo: "/project_h/ProjectH_Main.html" }, new Date("2026-09-12T00:00:00.000Z"), "test-secret"); // 성인 요청
    const minor = await createAgeVerificationResult({ birthDate: "2010-01-01", agreement: true, returnTo: "/project_h/ProjectH_Main.html" }, new Date("2026-09-12T00:00:00.000Z"), "test-secret"); // 미성년 요청
    assert.equal(adult.status, 200); // 성인 성공 확인
    assert.equal(typeof adult.token, "string"); // 토큰 발급 확인
    assert.equal(minor.status, 403); // 미성년 거부 확인
}); // 테스트 끝
```

- [ ] **Step 2: 인증 요청 테스트 실패 확인**

Run: `node --test tests/age-gate-api.test.mjs`

Expected: `createAgeVerificationResult` 누락으로 실패

- [ ] **Step 3: HTTP와 분리된 인증 요청 처리 구현**

```typescript
export interface AgeVerificationInput // 인증 입력 형식
{ // 형식 시작
    birthDate: unknown; // 생년월일 입력
    agreement: unknown; // 자기 확인 동의
    returnTo: unknown; // 복귀 주소 입력
} // 형식 끝

export async function createAgeVerificationResult(input: AgeVerificationInput, today: Date, secret: string | null): Promise<AgeVerificationResult> // 인증 결과 생성
{ // 함수 시작
    if (!secret) // 운영 키 누락 확인
    { // 조건 시작
        return { status: 503, message: "성인 확인 설정이 준비되지 않았습니다." }; // 설정 오류 반환
    } // 조건 끝
    if (input.agreement !== true || typeof input.birthDate !== "string" || !isAdultBirthDate(input.birthDate, today)) // 인증 조건 확인
    { // 조건 시작
        return { status: 403, message: "만 19세 이상만 열람할 수 있습니다." }; // 접근 거부 반환
    } // 조건 끝
    const token = await createAgeVerificationToken(today.getTime(), secret); // 서명 토큰 생성
    return { status: 200, message: "성인 확인이 완료되었습니다.", token, returnTo: sanitizeAgeReturnTo(typeof input.returnTo === "string" ? input.returnTo : null) }; // 성공 결과 반환
} // 함수 끝
```

- [ ] **Step 4: 인증 발급·상태 API 구현**

`POST /api/age/verify`는 JSON을 검사하고 성공 시 `devforge_age_verified` 쿠키를 43,200초로 발급한다. `GET /api/age/status`는 쿠키 검증 결과와 `Cache-Control: no-store`만 반환한다.

```typescript
response.cookies.set(AGE_GATE_COOKIE_NAME, result.token, // 인증 쿠키 발급
{ // 쿠키 설정 시작
    httpOnly: true, // 브라우저 스크립트 접근 차단
    sameSite: "lax", // 교차 사이트 요청 제한
    secure: process.env.NODE_ENV === "production", // 운영 보안 전송
    path: "/", // 전체 사이트 범위
    maxAge: AGE_GATE_MAX_AGE_SECONDS, // 12시간 만료
}); // 쿠키 설정 끝
```

- [ ] **Step 5: 성인 확인 화면과 입력 폼 구현**

폼은 `type="date"` 생년월일, 자기 확인 체크박스, 확인 버튼, 메인 복귀 링크를 제공한다. 제출 중 버튼 비활성화, 400·403·503 메시지 구분, 성공 시 서버가 반환한 내부 주소로 이동을 구현한다.

```tsx
<label className={styles.field}> {/* 생년월일 입력 묶음 */}
    <span>생년월일</span> {/* 입력 이름 */}
    <input type="date" name="birthDate" required /> {/* 날짜 입력 */}
</label> {/* 입력 묶음 끝 */}
<label className={styles.agreement}> {/* 자기 확인 동의 */}
    <input type="checkbox" name="agreement" required /> {/* 동의 입력 */}
    <span>만 19세 이상이며 개발용 자기 확인 방식임을 이해했습니다.</span> {/* 동의 문구 */}
</label> {/* 자기 확인 동의 끝 */}
```

- [ ] **Step 6: API와 화면 테스트 통과 확인**

Run: `node --test tests/age-gate-api.test.mjs`

Expected: 성인 성공, 미성년·미동의·잘못된 날짜·설정 누락 테스트 통과

- [ ] **Step 7: 작업 단위 저장**

```powershell
git add -- lib/age-gate/request.ts app/api/age app/age-verification tests/age-gate-api.test.mjs # 관련 파일 추가
git commit -m "feat: 개발용 성인 확인 화면과 API 추가" # 작업 단위 저장
```

---

### Task 3: 상세 페이지와 원본 자료 직접 접근 차단

**Files:**

- Modify: `proxy.ts`
- Create: `tests/age-gate-proxy.test.mjs`

**Interfaces:**

- Consumes: `isProtectedAdultPath`, `verifyAgeVerificationToken`, `resolveAgeGateSecret`
- Produces: 인증 전 리디렉션, 인증 후 `private, no-store` 응답

- [ ] **Step 1: 실패하는 직접 경로 보호 테스트 작성**

```javascript
test("프록시가 모든 성인 상세 경로와 원본 이미지를 검사한다", async () => // 프록시 범위 검증
{ // 테스트 시작
    const source = await readFile(new URL("../proxy.ts", import.meta.url), "utf8"); // 프록시 코드 읽기
    assert.match(source, /isProtectedAdultPath/); // 보호 경로 판정 확인
    assert.match(source, /verifyAgeVerificationToken/); // 서명 쿠키 검증 확인
    assert.match(source, /private, no-store/); // 보호 캐시 차단 확인
    assert.match(source, /project_h/); // H 경로 범위 확인
    assert.match(source, /project_u/); // U 경로 범위 확인
    assert.match(source, /project_v/); // V 경로 범위 확인
}); // 테스트 끝
```

- [ ] **Step 2: 프록시 테스트 실패 확인**

Run: `node --test tests/age-gate-proxy.test.mjs`

Expected: 성인 경로 검사 코드 누락으로 실패

- [ ] **Step 3: 기존 관리자 프록시와 성인 접근 검사 조합**

```typescript
export async function proxy(request: NextRequest) // 통합 요청 프록시
{ // 함수 시작
    if (isProtectedAdultPath(request.nextUrl.pathname)) // 성인 경로 확인
    { // 조건 시작
        return protectAdultRequest(request); // 성인 콘텐츠 검사 반환
    } // 조건 끝
    return updateSupabaseSession(request); // 기존 관리자 세션 갱신
} // 함수 끝
```

인증 전 리디렉션에는 현재 경로와 검색 문자열을 인코딩한 `returnTo`를 포함한다. 인증 후 `NextResponse.next()`에 `Cache-Control: private, no-store`를 넣는다.

- [ ] **Step 4: 프록시 matcher 확장**

```typescript
matcher: ["/admin/:path*", "/project_h/:path*", "/project_u/:path*", "/project_v/:path*", "/images/games/project-h.png", "/images/games/project-u.png", "/images/games/project-v.png"], // 보호 경로 범위
```

- [ ] **Step 5: 프록시 테스트와 관리자 회귀 테스트 실행**

Run: `node --test tests/age-gate-proxy.test.mjs tests/admin-auth.test.mjs`

Expected: 직접 경로 보호와 기존 관리자 인증 테스트 통과

- [ ] **Step 6: 로컬 HTTP 직접 접근 확인**

Run: `Invoke-WebRequest -MaximumRedirection 0 -UseBasicParsing http://127.0.0.1:3000/project_h/ProjectH_Main.html`

Expected: 인증 쿠키가 없을 때 `/age-verification` 위치가 포함된 리디렉션 응답

- [ ] **Step 7: 작업 단위 저장**

```powershell
git add -- proxy.ts tests/age-gate-proxy.test.mjs # 관련 파일 추가
git commit -m "feat: 성인 게임 직접 접근 차단" # 작업 단위 저장
```

---

### Task 4: 메인 게임 카드 모자이크와 인증 후 전환

**Files:**

- Create: `public/images/games/age-restricted.svg`
- Create: `public/age-gate.mjs`
- Modify: `public/main.html`
- Create: `tests/age-gate-ui.test.mjs`

**Interfaces:**

- Consumes: `GET /api/age/status`
- Produces: `[data-adult-game]`, `[data-adult-image]`, `refreshAdultGameVisibility()`

- [ ] **Step 1: 실패하는 메인 모자이크 테스트 작성**

```javascript
test("인증 전 메인 HTML은 성인 게임 원본을 요청하지 않는다", async () => // 초기 이미지 보호 검증
{ // 테스트 시작
    const html = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 문서 읽기
    for (const id of ["h", "u", "v"]) // 성인 게임 순회
    { // 반복 시작
        assert.match(html, new RegExp(`data-adult-game="project-${id}"`)); // 성인 카드 표시 확인
        assert.match(html, new RegExp(`src="images/games/age-restricted\\.svg"[^>]+data-adult-image="images/games/project-${id}\\.png`)); // 안전 이미지 확인
    } // 반복 끝
}); // 테스트 끝
```

- [ ] **Step 2: UI 테스트 실패 확인**

Run: `node --test tests/age-gate-ui.test.mjs`

Expected: 안전한 성인 카드 속성 누락으로 실패

- [ ] **Step 3: 실제 게임 정보를 포함하지 않는 모자이크 SVG 생성**

SVG는 어두운 픽셀 블록, 중앙 `19+`, `성인 확인 후 열람` 문구만 사용한다. H, U, V의 기존 이미지를 포함하거나 변형하지 않는다.

- [ ] **Step 4: H, U, V 초기 이미지와 카드 상태 교체**

```html
<div class="game-card adult-game-card reveal" data-adult-game="project-h" onclick="window.location.href='project_h/ProjectH_Main.html'"> <!-- 성인 게임 카드 -->
    <div class="game-thumb"> <!-- 대표 이미지 영역 -->
        <img class="game-thumb-img" src="images/games/age-restricted.svg" data-adult-image="images/games/project-h.png?v=20260909-2" alt="프로젝트 H 성인 확인 필요"> <!-- 안전한 초기 이미지 -->
        <div class="adult-lock-label"><strong>19+</strong><span>성인 확인 후 열람</span></div> <!-- 성인 제한 안내 -->
    </div> <!-- 대표 이미지 영역 끝 -->
</div> <!-- 성인 게임 카드 끝 -->
```

- [ ] **Step 5: 인증 상태에 따른 원본 이미지 요청 구현**

```javascript
export async function getAgeVerificationStatus(fetcher = fetch) // 인증 상태 조회
{ // 함수 시작
    try // 서버 조회 시도
    { // 시도 시작
        const response = await fetcher("/api/age/status", { cache: "no-store" }); // 상태 API 요청
        const data = await response.json(); // 응답 해석
        return response.ok && data.verified === true; // 검증 상태 반환
    } // 시도 끝
    catch // 조회 오류 처리
    { // 오류 처리 시작
        return false; // 모자이크 유지
    } // 오류 처리 끝
} // 함수 끝
```

인증 성공일 때만 `data-adult-image` 값을 `src`로 옮기고 카드에 `age-verified` 클래스를 추가한다. 실패하면 초기 모자이크를 유지한다.

- [ ] **Step 6: 메인 HTML에 모듈 연결과 모자이크 스타일 추가**

`adult-lock-label`은 이미지 중앙에 배치하고 인증 성공 후 숨긴다. 카드 키보드 이동과 기존 장르 필터 동작을 유지한다.

- [ ] **Step 7: UI 테스트 통과 확인**

Run: `node --test tests/age-gate-ui.test.mjs tests/site-integrity.test.mjs`

Expected: 초기 원본 미요청, 모자이크 표시, 기존 카드 연결 테스트 통과

- [ ] **Step 8: 첫 화면 브라우저 점검**

`http://127.0.0.1:3000/main.html#games`에서 H, U, V 카드의 모자이크·19+ 안내와 일반 게임 이미지 유지를 확인한다.

- [ ] **Step 9: 작업 단위 저장**

```powershell
git add -- public/images/games/age-restricted.svg public/age-gate.mjs public/main.html tests/age-gate-ui.test.mjs # 관련 파일 추가
git commit -m "feat: 성인 게임 카드 모자이크 추가" # 작업 단위 저장
```

---

### Task 5: 커뮤니티 성인 게임 이미지 보호

**Files:**

- Modify: `public/community-data.mjs`
- Modify: `public/community.mjs`
- Modify: `tests/age-gate-ui.test.mjs`
- Modify: `tests/community-page.test.mjs`

**Interfaces:**

- Consumes: `getAgeVerificationStatus`
- Produces: `ADULT_COMMUNITY_GAME_IDS`, `createDemoItems(gameId, ageVerified)`와 인증 전 모자이크 렌더링

- [ ] **Step 1: 실패하는 커뮤니티 이미지 보호 테스트 추가**

```javascript
test("커뮤니티 성인 게임은 인증 전 모자이크 이미지만 만든다", () => // 커뮤니티 이미지 보호 검증
{ // 테스트 시작
    const locked = createDemoItems("project-h", false); // 인증 전 항목 생성
    const unlocked = createDemoItems("project-h", true); // 인증 후 항목 생성
    assert.ok(locked.every((item) => item.thumbnailUrl === "images/games/age-restricted.svg")); // 모자이크 경로 확인
    assert.ok(unlocked.every((item) => item.thumbnailUrl === "images/games/project-h.png")); // 원본 경로 확인
}); // 테스트 끝
```

- [ ] **Step 2: 커뮤니티 테스트 실패 확인**

Run: `node --test tests/age-gate-ui.test.mjs tests/community-page.test.mjs`

Expected: `createDemoItems`의 인증 인자 누락으로 실패

- [ ] **Step 3: 커뮤니티 성인 게임 설정과 시연 항목 분기 구현**

```javascript
export const ADULT_COMMUNITY_GAME_IDS = Object.freeze(["project-h", "project-u", "project-v"]); // 화면 성인 게임 목록

export function createDemoItems(gameId, ageVerified = false) // 시연 콘텐츠 생성
{ // 함수 시작
    const selectedGame = COMMUNITY_GAMES.find((game) => game.id === gameId); // 선택 게임 조회
    const resolvedGameId = selectedGame?.id ?? "all"; // 화면 게임 식별자
    const gameLabel = selectedGame?.label ?? "전체 프로젝트"; // 화면 게임 이름
    const imageId = selectedGame?.id ?? "project-a"; // 화면 이미지 식별자
    const adultLocked = ADULT_COMMUNITY_GAME_IDS.includes(gameId) && !ageVerified; // 성인 잠금 판정
    const thumbnailUrl = adultLocked ? "images/games/age-restricted.svg" : `images/games/${imageId}.png`; // 안전한 이미지 선택
    return COMMUNITY_PLATFORMS.map((platform) => // 플랫폼별 항목 변환
    { // 변환 시작
        return { id: `demo-${platform.id}-${resolvedGameId}`, platform: platform.id, contentType: platform.contentType, gameId: resolvedGameId, title: `${gameLabel} · ${platform.headline}`, author: "DEVFORGE 시연 데이터", publishedAt: "연동 준비 중", url: "", thumbnailUrl, metrics: {}, description: platform.description, isDemo: true }; // 시연 항목 반환
    }); // 변환 끝
} // 함수 끝
```

- [ ] **Step 4: 커뮤니티 초기화 전에 인증 상태 조회**

커뮤니티 화면은 기본값 `false`로 먼저 모자이크를 렌더링한다. 상태 API가 `true`를 반환한 뒤에만 같은 선택 게임을 인증 상태로 다시 렌더링한다. API 실패 시 기존 모자이크를 유지한다.

- [ ] **Step 5: 커뮤니티와 UI 테스트 통과 확인**

Run: `node --test tests/age-gate-ui.test.mjs tests/community-page.test.mjs`

Expected: 인증 전 모자이크와 인증 후 원본 전환 테스트 통과

- [ ] **Step 6: 브라우저 커뮤니티 점검**

`community.html?game=project-h`에서 인증 전 모자이크가 표시되고, 일반 게임 선택 시 기존 대표 이미지가 표시되는지 확인한다.

- [ ] **Step 7: 작업 단위 저장**

```powershell
git add -- public/community-data.mjs public/community.mjs tests/age-gate-ui.test.mjs tests/community-page.test.mjs # 관련 파일 추가
git commit -m "feat: 커뮤니티 성인 게임 이미지 보호" # 작업 단위 저장
```

---

### Task 6: 통합 검증과 master 결합 준비

**Files:**

- Modify only if verification exposes a defect in the files above

**Interfaces:**

- Consumes: Tasks 1–5 전체 결과
- Produces: 검증된 성인 콘텐츠 접근 제한 기능

- [ ] **Step 1: 전체 자동 테스트 실행**

Run: `node --test tests/*.test.mjs`

Expected: 실패 0건

- [ ] **Step 2: TypeScript 검사 실행**

Run: `node node_modules/typescript/bin/tsc --noEmit`

Expected: 종료 코드 0

- [ ] **Step 3: 배포 빌드 실행**

Run: `node node_modules/next/dist/bin/next build`

Expected: 성인 확인 API·페이지와 기존 경로 전체 빌드 성공

- [ ] **Step 4: 인증 전 HTTP 접근 검사**

다음 경로가 모두 성인 확인 페이지로 이동하는지 확인한다.

- `/project_h/ProjectH_Main.html`
- `/project_u/ProjectU_Main.html`
- `/project_v/ProjectV_Main.html`
- `/project_h/images/`
- `/images/games/project-h.png`
- `/images/games/project-u.png`
- `/images/games/project-v.png`

- [ ] **Step 5: 브라우저 사용자 흐름 검사**

메인 모자이크 → 성인 확인 화면 → 잘못된 날짜 오류 → 성인 날짜 성공 → 원래 상세 페이지 복귀 → 메인과 커뮤니티 원본 이미지 전환 순서로 확인한다.

- [ ] **Step 6: 보호 콘텐츠 캐시 검사**

인증된 보호 HTML과 이미지 응답의 `Cache-Control`이 `private, no-store`인지 확인한다.

- [ ] **Step 7: 저장소 상태 검사**

Run: `git diff --check`와 `git status --short`

Expected: 공백 오류 없음, 사용자 `WORK-HANDOFF.md` 보존, 기능 관련 미저장 변경 없음

- [ ] **Step 8: 기능 브랜치 완료 처리**

`superpowers:verification-before-completion`으로 증거를 확인하고 `superpowers:finishing-a-development-branch` 절차에 따라 사용자가 선택한 방식으로 결합한다.
