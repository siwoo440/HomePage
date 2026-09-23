import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { getMemberMode, sanitizeMemberReturnTo } from "../lib/member/config.ts"; // 회원 설정 도구
import { createDemoMemberProfile, parseDemoMemberProfile } from "../lib/member/demo-session.ts"; // 시연 회원 도구

test("Supabase 설정에 따라 실제 모드와 시연 모드를 구분한다", () => // 회원 모드 테스트
{ // 테스트 시작
    assert.equal(getMemberMode({}), "demo"); // 미설정 시연 모드
    assert.equal(getMemberMode({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key" }), "supabase"); // 설정 실제 모드
}); // 테스트 끝

test("로그인 뒤 이동 주소는 사이트 내부 경로만 허용한다", () => // 복귀 주소 테스트
{ // 테스트 시작
    assert.equal(sanitizeMemberReturnTo("/news/demo-echo-void"), "/news/demo-echo-void"); // 내부 주소 허용
    assert.equal(sanitizeMemberReturnTo("https://evil.example"), "/main.html"); // 외부 주소 차단
    assert.equal(sanitizeMemberReturnTo("//evil.example"), "/main.html"); // 상대 외부 주소 차단
    assert.equal(sanitizeMemberReturnTo("/\\evil.example"), "/main.html"); // 역슬래시 외부 주소 차단
}); // 테스트 끝

test("시연 회원 정보는 공개 표시 정보만 저장한다", () => // 시연 정보 테스트
{ // 테스트 시작
    const profile = createDemoMemberProfile("  플레이어  "); // 시연 회원 생성
    const restored = parseDemoMemberProfile(JSON.stringify(profile)); // 시연 회원 복원
    assert.equal(restored?.nickname, "플레이어"); // 닉네임 정리 확인
    assert.equal(restored?.demo, true); // 시연 상태 확인
    assert.equal(parseDemoMemberProfile(JSON.stringify({ ...profile, password: "secret" })), null); // 비밀번호 포함 차단
    assert.equal(parseDemoMemberProfile("broken"), null); // 손상 값 차단
}); // 테스트 끝
