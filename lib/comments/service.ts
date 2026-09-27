import type { NewsComment, ReactionType, ReportReason } from "./domain.ts"; // 댓글 도메인 형식

export type CommentServiceErrorCode = // 댓글 서비스 오류 코드
    | "COMMENT_NOT_FOUND" // 댓글 없음 오류
    | "INVALID_PARENT" // 부모 댓글 오류
    | "INVALID_CONTENT" // 댓글 내용 오류
    | "INVALID_IMAGE" // 댓글 이미지 오류
    | "INVALID_REPORT_REASON" // 신고 사유 오류
    | "REPORT_DETAIL_TOO_LONG" // 신고 상세 길이 오류
    | "DUPLICATE_REPORT"; // 중복 신고 오류

export class CommentServiceError extends Error // 댓글 서비스 오류
{ // 클래스 시작
    readonly code: CommentServiceErrorCode; // 오류 코드

    constructor(code: CommentServiceErrorCode, message: string) // 오류 생성자
    { // 생성자 시작
        super(message); // 기본 오류 생성
        this.name = "CommentServiceError"; // 오류 이름 설정
        this.code = code; // 오류 코드 저장
    } // 생성자 끝
} // 클래스 끝

export interface CommentImageInput // 댓글 이미지 입력
{ // 형식 시작
    url: string; // 이미지 데이터 주소
    type: string; // 이미지 MIME 형식
    size: number; // 이미지 용량
} // 형식 끝

export interface CreateCommentInput // 댓글 작성 입력
{ // 형식 시작
    newsId: string; // 뉴스 식별자
    parentId: string | null; // 부모 댓글 식별자
    authorId: string; // 작성자 식별자
    nickname: string; // 작성자 이름
    content: string; // 댓글 내용
    image: CommentImageInput | null; // 댓글 이미지
} // 형식 끝

export interface ReportCommentInput // 댓글 신고 입력
{ // 형식 시작
    commentId: string; // 댓글 식별자
    reporterId: string; // 신고자 식별자
    reason: string; // 신고 사유
    detail: string; // 신고 상세 내용
} // 형식 끝

export interface CommentReport // 댓글 신고 기록
{ // 형식 시작
    id: string; // 신고 식별자
    commentId: string; // 댓글 식별자
    reporterId: string; // 신고자 식별자
    reason: ReportReason; // 신고 사유
    detail: string; // 신고 상세 내용
    createdAt: string; // 신고 시각
} // 형식 끝

export interface CommentService // 댓글 서비스 계약
{ // 형식 시작
    list(newsId: string): Promise<NewsComment[]>; // 뉴스 댓글 조회
    create(input: CreateCommentInput): Promise<NewsComment>; // 댓글 작성
    toggleReaction(commentId: string, userId: string, reaction: ReactionType): Promise<NewsComment>; // 댓글 반응 전환
    report(input: ReportCommentInput): Promise<CommentReport>; // 댓글 신고
} // 형식 끝
