import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readCoverImage, readNewsValues, validateCoverImage, validateNewsPost } from "../lib/news/validation.ts"; // 입력 검증 함수

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
    assert.equal(validateCoverImage({ size: 5 * 1024 * 1024, type: "image/png" }), null); // 최대 크기 이미지 검증
    assert.equal(validateCoverImage(null), null); // 이미지 없음 검증
}); // 테스트 본문 끝

test("뉴스 폼 데이터를 도메인 입력으로 변환한다", () => // 폼 변환 검사
{ // 테스트 시작
    const formData = new FormData(); // 폼 데이터 생성
    const coverImage = new File(["image"], "cover.webp", { type: "image/webp" }); // 대표 이미지 생성
    formData.set("title", "새 소식"); // 제목 설정
    formData.set("summary", "요약"); // 요약 설정
    formData.set("content", "본문"); // 본문 설정
    formData.append("tags", "update"); // 태그 설정
    formData.append("tags", "fix"); // 추가 태그 설정
    formData.set("status", "published"); // 상태 설정
    formData.set("coverImage", coverImage); // 이미지 설정
    assert.deepEqual(readNewsValues(formData), { title: "새 소식", summary: "요약", content: "본문", tags: ["update", "fix"], status: "published" }); // 입력 변환 확인
    assert.equal(readCoverImage(formData), coverImage); // 이미지 변환 확인
    const emptyFormData = new FormData(); // 빈 이미지 폼 생성
    emptyFormData.set("coverImage", new File([], "empty.png", { type: "image/png" })); // 빈 이미지 설정
    assert.equal(readCoverImage(emptyFormData), null); // 빈 이미지 제외 확인
}); // 테스트 끝

test("뉴스 문자열 최대 길이 경계를 구분한다", () => // 문자열 경계 검사
{ // 테스트 시작
    const valid = validateNewsPost({ title: "가".repeat(120), summary: "나".repeat(300), content: "다".repeat(50000), tags: ["update"], status: "draft" }); // 최대 길이 입력 검증
    const invalid = validateNewsPost({ title: "가".repeat(121), summary: "나".repeat(301), content: "다".repeat(50001), tags: ["update"], status: "draft" }); // 초과 길이 입력 검증
    assert.deepEqual(valid.errors, {}); // 최대 길이 허용 확인
    assert.equal(invalid.errors.title, "제목은 120자 이하여야 합니다."); // 제목 초과 확인
    assert.equal(invalid.errors.summary, "요약은 300자 이하여야 합니다."); // 요약 초과 확인
    assert.equal(invalid.errors.content, "본문은 50,000자 이하여야 합니다."); // 본문 초과 확인
}); // 테스트 끝
