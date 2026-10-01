import { REPORT_REASONS, validateCommentContent, validateCommentImage, type ReportReason } from "./domain.ts"; // 댓글 도메인 규칙
import { CommentServiceError, type CommentImageInput } from "./service.ts"; // 댓글 서비스 오류 형식

export const REPORT_DETAIL_MAX_LENGTH = 500; // 신고 상세 최대 길이

export function requireCommentContent(content: string): string // 댓글 내용 확인
{ // 함수 시작
    const result = validateCommentContent(content); // 댓글 내용 검증

    if (!result.ok) // 내용 오류 확인
    { // 조건 시작
        throw new CommentServiceError("INVALID_CONTENT", result.message); // 내용 오류 발생
    } // 조건 끝

    return result.value; // 정리된 내용 반환
} // 함수 끝

export function requireCommentImage(image: CommentImageInput | null): CommentImageInput | null // 댓글 이미지 확인
{ // 함수 시작
    const result = validateCommentImage(image); // 이미지 규칙 검사

    if (!result.ok) // 이미지 오류 확인
    { // 조건 시작
        throw new CommentServiceError("INVALID_IMAGE", result.message); // 이미지 오류 발생
    } // 조건 끝

    return image; // 정상 이미지 반환
} // 함수 끝

export function requireReportReason(reason: string): ReportReason // 신고 사유 확인
{ // 함수 시작
    const matched = REPORT_REASONS.find((item) => item.value === reason); // 신고 사유 찾기

    if (!matched) // 신고 사유 없음 확인
    { // 조건 시작
        throw new CommentServiceError("INVALID_REPORT_REASON", "신고 사유를 다시 선택해 주세요."); // 신고 사유 오류 발생
    } // 조건 끝

    return matched.value; // 정상 신고 사유 반환
} // 함수 끝

export function requireReportDetail(detail: string): string // 신고 상세 확인
{ // 함수 시작
    const value = detail.trim(); // 신고 상세 정리

    if (value.length > REPORT_DETAIL_MAX_LENGTH) // 상세 길이 확인
    { // 조건 시작
        throw new CommentServiceError("REPORT_DETAIL_TOO_LONG", "신고 상세 내용은 500자 이하로 입력해 주세요."); // 상세 길이 오류 발생
    } // 조건 끝

    return value; // 정리된 상세 반환
} // 함수 끝
