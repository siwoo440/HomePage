import { toggleCommentReaction, type CommentReaction, type NewsComment, type ReactionType } from "./domain.ts"; // 댓글 도메인 도구
import { requireCommentAllowed, requireCommentContent, requireCommentImage, requireReportDetail, requireReportReason } from "./rules.ts"; // 댓글 공통 규칙
import { CommentServiceError, type CommentReport, type CommentService, type CreateCommentInput, type ReportCommentInput } from "./service.ts"; // 댓글 서비스 형식

interface LocalCommentServiceOptions // 로컬 서비스 설정
{ // 형식 시작
    initialComments: NewsComment[]; // 초기 댓글 목록
    createId?: (prefix: "comment" | "report") => string; // 식별자 생성기
    now?: () => string; // 시각 생성기
} // 형식 끝

function cloneReaction(reaction: CommentReaction): CommentReaction // 반응 복제
{ // 함수 시작
    return { count: reaction.count, selectedBy: [...reaction.selectedBy] }; // 반응 사본 반환
} // 함수 끝

function cloneComment(comment: NewsComment): NewsComment // 댓글 복제
{ // 함수 시작
    return ( // 댓글 사본 반환
    { // 객체 시작
        ...comment, // 기본 댓글 값
        reactions: // 반응 사본
        { // 반응 객체 시작
            like: cloneReaction(comment.reactions.like), // 좋아요 복제
            cheer: cloneReaction(comment.reactions.cheer), // 응원 복제
            curious: cloneReaction(comment.reactions.curious), // 궁금해요 복제
        }, // 반응 객체 끝
    }); // 객체 끝
} // 함수 끝

function cloneReport(report: CommentReport): CommentReport // 신고 복제
{ // 함수 시작
    return { ...report }; // 신고 사본 반환
} // 함수 끝

function createEmptyReactions(): Record<ReactionType, CommentReaction> // 빈 반응 생성
{ // 함수 시작
    return { like: { count: 0, selectedBy: [] }, cheer: { count: 0, selectedBy: [] }, curious: { count: 0, selectedBy: [] } }; // 빈 반응 반환
} // 함수 끝

function defaultCreateId(prefix: "comment" | "report"): string // 기본 식별자 생성
{ // 함수 시작
    return `${prefix}-${crypto.randomUUID()}`; // 무작위 식별자 반환
} // 함수 끝

function defaultNow(): string // 기본 시각 생성
{ // 함수 시작
    return new Date().toISOString(); // 현재 시각 반환
} // 함수 끝

function validateParent(comments: NewsComment[], input: CreateCommentInput): string | null // 부모 댓글 검증
{ // 함수 시작
    if (input.parentId === null) // 최상위 댓글 확인
    { // 조건 시작
        return null; // 부모 없음 반환
    } // 조건 끝

    const parent = comments.find((comment) => comment.id === input.parentId); // 부모 댓글 찾기

    if (!parent || parent.newsId !== input.newsId || parent.parentId !== null) // 부모 조건 확인
    { // 조건 시작
        throw new CommentServiceError("INVALID_PARENT", "같은 뉴스의 최상위 댓글에만 답글을 작성할 수 있습니다."); // 부모 오류 발생
    } // 조건 끝

    return parent.id; // 부모 식별자 반환
} // 함수 끝

export function createLocalCommentService(options: LocalCommentServiceOptions): CommentService // 로컬 댓글 서비스 생성
{ // 함수 시작
    let comments = options.initialComments.map(cloneComment); // 내부 댓글 상태
    const reports: CommentReport[] = []; // 내부 신고 상태
    const createId = options.createId ?? defaultCreateId; // 식별자 생성기 선택
    const now = options.now ?? defaultNow; // 시각 생성기 선택

    return ( // 댓글 서비스 반환
    { // 서비스 시작
        async list(newsId: string): Promise<NewsComment[]> // 뉴스 댓글 조회
        { // 메서드 시작
            return comments.filter((comment) => comment.newsId === newsId).map(cloneComment); // 뉴스 댓글 사본 반환
        }, // 메서드 끝
        async create(input: CreateCommentInput): Promise<NewsComment> // 댓글 작성
        { // 메서드 시작
            const content = requireCommentContent(input.content); // 댓글 내용 검증
            const image = requireCommentImage(input.image); // 이미지 입력 검증
            const parentId = validateParent(comments, input); // 부모 댓글 검증
            const createdAt = now(); // 작성 시각
            requireCommentAllowed(content, comments.filter((comment) => comment.authorId === input.authorId), Date.parse(createdAt)); // 작성 빈도·반복 확인
            const created: NewsComment = // 새 댓글 생성
            { // 댓글 시작
                id: createId("comment"), // 댓글 식별자
                newsId: input.newsId, // 뉴스 식별자
                parentId, // 부모 댓글 식별자
                authorId: input.authorId, // 작성자 식별자
                nickname: input.nickname, // 작성자 이름
                content, // 정리된 댓글 내용
                imageUrl: image?.url ?? null, // 이미지 주소
                createdAt, // 작성 시각
                reactions: createEmptyReactions(), // 초기 반응
            }; // 댓글 끝
            comments = [...comments, created]; // 내부 댓글 추가
            return cloneComment(created); // 작성 댓글 사본 반환
        }, // 메서드 끝
        async toggleReaction(commentId: string, userId: string, reaction: ReactionType): Promise<NewsComment> // 댓글 반응 전환
        { // 메서드 시작
            const index = comments.findIndex((comment) => comment.id === commentId); // 댓글 위치 찾기

            if (index < 0) // 댓글 없음 확인
            { // 조건 시작
                throw new CommentServiceError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 댓글 없음 오류 발생
            } // 조건 끝

            const updated = toggleCommentReaction(comments[index], userId, reaction); // 반응 전환
            comments = comments.map((comment, currentIndex) => currentIndex === index ? updated : comment); // 내부 댓글 갱신
            return cloneComment(updated); // 변경 댓글 사본 반환
        }, // 메서드 끝
        async report(input: ReportCommentInput): Promise<CommentReport> // 댓글 신고
        { // 메서드 시작
            const comment = comments.find((item) => item.id === input.commentId); // 대상 댓글 찾기

            if (!comment) // 댓글 없음 확인
            { // 조건 시작
                throw new CommentServiceError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 댓글 없음 오류 발생
            } // 조건 끝

            const reason = requireReportReason(input.reason); // 신고 사유 검증
            const detail = requireReportDetail(input.detail); // 신고 상세 검증

            if (reports.some((report) => report.commentId === input.commentId && report.reporterId === input.reporterId)) // 중복 신고 확인
            { // 조건 시작
                throw new CommentServiceError("DUPLICATE_REPORT", "이미 신고한 댓글입니다."); // 중복 신고 오류 발생
            } // 조건 끝

            const report: CommentReport = // 신고 기록 생성
            { // 신고 시작
                id: createId("report"), // 신고 식별자
                commentId: input.commentId, // 댓글 식별자
                reporterId: input.reporterId, // 신고자 식별자
                reason, // 신고 사유
                detail, // 신고 상세 내용
                createdAt: now(), // 신고 시각
            }; // 신고 끝
            reports.push(report); // 내부 신고 추가
            return cloneReport(report); // 신고 사본 반환
        }, // 메서드 끝
    }); // 서비스 끝
} // 함수 끝
