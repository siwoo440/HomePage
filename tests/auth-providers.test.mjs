import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { FALLBACK_AUTH_SETTINGS, fetchAuthSettings, findSocialProvider, parseAuthSettings, SOCIAL_PROVIDERS } from "../lib/member/auth-providers.ts"; // 간편 로그인 도구

const CONFIG = { url: "https://abcdefgh.supabase.co/", publishableKey: "sb_publishable_test" }; // 테스트 연결 설정

test("간편 로그인은 카카오를 먼저 두고 한국어 조사에 맞는 버튼 문구를 쓴다", () => // 지원 목록 테스트
{ // 테스트 시작
    assert.deepEqual(SOCIAL_PROVIDERS.map((provider) => provider.id), ["kakao", "google", "apple", "discord", "x", "facebook"]); // 지원 순서 확인
    assert.equal(findSocialProvider("kakao")?.action, "카카오로 계속하기"); // 카카오 문구 확인
    assert.equal(findSocialProvider("facebook")?.action, "Facebook으로 계속하기"); // 받침 조사 확인
    for (const id of ["naver", "github", "twitch"]) // 미지원 서비스 반복
    { // 반복 시작
        assert.equal(findSocialProvider(id), null, id); // 미지원 확인
    } // 반복 끝
}); // 테스트 끝

test("Supabase 설정 응답에서 켜진 간편 로그인과 가입 정책만 읽는다", () => // 설정 해석 테스트
{ // 테스트 시작
    const parsed = parseAuthSettings({ external: { email: true, google: true, kakao: true, discord: false, github: true, twitch: true, naver: true, anonymous_users: true }, disable_signup: false, mailer_autoconfirm: true }); // 설정 해석(지원하지 않는 서비스는 켜져 있어도 제외)
    assert.deepEqual(parsed, { providers: ["kakao", "google"], emailEnabled: true, signupEnabled: true, autoConfirm: true }); // 지원 순서·정책 확인
    assert.deepEqual(parseAuthSettings({ external: { email: false }, disable_signup: true }), { providers: [], emailEnabled: false, signupEnabled: false, autoConfirm: false }); // 가입 중지 확인
    assert.equal(parseAuthSettings(null), null); // 잘못된 응답 확인
    assert.equal(parseAuthSettings("text"), null); // 문자열 응답 확인
}); // 테스트 끝

test("설정 조회는 공개 키만 보내고 실패·시간 초과 시 null을 돌려준다", async () => // 설정 조회 테스트
{ // 테스트 시작
    const requests = []; // 요청 기록
    const okFetch = async (url, options) => { requests.push([url, options.headers]); return { ok: true, json: async () => ({ external: { discord: true } }) }; }; // 정상 응답 도구
    assert.deepEqual((await fetchAuthSettings(CONFIG, okFetch)).providers, ["discord"]); // 정상 조회 확인
    assert.deepEqual(requests[0], ["https://abcdefgh.supabase.co/auth/v1/settings", { apikey: "sb_publishable_test" }]); // 주소·공개 키 확인
    assert.equal(await fetchAuthSettings(CONFIG, async () => ({ ok: false, json: async () => ({}) })), null); // 실패 응답 확인
    assert.equal(await fetchAuthSettings(CONFIG, async () => { throw new Error("offline"); }), null); // 연결 실패 확인
    const slowFetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(new Error("aborted")))); // 응답 없는 요청
    assert.equal(await fetchAuthSettings(CONFIG, slowFetch, 20), null); // 시간 초과 확인
    assert.deepEqual(FALLBACK_AUTH_SETTINGS, { providers: [], emailEnabled: true, signupEnabled: true, autoConfirm: false }); // 대체값 확인
}); // 테스트 끝
