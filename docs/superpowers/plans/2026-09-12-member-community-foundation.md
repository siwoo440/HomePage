---

# DEVFORGE 일반 사용자·댓글 기반 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이메일·Google 로그인 준비 화면과 시연 세션, 뉴스 댓글·답글·반응·이미지·신고 화면, 향후 Supabase 연결용 데이터 정책을 구현한다.

**Architecture:** 로그인과 댓글 화면은 공급자와 무관한 도메인 규칙을 사용한다. Supabase가 없을 때는 비밀번호를 받지 않는 브라우저 세션 시연 모드로 동작하고, 실제 연결 뒤에는 동일한 화면에서 Supabase 인증·데이터를 사용하도록 경계를 분리한다.

**Tech Stack:** Next.js 16 App Router, React 19, Supabase SSR·Browser Client, 정적 HTML·ES Modules, PostgreSQL RLS, Node.js test runner

**Spec:** `docs/superpowers/specs/2026-09-12-member-community-foundation-design.md`

---

## 전역 제약

- 공용 헤더 작업 순서는 `문의하기 → 로그인`
- 로그인 주소는 `/login`
- 실제 비밀번호·인증 토큰을 시연 저장소에 저장 금지
- 시연 상태는 `sessionStorage`에 공개 프로필 표시 정보만 저장
- 시연 댓글은 새로고침 시 초기화되는 브라우저 메모리 데이터
- 답글 깊이는 한 단계
- 댓글 이미지는 JPEG, PNG, WebP, GIF와 5MB 이하 한 장
- 댓글 문자열의 HTML 직접 삽입 금지
- 실제 데이터 권한은 서버와 Supabase RLS에서 이중 검사
- 새 코드는 Allman 스타일과 각 줄의 짧은 한글 주석 유지
- `WORK-HANDOFF.md` 보존

---

### Task 1: 회원 모드와 시연 세션 규칙

**Files:**

- Create: `lib/members/config.ts`
- Create: `lib/members/demo-session.ts`
- Create: `tests/member-auth.test.mjs`

**Interfaces:**

- Produces: `getMemberMode(environment): "supabase" | "demo"`
- Produces: `MEMBER_DEMO_STORAGE_KEY`
- Produces: `createDemoMemberProfile(nowMs): DemoMemberProfile`
- Produces: `parseDemoMemberProfile(value): DemoMemberProfile | null`

- [ ] **Step 1: 실패하는 회원 모드 테스트 작성**

```javascript
test("Supabase 설정 여부에 따라 회원 모드를 선택한다", () => // 회원 모드 검증
{ // 테스트 시작
    assert.equal(getMemberMode({}), "demo"); // 시연 모드 확인
    assert.equal(getMemberMode({ NEXT_PUBLIC_SUPABASE_URL: "https://sample.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "key" }), "supabase"); // 서버 모드 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/member-auth.test.mjs`

Expected: 회원 설정 모듈 누락으로 실패

- [ ] **Step 3: 회원 모드와 공개 시연 프로필 구현**

```typescript
export function createDemoMemberProfile(nowMs: number): DemoMemberProfile // 시연 프로필 생성
{ // 함수 시작
    return { id: "demo-member", nickname: "시연 사용자", avatarUrl: null, createdAt: new Date(nowMs).toISOString(), demo: true }; // 공개 프로필 반환
} // 함수 끝
```

파서는 정확한 필드와 `demo: true`만 허용하고 이메일·비밀번호·토큰이 포함된 객체를 거부한다.

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/member-auth.test.mjs`

Expected: 회원 모드·시연 프로필 테스트 통과

- [ ] **Step 5: 작업 단위 저장**

```powershell
git add -- lib/members/config.ts lib/members/demo-session.ts tests/member-auth.test.mjs
git commit -m "feat: 일반 사용자 시연 세션 규칙 추가"
```

---

### Task 2: 로그인 화면과 공용 헤더 로그인 버튼

**Files:**

- Create: `app/login/page.tsx`
- Create: `app/login/member-login-form.tsx`
- Create: `app/login/login.module.css`
- Create: `app/auth/callback/route.ts`
- Create: `public/member-session.mjs`
- Modify: `public/main.html`
- Modify: `public/goods.html`
- Modify: `public/devlog.html`
- Modify: `public/community.html`
- Modify: `public/devlog.css`
- Modify: `public/goods.css`
- Modify: `public/community.css`
- Test: `tests/member-ui.test.mjs`

**Interfaces:**

- Consumes: `getMemberMode`, `MEMBER_DEMO_STORAGE_KEY`, `createDemoMemberProfile`
- Produces: `/login`, `/auth/callback`, `initializeMemberAction(root, storage)`

- [ ] **Step 1: 실패하는 헤더·로그인 화면 테스트 작성**

```javascript
test("공용 헤더는 문의하기 다음에 로그인 버튼을 제공한다", async () => // 헤더 순서 검증
{ // 테스트 시작
    for (const path of ["main.html", "goods.html", "devlog.html", "community.html"]) // 공용 화면 순회
    { // 반복 시작
        const html = await readPublic(path); // 문서 읽기
        assert.match(html, /문의하기[\s\S]*href="\/login"[^>]*data-member-action/); // 버튼 순서 확인
    } // 반복 끝
}); // 테스트 끝
```

로그인 화면 테스트는 이메일·Google 진입점, 시연 모드 안내, 실제 비밀번호 미저장을 검증한다.

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/member-ui.test.mjs`

Expected: `/login` 화면과 헤더 로그인 링크 누락으로 실패

- [ ] **Step 3: 로그인 화면 구현**

Supabase 모드에서는 기존 브라우저 클라이언트로 이메일 로그인을 수행하고 Google OAuth 복귀 주소는 `/auth/callback?returnTo=/main.html`을 사용한다. 시연 모드에서는 비밀번호 입력을 렌더링하지 않고 다음 동작만 제공한다.

```typescript
function startDemoSession() // 시연 세션 시작
{ // 함수 시작
    const profile = createDemoMemberProfile(Date.now()); // 공개 프로필 생성
    sessionStorage.setItem(MEMBER_DEMO_STORAGE_KEY, JSON.stringify(profile)); // 브라우저 세션 저장
    window.location.assign(returnTo); // 안전 주소 이동
} // 함수 끝
```

- [ ] **Step 4: 헤더 순서와 세션 표시 구현**

네 공용 헤더에서 기존 문의 버튼을 유지하고 바로 뒤에 다음 링크를 추가한다.

```html
<a class="btn-nav member-login-link" href="/login" data-member-action>로그인</a> <!-- 일반 사용자 로그인 -->
```

`member-session.mjs`는 유효한 시연 프로필이 있으면 링크 문구를 `시연 사용자`로 바꾸되 권한 판단에는 사용하지 않는다.

- [ ] **Step 5: 통과 확인**

Run: `node --test tests/member-ui.test.mjs tests/root-layout.test.mjs`

Expected: 헤더·로그인 화면 계약 통과

- [ ] **Step 6: 작업 단위 저장**

```powershell
git add -- app/login app/auth/callback public/member-session.mjs public/main.html public/goods.html public/devlog.html public/community.html public/devlog.css public/goods.css public/community.css tests/member-ui.test.mjs
git commit -m "feat: 일반 사용자 로그인 진입 화면 추가"
```

---

### Task 3: 임시 뉴스 상세 연결

**Files:**

- Create: `lib/news/demo-posts.ts`
- Modify: `app/news/[id]/page.tsx`
- Modify: `public/devlog.html`
- Test: `tests/demo-news-detail.test.mjs`

**Interfaces:**

- Produces: `DEMO_NEWS_POSTS`
- Produces: `resolveDemoNewsPost(id): DemoNewsPost | null`
- Produces: `/news/echo-void-v08`, `/news/star-vagrant-generation`, `/news/neon-pulse-213`, `/news/blade-rift-parry`

- [ ] **Step 1: 실패하는 시연 뉴스 테스트 작성**

```javascript
test("임시 뉴스 네 개가 고유 상세 경로를 가진다", () => // 시연 상세 검증
{ // 테스트 시작
    assert.equal(DEMO_NEWS_POSTS.length, 4); // 시연 뉴스 수 확인
    assert.equal(resolveDemoNewsPost("echo-void-v08")?.title, "에코 보이드 v0.8 — 음향 엔진 전면 재설계 완료"); // 첫 상세 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/demo-news-detail.test.mjs`

Expected: 시연 뉴스 모듈 누락으로 실패

- [ ] **Step 3: 시연 뉴스 데이터와 상세 조회 구현**

`NewsDetailPage`는 먼저 시연 식별자를 확인한다. 시연 글이면 Supabase 설정과 무관하게 표시하고, 그 외 식별자는 기존 공개 Supabase 조회를 유지한다.

- [ ] **Step 4: 정적 뉴스 행을 상세 링크로 변경**

각 `article.news-row`를 같은 구조의 `a.news-row.news-row-link`로 변경하고 네 고유 경로를 연결한다.

- [ ] **Step 5: 통과 확인**

Run: `node --test tests/demo-news-detail.test.mjs tests/development-news.test.mjs`

Expected: 시연 상세와 기존 뉴스 필터 통과

- [ ] **Step 6: 작업 단위 저장**

```powershell
git add -- lib/news/demo-posts.ts app/news/[id]/page.tsx public/devlog.html tests/demo-news-detail.test.mjs
git commit -m "feat: 임시 개발 뉴스 상세 경로 추가"
```

---

### Task 4: 댓글 도메인 규칙과 시연 데이터

**Files:**

- Create: `lib/comments/types.ts`
- Create: `lib/comments/validation.ts`
- Create: `lib/comments/demo-comments.ts`
- Test: `tests/comments-domain.test.mjs`

**Interfaces:**

- Produces: `COMMENT_REACTION_TYPES`
- Produces: `validateCommentContent(value): ValidationResult<string>`
- Produces: `validateCommentImage(file): ValidationResult<File | null>`
- Produces: `createDemoComments(newsId): CommentView[]`
- Produces: `toggleReaction(comment, reaction, memberId): CommentView`

- [ ] **Step 1: 실패하는 댓글 규칙 테스트 작성**

```javascript
test("댓글은 공백과 2000자 초과 내용을 거부한다", () => // 댓글 본문 검증
{ // 테스트 시작
    assert.equal(validateCommentContent("   ").ok, false); // 공백 거부
    assert.equal(validateCommentContent("가".repeat(2001)).ok, false); // 길이 초과 거부
    assert.deepEqual(validateCommentContent("  좋은 업데이트네요.  "), { ok: true, value: "좋은 업데이트네요." }); // 정상 정리
}); // 테스트 끝
```

이미지 형식·5MB 경계, 한 단계 답글, 반응 추가·취소를 각각 검증한다.

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/comments-domain.test.mjs`

Expected: 댓글 규칙 모듈 누락으로 실패

- [ ] **Step 3: 댓글 규칙과 시연 댓글 구현**

허용 반응은 `like`, `cheer`, `curious` 세 종류다. 시연 댓글은 고정 식별자와 상대적이지 않은 ISO 시각을 사용한다. 사용자 입력은 문자열로만 보관한다.

- [ ] **Step 4: 통과 확인**

Run: `node --test tests/comments-domain.test.mjs`

Expected: 본문·이미지·답글·반응 규칙 통과

- [ ] **Step 5: 작업 단위 저장**

```powershell
git add -- lib/comments tests/comments-domain.test.mjs
git commit -m "feat: 댓글과 반응 도메인 규칙 추가"
```

---

### Task 5: 뉴스 댓글·답글·반응·이미지·신고 화면

**Files:**

- Create: `app/news/[id]/comments-panel.tsx`
- Create: `app/news/[id]/comments-panel.module.css`
- Modify: `app/news/[id]/page.tsx`
- Modify: `app/news/[id]/news-detail.module.css`
- Test: `tests/comments-ui.test.mjs`

**Interfaces:**

- Consumes: 댓글 도메인 규칙과 시연 회원 저장 키
- Produces: `CommentsPanel({ newsId, demoMode })`

- [ ] **Step 1: 실패하는 댓글 화면 계약 테스트 작성**

테스트는 댓글 제목, 입력기, 답글, 세 반응 버튼, 이미지 입력, 신고 사유 다섯 개, 로그인 안내, 시연 모드 배지를 검증한다.

```javascript
test("댓글 화면은 작성과 안전 관리 기능을 함께 제공한다", async () => // 댓글 화면 계약
{ // 테스트 시작
    const source = await readAppFile("app/news/[id]/comments-panel.tsx"); // 댓글 화면 읽기
    assert.match(source, /댓글 작성/); // 작성 기능 확인
    assert.match(source, /답글/); // 답글 기능 확인
    assert.match(source, /스팸/); // 신고 기능 확인
    assert.match(source, /image\/jpeg/); // 이미지 제한 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/comments-ui.test.mjs`

Expected: 댓글 화면 파일 누락으로 실패

- [ ] **Step 3: 시연 댓글 상호작용 구현**

시연 세션이 없으면 입력을 잠그고 `/login?returnTo=<현재 뉴스>` 링크를 표시한다. 시연 세션이 있으면 댓글과 답글을 메모리 목록에 추가하고, 이미지에는 `URL.createObjectURL` 미리보기만 사용한다.

- [ ] **Step 4: 반응과 신고 화면 구현**

반응은 현재 사용자 기준으로 추가·취소한다. 신고 버튼은 사유 선택 영역을 열고 접수 뒤 같은 댓글의 버튼을 비활성화한다. 시연 신고는 서버로 전송하지 않는다.

- [ ] **Step 5: 뉴스 상세에 댓글 화면 연결**

시연 뉴스는 `demoMode={true}`, Supabase 뉴스는 현재 설정 여부를 기준으로 댓글 화면을 렌더링한다.

- [ ] **Step 6: 통과 확인**

Run: `node --test tests/comments-ui.test.mjs tests/demo-news-detail.test.mjs`

Expected: 댓글 화면과 뉴스 상세 연결 통과

- [ ] **Step 7: 작업 단위 저장**

```powershell
git add -- app/news/[id]/comments-panel.tsx app/news/[id]/comments-panel.module.css app/news/[id]/page.tsx app/news/[id]/news-detail.module.css tests/comments-ui.test.mjs
git commit -m "feat: 개발 뉴스 댓글 시연 화면 추가"
```

---

### Task 6: Supabase 댓글·신고·운영 정책

**Files:**

- Create: `supabase/migrations/202609120001_member_comments.sql`
- Create: `tests/member-comments-config.test.mjs`

**Interfaces:**

- Produces: `member_profiles`, `news_comments`, `comment_reactions`, `comment_reports`, `moderation_actions`
- Produces: `comment-images` Storage 버킷
- Produces: 공개 읽기·본인 쓰기·관리자 운영 RLS 정책

- [ ] **Step 1: 실패하는 데이터 정책 테스트 작성**

```javascript
test("댓글과 신고 테이블에 소유권과 관리자 정책이 있다", async () => // 데이터 정책 검증
{ // 테스트 시작
    const sql = await readMigration(); // 정책 문서 읽기
    assert.match(sql, /create table public\.news_comments/i); // 댓글 테이블 확인
    assert.match(sql, /auth\.uid\(\) = author_id/i); // 본인 권한 확인
    assert.match(sql, /public\.is_admin\(\)/i); // 관리자 권한 확인
}); // 테스트 끝
```

- [ ] **Step 2: 실패 확인**

Run: `node --test tests/member-comments-config.test.mjs`

Expected: 댓글 마이그레이션 누락으로 실패

- [ ] **Step 3: 테이블·인덱스·제약 구현**

댓글 본문 1~2000자, 답글 부모와 같은 뉴스, 반응 종류 세 개, 사용자별 반응·신고 중복 금지, 상태 열거 제약을 SQL로 정의한다.

- [ ] **Step 4: Storage와 RLS 구현**

댓글 이미지 버킷은 5MB와 네 MIME 형식을 제한한다. 공개 댓글 이미지는 읽기 가능하고 작성자는 자신의 폴더만 쓰며 관리자는 신고 자료를 검토할 수 있게 한다.

- [ ] **Step 5: 통과 확인**

Run: `node --test tests/member-comments-config.test.mjs tests/admin-products-config.test.mjs`

Expected: 댓글 정책과 기존 관리자 정책 통과

- [ ] **Step 6: 작업 단위 저장**

```powershell
git add -- supabase/migrations/202609120001_member_comments.sql tests/member-comments-config.test.mjs
git commit -m "feat: 회원 댓글과 신고 데이터 정책 추가"
```

---

### Task 7: 전체 회귀 검증과 master 반영

**Files:**

- Verify: 전체 변경 파일

**Interfaces:**

- Consumes: Tasks 1~6 전체 결과
- Produces: 기존 기능을 유지하는 일반 사용자·댓글 기반

- [ ] **Step 1: 전체 테스트 실행**

Run: `node --test tests/*.test.mjs`

Expected: 실패 0개

- [ ] **Step 2: TypeScript 검사 실행**

Run: `node_modules/.bin/tsc --noEmit`

Expected: 오류 없이 종료

- [ ] **Step 3: 운영 빌드 실행**

Run: `node_modules/.bin/next build`

Expected: `/login`, `/auth/callback`, `/news/[id]` 포함 빌드 성공

- [ ] **Step 4: 브라우저 확인**

- 메인 헤더에서 문의하기 왼쪽·로그인 오른쪽 배치 확인
- 로그인 시연 모드 진입 확인
- 임시 뉴스 상세 이동 확인
- 댓글 작성·답글·반응·이미지 미리보기·신고 확인
- 모바일 너비에서 헤더와 댓글 입력기 잘림 없음 확인

- [ ] **Step 5: 작업 상태 확인**

Run: `git status --short`

Expected: `WORK-HANDOFF.md` 외 의도하지 않은 변경 없음

- [ ] **Step 6: 검증된 기능을 master에 병합**

기능 브랜치를 로컬 `master`에 빠른 병합하고 병합 결과에서 전체 테스트를 다시 실행한다. 성공 후 작업 트리와 기능 브랜치를 정리한다.
