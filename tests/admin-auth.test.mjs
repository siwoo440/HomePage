import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { isAdminUser } from "../lib/auth/admin-policy.ts"; // 관리자 판정 함수
import { getLoginMessage } from "../lib/auth/login-message.ts"; // 로그인 안내 판정 함수

test("이메일과 관리자 역할이 모두 일치해야 관리자다", () => // 이중 권한 검사
{ // 테스트 본문 시작
    const admin = // 관리자 사용자 시작
    { // 관리자 사용자 객체
        email: "Owner@Example.com", // 대소문자 포함 이메일
        app_metadata: // 앱 권한 정보 시작
        { // 앱 권한 정보 객체
            role: "admin", // 관리자 역할
        }, // 앱 권한 정보 끝
    }; // 관리자 사용자 끝
    const member = // 일반 사용자 시작
    { // 일반 사용자 객체
        email: "owner@example.com", // 관리자와 같은 이메일
        app_metadata: // 앱 권한 정보 시작
        { // 앱 권한 정보 객체
            role: "member", // 일반 역할
        }, // 앱 권한 정보 끝
    }; // 일반 사용자 끝
    assert.equal(isAdminUser(admin, "owner@example.com"), true); // 관리자 허용 검증
    assert.equal(isAdminUser(member, "owner@example.com"), false); // 역할 불일치 거부
    assert.equal(isAdminUser(admin, "other@example.com"), false); // 이메일 불일치 거부
    assert.equal(isAdminUser(null, "owner@example.com"), false); // 사용자 없음 거부
}); // 테스트 본문 끝

test("Supabase 미설정 상태를 로그인 화면에서 즉시 안내한다", () => // 설정 안내 검사
{ // 테스트 본문 시작
    assert.equal(getLoginMessage(false, ""), "Supabase 설정이 아직 등록되지 않았습니다."); // 미설정 안내 검증
    assert.equal(getLoginMessage(true, "forbidden"), "이 계정에는 관리자 권한이 없습니다."); // 권한 안내 검증
    assert.equal(getLoginMessage(true, ""), ""); // 정상 초기 상태 검증
}); // 테스트 본문 끝
