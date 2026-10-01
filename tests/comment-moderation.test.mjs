import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { applyModerationToItem, countPendingReports, createDemoModerationItems, createLocalModerationService, createSupabaseModerationService, getAvailableActions, ModerationError, parseModerationFilter, parseModerationInput, summarizePendingReasons } from "../lib/comments/moderation.ts"; // 댓글 관리 도구

const ADMIN_ID = "99999999-9999-4999-8999-999999999999"; // 테스트 관리자 식별자

function createItem(overrides = {}) // 관리 항목 생성
{ // 함수 시작
    return { commentId: "c-1", newsId: "n-1", newsTitle: "뉴스", nickname: "포지", content: "내용", imagePath: null, imageUrl: null, status: "visible", createdAt: "2026-10-01T00:00:00.000Z", reports: [], ...overrides }; // 관리 항목 반환
} // 함수 끝

function report(id, status, reason = "spam", createdAt = "2026-10-01T01:00:00.000Z") // 신고 생성
{ // 함수 시작
    return { id, reason, detail: "", status, createdAt }; // 신고 반환
} // 함수 끝

function expectModerationError(code) // 관리 오류 검사기
{ // 함수 시작
    return (error) => // 오류 판별 함수 반환
    { // 판별 시작
        assert.equal(error instanceof ModerationError, true); // 관리 오류 형식 확인
        assert.equal(error.code, code); // 오류 코드 확인
        return true; // 오류 일치 반환
    }; // 판별 끝
} // 함수 끝

test("상태별로 가능한 처리만 허용하고 신고 대기 시에만 기각을 제공한다", () => // 처리 규칙 테스트
{ // 테스트 시작
    assert.deepEqual(getAvailableActions(createItem()), ["hide", "delete"]); // 공개 댓글 처리 확인
    assert.deepEqual(getAvailableActions(createItem({ status: "hidden" })), ["restore", "delete"]); // 숨김 댓글 처리 확인
    assert.deepEqual(getAvailableActions(createItem({ reports: [report("r-1", "pending")] })), ["hide", "delete", "dismiss_report"]); // 신고 대기 처리 확인
    assert.deepEqual(getAvailableActions(createItem({ status: "deleted" })), []); // 삭제 댓글 처리 없음 확인
    assert.throws(() => applyModerationToItem(createItem(), "restore"), expectModerationError("INVALID_STATE")); // 잘못된 처리 거부 확인
}); // 테스트 끝

test("숨김·삭제는 대기 신고를 처리 완료로, 기각은 기각으로 바꾸고 삭제는 이미지를 지운다", () => // 처리 결과 테스트
{ // 테스트 시작
    const reported = createItem({ imagePath: "u/a.png", imageUrl: "https://cdn/u/a.png", reports: [report("r-1", "pending"), report("r-2", "dismissed")] }); // 신고 댓글
    const hidden = applyModerationToItem(reported, "hide"); // 숨김 처리
    assert.equal(hidden.status, "hidden"); // 숨김 상태 확인
    assert.deepEqual(hidden.reports.map((entry) => entry.status), ["reviewed", "dismissed"]); // 대기 신고만 처리 확인
    assert.equal(applyModerationToItem(hidden, "restore").status, "visible"); // 다시 공개 확인
    const deleted = applyModerationToItem(reported, "delete"); // 삭제 처리
    assert.deepEqual([deleted.status, deleted.imagePath, deleted.imageUrl], ["deleted", null, null]); // 삭제·이미지 제거 확인
    assert.deepEqual(applyModerationToItem(reported, "dismiss_report").reports.map((entry) => entry.status), ["dismissed", "dismissed"]); // 신고 기각 확인
    assert.equal(reported.status, "visible"); // 원본 불변 확인
}); // 테스트 끝

test("처리 입력과 목록 종류를 검증하고 신고 사유를 요약한다", () => // 입력 검증 테스트
{ // 테스트 시작
    assert.deepEqual(parseModerationInput({ commentId: " c-1 ", action: "hide", note: " 광고 " }), { commentId: "c-1", action: "hide", note: "광고" }); // 정상 입력 확인
    assert.throws(() => parseModerationInput({ commentId: "c-1", action: "ban" }), expectModerationError("INVALID_INPUT")); // 잘못된 처리 확인
    assert.throws(() => parseModerationInput({ commentId: "", action: "hide" }), expectModerationError("INVALID_INPUT")); // 빈 식별자 확인
    assert.throws(() => parseModerationInput({ commentId: "c-1", action: "hide", note: "가".repeat(1001) }), expectModerationError("INVALID_INPUT")); // 긴 메모 확인
    assert.equal(parseModerationFilter("hidden"), "hidden"); // 허용 목록 확인
    assert.equal(parseModerationFilter("unknown"), "reported"); // 기본 목록 확인
    const item = createItem({ reports: [report("r-1", "pending", "spam"), report("r-2", "pending", "spam"), report("r-3", "pending", "privacy"), report("r-4", "reviewed", "adult")] }); // 여러 신고
    assert.equal(countPendingReports(item), 3); // 대기 수 확인
    assert.equal(summarizePendingReasons(item), "스팸·도배 2, 개인정보 노출 1"); // 사유 요약 확인
}); // 테스트 끝

test("데모 관리 서비스는 목록을 나누고 처리 결과와 기록을 메모리에만 남긴다", async () => // 데모 서비스 테스트
{ // 테스트 시작
    const service = createLocalModerationService(createDemoModerationItems(), () => "2026-10-01T09:00:00.000Z"); // 데모 서비스
    const reported = await service.list("reported", 1); // 신고 목록
    assert.deepEqual(reported.items.map((item) => item.commentId), ["demo-mod-1", "demo-mod-2"]); // 최근 신고 순 확인
    assert.equal((await service.list("hidden", 1)).total, 1); // 숨김 목록 확인
    assert.equal((await service.list("recent", 1)).total, 4); // 최근 목록 확인
    const hidden = await service.apply({ commentId: "demo-mod-1", action: "hide", note: "광고" }, ADMIN_ID); // 숨김 처리
    assert.equal(hidden.status, "hidden"); // 처리 결과 확인
    assert.deepEqual((await service.list("reported", 1)).items.map((item) => item.commentId), ["demo-mod-2"]); // 신고 목록 갱신 확인
    assert.deepEqual(service.log(), [{ commentId: "demo-mod-1", adminId: ADMIN_ID, action: "hide", note: "광고", createdAt: "2026-10-01T09:00:00.000Z" }]); // 처리 기록 확인
    await assert.rejects(service.apply({ commentId: "missing", action: "hide", note: "" }, ADMIN_ID), expectModerationError("COMMENT_NOT_FOUND")); // 없는 댓글 확인
    assert.equal(createDemoModerationItems()[0].status, "visible"); // 원본 시연 데이터 불변 확인
}); // 테스트 끝

function createFakeClient(handler) // 가짜 Supabase 클라이언트 생성
{ // 함수 시작
    const calls = []; // 데이터 요청 기록
    const storageCalls = []; // 저장소 요청 기록

    function createBuilder(table) // 가짜 질의 생성
    { // 함수 시작
        const state = { table, action: "select", columns: null, values: null, options: null, filters: [], order: null, range: null, limit: null }; // 질의 상태
        const builder = // 질의 연결 객체
        { // 객체 시작
            select(columns, options) { state.columns = columns; state.options = options ?? null; return builder; }, // 조회 열 설정
            update(values) { state.action = "update"; state.values = values; return builder; }, // 수정 설정
            insert(values) { state.action = "insert"; state.values = values; return builder; }, // 추가 설정
            eq(column, value) { state.filters.push(["eq", column, value]); return builder; }, // 같음 조건
            neq(column, value) { state.filters.push(["neq", column, value]); return builder; }, // 다름 조건
            in(column, values) { state.filters.push(["in", column, values]); return builder; }, // 포함 조건
            order(column, options) { state.order = [column, options]; return builder; }, // 정렬 설정
            range(from, to) { state.range = [from, to]; return builder; }, // 범위 설정
            limit(count) { state.limit = count; return builder; }, // 개수 제한
            then(resolve, reject) { calls.push(state); return Promise.resolve(handler(state)).then(resolve, reject); }, // 질의 실행
        }; // 객체 끝
        return builder; // 질의 반환
    } // 함수 끝

    const client = // 가짜 클라이언트
    { // 객체 시작
        from: (table) => createBuilder(table), // 테이블 질의 시작
        storage: { from: (bucket) => ({ async remove(paths) { storageCalls.push({ bucket, paths }); return { data: [], error: null }; }, getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${bucket}/${path}` } }) }) }, // 가짜 저장소
    }; // 객체 끝
    return { client, calls, storageCalls }; // 가짜 도구 반환
} // 함수 끝

function createDatabase() // 가짜 데이터 응답 생성
{ // 함수 시작
    const comments = [{ id: "c-1", news_id: "n-1", author_id: "u-1", content: "광고 댓글", image_path: "u-1/a.png", status: "visible", created_at: "2026-10-01T00:00:00.000Z" }, { id: "c-2", news_id: "n-1", author_id: "u-2", content: "개인정보", image_path: null, status: "visible", created_at: "2026-10-01T00:30:00.000Z" }]; // 댓글 행
    const reports = [{ id: "r-1", comment_id: "c-1", reason: "spam", detail: "", status: "pending", created_at: "2026-10-01T02:00:00.000Z" }, { id: "r-2", comment_id: "c-2", reason: "privacy", detail: "번호", status: "pending", created_at: "2026-10-01T03:00:00.000Z" }, { id: "r-3", comment_id: "c-1", reason: "spam", detail: "", status: "pending", created_at: "2026-10-01T01:00:00.000Z" }]; // 신고 행
    return (state) => // 질의별 응답
    { // 응답 시작
        const ids = state.filters.find((filter) => filter[0] === "in")?.[2] ?? []; // 포함 조건 값
        if (state.table === "comment_reports" && state.action === "select" && state.filters.some((filter) => filter[1] === "status")) { return { data: [...reports].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((row) => ({ comment_id: row.comment_id, created_at: row.created_at })), error: null }; } // 대기 신고 응답
        if (state.table === "comment_reports" && state.action === "select") { return { data: reports.filter((row) => ids.includes(row.comment_id)), error: null }; } // 댓글별 신고 응답
        if (state.table === "news_comments" && state.action === "select" && state.options?.count) { return { data: comments.map((row) => ({ id: row.id })), count: 7, error: null }; } // 범위 댓글 응답
        if (state.table === "news_comments" && state.action === "select") { return { data: comments.filter((row) => ids.includes(row.id)), error: null }; } // 댓글 상세 응답
        if (state.table === "news_posts") { return { data: [{ id: "n-1", title: "에코 보이드 소식" }], error: null }; } // 뉴스 제목 응답
        if (state.table === "member_profiles") { return { data: [{ id: "u-1", nickname: "광고봇" }], error: null }; } // 닉네임 응답
        return { data: null, error: null }; // 쓰기 응답
    }; // 응답 끝
} // 함수 끝

test("Supabase 관리 목록은 최근 신고 순으로 댓글을 묶고 제목·닉네임·신고를 합친다", async () => // 원격 목록 테스트
{ // 테스트 시작
    const fake = createFakeClient(createDatabase()); // 가짜 도구
    const page = await createSupabaseModerationService({ client: fake.client }).list("reported", 1); // 신고 목록 조회
    assert.equal(page.total, 2); // 댓글 단위 개수 확인
    assert.deepEqual(page.items.map((item) => item.commentId), ["c-2", "c-1"]); // 최근 신고 순 확인
    assert.equal(page.items[1].newsTitle, "에코 보이드 소식"); // 뉴스 제목 확인
    assert.equal(page.items[1].nickname, "광고봇"); // 닉네임 확인
    assert.equal(page.items[0].nickname, "회원"); // 프로필 없는 작성자 확인
    assert.deepEqual(page.items[1].reports.map((entry) => entry.id), ["r-1", "r-3"]); // 신고 최신순 확인
    assert.equal(page.items[1].imageUrl, "https://cdn.test/comment-images/u-1/a.png"); // 이미지 주소 확인
    const pendingQuery = fake.calls[0]; // 대기 신고 질의
    assert.deepEqual(pendingQuery.filters, [["eq", "status", "pending"]]); // 대기 조건 확인
    const hidden = createFakeClient(createDatabase()); // 숨김 목록 도구
    const hiddenPage = await createSupabaseModerationService({ client: hidden.client }).list("hidden", 2); // 둘째 숨김 화면
    assert.equal(hiddenPage.total, 7); // 전체 개수 확인
    assert.deepEqual(hidden.calls[0].filters, [["eq", "status", "hidden"]]); // 숨김 조건 확인
    assert.deepEqual(hidden.calls[0].range, [20, 39]); // 둘째 화면 범위 확인
    const recent = createFakeClient(createDatabase()); // 최근 목록 도구
    await createSupabaseModerationService({ client: recent.client }).list("recent", 1); // 최근 목록 조회
    assert.deepEqual(recent.calls[0].filters, [["neq", "status", "deleted"]]); // 삭제 제외 확인
}); // 테스트 끝

test("Supabase 삭제 처리는 상태·신고를 바꾸고 이미지를 지운 뒤 처리 기록을 남긴다", async () => // 원격 처리 테스트
{ // 테스트 시작
    const fake = createFakeClient(createDatabase()); // 가짜 도구
    await createSupabaseModerationService({ client: fake.client, now: () => "2026-10-01T10:00:00.000Z" }).apply({ commentId: "c-1", action: "delete", note: "광고" }, ADMIN_ID); // 삭제 처리
    const writes = fake.calls.filter((call) => call.action !== "select"); // 쓰기 요청
    assert.deepEqual(writes.map((call) => [call.table, call.action]), [["news_comments", "update"], ["comment_reports", "update"], ["moderation_actions", "insert"]]); // 처리 순서 확인
    assert.deepEqual(writes[0].values, { status: "deleted", updated_at: "2026-10-01T10:00:00.000Z", image_path: null }); // 댓글 삭제 값 확인
    assert.deepEqual(writes[1].values, { status: "reviewed" }); // 신고 처리 완료 확인
    assert.deepEqual(writes[1].filters, [["eq", "comment_id", "c-1"], ["eq", "status", "pending"]]); // 대기 신고만 처리 확인
    assert.deepEqual(writes[2].values, { comment_id: "c-1", admin_id: ADMIN_ID, action: "delete", note: "광고" }); // 처리 기록 확인
    assert.deepEqual(fake.storageCalls, [{ bucket: "comment-images", paths: ["u-1/a.png"] }]); // 이미지 삭제 확인
    const dismiss = createFakeClient(createDatabase()); // 기각 도구
    await createSupabaseModerationService({ client: dismiss.client }).apply({ commentId: "c-2", action: "dismiss_report", note: "" }, ADMIN_ID); // 신고 기각
    assert.deepEqual(dismiss.calls.filter((call) => call.action !== "select").map((call) => [call.table, call.values?.status ?? call.values?.action]), [["comment_reports", "dismissed"], ["moderation_actions", "dismiss_report"]]); // 댓글 유지·신고 기각 확인
    const denied = createFakeClient((state) => state.action === "update" ? { data: null, error: { code: "42501", message: "denied" } } : createDatabase()(state)); // 권한 오류 도구
    await assert.rejects(createSupabaseModerationService({ client: denied.client }).apply({ commentId: "c-1", action: "hide", note: "" }, ADMIN_ID), expectModerationError("FORBIDDEN")); // 권한 오류 확인
    const missing = createFakeClient(() => ({ data: [], error: null })); // 없는 댓글 도구
    await assert.rejects(createSupabaseModerationService({ client: missing.client }).apply({ commentId: "x", action: "hide", note: "" }, ADMIN_ID), expectModerationError("COMMENT_NOT_FOUND")); // 없는 댓글 확인
}); // 테스트 끝
