import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { AccountError, deleteMyComment, deleteOwnAccount, isDeleteConfirmed, listMyComments, toAccountError } from "../lib/member/account.ts"; // 내 정보 처리 도구
import { CRAWL_BLOCKED_PATHS, getSiteUrl, PUBLIC_STATIC_PATHS } from "../lib/site-url.ts"; // 사이트 주소 도구

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구

function createClient({ rows = [], deleteRows = [{ id: "c1" }], files = [], rpcError = null } = {}) // 시험 Supabase 연결
{ // 함수 시작
    const calls = []; // 호출 기록
    const query = (table) => // 테이블 요청
    { // 요청 시작
        const chain = { filters: [] }; // 조건 기록
        const builder = // 연결 요청 도구
        { // 도구 시작
            select: (columns) => { chain.columns = columns; return builder; }, // 열 선택
            delete: () => { chain.delete = true; return builder; }, // 삭제 요청
            eq: (column, value) => { chain.filters.push(["eq", column, value]); return builder; }, // 같음 조건
            neq: (column, value) => { chain.filters.push(["neq", column, value]); return builder; }, // 다름 조건
            order: () => builder, // 정렬
            limit: (value) => { chain.limit = value; calls.push(["query", table, chain]); return Promise.resolve({ data: rows, error: null }); }, // 조회 실행
            then: (resolve) => { calls.push(["delete", table, chain]); return Promise.resolve({ data: deleteRows, error: null }).then(resolve); }, // 삭제 실행
        }; // 도구 끝
        return builder; // 도구 반환
    }; // 요청 끝
    let listed = false; // 목록 조회 여부
    const bucket = // 저장소 버킷 대체
    { // 버킷 시작
        list: async (folder) => { calls.push(["list", folder]); const data = listed ? [] : files; listed = true; return { data, error: null }; }, // 목록 조회
        remove: async (paths) => { calls.push(["remove", paths]); return { data: paths, error: null }; }, // 파일 삭제
    }; // 버킷 끝
    const client = { from: query, storage: { from: () => bucket }, rpc: async (name) => { calls.push(["rpc", name]); return { data: null, error: rpcError }; }, auth: { signOut: async (options) => { calls.push(["signOut", options]); return { error: null }; } } }; // 연결 대체
    return { client, calls }; // 시험 도구 반환
} // 함수 끝

test("탈퇴 확인은 한국어 '탈퇴' 또는 영어 'DELETE'를 정확히 입력해야 한다", () => // 확인어 검사
{ // 테스트 시작
    assert.equal(isDeleteConfirmed(" 탈퇴 "), true); // 한국어 확인
    assert.equal(isDeleteConfirmed("DELETE"), true); // 영어 확인
    assert.equal(isDeleteConfirmed("delete"), false); // 대소문자 구분 확인
    assert.equal(isDeleteConfirmed("탈 퇴"), false); // 다른 입력 거부
    assert.equal(toAccountError({ message: "ADMIN_ACCOUNT" }).code, "ADMIN_ACCOUNT"); // 관리자 오류 변환
    assert.equal(toAccountError(new Error("boom")).code, "UNKNOWN"); // 기타 오류 변환
}); // 테스트 끝

test("내 댓글은 본인 글만 최신순으로 읽고 삭제된 글은 빼며 뉴스 제목을 붙인다", async () => // 내 댓글 조회 검사
{ // 테스트 시작
    const { client, calls } = createClient({ rows: [{ id: "c1", news_id: "n1", content: "안녕", status: "hidden", image_path: null, created_at: "2026-10-01T00:00:00Z", news_posts: { title: "첫 소식" } }, { id: "c2", news_id: "n2", content: "둘", status: "visible", image_path: "u1/a.png", created_at: "2026-09-30T00:00:00Z", news_posts: null }] }); // 시험 연결
    const items = await listMyComments(client, "u1"); // 조회
    assert.deepEqual(calls[0][2].filters, [["eq", "author_id", "u1"], ["neq", "status", "deleted"]]); // 본인·삭제 제외 조건 확인
    assert.equal(calls[0][2].limit, 50); // 표시 수 확인
    assert.equal(items[0].status, "hidden"); // 숨김 상태 확인
    assert.equal(items[0].newsTitle, "첫 소식"); // 뉴스 제목 확인
    assert.equal(items[1].newsTitle, "삭제되었거나 비공개인 뉴스"); // 제목 없음 대체 확인
}); // 테스트 끝

test("댓글 삭제는 본인 글만 지우고 이미지를 정리하며 대상이 없으면 알린다", async () => // 댓글 삭제 검사
{ // 테스트 시작
    const ok = createClient(); // 성공 연결
    await deleteMyComment(ok.client, "u1", { id: "c1", imagePath: "u1/a.png" }); // 삭제
    assert.deepEqual(ok.calls[0][2].filters, [["eq", "id", "c1"], ["eq", "author_id", "u1"]]); // 본인 조건 확인
    assert.deepEqual(ok.calls[1], ["remove", ["u1/a.png"]]); // 이미지 정리 확인
    const none = createClient({ deleteRows: [] }); // 대상 없음 연결
    await assert.rejects(deleteMyComment(none.client, "u1", { id: "x", imagePath: null }), (error) => error instanceof AccountError && error.code === "NOT_FOUND"); // 대상 없음 확인
}); // 테스트 끝

test("탈퇴는 본인 이미지 폴더를 비운 뒤 탈퇴 함수를 부르고 세션을 정리한다", async () => // 탈퇴 검사
{ // 테스트 시작
    const { client, calls } = createClient({ files: [{ name: "a.png" }, { name: ".emptyFolderPlaceholder" }] }); // 시험 연결
    await deleteOwnAccount(client, "u1"); // 탈퇴
    assert.deepEqual(calls.map((call) => call[0]), ["list", "remove", "list", "rpc", "signOut"]); // 처리 순서 확인
    assert.deepEqual(calls[1], ["remove", ["u1/a.png"]]); // 본인 폴더 파일 확인
    const admin = createClient({ rpcError: { message: "ADMIN_ACCOUNT" } }); // 관리자 거부 연결
    await assert.rejects(deleteOwnAccount(admin.client, "u1"), (error) => error.code === "ADMIN_ACCOUNT"); // 관리자 거부 확인
    const sql = read("supabase/migrations/202610010002_member_account_deletion.sql"); // 탈퇴 함수
    assert.match(sql, /security definer/); // 권한 실행 확인
    assert.match(sql, /set search_path = ''/); // 검색 경로 고정 확인
    assert.match(sql, /raise exception 'ADMIN_ACCOUNT'/); // 관리자 거부 확인
    assert.match(sql, /raise exception 'IMAGES_REMAIN'/); // 이미지 남음 거부 확인
    assert.match(sql, /delete from auth\.users where id = current_user_id/); // 본인만 삭제 확인
    assert.match(sql, /revoke all on function public\.delete_own_account\(\) from public, anon/); // 비로그인 실행 차단 확인
}); // 테스트 끝

test("내 정보 화면은 로그인 안내·닉네임·내 댓글·탈퇴를 제공하고 로그인 화면에서 이어진다", () => // 화면 연결 검사
{ // 테스트 시작
    const panel = read("app/account/account-panel.tsx"); // 내 정보 영역
    assert.match(panel, /href="\/login\?returnTo=%2Faccount"/); // 로그인 이동 확인
    assert.match(panel, /<MemberNicknameForm /); // 닉네임 변경 확인
    assert.match(panel, /listMyComments\(createBrowserSupabaseClient\(\), userId\)/); // 내 댓글 조회 확인
    assert.match(panel, /deleteOwnAccount\(createBrowserSupabaseClient\(\), userId\)/); // 탈퇴 연결 확인
    assert.match(panel, /disabled=\{busy !== null \|\| !isDeleteConfirmed\(confirmText\)\}/); // 확인 전 비활성 확인
    assert.match(read("app/account/page.tsx"), /robots: \{ index: false \}/); // 검색 제외 확인
    assert.match(read("app/login/member-access.tsx"), /href="\/account"/); // 로그인 화면 연결 확인
}); // 테스트 끝

test("검색엔진 파일과 오류 화면을 제공하고 비공개·성인 경로는 수집에서 뺀다", () => // 검색·오류 검사
{ // 테스트 시작
    assert.equal(getSiteUrl({ SITE_URL: "https://devforge.example/" }), "https://devforge.example"); // 직접 주소 확인
    assert.equal(getSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "devforge.vercel.app" }), "https://devforge.vercel.app"); // Vercel 주소 확인
    assert.equal(getSiteUrl({ SITE_URL: "not a url" }), "http://localhost:3000"); // 잘못된 주소 대체 확인
    for (const blocked of ["/admin", "/api/", "/account", "/project_h/", "/project_u/", "/project_v/"]) // 제외 경로 반복
    { // 반복 시작
        assert.ok(CRAWL_BLOCKED_PATHS.includes(blocked), blocked); // 수집 제외 확인
    } // 반복 끝
    assert.ok(PUBLIC_STATIC_PATHS.includes("/main.html")); // 메인 포함 확인
    assert.match(read("app/sitemap.ts"), /filter\(\(project\) => !project\.adultOnly\)/); // 성인 게임 제외 확인
    assert.match(read("app/robots.ts"), /sitemap: `\$\{siteUrl\}\/sitemap\.xml`/); // 사이트맵 안내 확인
    assert.match(read("app/error.tsx"), /onClick=\{reset\}/); // 다시 시도 확인
    assert.match(read("app/global-error.tsx"), /<html lang="ko">/); // 전체 오류 문서 확인
}); // 테스트 끝
