import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격 검증 도구
import { createCompleteFieldErrors, focusFirstInvalidField, getFieldErrorId, getFirstInvalidField, hasFieldErrors, preventInvalidFormSubmission } from "../lib/forms/validation.ts"; // 폼 오류 도구

test("화면 순서에서 첫 오류 필드를 찾는다", () => // 첫 오류 탐색 검증
{ // 테스트 시작
    const errors = { content: "본문 오류", title: "제목 오류" }; // 순서와 다른 오류 객체
    assert.equal(getFirstInvalidField(["title", "summary", "content"], errors), "title"); // 화면 첫 오류 확인
    assert.equal(getFirstInvalidField(["title", "summary"], {}), null); // 오류 없음 확인
    assert.equal(hasFieldErrors(errors), true); // 오류 존재 확인
    assert.equal(hasFieldErrors({ title: undefined }), false); // 빈 오류 확인
}); // 테스트 끝

test("첫 오류 입력으로 포커스를 이동한다", () => // 오류 포커스 검증
{ // 테스트 시작
    const focused = []; // 포커스 기록
    const form = // 가짜 폼 시작
    { // 가짜 폼 객체
        querySelector(selector) // 입력 탐색 함수
        { // 함수 시작
            return selector === '[name="content"]' ? { focus: () => focused.push(selector) } : null; // 본문 입력 반환
        }, // 함수 끝
    }; // 가짜 폼 끝
    const result = focusFirstInvalidField(form, ["title", "content"], { content: "본문 오류" }); // 포커스 이동 실행
    assert.equal(result, "content"); // 첫 오류 이름 확인
    assert.deepEqual(focused, ['[name="content"]']); // 포커스 호출 확인
}); // 테스트 끝

test("필드 오류 식별자를 안전한 형식으로 만든다", () => // 오류 식별자 검증
{ // 테스트 시작
    assert.equal(getFieldErrorId("product-editor", "salesUrl"), "product-editor-sales-url-error"); // 식별자 변환 확인
}); // 테스트 끝

test("잘못된 폼만 제출을 차단하고 첫 오류에 포커스한다", () => // 제출 차단 검증
{ // 테스트 시작
    let prevented = 0; // 제출 차단 횟수
    let focused = 0; // 포커스 횟수
    const event = // 가짜 제출 이벤트 시작
    { // 이벤트 객체
        currentTarget: { querySelector: () => ({ focus: () => focused += 1 }) }, // 가짜 폼 대상
        preventDefault: () => prevented += 1, // 기본 제출 차단
    }; // 가짜 제출 이벤트 끝
    assert.equal(preventInvalidFormSubmission(event, ["title"], { title: "제목 오류" }), true); // 잘못된 제출 차단 확인
    assert.equal(prevented, 1); // 차단 호출 확인
    assert.equal(focused, 1); // 포커스 호출 확인
    assert.equal(preventInvalidFormSubmission(event, ["title"], {}), false); // 정상 제출 허용 확인
    assert.equal(prevented, 1); // 추가 차단 없음 확인
}); // 테스트 끝

test("모든 필드 키를 포함한 오류 맵을 만든다", () => // 완전 오류 맵 검증
{ // 테스트 시작
    const errors = createCompleteFieldErrors(["title", "content"], { content: "본문 오류" }); // 완전 오류 맵 생성
    assert.deepEqual(errors, { title: undefined, content: "본문 오류" }); // 누락 필드 마스킹 확인
}); // 테스트 끝
