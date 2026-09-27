import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { validateCoverImage, validateNewsPost } from "../lib/news/validation.ts"; // 입력 검증 함수

test("빈 제목과 본문을 거부한다", () => // 필수 입력 검사
{ // 테스트 본문 시작
    const result = validateNewsPost( // 빈 입력 검증
    { // 게시물 입력 시작
        title: " ", // 빈 제목
        summary: "요약", // 정상 요약
        content: " ", // 빈 본문
        tags: ["update"], // 정상 태그
        status: "draft", // 정상 상태
    }); // 게시물 입력 끝
    assert.deepEqual(result.errors, // 오류 결과 검증
    { // 기대 오류 시작
        title: "제목을 입력해 주세요.", // 제목 오류
        content: "본문을 입력해 주세요.", // 본문 오류
    }); // 기대 오류 끝
}); // 테스트 본문 끝

test("허용되지 않은 태그와 상태를 거부한다", () => // 허용 목록 검사
{ // 테스트 본문 시작
    const result = validateNewsPost( // 잘못된 입력 검증
    { // 게시물 입력 시작
        title: "제목", // 정상 제목
        summary: "요약", // 정상 요약
        content: "본문", // 정상 본문
        tags: ["unknown"], // 잘못된 태그
        status: "hidden", // 잘못된 상태
    }); // 게시물 입력 끝
    assert.equal(result.errors.tags, "허용된 태그를 선택해 주세요."); // 태그 오류 검증
    assert.equal(result.errors.status, "공개 상태를 확인해 주세요."); // 상태 오류 검증
}); // 테스트 본문 끝

test("정상 입력의 공백과 중복 태그를 정리한다", () => // 입력 정규화 검사
{ // 테스트 본문 시작
    const result = validateNewsPost( // 정상 입력 검증
    { // 게시물 입력 시작
        title: "  새 소식  ", // 공백 포함 제목
        summary: "  요약  ", // 공백 포함 요약
        content: "  본문\n내용  ", // 공백 포함 본문
        tags: ["update", "update", "fix"], // 중복 태그
        status: "published", // 공개 상태
    }); // 게시물 입력 끝
    assert.deepEqual(result.errors, {}); // 오류 없음 검증
    assert.deepEqual(result.value, // 정규화 결과 검증
    { // 기대 값 시작
        title: "새 소식", // 정리된 제목
        summary: "요약", // 정리된 요약
        content: "본문\n내용", // 정리된 본문
        tags: ["update", "fix"], // 정리된 태그
        status: "published", // 유지된 상태
    }); // 기대 값 끝
}); // 테스트 본문 끝

test("5MB 초과 이미지와 잘못된 형식을 거부한다", () => // 이미지 제한 검사
{ // 테스트 본문 시작
    assert.equal(validateCoverImage({ size: 5 * 1024 * 1024 + 1, type: "image/png" }), "이미지는 5MB 이하여야 합니다."); // 크기 제한 검증
    assert.equal(validateCoverImage({ size: 1024, type: "image/gif" }), "JPG, PNG, WebP 이미지만 사용할 수 있습니다."); // 형식 제한 검증
    assert.equal(validateCoverImage({ size: 1024, type: "image/webp" }), null); // 정상 이미지 검증
    assert.equal(validateCoverImage(null), null); // 이미지 없음 검증
}); // 테스트 본문 끝
