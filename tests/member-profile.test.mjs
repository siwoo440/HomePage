import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { fetchMemberProfile, MemberProfileError, NICKNAME_MAX_LENGTH, saveMemberNickname, validateNickname } from "../lib/member/profile.ts"; // 회원 프로필 도구

const MEMBER_ID = "22222222-2222-4222-8222-222222222222"; // 테스트 회원 식별자

function createFakeClient(response) // 가짜 Supabase 클라이언트 생성
{ // 함수 시작
    const calls = []; // 요청 기록
    const client = // 가짜 클라이언트
    { // 객체 시작
        from(table) // 테이블 질의 시작
        { // 함수 시작
            const state = { table, action: "select", values: null, options: null, filters: [] }; // 질의 상태
            const builder = // 질의 연결 객체
            { // 객체 시작
                select() { return builder; }, // 조회 열 설정
                upsert(values, options) { state.action = "upsert"; state.values = values; state.options = options; return builder; }, // 추가·수정 설정
                eq(column, value) { state.filters.push([column, value]); return builder; }, // 같음 조건
                single() { return builder; }, // 단일 결과 설정
                maybeSingle() { return builder; }, // 선택 단일 결과 설정
                then(resolve, reject) { calls.push(state); return Promise.resolve(typeof response === "function" ? response(state) : response).then(resolve, reject); }, // 질의 실행
            }; // 객체 끝
            return builder; // 질의 반환
        }, // 함수 끝
    }; // 객체 끝
    return { client, calls }; // 가짜 도구 반환
} // 함수 끝

test("닉네임은 공백을 정리하고 1~20자·제어 문자 없음 규칙을 지킨다", () => // 닉네임 검증 테스트
{ // 테스트 시작
    assert.deepEqual(validateNickname("  별빛   항해자 "), { ok: true, value: "별빛 항해자" }); // 공백 정리 확인
    assert.equal(validateNickname("   ").ok, false); // 빈 닉네임 거부 확인
    assert.equal(validateNickname("가".repeat(NICKNAME_MAX_LENGTH)).ok, true); // 20자 허용 확인
    assert.equal(validateNickname("가".repeat(NICKNAME_MAX_LENGTH + 1)).ok, false); // 21자 거부 확인
    assert.equal(validateNickname("😀".repeat(NICKNAME_MAX_LENGTH)).ok, true); // 이모지 글자 수 확인
    assert.equal(validateNickname("포지\u0007").ok, false); // 제어 문자 거부 확인
}); // 테스트 끝

test("본인 프로필을 조회하고 없으면 null, 실패하면 안내 오류를 낸다", async () => // 프로필 조회 테스트
{ // 테스트 시작
    const found = createFakeClient({ data: { id: MEMBER_ID, nickname: "포지" }, error: null }); // 프로필 있음
    assert.deepEqual(await fetchMemberProfile(found.client, MEMBER_ID), { id: MEMBER_ID, nickname: "포지" }); // 프로필 반환 확인
    assert.deepEqual(found.calls[0].filters, [["id", MEMBER_ID]]); // 본인 조건 확인
    assert.equal(await fetchMemberProfile(createFakeClient({ data: null, error: null }).client, MEMBER_ID), null); // 프로필 없음 확인
    await assert.rejects(fetchMemberProfile(createFakeClient({ data: null, error: { code: "08006" } }).client, MEMBER_ID), MemberProfileError); // 조회 실패 확인
}); // 테스트 끝

test("닉네임 저장은 검증 뒤 본인 프로필을 추가·수정하고 오류를 구분한다", async () => // 닉네임 저장 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => ({ data: { id: state.values.id, nickname: state.values.nickname }, error: null })); // 저장 응답 정의
    await assert.rejects(saveMemberNickname(fake.client, MEMBER_ID, "  "), { message: "닉네임을 입력해 주세요." }); // 빈 값 거부 확인
    assert.equal(fake.calls.length, 0); // 서버 요청 없음 확인
    const saved = await saveMemberNickname(fake.client, MEMBER_ID, " 포지 ", () => "2026-10-01T00:00:00.000Z"); // 닉네임 저장
    assert.deepEqual(fake.calls[0].values, { id: MEMBER_ID, nickname: "포지", updated_at: "2026-10-01T00:00:00.000Z" }); // 저장 값 확인
    assert.deepEqual(fake.calls[0].options, { onConflict: "id" }); // 본인 행 갱신 확인
    assert.deepEqual(saved, { id: MEMBER_ID, nickname: "포지" }); // 저장 결과 확인
    await assert.rejects(saveMemberNickname(createFakeClient({ data: null, error: { code: "42501" } }).client, MEMBER_ID, "포지"), { message: "로그인이 만료되었습니다. 다시 로그인해 주세요." }); // 로그인 만료 확인
    await assert.rejects(saveMemberNickname(createFakeClient({ data: null, error: { code: "08006" } }).client, MEMBER_ID, "포지"), { message: "닉네임을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }); // 일반 실패 확인
}); // 테스트 끝
