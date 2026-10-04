import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMENT_BANNED_WORDS } from "../lib/comments/banned-words.ts"; // 금칙어 목록
import { validateCommentContent } from "../lib/comments/domain.ts"; // 댓글 내용 검증
import { checkCommentContentRules, checkCommentRate, COMMENT_DUPLICATE_HOURS, COMMENT_MAX_LINKS, COMMENT_MIN_INTERVAL_SECONDS, COMMENT_WINDOW_MAX, COMMENT_WINDOW_MINUTES, countCommentLinks, describeCommentFlags, findBannedWord, getCommentBlockMessage, normalizeForDuplicate } from "../lib/comments/guard.ts"; // 작성 제한 규칙
import { createLocalCommentService } from "../lib/comments/local-service.ts"; // 로컬 댓글 서비스
import { createDemoModerationItems } from "../lib/comments/moderation.ts"; // 시연 관리 항목
import { CommentServiceError } from "../lib/comments/service.ts"; // 댓글 서비스 오류
import { createSupabaseCommentService, toCommentServiceError } from "../lib/comments/supabase-service.ts"; // Supabase 댓글 서비스
import { SUPABASE_MIGRATIONS } from "../scripts/check-supabase-env.mjs"; // 마이그레이션 적용 순서

const NOW = Date.parse("2026-10-04T12:00:00.000Z"); // 기준 시각
const ago = (seconds) => new Date(NOW - seconds * 1000).toISOString(); // 기준 시각 이전 시각
const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구

function expectServiceError(code, pattern) // 서비스 오류 검사기
{ // 함수 시작
    return (error) => // 오류 판별 함수 반환
    { // 판별 시작
        assert.equal(error instanceof CommentServiceError, true); // 서비스 오류 형식 확인
        assert.equal(error.code, code); // 오류 코드 확인
        assert.match(error.message, pattern ?? /./); // 안내 문구 확인
        return true; // 오류 일치 반환
    }; // 판별 끝
} // 함수 끝

test("링크 수와 금칙어는 댓글 내용 검증에서 걸러 낸다", () => // 내용 규칙 검사
{ // 테스트 시작
    assert.equal(countCommentLinks("http://www.a.example 과 https://b.example"), 2); // 주소 하나를 한 번만 세는지 확인
    assert.equal(countCommentLinks("www.a.example WWW.B.EXAMPLE Http://c.example"), 3); // 대소문자 구분 없음 확인
    assert.equal(countCommentLinks("링크 없는 댓글 v2.1.3"), 0); // 링크 없음 확인
    assert.equal(checkCommentContentRules("https://a.example https://b.example"), null); // 허용 개수 통과
    assert.deepEqual(checkCommentContentRules("a.example http://1.example http://2.example http://3.example"), { reason: "too_many_links", message: `댓글에는 링크를 ${COMMENT_MAX_LINKS}개까지만 넣을 수 있습니다.` }); // 링크 초과 차단
    assert.equal(findBannedWord("정상적인 댓글입니다. 시발점이 좋네요."), null); // 다른 낱말 속 글자 오탐 없음 확인
    assert.equal(findBannedWord("토 토 사​이 트 홍보"), "토토사이트"); // 띄어 쓰거나 보이지 않는 글자를 끼운 금칙어 확인
    assert.equal(findBannedWord("What the FUCK"), "fuck"); // 대소문자 구분 없음 확인
    assert.equal(checkCommentContentRules("카지노 사이트 추천").reason, "banned_word"); // 금칙어 차단
    assert.doesNotMatch(checkCommentContentRules("카지노 사이트 추천").message, /카지노/); // 걸린 낱말을 알려 주지 않는지 확인
    assert.deepEqual(validateCommentContent("  반가워요  "), { ok: true, value: "반가워요" }); // 정상 댓글 통과
    assert.equal(validateCommentContent("대출 문의 주세요").ok, false); // 내용 검증에 연결 확인
    assert.equal(validateCommentContent("http://1.example http://2.example http://3.example").message, getCommentBlockMessage("too_many_links")); // 화면 즉시 안내 문구 확인
    assert.ok(COMMENT_BANNED_WORDS.every((word) => word === word.toLowerCase() && !/\s/.test(word) && word.length >= 2)); // 금칙어 표기 규칙 확인
    assert.equal(new Set(COMMENT_BANNED_WORDS).size, COMMENT_BANNED_WORDS.length); // 금칙어 중복 없음 확인
}); // 테스트 끝

test("연속 작성·작성 수·같은 내용 반복을 차례로 막고 다시 쓸 수 있는 시간을 알려 준다", () => // 빈도 규칙 검사
{ // 테스트 시작
    assert.equal(checkCommentRate("첫 댓글", [], NOW), null); // 기록 없음 통과
    assert.deepEqual(checkCommentRate("새 댓글", [{ content: "이전", createdAt: ago(10) }], NOW), { reason: "too_fast", message: `댓글은 ${COMMENT_MIN_INTERVAL_SECONDS}초에 한 번만 쓸 수 있습니다. 20초 뒤에 다시 시도해 주세요.` }); // 연속 작성 차단과 남은 시간
    assert.equal(checkCommentRate("새 댓글", [{ content: "이전", createdAt: ago(COMMENT_MIN_INTERVAL_SECONDS) }], NOW), null); // 최소 간격 경계 통과
    assert.equal(checkCommentRate("새 댓글", [{ content: "이전", createdAt: ago(-120) }], NOW), null); // 기기 시계가 늦을 때는 서버 판단에 맡김
    const busy = [540, 400, 300, 200, 100].map((seconds, index) => ({ content: `댓글 ${index}`, createdAt: ago(seconds) })); // 10분 안 다섯 개
    assert.deepEqual(checkCommentRate("여섯째", busy, NOW), { reason: "rate_limited", message: `${COMMENT_WINDOW_MINUTES}분 동안 댓글을 ${COMMENT_WINDOW_MAX}개까지 쓸 수 있습니다. 1분 뒤에 다시 시도해 주세요.` }); // 작성 수 차단과 남은 시간
    assert.equal(checkCommentRate("여섯째", busy.slice(1), NOW), null); // 네 개는 통과
    assert.equal(checkCommentRate("여섯째", [{ content: "오래된 댓글", createdAt: ago(601) }, ...busy.slice(1)], NOW), null); // 구간 밖 댓글 제외 확인
    assert.deepEqual(checkCommentRate("  같은   내용 ABC ", [{ content: "같은 내용 abc", createdAt: ago(3600) }], NOW), { reason: "duplicate", message: getCommentBlockMessage("duplicate") }); // 공백·대소문자만 다른 반복 차단
    assert.equal(checkCommentRate("같은 내용", [{ content: "같은 내용", createdAt: ago(COMMENT_DUPLICATE_HOURS * 3600 + 1) }], NOW), null); // 금지 기간 지난 반복 통과
    assert.equal(checkCommentRate("새 댓글", [{ content: "이전", createdAt: "잘못된 시각" }], NOW), null); // 읽을 수 없는 시각 무시
    assert.equal(normalizeForDuplicate(" 가\n\n나  DA "), "가 나 da"); // 비교용 정리 확인
    assert.match(getCommentBlockMessage("too_fast"), /잠시 뒤에 다시 시도해 주세요\.$/); // 남은 시간을 모를 때 문구
    assert.match(getCommentBlockMessage("rate_limited", 61), /2분 뒤에 다시 시도해 주세요\.$/); // 분 단위 올림 확인
}); // 테스트 끝

test("시연 댓글 서비스는 같은 회원의 도배만 막고 다른 회원은 막지 않는다", async () => // 로컬 서비스 검사
{ // 테스트 시작
    let clock = NOW; // 시험 시계
    let sequence = 0; // 식별자 순번
    const service = createLocalCommentService({ initialComments: [], createId: (prefix) => `${prefix}-${++sequence}`, now: () => new Date(clock).toISOString() }); // 시험 서비스
    const base = { newsId: "news", parentId: null, authorId: "member-1", nickname: "회원", image: null }; // 기본 입력
    await service.create({ ...base, content: "첫 댓글" }); // 첫 댓글 작성
    await assert.rejects(service.create({ ...base, content: "바로 다음 댓글" }), expectServiceError("TOO_FAST", /30초 뒤에/)); // 연속 작성 차단
    assert.equal((await service.create({ ...base, authorId: "member-2", content: "첫 댓글" })).authorId, "member-2"); // 다른 회원은 영향 없음
    clock += 31_000; // 31초 뒤
    await assert.rejects(service.create({ ...base, content: " 첫   댓글 " }), expectServiceError("DUPLICATE_CONTENT")); // 같은 내용 반복 차단
    await assert.rejects(service.create({ ...base, content: "바카라 사이트 가입" }), expectServiceError("INVALID_CONTENT", /사용할 수 없는 표현/)); // 금칙어 차단
    for (const content of ["둘째", "셋째", "넷째", "다섯째"]) // 허용 범위 작성 반복
    { // 반복 시작
        await service.create({ ...base, content }); // 댓글 작성
        clock += 31_000; // 31초 뒤
    } // 반복 끝
    await assert.rejects(service.create({ ...base, content: "여섯째" }), expectServiceError("RATE_LIMITED", /10분 동안 댓글을 5개까지/)); // 작성 수 차단
    assert.equal((await service.list("news")).filter((comment) => comment.authorId === "member-1").length, 5); // 막힌 댓글은 저장되지 않음
    clock += 10 * 60_000; // 10분 뒤
    assert.equal((await service.create({ ...base, content: "여섯째" })).content, "여섯째"); // 구간이 지나면 다시 작성
}); // 테스트 끝

test("Supabase 댓글 서비스는 올리기 전에 최근 댓글로 확인하고 데이터베이스 차단도 같은 안내로 바꾼다", async () => // 원격 서비스 검사
{ // 테스트 시작
    const calls = []; // 요청 기록
    const uploads = []; // 업로드 기록
    function createClient(rows, insertError = null) // 가짜 클라이언트 생성
    { // 함수 시작
        const builder = (state) => ({ select() { return this; }, insert(values) { state.action = "insert"; state.values = values; return this; }, eq() { return this; }, gte() { return this; }, order() { return this; }, limit() { return this; }, single() { return this; }, then(resolve) { calls.push(state.action); return Promise.resolve(state.action === "insert" ? { data: insertError ? null : { id: "c-1", news_id: "n", parent_id: null, author_id: "m", content: state.values.content, image_path: null, created_at: ago(0) }, error: insertError } : { data: rows, error: null }).then(resolve); } }); // 가짜 질의
        return { from: () => builder({ action: "select" }), storage: { from: () => ({ async upload(path) { uploads.push(path); return { data: { path }, error: null }; }, async remove() { return { data: [], error: null }; }, getPublicUrl: (path) => ({ data: { publicUrl: path } }) }) } }; // 가짜 클라이언트 반환
    } // 함수 끝
    const input = { newsId: "n", parentId: null, authorId: "m", nickname: "회원", content: "새 댓글", image: { url: "", type: "image/png", size: 5, file: new Blob(["i"]) } }; // 이미지 포함 입력
    await assert.rejects(createSupabaseCommentService({ client: createClient([{ content: "이전", created_at: ago(5) }]), now: () => NOW }).create(input), expectServiceError("TOO_FAST", /25초 뒤에/)); // 연속 작성 차단
    await assert.rejects(createSupabaseCommentService({ client: createClient([{ content: "새  댓글", created_at: ago(7200) }]), now: () => NOW }).create(input), expectServiceError("DUPLICATE_CONTENT")); // 같은 내용 차단
    assert.deepEqual([calls, uploads], [["select", "select"], []]); // 막힌 댓글은 이미지 업로드·저장 요청 없음
    assert.equal((await createSupabaseCommentService({ client: createClient([{ content: "이전", created_at: ago(60) }]), now: () => NOW }).create(input)).content, "새 댓글"); // 정상 작성
    await assert.rejects(createSupabaseCommentService({ client: createClient([], { code: "P0001", message: "COMMENT_RATE_LIMITED" }), now: () => NOW }).create(input), expectServiceError("RATE_LIMITED", /잠시 뒤에/)); // 데이터베이스 차단 변환
    for (const [marker, code] of [["COMMENT_TOO_FAST", "TOO_FAST"], ["COMMENT_RATE_LIMITED", "RATE_LIMITED"], ["COMMENT_DUPLICATE", "DUPLICATE_CONTENT"], ["COMMENT_TOO_MANY_LINKS", "INVALID_CONTENT"], ["COMMENT_BANNED_WORD", "INVALID_CONTENT"]]) // 차단 표시 반복
    { // 반복 시작
        assert.equal(toCommentServiceError({ code: "P0001", message: marker }).code, code, marker); // 표시별 오류 코드 확인
    } // 반복 끝
    assert.equal(toCommentServiceError({ code: "P0001", message: "INVALID_COMMENT_PARENT" }).code, "INVALID_PARENT"); // 기존 답글 오류 유지 확인
}); // 테스트 끝

test("데이터베이스 제한은 화면 규칙과 같은 수치·금칙어를 쓰고 적용 순서에 들어 있다", () => // 마이그레이션 일치 검사
{ // 테스트 시작
    const file = "202610040002_comment_limits.sql"; // 작성 제한 마이그레이션
    const sql = read(`supabase/migrations/${file}`); // 마이그레이션 내용
    assert.equal(SUPABASE_MIGRATIONS.at(-1), file); // 마지막 적용 순서 확인
    assert.match(read("README.md"), new RegExp(`supabase/migrations/${file.replace(".", "\\.")}`)); // README 안내 확인
    assert.ok(sql.includes(`interval '${COMMENT_MIN_INTERVAL_SECONDS} seconds'`)); // 최소 간격 일치
    assert.ok(sql.includes(`interval '${COMMENT_WINDOW_MINUTES} minutes'`)); // 제한 구간 일치
    assert.ok(sql.includes(`recent_count >= ${COMMENT_WINDOW_MAX} then`)); // 구간 최대 수 일치
    assert.ok(sql.includes(`interval '${COMMENT_DUPLICATE_HOURS} hours'`)); // 같은 내용 금지 기간 일치
    assert.ok(sql.includes(`> ${COMMENT_MAX_LINKS} then raise exception 'COMMENT_TOO_MANY_LINKS'`)); // 링크 수 일치
    assert.deepEqual([...sql.matchAll(/^\s+\('([^']+)'\),? --/gm)].map((match) => match[1]), [...COMMENT_BANNED_WORDS]); // 금칙어 목록 일치
    for (const marker of ["COMMENT_TOO_FAST", "COMMENT_RATE_LIMITED", "COMMENT_DUPLICATE", "COMMENT_TOO_MANY_LINKS", "COMMENT_BANNED_WORD"]) // 차단 표시 반복
    { // 반복 시작
        assert.ok(sql.includes(`raise exception '${marker}'`), marker); // 차단 표시 확인
        assert.ok(read("lib/comments/supabase-service.ts").includes(`"${marker}"`), marker); // 화면 쪽 변환 확인
    } // 반복 끝
    assert.match(sql, /security definer[^\n]*\nset search_path = ''/); // 고정 검색 경로 확인
    assert.match(sql, /revoke all on function public\.enforce_comment_limits\(\) from public, anon, authenticated;/); // 직접 실행 차단 확인
    assert.match(sql, /before insert or update of content on public\.news_comments/); // 작성·내용 수정 때 실행 확인
    assert.match(sql, /if tg_op = 'INSERT' then[\s\S]*pg_advisory_xact_lock/); // 동시 작성 직렬화 확인
    assert.match(sql, /alter table public\.comment_banned_words enable row level security;/); // 금칙어 행 보안 확인
    assert.equal((sql.match(/\(select public\.is_admin\(\)\)/g) ?? []).length, 3); // 금칙어는 관리자만 읽기·추가·삭제 확인
}); // 테스트 끝

test("댓글 화면은 규칙을 미리 알려 주고 내용 오류를 입력 칸에 표시하며 관리자 화면은 자동 감지 사유를 보여 준다", () => // 화면 연결 검사
{ // 테스트 시작
    const panel = read("app/news/[id]/comments-panel.tsx"); // 댓글 화면
    assert.match(panel, /const COMMENT_RULE_HINT = `링크는 \$\{COMMENT_MAX_LINKS\}개까지 넣을 수 있고, 댓글은 \$\{COMMENT_MIN_INTERVAL_SECONDS\}초에 한 번 쓸 수 있습니다\.`/); // 규칙 안내가 수치를 따라가는지 확인
    assert.match(panel, /id="comment-content-hint">\{COMMENT_RULE_HINT\}/); // 안내 표시 확인
    assert.match(panel, /aria-describedby=\{contentError \? "comment-content-error comment-content-hint" : "comment-content-hint"\}/); // 안내·오류 연결 확인
    assert.match(panel, /CONTENT_ERROR_CODES\.includes\(error\.code\)\)[\s\S]*?setContentError\(error\.message\)[\s\S]*?contentInputRef\.current\?\.focus\(\)/); // 내용 오류를 입력 칸에 표시하고 포커스 확인
    assert.match(read("app/news/[id]/news-detail.module.css"), /\.fieldHint \/\* 댓글 작성 규칙 안내 \*\//); // 안내 스타일 확인
    assert.deepEqual(describeCommentFlags("좋은 댓글 https://a.example"), []); // 정상 댓글 감지 없음
    assert.deepEqual(describeCommentFlags("씨 발 http://1.example http://2.example http://3.example"), [`링크 3개(허용 ${COMMENT_MAX_LINKS}개)`, "금칙어 포함"]); // 감지 사유 문구
    assert.deepEqual(describeCommentFlags(createDemoModerationItems()[0].content), [`링크 3개(허용 ${COMMENT_MAX_LINKS}개)`]); // 시연 광고 댓글 감지
    const board = read("app/admin/comments/moderation-board.tsx"); // 관리자 댓글 관리 화면
    assert.match(board, /item\.status === "deleted" \? \[\] : describeCommentFlags\(item\.content\)/); // 삭제 댓글 제외 확인
    assert.match(board, /className="moderation-flags"><strong>자동 감지<\/strong>/); // 감지 표시 확인
    assert.match(read("app/admin/admin.css"), /\.moderation-flags \/\* 자동 감지 사유 \*\//); // 감지 스타일 확인
}); // 테스트 끝
