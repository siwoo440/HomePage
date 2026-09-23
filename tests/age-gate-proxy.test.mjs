import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { getAdultAccessDecision, verifyAdultGameAccess } from "../lib/age-gate/proxy-policy.ts"; // 접근 결정 함수
import { createAgeVerificationToken } from "../lib/age-gate/verification.ts"; // 인증 토큰 생성 함수

test("일반 경로는 성인 인증 검사 대상이 아니다", async () => // 일반 경로 검증
{ // 테스트 시작
    const decision = await getAdultAccessDecision("/project_a/ProjectA_Main.html", undefined, 1001, null); // 일반 경로 판정
    assert.equal(decision, "not-protected"); // 검사 제외 확인
}); // 테스트 끝

test("인증되지 않은 직접 성인 경로는 차단한다", async () => // 직접 접근 차단 검증
{ // 테스트 시작
    assert.equal(await getAdultAccessDecision("/project_h/ProjectH_Main.html", undefined, 1001, "test-secret"), "denied"); // 상세 페이지 차단
    assert.equal(await getAdultAccessDecision("/images/games/project-u.png", undefined, 1001, "test-secret"), "denied"); // 대표 이미지 차단
    assert.equal(await getAdultAccessDecision("/project_v/assets/scene.jpg", undefined, 1001, null), "denied"); // 설정 누락 차단
}); // 테스트 끝

test("유효한 서명 쿠키만 직접 성인 경로를 허용한다", async () => // 인증 접근 검증
{ // 테스트 시작
    const token = await createAgeVerificationToken(1000, "test-secret"); // 정상 토큰 생성
    assert.equal(await getAdultAccessDecision("/project_h/ProjectH_Main.html", token, 1001, "test-secret"), "allowed"); // 정상 쿠키 허용
    assert.equal(await getAdultAccessDecision("/project_h/ProjectH_Main.html", `${token}x`, 1001, "test-secret"), "denied"); // 위조 쿠키 차단
}); // 테스트 끝

test("성인 게임 커뮤니티 피드도 유효한 쿠키만 허용한다", async () => // 성인 피드 보호 검증
{ // 테스트 시작
    const token = await createAgeVerificationToken(1000, "test-secret"); // 정상 토큰 생성
    assert.equal(await verifyAdultGameAccess("project-a", undefined, 1001, null), true); // 일반 피드 허용
    assert.equal(await verifyAdultGameAccess("project-h", undefined, 1001, "test-secret"), false); // 미인증 성인 피드 차단
    assert.equal(await verifyAdultGameAccess("project-u", token, 1001, "test-secret"), true); // 인증 성인 피드 허용
}); // 테스트 끝
