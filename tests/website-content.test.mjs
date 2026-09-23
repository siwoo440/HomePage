import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

test("메인 게임 목록은 내부 기획 문구를 노출하지 않는다", () => // 공개 문구 테스트
{ // 테스트 시작
    const html = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    assert.doesNotMatch(html, /기획서 ✔|기획 초안|기획 준비 중/); // 내부 문구 제거 확인
    assert.match(html, /대표 프로젝트|개발 중|기획 단계/); // 공개 상태 문구 확인
}); // 테스트 끝
