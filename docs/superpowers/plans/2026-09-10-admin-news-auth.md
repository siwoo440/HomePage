---

# DEVFORGE 관리자 뉴스 인증 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관리자만 로그인하여 개발 뉴스를 작성·수정·삭제하고, 공개된 글을 기존 개발 뉴스 화면에서 조회할 수 있는 기반 구축

**Architecture:** Next.js 서버 컴포넌트와 서버 액션에서 Supabase 쿠키 세션을 확인하고, Supabase RLS에서 `app_metadata.role = admin`을 다시 검사한다. 기존 정적 개발 뉴스는 `/api/news`의 공개 게시물을 불러오되 Supabase 미설정이나 통신 실패 시 현재 임시 뉴스 네 개를 유지한다.

**Tech Stack:** Next.js 16, React 19, TypeScript, Supabase Auth, Supabase Postgres, Supabase Storage, Node Test Runner

**Spec:** `docs/superpowers/specs/2026-09-10-admin-news-auth-design.md`

---

## 전역 제약

- 관리자 이메일과 Supabase 비밀 키를 브라우저 코드에 포함하지 않음
- Supabase 서비스 역할 키를 사용하지 않음
- 관리자 판정에 수정 가능한 `user_metadata`를 사용하지 않음
- 서버의 `ADMIN_EMAIL`과 JWT의 `app_metadata.role`을 모두 확인
- 데이터베이스 테이블과 Storage에 RLS 적용
- 공개 목록에는 `published` 게시물만 노출
- 본문은 일반 텍스트로 저장하고 출력 시 HTML로 해석하지 않음
- 대표 이미지는 JPG, PNG, WebP 및 5MB 이하만 허용
- Supabase 미설정 상태에서도 기존 공개 뉴스 네 개 유지
- 코드 블록의 함수와 제어문은 Allman 스타일 적용
- 실행 가능한 JSON처럼 주석을 허용하지 않는 형식을 제외하고 신규 코드 각 줄에 짧은 한글 명사형 주석 적용
- 실제 Supabase 로그인·저장·업로드 완료 판정은 프로젝트 키 등록 후 수행

---

## 파일 구조

- `.env.example`: 로컬과 Vercel 환경 변수 이름 안내
- `supabase/migrations/202609100001_admin_news.sql`: 게시물, 관리자 정책, Storage 정책
- `lib/supabase/config.ts`: Supabase 설정 존재 여부 판정
- `lib/supabase/client.ts`: 브라우저 Supabase 클라이언트
- `lib/supabase/server.ts`: 쿠키 기반 서버 Supabase 클라이언트
- `lib/supabase/proxy.ts`: 세션 쿠키 갱신
- `lib/auth/admin.ts`: 관리자 권한 판정과 보호 함수
- `lib/news/validation.ts`: 게시물과 이미지 입력 검증
- `lib/news/types.ts`: 게시물과 폼 상태 타입
- `proxy.ts`: 관리자 요청의 인증 쿠키 갱신
- `app/admin/login/page.tsx`: 관리자 로그인 화면
- `app/admin/login/login-form.tsx`: 로그인 입력과 오류 처리
- `app/admin/news/new/page.tsx`: 보호된 새 글 화면
- `app/admin/news/[id]/edit/page.tsx`: 보호된 수정 화면
- `app/admin/news/news-editor.tsx`: 공용 글쓰기 편집기
- `app/admin/news/actions.ts`: 작성·수정·삭제·로그아웃 서버 액션
- `app/api/news/route.ts`: 공개 게시물 목록 API
- `app/news/[id]/page.tsx`: 공개 게시물 상세 화면
- `app/admin/admin.css`: 로그인과 글쓰기 화면 스타일
- `public/devlog.html`: 관리자 링크와 동적 목록 상태 영역
- `public/devlog.mjs`: 공개 API 조회, 기존 뉴스 대체, 태그 필터 재연결
- `public/devlog.css`: 로딩·오류·클릭 가능한 뉴스 스타일
- `tests/admin-news-config.test.mjs`: 환경 설정 판정 테스트
- `tests/admin-news-validation.test.mjs`: 입력 검증 테스트
- `tests/admin-news-contract.test.mjs`: 관리자·공개 경로와 SQL 보안 계약 테스트
- `tests/development-news.test.mjs`: 동적 뉴스와 기존 필터 회귀 테스트
- `README.md`: Supabase 생성과 로컬·Vercel 설정 순서

---

### 작업 1: 의존성과 환경 설정 경계

**Files:**

- Modify: `package.json`
- Create: `.env.example`
- Create: `lib/supabase/config.ts`
- Create: `tests/admin-news-config.test.mjs`

**Interfaces:**

- Produces: `getSupabasePublicConfig(): { url: string; publishableKey: string } | null`
- Produces: `isSupabaseConfigured(): boolean`

- [ ] **Step 1: 설정 누락과 정상 설정을 구분하는 실패 테스트 작성**

```javascript
import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { getSupabasePublicConfig } from "../lib/supabase/config.ts"; // 설정 판정 함수

test("Supabase 환경 변수가 없으면 null을 반환한다", () => // 설정 누락 검사
{ // 테스트 본문 시작
    assert.equal(getSupabasePublicConfig({}), null); // 누락 결과 검증
}); // 테스트 본문 끝

test("Supabase URL과 공개 키가 있으면 설정을 반환한다", () => // 정상 설정 검사
{ // 테스트 본문 시작
    const environment = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key" }; // 테스트 환경
    assert.deepEqual(getSupabasePublicConfig(environment), { url: environment.NEXT_PUBLIC_SUPABASE_URL, publishableKey: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }); // 정상 결과 검증
}); // 테스트 본문 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/admin-news-config.test.mjs`

Expected: `ERR_MODULE_NOT_FOUND` 또는 `getSupabasePublicConfig` 누락 실패

- [ ] **Step 3: Supabase 패키지와 테스트 명령 추가**

Run: `pnpm add @supabase/ssr @supabase/supabase-js`

Run: `pnpm pkg set scripts.test="node --test tests/*.test.mjs"`

- [ ] **Step 4: 최소 설정 판정 구현**

```typescript
type SupabaseEnvironment = Record<string, string | undefined>; // 환경 변수 집합

export function getSupabasePublicConfig(environment: SupabaseEnvironment = process.env) // 공개 설정 판정
{ // 함수 시작
    const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim(); // 프로젝트 주소
    const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(); // 공개 키

    if (!url || !publishableKey) // 설정 누락 확인
    { // 조건 시작
        return null; // 미설정 결과
    } // 조건 끝

    return { url, publishableKey }; // 정상 설정 반환
} // 함수 끝

export function isSupabaseConfigured() // 설정 여부 판정
{ // 함수 시작
    return getSupabasePublicConfig() !== null; // 설정 존재 결과
} // 함수 끝
```

- [ ] **Step 5: 환경 변수 예제 작성**

`.env.example`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `ADMIN_EMAIL` 세 항목과 설명 주석을 기록한다. 실제 값은 기록하지 않는다.

- [ ] **Step 6: 테스트 통과 확인**

Run: `node --test tests/admin-news-config.test.mjs`

Expected: 2 tests passed

- [ ] **Step 7: 작업 단위 커밋**

Run: `git add package.json pnpm-lock.yaml .env.example lib/supabase/config.ts tests/admin-news-config.test.mjs && git commit -m "feat: Supabase 설정 경계 추가"`

---

### 작업 2: 게시물 입력 검증

**Files:**

- Create: `lib/news/types.ts`
- Create: `lib/news/validation.ts`
- Create: `tests/admin-news-validation.test.mjs`

**Interfaces:**

- Produces: `NEWS_TAGS`, `NewsTag`, `NewsPostInput`, `NewsValidationResult`
- Produces: `validateNewsPost(input): NewsValidationResult`
- Produces: `validateCoverImage(file): string | null`

- [ ] **Step 1: 게시물과 이미지 검증 실패 테스트 작성**

```javascript
import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { validateCoverImage, validateNewsPost } from "../lib/news/validation.ts"; // 입력 검증 함수

test("빈 제목과 본문을 거부한다", () => // 필수 입력 검사
{ // 테스트 본문 시작
    const result = validateNewsPost({ title: " ", summary: "요약", content: " ", tags: ["update"], status: "draft" }); // 빈 입력 검증
    assert.deepEqual(result.errors, { title: "제목을 입력해 주세요.", content: "본문을 입력해 주세요." }); // 오류 결과 검증
}); // 테스트 본문 끝

test("허용되지 않은 태그를 거부한다", () => // 태그 허용 목록 검사
{ // 테스트 본문 시작
    const result = validateNewsPost({ title: "제목", summary: "요약", content: "본문", tags: ["unknown"], status: "published" }); // 잘못된 태그 검증
    assert.equal(result.errors.tags, "허용된 태그를 선택해 주세요."); // 태그 오류 검증
}); // 테스트 본문 끝

test("5MB 초과 이미지와 잘못된 형식을 거부한다", () => // 이미지 제한 검사
{ // 테스트 본문 시작
    assert.equal(validateCoverImage({ size: 5 * 1024 * 1024 + 1, type: "image/png" }), "이미지는 5MB 이하여야 합니다."); // 크기 제한 검증
    assert.equal(validateCoverImage({ size: 1024, type: "image/gif" }), "JPG, PNG, WebP 이미지만 사용할 수 있습니다."); // 형식 제한 검증
}); // 테스트 본문 끝
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/admin-news-validation.test.mjs`

Expected: 검증 모듈 누락 실패

- [ ] **Step 3: 최소 타입과 검증 함수 구현**

`NEWS_TAGS`를 `update`, `feature`, `devlog`, `fix`로 고정한다. 제목 120자, 요약 300자, 본문 50,000자 제한과 필수값, 상태값, 태그 허용 목록을 검사한다. `validateCoverImage`는 파일이 없으면 `null`, 허용되지 않은 MIME 형식 또는 5MB 초과 시 한국어 오류 문자열을 반환한다.

- [ ] **Step 4: 검증 테스트 통과 확인**

Run: `node --test tests/admin-news-validation.test.mjs`

Expected: 3 tests passed

- [ ] **Step 5: 작업 단위 커밋**

Run: `git add lib/news tests/admin-news-validation.test.mjs && git commit -m "feat: 개발 뉴스 입력 검증 추가"`

---

### 작업 3: 데이터베이스와 Storage 보안 정책

**Files:**

- Create: `supabase/migrations/202609100001_admin_news.sql`
- Create: `tests/admin-news-contract.test.mjs`

**Interfaces:**

- Produces: `public.news_posts` 테이블
- Produces: `public.is_admin()` RLS 보조 함수
- Produces: `news-images` 공개 읽기 버킷과 관리자 쓰기 정책

- [ ] **Step 1: SQL 보안 계약 실패 테스트 작성**

테스트는 마이그레이션 파일에 다음 계약이 모두 존재하는지 확인한다.

- `news_posts` RLS 활성화
- `anon`의 쓰기 권한 회수
- 공개된 행만 읽는 정책
- `auth.jwt()->'app_metadata'->>'role' = 'admin'` 관리자 검사
- 관리자 작성·수정·삭제 정책
- `news-images` 버킷의 MIME 형식과 5MB 제한
- Storage 관리자 작성·수정·삭제 정책

- [ ] **Step 2: 계약 테스트 실패 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: 마이그레이션 파일 누락 실패

- [ ] **Step 3: 마이그레이션 구현**

```sql
create table public.news_posts ( -- 뉴스 게시물 테이블
    id uuid primary key default gen_random_uuid(), -- 게시물 식별자
    title text not null check (char_length(title) between 1 and 120), -- 제목 제한
    summary text not null default '' check (char_length(summary) <= 300), -- 요약 제한
    content text not null check (char_length(content) between 1 and 50000), -- 본문 제한
    tags text[] not null default '{}', -- 태그 목록
    cover_image_path text, -- 이미지 경로
    status text not null check (status in ('draft', 'published')), -- 공개 상태
    author_id uuid not null references auth.users(id), -- 작성자 식별자
    created_at timestamptz not null default now(), -- 생성 시각
    updated_at timestamptz not null default now(), -- 수정 시각
    published_at timestamptz -- 공개 시각
); -- 테이블 끝

alter table public.news_posts enable row level security; -- 행 보안 활성화
revoke all on public.news_posts from anon, authenticated; -- 기본 권한 회수
grant select on public.news_posts to anon; -- 공개 읽기 권한
grant select, insert, update, delete on public.news_posts to authenticated; -- 로그인 사용자 기본 권한

create function public.is_admin() -- 관리자 판정 함수
returns boolean -- 판정 결과 형식
language sql -- SQL 함수 형식
stable -- 요청 중 안정 함수
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
    select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); -- 관리자 역할 확인
$$; -- 함수 본문 끝

grant execute on function public.is_admin() to authenticated; -- 관리자 판정 호출 권한

create policy "published news is public" -- 공개 뉴스 읽기 정책
on public.news_posts -- 대상 테이블
for select -- 읽기 작업
to anon, authenticated -- 공개 대상 역할
using (status = 'published'); -- 공개 상태 조건

create policy "admins can read all news" -- 관리자 전체 읽기 정책
on public.news_posts -- 대상 테이블
for select -- 읽기 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin())); -- 관리자 조건

create policy "admins can create news" -- 관리자 작성 정책
on public.news_posts -- 대상 테이블
for insert -- 작성 작업
to authenticated -- 로그인 대상 역할
with check ((select public.is_admin()) and author_id = (select auth.uid())); -- 관리자와 작성자 조건

create policy "admins can update news" -- 관리자 수정 정책
on public.news_posts -- 대상 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin()) and author_id = (select auth.uid())) -- 기존 행 조건
with check ((select public.is_admin()) and author_id = (select auth.uid())); -- 변경 행 조건

create policy "admins can delete news" -- 관리자 삭제 정책
on public.news_posts -- 대상 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using ((select public.is_admin()) and author_id = (select auth.uid())); -- 관리자와 작성자 조건

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) -- 이미지 버킷 생성
values ('news-images', 'news-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']) -- 버킷 설정값
on conflict (id) do update -- 기존 버킷 갱신
set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types; -- 제한 설정 갱신

create policy "admins can upload news images" -- 관리자 이미지 작성 정책
on storage.objects -- 저장 객체 테이블
for insert -- 업로드 작업
to authenticated -- 로그인 대상 역할
with check (bucket_id = 'news-images' and (select public.is_admin())); -- 버킷과 관리자 조건

create policy "admins can update news images" -- 관리자 이미지 수정 정책
on storage.objects -- 저장 객체 테이블
for update -- 수정 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'news-images' and (select public.is_admin())) -- 기존 객체 조건
with check (bucket_id = 'news-images' and (select public.is_admin())); -- 변경 객체 조건

create policy "admins can delete news images" -- 관리자 이미지 삭제 정책
on storage.objects -- 저장 객체 테이블
for delete -- 삭제 작업
to authenticated -- 로그인 대상 역할
using (bucket_id = 'news-images' and (select public.is_admin())); -- 버킷과 관리자 조건

create function public.set_news_updated_at() -- 수정 시각 함수
returns trigger -- 트리거 결과 형식
language plpgsql -- 절차형 함수 형식
security invoker -- 호출자 권한 사용
set search_path = '' -- 고정 검색 경로
as $$ -- 함수 본문 시작
begin -- 처리 블록 시작
    new.updated_at = now(); -- 수정 시각 갱신
    return new; -- 변경 행 반환
end; -- 처리 블록 끝
$$; -- 함수 본문 끝

create trigger set_news_updated_at -- 수정 시각 트리거
before update on public.news_posts -- 수정 전 실행
for each row -- 행별 실행
execute function public.set_news_updated_at(); -- 갱신 함수 호출
```

- [ ] **Step 4: 정적 계약 테스트 통과 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: SQL 계약 tests passed

- [ ] **Step 5: Supabase 프로젝트 생성 후 실행할 실제 정책 검사 기록**

Run after project setup: `supabase db push`

Run after project setup: `supabase test db`

Expected: `anon` 쓰기 거부, 일반 `authenticated` 쓰기 거부, `admin` 쓰기 허용, 초안 공개 읽기 거부

- [ ] **Step 6: 작업 단위 커밋**

Run: `git add supabase tests/admin-news-contract.test.mjs && git commit -m "feat: 관리자 뉴스 RLS 정책 추가"`

---

### 작업 4: 쿠키 세션과 관리자 보호

**Files:**

- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/proxy.ts`
- Create: `lib/auth/admin.ts`
- Create: `proxy.ts`
- Modify: `tests/admin-news-contract.test.mjs`

**Interfaces:**

- Produces: `createBrowserSupabaseClient()`
- Produces: `createServerSupabaseClient()`
- Produces: `updateSupabaseSession(request)`
- Produces: `isAdminUser(user, adminEmail): boolean`
- Produces: `requireAdmin(returnTo): Promise<User>`

- [ ] **Step 1: 관리자 판정 실패 테스트 작성**

```javascript
test("이메일과 관리자 역할이 모두 일치해야 관리자다", () => // 이중 권한 검사
{ // 테스트 본문 시작
    const admin = { email: "owner@example.com", app_metadata: { role: "admin" } }; // 관리자 사용자
    const member = { email: "owner@example.com", app_metadata: { role: "member" } }; // 일반 사용자
    assert.equal(isAdminUser(admin, "owner@example.com"), true); // 관리자 허용 검증
    assert.equal(isAdminUser(member, "owner@example.com"), false); // 역할 불일치 거부
    assert.equal(isAdminUser(admin, "other@example.com"), false); // 이메일 불일치 거부
}); // 테스트 본문 끝
```

- [ ] **Step 2: 관리자 판정 테스트 실패 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: `isAdminUser` 누락 실패

- [ ] **Step 3: 브라우저·서버 클라이언트와 세션 프록시 구현**

공식 `@supabase/ssr` 패턴으로 브라우저는 `createBrowserClient`, 서버는 `cookies()`와 `createServerClient`, 프록시는 요청·응답 쿠키의 `getAll`과 `setAll`을 연결한다. 설정이 없으면 명확한 설정 오류를 반환하고 임의의 기본 키를 만들지 않는다.

- [ ] **Step 4: 관리자 보호 함수 구현**

`isAdminUser`는 이메일을 소문자로 비교하고 `app_metadata.role === "admin"`을 확인한다. `requireAdmin`은 설정 누락 시 `/admin/login?error=configuration`, 세션 누락 시 `/admin/login?returnTo=...`, 권한 없음 시 `/admin/login?error=forbidden`으로 이동한다.

- [ ] **Step 5: 관리자 요청만 처리하는 프록시 범위 설정**

`proxy.ts`의 matcher는 `/admin/:path*`로 제한한다. 정적 공개 뉴스 요청은 세션 프록시를 거치지 않는다.

- [ ] **Step 6: 테스트와 타입 검사**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Expected: 모든 테스트 통과와 TypeScript 오류 없음

- [ ] **Step 7: 작업 단위 커밋**

Run: `git add lib proxy.ts tests/admin-news-contract.test.mjs && git commit -m "feat: 관리자 세션 보호 추가"`

---

### 작업 5: 관리자 로그인 화면

**Files:**

- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/login-form.tsx`
- Create: `app/admin/admin.css`
- Modify: `tests/admin-news-contract.test.mjs`

**Interfaces:**

- Consumes: `createBrowserSupabaseClient()`, `isSupabaseConfigured()`
- Produces: `/admin/login`

- [ ] **Step 1: 로그인 화면 계약 실패 테스트 작성**

로그인 페이지에 이메일, 비밀번호, 제출 버튼, 설정 누락 안내, 메인 복귀 링크가 존재하는지 검사한다. 브라우저 컴포넌트가 `signInWithPassword`를 사용하고 로그인 후 `/admin/news/new`로 이동하는지 검사한다.

- [ ] **Step 2: 계약 테스트 실패 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: 로그인 파일 누락 실패

- [ ] **Step 3: 로그인 페이지와 폼 구현**

```typescript
async function handleSubmit(event: FormEvent<HTMLFormElement>) // 로그인 제출 처리
{ // 함수 시작
    event.preventDefault(); // 기본 제출 차단
    setMessage(""); // 이전 안내 제거
    setIsSubmitting(true); // 제출 상태 시작
    const supabase = createBrowserSupabaseClient(); // 브라우저 인증 도구
    const result = await supabase.auth.signInWithPassword({ email, password }); // 이메일 로그인

    if (result.error) // 로그인 실패 확인
    { // 조건 시작
        setMessage("이메일 또는 비밀번호를 확인해 주세요."); // 안전한 실패 안내
        setIsSubmitting(false); // 제출 상태 종료
        return; // 실패 처리 종료
    } // 조건 끝

    window.location.assign(returnTo); // 보호 화면 이동
} // 함수 끝
```

화면은 기존 DEVFORGE의 짙은 배경, 청록 강조색, 기술형 타이포그래피를 유지한다. 비밀번호 표시 전환은 넣지 않고 브라우저 비밀번호 관리자와 자동 완성을 지원한다.

- [ ] **Step 4: 계약·타입·빌드 검사**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Expected: 모든 검사 통과

- [ ] **Step 5: 작업 단위 커밋**

Run: `git add app/admin tests/admin-news-contract.test.mjs && git commit -m "feat: 관리자 로그인 화면 추가"`

---

### 작업 6: 관리자 뉴스 편집과 서버 액션

**Files:**

- Create: `app/admin/news/new/page.tsx`
- Create: `app/admin/news/[id]/edit/page.tsx`
- Create: `app/admin/news/news-editor.tsx`
- Create: `app/admin/news/actions.ts`
- Modify: `app/admin/admin.css`
- Modify: `tests/admin-news-contract.test.mjs`

**Interfaces:**

- Consumes: `requireAdmin()`, `validateNewsPost()`, `validateCoverImage()`
- Produces: `createNewsPost(previousState, formData)`
- Produces: `updateNewsPost(id, previousState, formData)`
- Produces: `deleteNewsPost(id)`
- Produces: `signOutAdmin()`

- [ ] **Step 1: 편집기와 서버 액션 계약 실패 테스트 작성**

다음 계약을 파일 기반 테스트로 고정한다.

- 새 글과 수정 페이지가 `requireAdmin` 호출
- 편집기가 제목·요약·본문·태그·이미지·상태 입력 제공
- 서버 액션이 입력 검증 후 Storage 업로드 수행
- Storage 성공 뒤 게시물 저장 실패 시 새 이미지 삭제
- 모든 변경 액션이 `requireAdmin` 재호출
- 삭제 액션이 게시물과 연결 이미지 삭제
- 로그아웃 액션이 Supabase `signOut` 호출

- [ ] **Step 2: 계약 테스트 실패 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: 편집기와 액션 파일 누락 실패

- [ ] **Step 3: 새 글과 수정 화면 구현**

새 글 화면은 보호 함수 통과 뒤 빈 편집기를 표시한다. 수정 화면은 관리자에게만 해당 UUID 게시물을 조회하여 초기값을 전달한다. 존재하지 않는 UUID는 Next.js `notFound()`로 처리한다.

- [ ] **Step 4: 서버 액션 구현**

폼 값을 문자열과 문자열 배열로 정규화하고 공용 검증 함수를 실행한다. 이미지가 있으면 `news-images/{userId}/{uuid}.{extension}`에 `upsert: false`로 업로드한다. 게시물 저장 시 `author_id`는 폼 값이 아니라 로그인 사용자 UUID를 사용한다. 공개 전환 시에만 `published_at`을 설정한다.

- [ ] **Step 5: 실패 복구 구현**

새 이미지 업로드 후 데이터베이스 저장이 실패하면 그 요청에서 새로 만든 이미지만 삭제한다. 수정 과정에서 기존 이미지는 새 게시물 저장 성공 후 삭제한다. 입력 오류나 저장 오류가 발생해도 제목·요약·본문·태그·상태는 폼 상태로 유지한다.

- [ ] **Step 6: 계약·타입·빌드 검사**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Expected: 모든 검사 통과

- [ ] **Step 7: 작업 단위 커밋**

Run: `git add app/admin lib/news tests/admin-news-contract.test.mjs && git commit -m "feat: 관리자 뉴스 편집기 추가"`

---

### 작업 7: 공개 뉴스 API·목록·상세 화면

**Files:**

- Create: `app/api/news/route.ts`
- Create: `app/news/[id]/page.tsx`
- Modify: `public/devlog.html`
- Modify: `public/devlog.mjs`
- Modify: `public/devlog.css`
- Modify: `tests/development-news.test.mjs`

**Interfaces:**

- Consumes: 공개 RLS가 적용된 `news_posts`
- Produces: `GET /api/news`
- Produces: `renderNewsRows(posts)`
- Produces: `/news/{id}` 공개 상세 화면

- [ ] **Step 1: 동적 공개 뉴스 실패 테스트 작성**

기존 네 개 뉴스와 필터 테스트를 유지하면서 다음 계약을 추가한다.

- API가 `published` 조건과 `published_at` 내림차순 사용
- Supabase 미설정 시 빈 배열과 `configured: false` 반환
- 정적 뉴스 스크립트가 `/api/news` 조회
- 성공한 동적 결과가 있을 때 기존 임시 뉴스 대체
- 조회 실패나 빈 결과에서는 기존 임시 뉴스 유지
- 동적 태그에 기존 필터 재적용
- 동적 제목이 `/news/{id}`로 이동

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --test tests/development-news.test.mjs`

Expected: 동적 API 계약 누락 실패

- [ ] **Step 3: 공개 API 구현**

API는 공개 키로 `id`, `title`, `summary`, `tags`, `cover_image_path`, `published_at`만 조회한다. 설정 누락은 HTTP 200과 `{ configured: false, posts: [] }`로 반환하고, 원격 오류는 내부 세부 정보를 숨긴 HTTP 503으로 반환한다.

- [ ] **Step 4: 정적 목록의 동적 교체 구현**

```javascript
export function shouldUseRemotePosts(response) // 원격 게시물 사용 판정
{ // 함수 시작
    return response?.configured === true && Array.isArray(response.posts) && response.posts.length > 0; // 정상 원격 목록 확인
} // 함수 끝
```

페이지 로드 뒤 API를 한 번 호출한다. 정상 원격 게시물이 있을 때 DOM API와 `textContent`로 행을 만들며 `innerHTML`로 사용자 본문을 삽입하지 않는다. 행을 교체한 뒤 뉴스 목록과 필터 버튼을 다시 연결한다.

- [ ] **Step 5: 공개 상세 화면 구현**

상세 페이지는 공개 RLS를 사용하는 서버 클라이언트로 UUID 게시물을 조회한다. 제목, 게시일, 태그, 대표 이미지, 본문을 표시하고 본문 줄바꿈은 CSS `white-space: pre-wrap`으로 처리한다. 초안이나 없는 게시물은 `notFound()`로 처리한다.

- [ ] **Step 6: 스타일 확장**

클릭 가능한 뉴스의 키보드 초점, 로딩 상태, 원격 오류 안내, 대표 이미지, 상세 본문을 기존 `devlog.css` 색상 체계로 추가한다. 760px 이하 한 열 배치를 유지하고 200% 글자 확대에서 가로 스크롤이 생기지 않게 한다.

- [ ] **Step 7: 회귀·타입·빌드 검사**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm build`

Expected: 기존 뉴스 네 개, 태그 필터, 프로젝트 페이지 테스트를 포함한 전체 통과

- [ ] **Step 8: 작업 단위 커밋**

Run: `git add app/api app/news public/devlog.html public/devlog.mjs public/devlog.css tests/development-news.test.mjs && git commit -m "feat: 공개 개발 뉴스 연동 추가"`

---

### 작업 8: 설정 문서와 최종 검증

**Files:**

- Create: `README.md`
- Modify: `.gitignore`
- Modify: `tests/admin-news-contract.test.mjs`

**Interfaces:**

- Produces: Supabase 생성·관리자 지정·로컬 실행·Vercel 배포·도메인 전환 절차

- [ ] **Step 1: 문서 계약 실패 테스트 작성**

README에 다음 항목이 모두 있는지 검사한다.

- Supabase 프로젝트 생성
- 마이그레이션 실행
- 관리자 사용자 생성
- 관리자 `app_metadata.role` 설정
- `.env.local` 설정
- Vercel 환경 변수 설정
- 로컬 Redirect URL
- Vercel Redirect URL
- 커스텀 도메인 전환
- 서비스 역할 키를 브라우저에 넣지 말라는 경고

- [ ] **Step 2: 문서 계약 테스트 실패 확인**

Run: `node --test tests/admin-news-contract.test.mjs`

Expected: README 누락 실패

- [ ] **Step 3: 초보자용 설정 문서 작성**

각 단계에서 클릭할 Supabase 메뉴와 입력할 환경 변수 이름을 설명한다. 실제 프로젝트 URL, 공개 키, 이메일, 비밀번호는 예시에 포함하지 않는다. 관리자 계정 생성 뒤 SQL Editor에서 해당 사용자의 `raw_app_meta_data`에 `role: admin`을 넣는 명령과 확인 쿼리를 제공한다.

- [ ] **Step 4: 비밀 파일 제외 확인**

`.gitignore`에서 `.env*.local` 유지와 Supabase 임시 파일 제외를 확인한다. `rg`로 서비스 역할 키, 비밀번호, 실제 관리자 이메일이 추적 파일에 없는지 검사한다.

- [ ] **Step 5: Supabase 미설정 상태 전체 자동 검증**

Run: `pnpm test`

Run: `pnpm exec tsc --noEmit`

Run: `pnpm lint`

Run: `pnpm build`

Expected: 종료 코드 0, 오류와 경고 없음

- [ ] **Step 6: 로컬 미리보기 확인**

Run: `pnpm dev`

Check: `/devlog.html`, `/admin/login`, `/admin/news/new`, `/news/{없는-uuid}`

Expected: 공개 뉴스 정상 표시, 로그인 화면 표시, 보호 화면 로그인 이동, 없는 공개 글 404

- [ ] **Step 7: Supabase 프로젝트 등록 후 원격 통합 검증**

Check: 관리자 로그인 성공, 일반 계정 관리자 화면 차단, 초안 작성, 공개 전환, 대표 이미지 업로드, 공개 목록 반영, 태그 필터, 수정, 삭제, 로그아웃

Expected: 서버 보호와 RLS 정책이 모두 설계대로 동작

- [ ] **Step 8: 최종 작업 커밋**

Run: `git add README.md .gitignore tests/admin-news-contract.test.mjs && git commit -m "docs: 관리자 뉴스 설정 안내 추가"`

---

## 자체 검토 결과

- 설계의 관리자 인증, 작성·수정·삭제, 이미지, 공개 목록, 필터, 오류 처리, 도메인 전환 요구를 모두 작업에 연결함
- 일반 사용자 댓글·이모티콘·댓글 이미지는 1차 범위에서 제외함
- 서버와 RLS의 이중 권한 검사를 모두 포함함
- Supabase 프로젝트 생성 전과 생성 후 검증 기준을 분리함
- 미정 항목이나 구현 위임 표현 없음
- `User`, `NewsPostInput`, 검증 함수, 서버 액션, API 경계를 작업 순서대로 정의함
