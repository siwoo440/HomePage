export const COMMENT_IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 이미지 최대 용량
export const COMMENT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const; // 이미지 허용 형식
export const REACTION_TYPES = ["like", "cheer", "curious"] as const; // 반응 종류
export const REPORT_REASONS = // 신고 사유 목록
[ // 목록 시작
    { value: "spam", label: "스팸·도배" }, // 스팸 사유
    { value: "harassment", label: "욕설·괴롭힘" }, // 괴롭힘 사유
    { value: "adult", label: "성인·유해 콘텐츠" }, // 유해 사유
    { value: "privacy", label: "개인정보 노출" }, // 개인정보 사유
    { value: "other", label: "기타" }, // 기타 사유
] as const; // 목록 끝

export type ReactionType = typeof REACTION_TYPES[number]; // 반응 형식
export type ReportReason = typeof REPORT_REASONS[number]["value"]; // 신고 사유 형식

export interface CommentReaction // 댓글 반응 형식
{ // 형식 시작
    count: number; // 반응 수
    selectedBy: string[]; // 선택 회원 목록
} // 형식 끝

export interface NewsComment // 뉴스 댓글 형식
{ // 형식 시작
    id: string; // 댓글 식별자
    newsId: string; // 뉴스 식별자
    parentId: string | null; // 부모 댓글 식별자
    authorId: string; // 작성자 식별자
    nickname: string; // 작성자 이름
    content: string; // 댓글 내용
    imageUrl: string | null; // 첨부 이미지 주소
    createdAt: string; // 작성 시각
    reactions: Record<ReactionType, CommentReaction>; // 반응 상태
} // 형식 끝

interface CommentImageLike // 댓글 이미지 입력 형식
{ // 형식 시작
    type: string; // 파일 형식
    size: number; // 파일 용량
} // 형식 끝

type ValidationResult<T> = { ok: true; value: T } | { ok: false; message: string }; // 검증 결과 형식

export function validateCommentContent(content: string): ValidationResult<string> // 댓글 내용 검증
{ // 함수 시작
    const value = content.trim(); // 입력 공백 정리

    if (value.length < 1) // 빈 내용 확인
    { // 조건 시작
        return { ok: false, message: "댓글 내용을 입력해 주세요." }; // 빈 내용 오류
    } // 조건 끝

    if (value.length > 2000) // 최대 길이 확인
    { // 조건 시작
        return { ok: false, message: "댓글은 2,000자 이하로 입력해 주세요." }; // 긴 내용 오류
    } // 조건 끝

    return { ok: true, value }; // 정상 내용 반환
} // 함수 끝

export function validateCommentImage(file: CommentImageLike | null): ValidationResult<CommentImageLike | null> // 댓글 이미지 검증
{ // 함수 시작
    if (!file) // 이미지 없음 확인
    { // 조건 시작
        return { ok: true, value: null }; // 이미지 없음 허용
    } // 조건 끝

    if (!COMMENT_IMAGE_TYPES.includes(file.type as typeof COMMENT_IMAGE_TYPES[number])) // 파일 형식 확인
    { // 조건 시작
        return { ok: false, message: "JPG, PNG, WebP, GIF 이미지만 올릴 수 있습니다." }; // 형식 오류
    } // 조건 끝

    if (file.size > COMMENT_IMAGE_MAX_BYTES) // 파일 용량 확인
    { // 조건 시작
        return { ok: false, message: "이미지는 5MB 이하만 올릴 수 있습니다." }; // 용량 오류
    } // 조건 끝

    return { ok: true, value: file }; // 정상 이미지 반환
} // 함수 끝

function createReaction(count: number): CommentReaction // 반응 상태 생성
{ // 함수 시작
    return { count, selectedBy: [] }; // 반응 상태 반환
} // 함수 끝

export function createDemoComments(newsId: string): NewsComment[] // 시연 댓글 생성
{ // 함수 시작
    return [ // 댓글 목록 반환
        { id: "demo-comment-1", newsId, parentId: null, authorId: "demo-reader-1", nickname: "별빛항해자", content: "개발 과정을 상세하게 볼 수 있어 좋네요. 다음 소식도 기대하고 있습니다!", imageUrl: null, createdAt: "2025-04-28T12:20:00+09:00", reactions: { like: createReaction(12), cheer: createReaction(6), curious: createReaction(2) } }, // 첫 댓글
        { id: "demo-comment-2", newsId, parentId: "demo-comment-1", authorId: "demo-reader-2", nickname: "네온캣", content: "저도 새 음향 효과가 가장 궁금합니다.", imageUrl: null, createdAt: "2025-04-28T13:05:00+09:00", reactions: { like: createReaction(4), cheer: createReaction(1), curious: createReaction(1) } }, // 첫 답글
        { id: "demo-comment-3", newsId, parentId: null, authorId: "demo-reader-3", nickname: "픽셀정비사", content: "테스트 일정이 공개되면 바로 참여하고 싶어요.", imageUrl: null, createdAt: "2025-04-29T09:40:00+09:00", reactions: { like: createReaction(8), cheer: createReaction(3), curious: createReaction(5) } }, // 둘째 댓글
    ]; // 댓글 목록 끝
} // 함수 끝

export function toggleCommentReaction(comment: NewsComment, userId: string, nextType: ReactionType): NewsComment // 댓글 반응 전환
{ // 함수 시작
    const reactions = Object.fromEntries(REACTION_TYPES.map((type) => // 반응 복사 시작
    { // 매핑 시작
        const selectedBy = comment.reactions[type].selectedBy.filter((id) => id !== userId); // 기존 사용자 제거
        return [type, { count: Math.max(0, comment.reactions[type].count - (comment.reactions[type].selectedBy.includes(userId) ? 1 : 0)), selectedBy }]; // 정리 반응 반환
    })) as Record<ReactionType, CommentReaction>; // 반응 형식 지정
    const wasSelected = comment.reactions[nextType].selectedBy.includes(userId); // 같은 반응 선택 여부

    if (!wasSelected) // 새 반응 확인
    { // 조건 시작
        reactions[nextType] = { count: reactions[nextType].count + 1, selectedBy: [...reactions[nextType].selectedBy, userId] }; // 새 반응 추가
    } // 조건 끝

    return { ...comment, reactions }; // 변경 댓글 반환
} // 함수 끝
