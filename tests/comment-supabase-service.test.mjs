import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { CommentServiceError } from "../lib/comments/service.ts"; // 댓글 서비스 오류
import { createLocalCommentService } from "../lib/comments/local-service.ts"; // 로컬 댓글 서비스
import { COMMENT_IMAGE_BUCKET, createSupabaseCommentService, UNKNOWN_COMMENT_NICKNAME } from "../lib/comments/supabase-service.ts"; // Supabase 댓글 서비스

const NEWS_ID = "11111111-1111-4111-8111-111111111111"; // 테스트 뉴스 식별자
const MEMBER_ID = "22222222-2222-4222-8222-222222222222"; // 테스트 회원 식별자
const OTHER_ID = "33333333-3333-4333-8333-333333333333"; // 다른 회원 식별자

function createFakeClient(handler) // 가짜 Supabase 클라이언트 생성
{ // 함수 시작
    const calls = []; // 데이터 요청 기록
    const storageCalls = []; // 저장소 요청 기록

    function createBuilder(table) // 가짜 질의 생성
    { // 함수 시작
        const state = { table, action: "select", columns: null, returning: null, values: null, options: null, filters: [], order: null, mode: "many" }; // 질의 상태
        const builder = // 질의 연결 객체
        { // 객체 시작
            select(columns) { if (state.action === "select") { state.columns = columns; } else { state.returning = columns; } return builder; }, // 조회 열 설정
            insert(values) { state.action = "insert"; state.values = values; return builder; }, // 추가 설정
            upsert(values, options) { state.action = "upsert"; state.values = values; state.options = options; return builder; }, // 추가·수정 설정
            delete() { state.action = "delete"; return builder; }, // 삭제 설정
            eq(column, value) { state.filters.push(["eq", column, value]); return builder; }, // 같음 조건
            in(column, values) { state.filters.push(["in", column, values]); return builder; }, // 포함 조건
            gte(column, value) { state.filters.push(["gte", column, value]); return builder; }, // 이상 조건
            limit(count) { state.limit = count; return builder; }, // 개수 제한
            order(column, options) { state.order = [column, options]; return builder; }, // 정렬 설정
            single() { state.mode = "single"; return builder; }, // 단일 결과 설정
            maybeSingle() { state.mode = "maybeSingle"; return builder; }, // 선택 단일 결과 설정
            then(resolve, reject) { calls.push(state); return Promise.resolve(handler(state)).then(resolve, reject); }, // 질의 실행
        }; // 객체 끝
        return builder; // 질의 반환
    } // 함수 끝

    const client = // 가짜 클라이언트
    { // 객체 시작
        from: (table) => createBuilder(table), // 테이블 질의 시작
        storage: // 가짜 저장소
        { // 저장소 시작
            from: (bucket) => // 버킷 선택
            ({ // 버킷 도구 시작
                async upload(path, file, options) { storageCalls.push({ action: "upload", bucket, path, file, options }); return handler({ table: `storage:${bucket}`, action: "upload", path }) ?? { data: { path }, error: null }; }, // 업로드 기록
                async remove(paths) { storageCalls.push({ action: "remove", bucket, paths }); return { data: [], error: null }; }, // 삭제 기록
                getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }), // 공개 주소 생성
            }), // 버킷 도구 끝
        }, // 저장소 끝
    }; // 객체 끝
    return { client, calls, storageCalls }; // 가짜 도구 반환
} // 함수 끝

function commentRow(overrides = {}) // 댓글 행 생성
{ // 함수 시작
    return { id: "c-1", news_id: NEWS_ID, parent_id: null, author_id: MEMBER_ID, content: "첫 댓글", image_path: null, created_at: "2026-10-01T00:00:00.000Z", comment_reactions: [], ...overrides }; // 댓글 행 반환
} // 함수 끝

function expectServiceError(code) // 서비스 오류 검사기
{ // 함수 시작
    return (error) => // 오류 판별 함수 반환
    { // 판별 시작
        assert.equal(error instanceof CommentServiceError, true); // 서비스 오류 형식 확인
        assert.equal(error.code, code); // 오류 코드 확인
        return true; // 오류 일치 반환
    }; // 판별 끝
} // 함수 끝

test("Supabase 댓글 서비스는 로컬 서비스와 같은 계약을 제공한다", () => // 계약 동일성 테스트
{ // 테스트 시작
    const local = createLocalCommentService({ initialComments: [] }); // 로컬 서비스
    const remote = createSupabaseCommentService({ client: createFakeClient(() => ({ data: [], error: null })).client }); // 원격 서비스
    assert.deepEqual(Object.keys(remote).sort(), Object.keys(local).sort()); // 같은 메서드 확인
}); // 테스트 끝

test("공개 댓글을 작성 순서대로 읽고 닉네임·반응·이미지 주소를 합친다", async () => // 댓글 조회 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => // 조회 응답 정의
    { // 응답 시작
        if (state.table === "news_comments") // 댓글 조회 확인
        { // 조건 시작
            return { data: [commentRow({ image_path: `${MEMBER_ID}/a.png`, comment_reactions: [{ user_id: MEMBER_ID, reaction: "like" }, { user_id: OTHER_ID, reaction: "like" }, { user_id: "x", reaction: "unknown" }] }), commentRow({ id: "c-2", parent_id: "c-1", author_id: OTHER_ID })], error: null }; // 댓글 행 반환
        } // 조건 끝
        return { data: [{ id: MEMBER_ID, nickname: "포지" }], error: null }; // 프로필 행 반환
    }); // 응답 끝
    const comments = await createSupabaseCommentService({ client: fake.client }).list(NEWS_ID); // 댓글 조회
    const [commentQuery, profileQuery] = fake.calls; // 요청 기록
    assert.deepEqual(commentQuery.filters, [["eq", "news_id", NEWS_ID], ["eq", "status", "visible"]]); // 공개 댓글 조건 확인
    assert.deepEqual(commentQuery.order, ["created_at", { ascending: true }]); // 작성 순서 확인
    assert.match(commentQuery.columns, /comment_reactions\(user_id, reaction\)/); // 반응 함께 조회 확인
    assert.deepEqual(profileQuery.filters, [["in", "id", [MEMBER_ID, OTHER_ID]]]); // 작성자 중복 제거 확인
    assert.equal(comments[0].nickname, "포지"); // 닉네임 연결 확인
    assert.equal(comments[1].nickname, UNKNOWN_COMMENT_NICKNAME); // 프로필 없는 작성자 확인
    assert.equal(comments[1].parentId, "c-1"); // 답글 연결 확인
    assert.equal(comments[0].imageUrl, `https://cdn.test/${COMMENT_IMAGE_BUCKET}/${MEMBER_ID}/a.png`); // 이미지 주소 확인
    assert.deepEqual(comments[0].reactions.like, { count: 2, selectedBy: [MEMBER_ID, OTHER_ID] }); // 반응 집계 확인
    assert.equal(comments[0].reactions.cheer.count, 0); // 없는 반응 0 확인
}); // 테스트 끝

test("댓글이 없으면 프로필을 조회하지 않고 서버 오류는 연결 오류로 바꾼다", async () => // 빈 목록·오류 테스트
{ // 테스트 시작
    const empty = createFakeClient(() => ({ data: [], error: null })); // 빈 응답 도구
    assert.deepEqual(await createSupabaseCommentService({ client: empty.client }).list(NEWS_ID), []); // 빈 목록 확인
    assert.equal(empty.calls.length, 1); // 프로필 조회 생략 확인
    const broken = createFakeClient(() => ({ data: null, error: { code: "08006", message: "connection failure" } })); // 실패 응답 도구
    await assert.rejects(createSupabaseCommentService({ client: broken.client }).list(NEWS_ID), expectServiceError("SERVICE_UNAVAILABLE")); // 연결 오류 확인
}); // 테스트 끝

test("댓글 작성은 입력을 검증하고 이미지를 본인 폴더에 올린 뒤 저장한다", async () => // 댓글 작성 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => state.action === "insert" ? { data: commentRow({ content: state.values.content, image_path: state.values.image_path }), error: null } : { data: [], error: null }); // 저장 응답 정의
    const service = createSupabaseCommentService({ client: fake.client, createId: () => "fixed", now: () => Date.parse("2026-10-02T00:00:00.000Z") }); // 테스트 서비스
    const file = new Blob(["image"], { type: "image/png" }); // 업로드 파일
    const created = await service.create({ newsId: NEWS_ID, parentId: null, authorId: MEMBER_ID, nickname: "포지", content: "  반가워요  ", image: { url: "", type: "image/png", size: 5, file } }); // 댓글 작성
    assert.deepEqual(fake.storageCalls[0], { action: "upload", bucket: COMMENT_IMAGE_BUCKET, path: `${MEMBER_ID}/fixed.png`, file, options: { contentType: "image/png", upsert: false } }); // 본인 폴더 업로드 확인
    assert.deepEqual(fake.calls[0].filters, [["eq", "author_id", MEMBER_ID], ["gte", "created_at", "2026-10-01T00:00:00.000Z"]]); // 본인의 최근 24시간 댓글 조회 확인
    assert.deepEqual([fake.calls[0].action, fake.calls[0].columns, fake.calls[0].limit], ["select", "content, created_at", 50]); // 조회 범위 확인
    assert.deepEqual(fake.calls[1].values, { news_id: NEWS_ID, parent_id: null, author_id: MEMBER_ID, content: "반가워요", image_path: `${MEMBER_ID}/fixed.png` }); // 저장 값 확인
    assert.equal(created.nickname, "포지"); // 작성자 이름 확인
    assert.equal(created.imageUrl, `https://cdn.test/${COMMENT_IMAGE_BUCKET}/${MEMBER_ID}/fixed.png`); // 이미지 주소 확인
    assert.equal(created.reactions.like.count, 0); // 초기 반응 확인
}); // 테스트 끝

test("잘못된 댓글은 서버 요청 없이 거부하고 저장 실패 시 올린 이미지를 지운다", async () => // 작성 실패 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => state.action === "insert" ? { data: null, error: { code: "P0001", message: "INVALID_COMMENT_PARENT" } } : { data: [], error: null }); // 부모 오류 응답
    const service = createSupabaseCommentService({ client: fake.client, createId: () => "fixed" }); // 테스트 서비스
    const base = { newsId: NEWS_ID, parentId: "reply-1", authorId: MEMBER_ID, nickname: "포지", content: "답글", image: null }; // 기본 입력
    await assert.rejects(service.create({ ...base, content: "   " }), expectServiceError("INVALID_CONTENT")); // 빈 내용 거부 확인
    await assert.rejects(service.create({ ...base, image: { url: "", type: "image/png", size: 5 } }), expectServiceError("INVALID_IMAGE")); // 파일 없는 이미지 거부 확인
    assert.equal(fake.calls.length + fake.storageCalls.length, 0); // 서버 요청 없음 확인
    await assert.rejects(service.create({ ...base, image: { url: "", type: "image/gif", size: 5, file: new Blob(["g"]) } }), expectServiceError("INVALID_PARENT")); // 답글 단계 오류 변환 확인
    assert.deepEqual(fake.storageCalls.map((call) => call.action), ["upload", "remove"]); // 남은 이미지 정리 확인
    assert.deepEqual(fake.storageCalls[1].paths, [`${MEMBER_ID}/fixed.gif`]); // 정리 경로 확인
    const denied = createFakeClient(() => ({ data: null, error: { code: "42501", message: "row-level security" } })); // 권한 오류 응답
    await assert.rejects(createSupabaseCommentService({ client: denied.client }).create(base), expectServiceError("SIGN_IN_REQUIRED")); // 로그인 필요 변환 확인
}); // 테스트 끝

test("반응은 새로 추가·같은 반응 취소·다른 반응 전환 후 최신 댓글을 돌려준다", async () => // 반응 전환 테스트
{ // 테스트 시작
    for (const [existing, expectedAction] of [[null, "upsert"], ["like", "delete"], ["cheer", "upsert"]]) // 경우별 반복
    { // 반복 시작
        const fake = createFakeClient((state) => // 반응 응답 정의
        { // 응답 시작
            if (state.table === "comment_reactions" && state.action === "select") // 현재 반응 조회 확인
            { // 조건 시작
                return { data: existing ? { reaction: existing } : null, error: null }; // 현재 반응 반환
            } // 조건 끝
            if (state.table === "news_comments") // 최신 댓글 조회 확인
            { // 조건 시작
                return { data: commentRow({ comment_reactions: [{ user_id: MEMBER_ID, reaction: "like" }] }), error: null }; // 최신 댓글 반환
            } // 조건 끝
            return { data: state.table === "member_profiles" ? [{ id: MEMBER_ID, nickname: "포지" }] : null, error: null }; // 기타 응답
        }); // 응답 끝
        const updated = await createSupabaseCommentService({ client: fake.client }).toggleReaction("c-1", MEMBER_ID, "like"); // 반응 전환
        const write = fake.calls.find((call) => call.table === "comment_reactions" && call.action !== "select"); // 변경 요청
        assert.equal(write.action, expectedAction, `기존 ${existing}`); // 요청 종류 확인
        if (expectedAction === "upsert") // 저장 요청 확인
        { // 조건 시작
            assert.deepEqual(write.values, { comment_id: "c-1", user_id: MEMBER_ID, reaction: "like" }); // 저장 값 확인
            assert.deepEqual(write.options, { onConflict: "comment_id,user_id" }); // 회원별 단일 반응 확인
        } // 조건 끝
        else // 삭제 요청 확인
        { // 대안 시작
            assert.deepEqual(write.filters, [["eq", "comment_id", "c-1"], ["eq", "user_id", MEMBER_ID]]); // 본인 반응 삭제 확인
        } // 대안 끝
        assert.equal(updated.nickname, "포지"); // 최신 댓글 이름 확인
        assert.equal(updated.reactions.like.count, 1); // 최신 반응 확인
    } // 반복 끝
}); // 테스트 끝

test("없는 댓글 반응과 숨겨진 댓글은 댓글 없음 오류로 처리한다", async () => // 반응 실패 테스트
{ // 테스트 시작
    const missing = createFakeClient((state) => state.action === "upsert" ? { data: null, error: { code: "23503", message: "foreign key" } } : { data: null, error: null }); // 참조 오류 응답
    await assert.rejects(createSupabaseCommentService({ client: missing.client }).toggleReaction("gone", MEMBER_ID, "cheer"), expectServiceError("COMMENT_NOT_FOUND")); // 없는 댓글 확인
    const hidden = createFakeClient(() => ({ data: null, error: null })); // 숨김 댓글 응답
    await assert.rejects(createSupabaseCommentService({ client: hidden.client }).toggleReaction("hidden", MEMBER_ID, "cheer"), expectServiceError("COMMENT_NOT_FOUND")); // 숨김 댓글 확인
}); // 테스트 끝

test("신고는 사유·상세를 검증하고 중복 신고를 구분한다", async () => // 신고 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => ({ data: { id: "r-1", comment_id: state.values.comment_id, reporter_id: state.values.reporter_id, reason: state.values.reason, detail: state.values.detail, created_at: "2026-10-01T01:00:00.000Z" }, error: null })); // 신고 응답 정의
    const service = createSupabaseCommentService({ client: fake.client }); // 테스트 서비스
    await assert.rejects(service.report({ commentId: "c-1", reporterId: MEMBER_ID, reason: "unknown", detail: "" }), expectServiceError("INVALID_REPORT_REASON")); // 사유 거부 확인
    await assert.rejects(service.report({ commentId: "c-1", reporterId: MEMBER_ID, reason: "spam", detail: "가".repeat(501) }), expectServiceError("REPORT_DETAIL_TOO_LONG")); // 상세 길이 거부 확인
    assert.equal(fake.calls.length, 0); // 서버 요청 없음 확인
    const report = await service.report({ commentId: "c-1", reporterId: MEMBER_ID, reason: "privacy", detail: "  연락처 노출  " }); // 정상 신고
    assert.deepEqual(fake.calls[0].values, { comment_id: "c-1", reporter_id: MEMBER_ID, reason: "privacy", detail: "연락처 노출" }); // 저장 값 확인
    assert.deepEqual(report, { id: "r-1", commentId: "c-1", reporterId: MEMBER_ID, reason: "privacy", detail: "연락처 노출", createdAt: "2026-10-01T01:00:00.000Z" }); // 신고 기록 확인
    const duplicate = createFakeClient(() => ({ data: null, error: { code: "23505", message: "duplicate key" } })); // 중복 응답
    await assert.rejects(createSupabaseCommentService({ client: duplicate.client }).report({ commentId: "c-1", reporterId: MEMBER_ID, reason: "spam", detail: "" }), expectServiceError("DUPLICATE_REPORT")); // 중복 신고 확인
}); // 테스트 끝
