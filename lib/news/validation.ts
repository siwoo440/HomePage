import { NEWS_STATUSES, NEWS_TAGS } from "./types.ts"; // 허용 값 목록
import type { ImageLike, NewsPostInput, NewsStatus, NewsTag, NewsValidationErrors, NewsValidationResult, ValidatedNewsPost } from "./types.ts"; // 뉴스 형식 목록

const MAX_TITLE_LENGTH = 120; // 제목 최대 길이
const MAX_SUMMARY_LENGTH = 300; // 요약 최대 길이
const MAX_CONTENT_LENGTH = 50000; // 본문 최대 길이
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 이미지 최대 크기
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]); // 허용 이미지 형식

function isNewsTag(value: string): value is NewsTag // 태그 형식 판정
{ // 함수 시작
    return NEWS_TAGS.includes(value as NewsTag); // 허용 태그 포함 결과
} // 함수 끝

function isNewsStatus(value: string): value is NewsStatus // 상태 형식 판정
{ // 함수 시작
    return NEWS_STATUSES.includes(value as NewsStatus); // 허용 상태 포함 결과
} // 함수 끝

export function validateNewsPost(input: NewsPostInput): NewsValidationResult // 게시물 입력 검증
{ // 함수 시작
    const title = input.title.trim(); // 제목 공백 정리
    const summary = input.summary.trim(); // 요약 공백 정리
    const content = input.content.trim(); // 본문 공백 정리
    const uniqueTags = Array.from(new Set(input.tags)); // 중복 태그 제거
    const errors: NewsValidationErrors = {}; // 필드 오류 저장소

    if (!title) // 제목 누락 확인
    { // 조건 시작
        errors.title = "제목을 입력해 주세요."; // 제목 누락 안내
    } // 조건 끝
    else if (title.length > MAX_TITLE_LENGTH) // 제목 길이 확인
    { // 조건 시작
        errors.title = `제목은 ${MAX_TITLE_LENGTH}자 이하여야 합니다.`; // 제목 길이 안내
    } // 조건 끝

    if (summary.length > MAX_SUMMARY_LENGTH) // 요약 길이 확인
    { // 조건 시작
        errors.summary = `요약은 ${MAX_SUMMARY_LENGTH}자 이하여야 합니다.`; // 요약 길이 안내
    } // 조건 끝

    if (!content) // 본문 누락 확인
    { // 조건 시작
        errors.content = "본문을 입력해 주세요."; // 본문 누락 안내
    } // 조건 끝
    else if (content.length > MAX_CONTENT_LENGTH) // 본문 길이 확인
    { // 조건 시작
        errors.content = `본문은 ${MAX_CONTENT_LENGTH.toLocaleString("ko-KR")}자 이하여야 합니다.`; // 본문 길이 안내
    } // 조건 끝

    if (uniqueTags.length === 0 || !uniqueTags.every(isNewsTag)) // 태그 허용 확인
    { // 조건 시작
        errors.tags = "허용된 태그를 선택해 주세요."; // 태그 오류 안내
    } // 조건 끝

    if (!isNewsStatus(input.status)) // 상태 허용 확인
    { // 조건 시작
        errors.status = "공개 상태를 확인해 주세요."; // 상태 오류 안내
    } // 조건 끝

    if (Object.keys(errors).length > 0) // 오류 존재 확인
    { // 조건 시작
        return { errors, value: null }; // 실패 결과 반환
    } // 조건 끝

    const value: ValidatedNewsPost = // 검증 값 시작
    { // 검증 값 객체
        title, // 정리된 제목
        summary, // 정리된 요약
        content, // 정리된 본문
        tags: uniqueTags as NewsTag[], // 정리된 태그
        status: input.status as NewsStatus, // 정리된 상태
    }; // 검증 값 끝
    return { errors, value }; // 성공 결과 반환
} // 함수 끝

export function validateCoverImage(file: ImageLike | null): string | null // 대표 이미지 검증
{ // 함수 시작
    if (!file) // 이미지 없음 확인
    { // 조건 시작
        return null; // 이미지 없음 허용
    } // 조건 끝

    if (file.size > MAX_IMAGE_SIZE) // 이미지 크기 확인
    { // 조건 시작
        return "이미지는 5MB 이하여야 합니다."; // 크기 오류 반환
    } // 조건 끝

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) // 이미지 형식 확인
    { // 조건 시작
        return "JPG, PNG, WebP 이미지만 사용할 수 있습니다."; // 형식 오류 반환
    } // 조건 끝

    return null; // 정상 이미지 결과
} // 함수 끝
