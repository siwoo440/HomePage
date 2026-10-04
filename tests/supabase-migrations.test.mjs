import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { PGlite } from "@electric-sql/pglite"; // 내 컴퓨터에서 도는 시험용 PostgreSQL
import { COMMENT_BANNED_WORDS } from "../lib/comments/banned-words.ts"; // 금칙어 목록
import { buildSupabaseSetupSql, SETUP_SQL_PATH } from "../scripts/build-supabase-setup.mjs"; // 한 번에 붙여 넣는 설정 파일 도구
import { SUPABASE_MIGRATIONS } from "../scripts/check-supabase-env.mjs"; // 마이그레이션 적용 순서

// Supabase가 기본으로 주는 것 가운데 마이그레이션이 쓰는 부분(역할, 인증·저장소 구조, 기본 권한)만 흉내 냅니다.
const SUPABASE_STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create schema storage;
create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_app_meta_data jsonb not null default '{}');
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt() ->> 'sub', '')::uuid $$;
create table storage.buckets (id text primary key, name text not null, public boolean default false, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets(id), name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:greatest(array_length(string_to_array(name, '/'), 1) - 1, 0)] $$;
grant usage on schema public, auth, storage to anon, authenticated, service_role;
grant execute on all functions in schema auth to anon, authenticated, service_role;
grant execute on all functions in schema storage to anon, authenticated, service_role;
grant all on all tables in schema storage to authenticated, service_role;
grant all on all tables in schema auth to service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
`; // Supabase 기본 구조 대체 SQL

const ADMIN = "00000000-0000-4000-8000-000000000001"; // 관리자 식별자
const MEMBER = "00000000-0000-4000-8000-000000000002"; // 회원 식별자
const OTHER = "00000000-0000-4000-8000-000000000003"; // 다른 회원 식별자
const db = new PGlite(); // 시험용 데이터베이스
let newsId = ""; // 공개 뉴스 식별자

async function as(role, claims, run) // 역할을 바꿔 실행
{ // 함수 시작
    await db.query("select set_config('request.jwt.claims', $1, false)", [claims ? JSON.stringify(claims) : ""]); // 로그인 정보 설정
    await db.exec(`set role ${role}`); // 역할 전환
    try // 실행 시도
    { // 시도 시작
        return await run(); // 실행 결과 반환
    } // 시도 끝
    finally // 역할 복구
    { // 정리 시작
        await db.exec("reset role"); // 원래 역할로 복구
        await db.query("select set_config('request.jwt.claims', '', false)"); // 로그인 정보 지움
    } // 정리 끝
} // 함수 끝

const asAnon = (run) => as("anon", null, run); // 비로그인 방문자
const asMember = (id, run) => as("authenticated", { sub: id, role: "authenticated", app_metadata: {} }, run); // 로그인 회원
const asAdmin = (run) => as("authenticated", { sub: ADMIN, role: "authenticated", app_metadata: { role: "admin" } }, run); // 관리자
const asService = (run) => as("service_role", { role: "service_role" }, run); // 서버 전용 키
const blocked = (run, pattern) => assert.rejects(run, (error) => pattern.test(error.message) || assert.fail(`다른 오류: ${error.message}`)); // 막혀야 하는 동작 확인
const addComment = (id, content, parent = null) => asMember(id, () => db.query("insert into public.news_comments (news_id, parent_id, author_id, content) values ($1, $2, $3, $4) returning id", [newsId, parent, id, content])); // 댓글 작성
const agePast = () => db.exec("update public.news_comments set created_at = now() - interval '40 seconds' where created_at > now() - interval '35 seconds'"); // 방금 쓴 댓글을 40초 전으로 옮김

test("마이그레이션 여덟 개가 안내한 순서대로 오류 없이 실행된다", async () => // 실행 검사
{ // 테스트 시작
    await db.exec(SUPABASE_STUB); // Supabase 기본 구조 준비
    for (const file of SUPABASE_MIGRATIONS) // 적용 순서 반복
    { // 반복 시작
        await assert.doesNotReject(db.exec(fs.readFileSync(`supabase/migrations/${file}`, "utf8")), file); // 파일 실행 확인
    } // 반복 끝
    assert.equal(SUPABASE_MIGRATIONS.length, fs.readdirSync("supabase/migrations").filter((file) => file.endsWith(".sql")).length); // 빠진 파일 없음 확인
    await db.query("insert into auth.users (id, email) values ($1, 'admin@example.com'), ($2, 'member@example.com'), ($3, 'other@example.com')", [ADMIN, MEMBER, OTHER]); // 시험 계정 준비
}); // 테스트 끝

test("뉴스는 관리자만 쓰고 방문자는 공개 글만 읽는다", async () => // 뉴스 권한 검사
{ // 테스트 시작
    const created = await asAdmin(() => db.query("insert into public.news_posts (title, content, status, author_id, published_at) values ('소식', '본문', 'published', $1, now()) returning id", [ADMIN])); // 공개 뉴스 작성
    newsId = created.rows[0].id; // 뉴스 식별자 저장
    await asAdmin(() => db.query("insert into public.news_posts (title, content, status, author_id) values ('초안', '본문', 'draft', $1)", [ADMIN])); // 초안 작성
    await blocked(() => asMember(MEMBER, () => db.query("insert into public.news_posts (title, content, status, author_id) values ('x', 'y', 'published', $1)", [MEMBER])), /row-level security/); // 일반 회원 작성 차단
    assert.deepEqual((await asAnon(() => db.query("select status from public.news_posts"))).rows, [{ status: "published" }]); // 방문자는 공개 글만
    assert.equal((await asAdmin(() => db.query("select id from public.news_posts"))).rows.length, 2); // 관리자는 초안도
}); // 테스트 끝

test("댓글은 본인 이름으로만 쓰고 데이터베이스가 작성 제한을 다시 확인한다", async () => // 댓글 권한·제한 검사
{ // 테스트 시작
    await asMember(MEMBER, () => db.query("insert into public.member_profiles (id, nickname) values ($1, '회원')", [MEMBER])); // 본인 프로필 생성
    await asMember(OTHER, () => db.query("insert into public.member_profiles (id, nickname) values ($1, '다른회원')", [OTHER])); // 다른 회원 프로필 생성
    await blocked(() => asMember(MEMBER, () => db.query("insert into public.member_profiles (id, nickname) values ($1, '사칭')", [ADMIN])), /row-level security/); // 남의 프로필 생성 차단
    await blocked(() => asAnon(() => db.query("select terms_agreed_at from public.member_profiles")), /permission denied/); // 동의 시각 열 비공개
    const first = await addComment(MEMBER, "첫 댓글"); // 첫 댓글
    await blocked(() => addComment(MEMBER, "바로 다음 댓글"), /COMMENT_TOO_FAST/); // 30초 안 연속 작성 차단
    await blocked(() => asAnon(() => db.query("insert into public.news_comments (news_id, author_id, content) values ($1, $2, 'x')", [newsId, MEMBER])), /permission denied/); // 비로그인 작성 차단
    await blocked(() => asMember(OTHER, () => db.query("insert into public.news_comments (news_id, author_id, content) values ($1, $2, '사칭 댓글')", [newsId, ADMIN])), /row-level security/); // 남의 이름 작성 차단
    await agePast(); // 시간 경과
    await blocked(() => addComment(MEMBER, "  첫   댓글 "), /COMMENT_DUPLICATE/); // 공백만 다른 반복 차단
    await blocked(() => addComment(MEMBER, "http://www.a.example https://b.example www.c.example"), /COMMENT_TOO_MANY_LINKS/); // 링크 3개 차단
    await addComment(MEMBER, "http://www.a.example https://b.example"); // 링크 2개 허용
    await agePast(); // 시간 경과
    await blocked(() => addComment(MEMBER, "토 토 사​이 트 홍보"), /COMMENT_BANNED_WORD/); // 띄어 쓴 금칙어 차단
    await addComment(MEMBER, "여기가 시발점이네요"); // 다른 낱말 속 글자 허용
    for (const content of ["넷째 댓글", "다섯째 댓글"]) // 제한 범위 안 작성 반복
    { // 반복 시작
        await agePast(); // 시간 경과
        await addComment(MEMBER, content); // 댓글 작성
    } // 반복 끝
    await agePast(); // 시간 경과
    await blocked(() => addComment(MEMBER, "여섯째 댓글"), /COMMENT_RATE_LIMITED/); // 10분 5개 초과 차단
    const reply = await addComment(OTHER, "답글입니다", first.rows[0].id); // 다른 회원의 답글
    await agePast(); // 시간 경과
    await blocked(() => addComment(OTHER, "중첩 답글", reply.rows[0].id), /INVALID_COMMENT_PARENT/); // 답글의 답글 차단
    await blocked(() => asMember(MEMBER, () => db.query("update public.news_comments set status = 'hidden' where id = $1", [first.rows[0].id])), /COMMENT_STATUS_ADMIN_ONLY/); // 회원의 공개 상태 변경 차단
    await blocked(() => asMember(MEMBER, () => db.query("update public.news_comments set content = '수정해서 넣는 씨발' where id = $1", [first.rows[0].id])), /COMMENT_BANNED_WORD/); // 내용 수정으로 금칙어 넣기 차단
    await asAdmin(() => db.query("update public.news_comments set status = 'hidden', updated_at = now() where id = $1", [first.rows[0].id])); // 관리자 숨김
    assert.equal((await asAnon(() => db.query("select id from public.news_comments where id = $1", [first.rows[0].id]))).rows.length, 0); // 숨긴 댓글은 방문자에게 안 보임
    await asMember(MEMBER, () => db.query("insert into public.comment_reports (comment_id, reporter_id, reason) values ($1, $2, 'spam')", [reply.rows[0].id, MEMBER])); // 신고 접수
    await blocked(() => asMember(MEMBER, () => db.query("insert into public.comment_reports (comment_id, reporter_id, reason) values ($1, $2, 'spam')", [reply.rows[0].id, MEMBER])), /duplicate key/); // 중복 신고 차단
    assert.equal((await asAdmin(() => db.query("update public.comment_reports set status = 'reviewed' returning id"))).rows.length, 1); // 관리자 신고 처리
    await blocked(() => asAnon(() => db.query("select word from public.comment_banned_words")), /permission denied/); // 방문자 금칙어 조회 차단
    assert.equal((await asMember(MEMBER, () => db.query("select word from public.comment_banned_words"))).rows.length, 0); // 회원에게는 금칙어가 안 보임
    assert.deepEqual((await asAdmin(() => db.query("select word from public.comment_banned_words order by created_at, word"))).rows.map((row) => row.word).sort(), [...COMMENT_BANNED_WORDS].sort()); // 관리자가 보는 금칙어는 화면 목록과 같음
    await blocked(() => asMember(MEMBER, () => db.query("select public.enforce_comment_limits()")), /permission denied/); // 제한 함수 직접 실행 차단
}); // 테스트 끝

test("문의는 누구나 넣고 관리자만 읽고 처리한다", async () => // 문의 권한 검사
{ // 테스트 시작
    await asAnon(() => db.query("insert into public.contact_messages (category, email, subject, message) values ('game', 'player@example.com', '문의 제목', '문의 내용을 열 글자 이상 씁니다')")); // 방문자 문의 접수
    await blocked(() => asAnon(() => db.query("insert into public.contact_messages (category, email, subject, message, status) values ('game', 'a@b.co', '문의 제목', '문의 내용을 열 글자 이상 씁니다', 'answered')")), /permission denied/); // 처리 상태 직접 입력 차단
    await blocked(() => asAnon(() => db.query("select id from public.contact_messages")), /permission denied/); // 방문자 조회 차단
    assert.equal((await asMember(MEMBER, () => db.query("select id from public.contact_messages"))).rows.length, 0); // 일반 회원에게 안 보임
    assert.equal((await asAdmin(() => db.query("update public.contact_messages set status = 'answered', handled_at = now(), handled_by = $1 returning id", [ADMIN]))).rows.length, 1); // 관리자 처리
}); // 테스트 끝

test("출시 알림은 함수로만 신청하고 확인 값은 서버 전용 키만 발급받는다", async () => // 출시 알림 권한·한도 검사
{ // 테스트 시작
    const issue = (project) => asService(() => db.query("select public.issue_release_confirmation($1, 'player@example.com') as token", [project])).then((result) => result.rows[0].token); // 확인 값 발급
    await asAnon(() => db.query("select public.subscribe_release_notification('project-eta', ' Player@Example.com ')")); // 방문자 신청
    await asAnon(() => db.query("select public.subscribe_release_notification('project-eta', 'player@example.com')")); // 같은 신청 반복
    assert.deepEqual((await db.query("select email, status from public.release_notifications")).rows, [{ email: "player@example.com", status: "active" }]); // 소문자로 한 번만 저장
    await blocked(() => asAnon(() => db.query("select public.subscribe_release_notification('project-eta', 'not-an-email')")), /NOTIFY_INVALID_EMAIL/); // 잘못된 이메일 거부
    await blocked(() => asAnon(() => db.query("select public.subscribe_release_notification('Project_X', 'a@b.co')")), /NOTIFY_INVALID_PROJECT/); // 잘못된 게임 식별자 거부
    await blocked(() => asAnon(() => db.query("select token from public.release_notifications")), /permission denied/); // 방문자 직접 조회 차단
    await blocked(() => asAnon(() => db.query("insert into public.release_notifications (project_id, email) values ('project-a', 'x@y.co')")), /permission denied/); // 방문자 직접 추가 차단
    assert.equal((await asMember(MEMBER, () => db.query("select token from public.release_notifications"))).rows.length, 0); // 일반 회원에게 안 보임
    await blocked(() => asAnon(() => db.query("select public.issue_release_confirmation('project-eta', 'player@example.com')")), /permission denied/); // 방문자 확인 값 발급 차단
    await blocked(() => asMember(MEMBER, () => db.query("select public.issue_release_confirmation('project-eta', 'player@example.com')")), /permission denied/); // 로그인 회원 확인 값 발급 차단
    const token = await issue("project-eta"); // 서버 전용 키 발급
    assert.match(token, /^[0-9a-f-]{36}$/); // 확인 값 형식
    assert.equal(await issue("project-eta"), null); // 24시간 안 재발급 없음
    assert.equal((await asService(() => db.query("update public.release_notifications set confirmation_sent_at = null where project_id = 'project-eta' and email = 'player@example.com' and confirmed_at is null returning id"))).rows.length, 1); // 발송 실패 때 표시 지우기
    assert.equal(await issue("project-eta"), token); // 표시를 지우면 같은 값 재발급
    for (const project of ["project-a", "project-b", "project-c"]) // 다른 게임 신청 반복
    { // 반복 시작
        await asAnon(() => db.query("select public.subscribe_release_notification($1, 'player@example.com')", [project])); // 같은 이메일로 신청
    } // 반복 끝
    assert.deepEqual([Boolean(await issue("project-a")), Boolean(await issue("project-b")), await issue("project-c")], [true, true, null]); // 같은 이메일 하루 3통 한도
    assert.equal((await asAnon(() => db.query("select public.confirm_release_notification('11111111-1111-4111-8111-111111111111') as found"))).rows[0].found, false); // 틀린 확인 값
    assert.equal((await asAnon(() => db.query("select public.confirm_release_notification($1) as found", [token]))).rows[0].found, true); // 메일의 확인 값으로 본인 확인
    await db.exec("update public.release_notifications set confirmation_sent_at = null"); // 발송 기록 초기화
    assert.equal(await issue("project-eta"), null); // 확인한 신청에는 재발급 없음
    const counts = (await asAdmin(() => db.query("select * from public.release_notification_counts() where project_id = 'project-eta'"))).rows[0]; // 관리자 집계
    assert.deepEqual([Number(counts.active_count), Number(counts.confirmed_count), Number(counts.unsubscribed_count)], [1, 1, 0]); // 수신 중·확인 완료·수신 거부 수
    assert.equal((await asMember(MEMBER, () => db.query("select * from public.release_notification_counts()"))).rows.length, 0); // 일반 회원 집계는 비어 있음
    await blocked(() => asAnon(() => db.query("select * from public.release_notification_counts()")), /permission denied/); // 방문자 집계 차단
    assert.equal((await asAnon(() => db.query("select public.unsubscribe_release_notification($1) as found", [token]))).rows[0].found, true); // 확인 값으로 수신 거부
    assert.equal((await asAnon(() => db.query("select public.confirm_release_notification($1) as found", [token]))).rows[0].found, false); // 수신 거부한 신청은 확인 불가
    await asAnon(() => db.query("select public.subscribe_release_notification('project-eta', 'player@example.com')")); // 다시 신청
    const renewed = (await db.query("select status, confirmed_at, confirmation_sent_at, token from public.release_notifications where project_id = 'project-eta'")).rows[0]; // 다시 신청한 뒤 상태
    assert.deepEqual([renewed.status, renewed.confirmed_at, renewed.confirmation_sent_at, renewed.token === token], ["active", null, null, false]); // 확인 값·본인 확인이 새로 시작
}); // 테스트 끝

test("회원 탈퇴는 본인 계정만 지우고 연결된 기록도 함께 지운다", async () => // 탈퇴 검사
{ // 테스트 시작
    await blocked(() => asAdmin(() => db.query("select public.delete_own_account()")), /ADMIN_ACCOUNT/); // 관리자 탈퇴 차단
    await blocked(() => asAnon(() => db.query("select public.delete_own_account()")), /permission denied/); // 비로그인 실행 차단
    await asMember(OTHER, () => db.query("select public.delete_own_account()")); // 회원 탈퇴
    const left = (await db.query("select (select count(*) from auth.users where id = $1) as users, (select count(*) from public.member_profiles where id = $1) as profiles, (select count(*) from public.news_comments where author_id = $1) as comments", [OTHER])).rows[0]; // 남은 기록 수
    assert.deepEqual([Number(left.users), Number(left.profiles), Number(left.comments)], [0, 0, 0]); // 계정·프로필·댓글 삭제 확인
    assert.equal(Number((await db.query("select count(*) as members from auth.users")).rows[0].members), 2); // 다른 계정은 그대로
}); // 테스트 끝

test("한 번에 붙여 넣는 설정 파일은 여덟 개를 순서대로 담고 오류가 나면 아무것도 적용하지 않는다", async () => // 묶음 파일 검사
{ // 테스트 시작
    const sql = buildSupabaseSetupSql(); // 묶은 설정 SQL
    const positions = SUPABASE_MIGRATIONS.map((file) => sql.indexOf(`-- ===== ${file} =====`)); // 파일별 위치
    assert.ok(positions.every((position, index) => position > 0 && (index === 0 || position > positions[index - 1])), JSON.stringify(positions)); // 적용 순서 확인
    assert.match(sql, /^-- [^\n]*\n-- [^\n]*\nbegin;\n/); // 전부 성공할 때만 적용하도록 시작
    assert.match(sql, /\ncommit;\n$/); // 마지막에 적용 확정
    assert.equal(sql.includes("\r"), false); // 줄바꿈 통일 확인
    assert.match(fs.readFileSync(".gitignore", "utf8"), /^supabase\/\.temp\/$/m); // 만든 파일은 저장소에 올리지 않음
    assert.equal(SETUP_SQL_PATH.startsWith("supabase/.temp/"), true); // 저장 위치 확인
    const tables = "select count(*) as tables from information_schema.tables where table_schema = 'public'"; // 만든 표 수 조회
    const fresh = new PGlite(); // 새 시험용 데이터베이스
    try // 정상 실행 확인
    { // 시도 시작
        await fresh.exec(SUPABASE_STUB); // Supabase 기본 구조 준비
        await fresh.exec(sql); // 묶음 파일 한 번 실행
        assert.equal(Number((await fresh.query(tables)).rows[0].tables), 10); // 표 열 개 생성 확인
    } // 시도 끝
    finally // 정리
    { // 정리 시작
        await fresh.close(); // 데이터베이스 닫기
    } // 정리 끝
    const broken = new PGlite(); // 오류 시험용 데이터베이스
    try // 오류 때 되돌림 확인
    { // 시도 시작
        await broken.exec(SUPABASE_STUB); // Supabase 기본 구조 준비
        await assert.rejects(broken.exec(sql.replace("\ncommit;\n", "\nselect 1 / 0;\ncommit;\n"))); // 마지막에 일부러 오류
        await broken.exec("rollback"); // 끊긴 작업 정리
        assert.equal(Number((await broken.query(tables)).rows[0].tables), 0); // 아무 표도 남지 않음 확인
    } // 시도 끝
    finally // 정리
    { // 정리 시작
        await broken.close(); // 데이터베이스 닫기
    } // 정리 끝
    assert.match(fs.readFileSync("package.json", "utf8"), /"supabase:sql": "node scripts\/build-supabase-setup\.mjs"/); // 명령 등록 확인
}); // 테스트 끝

test.after(() => db.close()); // 시험용 데이터베이스 닫기
