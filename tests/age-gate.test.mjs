import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { AGE_GATE_MAX_AGE_MS, isAdultGameId, isProtectedAdultPath } from "../lib/age-gate/config.ts"; // 보호 설정 함수
import { createAgeVerificationToken, isAdultBirthDate, resolveAgeGateSecret, sanitizeAgeReturnTo, verifyAgeVerificationToken } from "../lib/age-gate/verification.ts"; // 인증 규칙 함수

test("성인 게임과 보호 경로를 정확히 판정한다", () => // 보호 범위 검증
{ // 테스트 시작
    assert.equal(isAdultGameId("project-h"), true); // 프로젝트 H 확인
    assert.equal(isAdultGameId("project-u"), true); // 프로젝트 U 확인
    assert.equal(isAdultGameId("project-v"), true); // 프로젝트 V 확인
    assert.equal(isAdultGameId("project-a"), false); // 일반 프로젝트 확인
    assert.equal(isProtectedAdultPath("/project_h/ProjectH_Main.html"), true); // H 상세 경로 확인
    assert.equal(isProtectedAdultPath("/project_u/assets/cover.png"), true); // U 내부 자료 확인
    assert.equal(isProtectedAdultPath("/images/games/project-v.png"), true); // V 대표 이미지 확인
    assert.equal(isProtectedAdultPath("/images/games/project-a.png"), false); // 일반 대표 이미지 확인
    assert.equal(isProtectedAdultPath("/project_hacker/index.html"), false); // 비슷한 경로 오탐 방지
}); // 테스트 끝

test("생년월일로 만 19세 경계를 판정한다", () => // 나이 경계 검증
{ // 테스트 시작
    const today = new Date("2026-09-12T00:00:00.000Z"); // 기준 날짜
    assert.equal(isAdultBirthDate("2007-09-12", today), true); // 생일 당일 성인 확인
    assert.equal(isAdultBirthDate("2007-09-13", today), false); // 생일 전 미성년 확인
    assert.equal(isAdultBirthDate("2007-02-30", today), false); // 존재하지 않는 날짜 확인
    assert.equal(isAdultBirthDate("2027-01-01", today), false); // 미래 날짜 확인
    assert.equal(isAdultBirthDate("잘못된값", today), false); // 잘못된 형식 확인
}); // 테스트 끝

test("복귀 주소는 사이트 내부의 안전한 경로만 허용한다", () => // 복귀 주소 검증
{ // 테스트 시작
    assert.equal(sanitizeAgeReturnTo("/project_h/ProjectH_Main.html?x=1#intro"), "/project_h/ProjectH_Main.html?x=1#intro"); // 내부 주소 유지
    assert.equal(sanitizeAgeReturnTo("https://evil.example/path"), "/main.html#games"); // 외부 주소 거부
    assert.equal(sanitizeAgeReturnTo("//evil.example/path"), "/main.html#games"); // 상대 외부 주소 거부
    assert.equal(sanitizeAgeReturnTo("/project_h/\nnext"), "/main.html#games"); // 제어 문자 거부
    assert.equal(sanitizeAgeReturnTo(null), "/main.html#games"); // 빈 주소 대체
}); // 테스트 끝

test("서명 쿠키의 정상·위조·만료를 판정한다", async () => // 쿠키 검증
{ // 테스트 시작
    const token = await createAgeVerificationToken(1000, "test-secret"); // 정상 토큰 생성
    assert.equal(await verifyAgeVerificationToken(token, 1001, "test-secret"), true); // 정상 토큰 확인
    assert.equal(await verifyAgeVerificationToken(token, 1001, "wrong-secret"), false); // 다른 키 거부
    assert.equal(await verifyAgeVerificationToken(`${token}x`, 1001, "test-secret"), false); // 위조 토큰 거부
    assert.equal(await verifyAgeVerificationToken(token, 1000 + AGE_GATE_MAX_AGE_MS + 1, "test-secret"), false); // 만료 토큰 거부
    assert.equal(await verifyAgeVerificationToken(undefined, 1001, "test-secret"), false); // 빈 토큰 거부
}); // 테스트 끝

test("운영 환경은 설정된 서명 키가 없으면 닫힌다", () => // 서명 키 검증
{ // 테스트 시작
    assert.equal(resolveAgeGateSecret("production", undefined), null); // 운영 누락 거부
    assert.equal(resolveAgeGateSecret("development", undefined), "devforge-local-age-gate-only"); // 개발 대체 키 확인
    assert.equal(resolveAgeGateSecret("production", " configured-secret "), "configured-secret"); // 설정 키 정리
}); // 테스트 끝
