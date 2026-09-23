import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { processAgeVerification } from "../lib/age-gate/request.ts"; // 인증 요청 처리 함수
import { verifyAgeVerificationToken } from "../lib/age-gate/verification.ts"; // 인증 토큰 검증 함수

const NOW = new Date("2026-09-12T00:00:00.000Z"); // 기준 날짜
const SECRET = "test-secret"; // 테스트 서명 키

test("서명 키가 없으면 인증 요청을 닫는다", async () => // 설정 누락 검증
{ // 테스트 시작
    const result = await processAgeVerification({ birthDate: "2000-01-01", agreed: true, returnTo: "/project_h/ProjectH_Main.html" }, NOW, null); // 설정 누락 요청
    assert.deepEqual(result, { ok: false, status: 503, message: "성인 확인 설정이 준비되지 않았습니다." }); // 닫힌 응답 확인
}); // 테스트 끝

test("동의하지 않은 요청과 잘못된 날짜를 구분한다", async () => // 입력 오류 검증
{ // 테스트 시작
    const notAgreed = await processAgeVerification({ birthDate: "2000-01-01", agreed: false, returnTo: "/project_h/ProjectH_Main.html" }, NOW, SECRET); // 동의 누락 요청
    const invalidDate = await processAgeVerification({ birthDate: "2000-02-30", agreed: true, returnTo: "/project_h/ProjectH_Main.html" }, NOW, SECRET); // 잘못된 날짜 요청
    assert.deepEqual(notAgreed, { ok: false, status: 400, message: "만 19세 이상임에 동의해 주세요." }); // 동의 오류 확인
    assert.deepEqual(invalidDate, { ok: false, status: 400, message: "올바른 생년월일을 입력해 주세요." }); // 날짜 오류 확인
}); // 테스트 끝

test("미성년 요청은 토큰 없이 거부한다", async () => // 미성년 차단 검증
{ // 테스트 시작
    const result = await processAgeVerification({ birthDate: "2007-09-13", agreed: true, returnTo: "/project_h/ProjectH_Main.html" }, NOW, SECRET); // 미성년 요청
    assert.deepEqual(result, { ok: false, status: 403, message: "만 19세 이상만 열람할 수 있습니다." }); // 미성년 응답 확인
}); // 테스트 끝

test("성인 요청은 안전한 복귀 주소와 유효한 토큰을 반환한다", async () => // 정상 인증 검증
{ // 테스트 시작
    const result = await processAgeVerification({ birthDate: "2000-01-01", agreed: true, returnTo: "https://evil.example" }, NOW, SECRET); // 성인 요청
    assert.equal(result.ok, true); // 성공 여부 확인
    if (!result.ok) // 형식 축소 조건
    { // 조건 시작
        assert.fail("성인 인증 실패"); // 예기치 않은 실패
    } // 조건 끝
    assert.equal(result.status, 200); // 상태 코드 확인
    assert.equal(result.returnTo, "/main.html#games"); // 외부 복귀 주소 대체
    assert.equal(await verifyAgeVerificationToken(result.token, NOW.getTime() + 1, SECRET), true); // 발급 토큰 확인
}); // 테스트 끝

test("객체가 아닌 요청 본문을 거부한다", async () => // 본문 형식 검증
{ // 테스트 시작
    const result = await processAgeVerification(null, NOW, SECRET); // 빈 본문 요청
    assert.deepEqual(result, { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }); // 본문 오류 확인
}); // 테스트 끝
