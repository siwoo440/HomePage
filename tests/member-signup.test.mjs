import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { ensureMemberProfile, readSignupProfile, saveMemberNickname } from "../lib/member/profile.ts"; // 회원 프로필 도구
import { toAuthErrorMessage, validateConsents, validateEmail, validatePassword, validatePasswordPair, validateSignup } from "../lib/member/signup.ts"; // 가입 규칙

const MEMBER_ID = "22222222-2222-4222-8222-222222222222"; // 테스트 회원 식별자
const VALID = { email: " fan@example.com ", password: "devforge2026", passwordConfirm: "devforge2026", nickname: " 포지 ", agreeAge: true, agreeTerms: true, agreePrivacy: true }; // 정상 가입 입력

function createFakeClient(handler) // 가짜 Supabase 클라이언트 생성
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
                then(resolve, reject) { calls.push(state); return Promise.resolve(handler(state)).then(resolve, reject); }, // 질의 실행
            }; // 객체 끝
            return builder; // 질의 반환
        }, // 함수 끝
    }; // 객체 끝
    return { client, calls }; // 가짜 도구 반환
} // 함수 끝

test("이메일·비밀번호 규칙은 형식·길이·영문 숫자 조합·확인 일치를 검사한다", () => // 기본 규칙 테스트
{ // 테스트 시작
    assert.equal(validateEmail(""), "이메일을 입력해 주세요."); // 빈 이메일 확인
    assert.equal(validateEmail("fan@example"), "이메일 주소 형식을 확인해 주세요."); // 잘못된 형식 확인
    assert.equal(validateEmail(" fan@example.com "), null); // 공백 정리 확인
    assert.equal(validatePassword("abc1234"), "비밀번호는 8자 이상으로 입력해 주세요."); // 짧은 비밀번호 확인
    assert.equal(validatePassword("abcdefgh"), "비밀번호에 영문과 숫자를 함께 넣어 주세요."); // 숫자 없음 확인
    assert.equal(validatePassword("12345678"), "비밀번호에 영문과 숫자를 함께 넣어 주세요."); // 영문 없음 확인
    assert.match(validatePassword(`a1${"가".repeat(30)}`), /72자 이하/); // 바이트 초과 확인
    assert.equal(validatePassword("devforge2026"), null); // 정상 비밀번호 확인
    assert.deepEqual(validatePasswordPair("devforge2026", "devforge2027"), { passwordConfirm: "비밀번호 확인이 일치하지 않습니다." }); // 확인 불일치 확인
}); // 테스트 끝

test("가입은 필수 동의 세 가지와 닉네임을 모두 받아야 통과한다", () => // 가입 검증 테스트
{ // 테스트 시작
    assert.deepEqual(validateSignup(VALID), { ok: true, value: { email: "fan@example.com", password: "devforge2026", nickname: "포지" } }); // 정상 가입 확인
    const failed = validateSignup({ ...VALID, nickname: "", agreeAge: false, agreeTerms: false, agreePrivacy: false }); // 누락 가입
    assert.equal(failed.ok, false); // 실패 확인
    assert.deepEqual(Object.keys(failed.errors).sort(), ["agreeAge", "agreePrivacy", "agreeTerms", "nickname"]); // 누락 항목 확인
    assert.deepEqual(validateConsents({ agreeAge: true, agreeTerms: false, agreePrivacy: true }), { agreeTerms: "이용약관에 동의해 주세요." }); // 개별 동의 확인
}); // 테스트 끝

test("인증 오류 코드는 원인별 한국어 안내로 바꾸고 모르는 오류는 일반 안내를 쓴다", () => // 오류 안내 테스트
{ // 테스트 시작
    assert.match(toAuthErrorMessage({ code: "weak_password" }), /보안 기준/); // 약한 비밀번호 확인
    assert.match(toAuthErrorMessage({ code: "over_email_send_rate_limit" }), /잠시 후/); // 요청 제한 확인
    assert.match(toAuthErrorMessage({ status: 429 }), /잠시 후/); // 상태 코드 제한 확인
    assert.equal(toAuthErrorMessage({ code: "signup_disabled" }), "현재 회원가입을 받지 않습니다."); // 가입 중지 확인
    assert.match(toAuthErrorMessage({ code: "same_password" }), /다른 비밀번호/); // 같은 비밀번호 확인
    assert.match(toAuthErrorMessage({ code: "email_not_confirmed" }), /이메일 인증/); // 미인증 확인
    assert.equal(toAuthErrorMessage(null), "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 기본 안내 확인
}); // 테스트 끝

test("이메일 가입 정보가 있으면 첫 로그인 때 닉네임과 동의 시각으로 프로필을 만든다", async () => // 프로필 자동 생성 테스트
{ // 테스트 시작
    const agreedAt = "2026-10-01T05:00:00.000Z"; // 동의 시각
    const user = { id: MEMBER_ID, user_metadata: { nickname: " 포지 ", consent_agreed_at: agreedAt } }; // 이메일 가입 회원
    assert.deepEqual(readSignupProfile(user), { nickname: "포지", consentAt: agreedAt }); // 가입 정보 읽기 확인
    assert.equal(readSignupProfile({ id: MEMBER_ID, user_metadata: { nickname: "구글이름" } }), null); // 동의 없는 간편 로그인 제외 확인
    const fake = createFakeClient((state) => state.action === "select" ? { data: null, error: null } : { data: { id: state.values.id, nickname: state.values.nickname }, error: null }); // 프로필 없음 응답
    const created = await ensureMemberProfile(fake.client, user, () => "2026-10-01T06:00:00.000Z"); // 프로필 준비
    assert.deepEqual(created, { id: MEMBER_ID, nickname: "포지" }); // 생성 결과 확인
    assert.deepEqual(fake.calls[1].values, { id: MEMBER_ID, nickname: "포지", updated_at: "2026-10-01T06:00:00.000Z", terms_agreed_at: agreedAt, privacy_agreed_at: agreedAt, age_confirmed_at: agreedAt }); // 동의 기록 저장 확인
    const existing = createFakeClient(() => ({ data: { id: MEMBER_ID, nickname: "기존" }, error: null })); // 기존 프로필 응답
    assert.deepEqual(await ensureMemberProfile(existing.client, user), { id: MEMBER_ID, nickname: "기존" }); // 기존 프로필 유지 확인
    assert.equal(existing.calls.length, 1); // 추가 저장 없음 확인
    const oauth = createFakeClient(() => ({ data: null, error: null })); // 간편 로그인 응답
    assert.equal(await ensureMemberProfile(oauth.client, { id: MEMBER_ID, user_metadata: { full_name: "실명" } }), null); // 실명 자동 공개 방지 확인
}); // 테스트 끝

test("닉네임만 바꿀 때는 동의 기록을 건드리지 않는다", async () => // 닉네임 변경 테스트
{ // 테스트 시작
    const fake = createFakeClient((state) => ({ data: { id: state.values.id, nickname: state.values.nickname }, error: null })); // 저장 응답
    await saveMemberNickname(fake.client, MEMBER_ID, "새이름", () => "2026-10-01T07:00:00.000Z"); // 닉네임 변경
    assert.deepEqual(fake.calls[0].values, { id: MEMBER_ID, nickname: "새이름", updated_at: "2026-10-01T07:00:00.000Z" }); // 동의 열 제외 확인
}); // 테스트 끝
