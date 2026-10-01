import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { hasSupabaseAuthCookie, initializeMemberActions, loadServerMemberProfile, MEMBER_STATUS_ENDPOINT, parseServerMemberStatus, setServerMemberProfile } from "../public/member-session.mjs"; // 회원 상태 도구

function createAction() // 회원 버튼 대체 요소
{ // 함수 시작
    return { textContent: "", dataset: {}, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }; // 속성 기록 요소 반환
} // 함수 끝

const location = { pathname: "/devlog.html", search: "", hash: "" }; // 현재 주소 대체

test("Supabase 로그인 쿠키가 있을 때만 실제 회원 상태를 확인한다", async () => // 쿠키 확인 테스트
{ // 테스트 시작
    assert.equal(hasSupabaseAuthCookie("theme=dark; sb-abcd-auth-token=base64-xyz"), true); // 기본 쿠키 확인
    assert.equal(hasSupabaseAuthCookie("sb-abcd-auth-token.0=part; sb-abcd-auth-token.1=part"), true); // 나뉜 쿠키 확인
    assert.equal(hasSupabaseAuthCookie("sb-abcd-auth-token-code-verifier=pkce"), false); // 인증 과정 쿠키 제외 확인
    assert.equal(hasSupabaseAuthCookie(""), false); // 빈 쿠키 확인
    let called = 0; // 요청 횟수
    const fetchImpl = async () => { called += 1; return { ok: true, json: async () => ({ mode: "supabase", signedIn: true, nickname: "포지" }) }; }; // 가짜 요청 도구
    assert.equal(await loadServerMemberProfile(fetchImpl, "theme=dark"), null); // 쿠키 없음 생략 확인
    assert.equal(called, 0); // 요청 없음 확인
}); // 테스트 끝

test("서버 회원 상태는 공개 닉네임만 읽고 실패하면 로그아웃 상태로 둔다", async () => // 상태 조회 테스트
{ // 테스트 시작
    const requests = []; // 요청 기록
    const fetchImpl = async (url, options) => { requests.push([url, options]); return { ok: true, json: async () => ({ mode: "supabase", signedIn: true, nickname: " 포지 ", email: "hidden@example.com" }) }; }; // 정상 응답 도구
    assert.deepEqual(await loadServerMemberProfile(fetchImpl, "sb-abcd-auth-token=x"), { nickname: "포지", hasNickname: true }); // 닉네임만 반환 확인
    assert.deepEqual(requests[0], [MEMBER_STATUS_ENDPOINT, { credentials: "same-origin", cache: "no-store" }]); // 같은 사이트 요청 확인
    assert.deepEqual(parseServerMemberStatus({ mode: "supabase", signedIn: true, nickname: null }), { nickname: "회원", hasNickname: false }); // 닉네임 미설정 확인
    assert.equal(parseServerMemberStatus({ mode: "demo", signedIn: false, nickname: null }), null); // 시연 모드 제외 확인
    assert.equal(parseServerMemberStatus({ mode: "supabase", signedIn: false, nickname: "포지" }), null); // 로그아웃 확인
    assert.equal(await loadServerMemberProfile(async () => ({ ok: false, json: async () => ({}) }), "sb-a-auth-token=x"), null); // 실패 응답 확인
    assert.equal(await loadServerMemberProfile(async () => { throw new Error("offline"); }, "sb-a-auth-token=x"), null); // 연결 실패 확인
}); // 테스트 끝

test("확인된 실제 회원은 헤더·서랍 회원 버튼에 닉네임으로 표시된다", () => // 버튼 표시 테스트
{ // 테스트 시작
    const actions = [createAction(), createAction()]; // 헤더·서랍 버튼
    const root = { querySelectorAll: () => actions }; // 문서 대체
    try // 서버 회원 상태 검사
    { // 시도 시작
        setServerMemberProfile({ nickname: "포지", hasNickname: true }); // 닉네임 회원 저장
        initializeMemberActions(root, location, null); // 버튼 표시
        assert.equal(actions[1].textContent, "포지"); // 닉네임 표시 확인
        assert.equal(actions[1].attributes["aria-label"], "포지 회원 메뉴 (로그아웃 가능)"); // 회원 메뉴 이름 확인
        assert.equal(actions[1].dataset.memberState, "signed-in"); // 로그인 상태 확인
        setServerMemberProfile({ nickname: "회원", hasNickname: false }); // 닉네임 없는 회원 저장
        initializeMemberActions(root, location, null); // 버튼 다시 표시
        assert.equal(actions[0].attributes["aria-label"], "회원 메뉴 (닉네임 설정·로그아웃 가능)"); // 닉네임 설정 안내 확인
    } // 시도 끝
    finally // 상태 정리
    { // 정리 시작
        setServerMemberProfile(null); // 서버 회원 해제
    } // 정리 끝
    initializeMemberActions(root, location, null); // 해제 후 표시
    assert.equal(actions[0].textContent, "로그인"); // 로그인 문구 복귀 확인
}); // 테스트 끝

test("회원 상태 API는 시연 모드를 구분하고 이메일 없이 공개 정보만 응답한다", () => // 상태 API 계약
{ // 테스트 시작
    const route = fs.readFileSync("app/api/member/status/route.ts", "utf8"); // 상태 API 읽기
    assert.match(route, /mode: "demo", signedIn: false, nickname: null/); // 시연 응답 확인
    assert.match(route, /auth\.getUser\(\)/); // 서버 세션 확인
    assert.match(route, /"Cache-Control": "private, no-store"/); // 캐시 차단 확인
    assert.doesNotMatch(route, /email/); // 이메일 미노출 확인
}); // 테스트 끝
