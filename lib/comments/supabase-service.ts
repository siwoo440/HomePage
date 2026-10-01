import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 클라이언트 형식
import { REACTION_TYPES, type CommentReaction, type NewsComment, type ReactionType } from "./domain.ts"; // 댓글 도메인 형식
import { requireCommentContent, requireCommentImage, requireReportDetail, requireReportReason } from "./rules.ts"; // 댓글 공통 규칙
import { CommentServiceError, type CommentReport, type CommentService, type CreateCommentInput, type ReportCommentInput } from "./service.ts"; // 댓글 서비스 형식

export const COMMENT_IMAGE_BUCKET = "comment-images"; // 댓글 이미지 저장 버킷
export const UNKNOWN_COMMENT_NICKNAME = "회원"; // 프로필 없는 작성자 이름

const COMMENT_COLUMNS = "id, news_id, parent_id, author_id, content, image_path, created_at"; // 댓글 기본 열
const COMMENT_WITH_REACTIONS = `${COMMENT_COLUMNS}, comment_reactions(user_id, reaction)`; // 반응 포함 댓글 열
const REPORT_COLUMNS = "id, comment_id, reporter_id, reason, detail, created_at"; // 신고 기록 열
const PROFILE_CHUNK_SIZE = 100; // 프로필 조회 묶음 크기
const IMAGE_EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }; // 이미지 확장자 목록

interface ReactionRow // 반응 행 형식
{ // 형식 시작
    user_id: string; // 회원 식별자
    reaction: string; // 반응 종류
} // 형식 끝

interface CommentRow // 댓글 행 형식
{ // 형식 시작
    id: string; // 댓글 식별자
    news_id: string; // 뉴스 식별자
    parent_id: string | null; // 부모 댓글 식별자
    author_id: string; // 작성자 식별자
    content: string; // 댓글 내용
    image_path: string | null; // 이미지 저장 경로
    created_at: string; // 작성 시각
    comment_reactions?: ReactionRow[] | null; // 반응 목록
} // 형식 끝

interface ProfileRow // 프로필 행 형식
{ // 형식 시작
    id: string; // 회원 식별자
    nickname: string; // 공개 닉네임
} // 형식 끝

interface ReportRow // 신고 행 형식
{ // 형식 시작
    id: string; // 신고 식별자
    comment_id: string; // 댓글 식별자
    reporter_id: string; // 신고자 식별자
    detail: string; // 신고 상세
    created_at: string; // 신고 시각
} // 형식 끝

interface DatabaseError // 데이터베이스 오류 형식
{ // 형식 시작
    code?: string; // 오류 코드
    message?: string; // 오류 내용
} // 형식 끝

interface SupabaseCommentServiceOptions // Supabase 댓글 서비스 설정
{ // 형식 시작
    client: SupabaseClient; // Supabase 클라이언트
    createId?: () => string; // 이미지 파일 이름 생성기
} // 형식 끝

export function toCommentServiceError(error: DatabaseError | null | undefined): CommentServiceError // 서버 오류 변환
{ // 함수 시작
    const code = error?.code ?? ""; // 오류 코드
    const message = error?.message ?? ""; // 오류 내용

    if (message.includes("INVALID_COMMENT_PARENT")) // 답글 단계 오류 확인
    { // 조건 시작
        return new CommentServiceError("INVALID_PARENT", "같은 뉴스의 최상위 댓글에만 답글을 작성할 수 있습니다."); // 부모 오류 반환
    } // 조건 끝

    if (code === "23503") // 참조 대상 없음 확인
    { // 조건 시작
        return new CommentServiceError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 댓글 없음 오류 반환
    } // 조건 끝

    if (code === "42501" || code.startsWith("PGRST30")) // 권한·인증 오류 확인
    { // 조건 시작
        return new CommentServiceError("SIGN_IN_REQUIRED", "로그인한 회원만 이용할 수 있습니다. 다시 로그인해 주세요."); // 로그인 필요 오류 반환
    } // 조건 끝

    return new CommentServiceError("SERVICE_UNAVAILABLE", "댓글 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 연결 오류 반환
} // 함수 끝

function summarizeReactions(rows: ReactionRow[] | null | undefined): Record<ReactionType, CommentReaction> // 반응 집계
{ // 함수 시작
    const reactions: Record<ReactionType, CommentReaction> = { like: { count: 0, selectedBy: [] }, cheer: { count: 0, selectedBy: [] }, curious: { count: 0, selectedBy: [] } }; // 빈 반응 상태

    for (const row of rows ?? []) // 반응 행 반복
    { // 반복 시작
        if (!REACTION_TYPES.includes(row.reaction as ReactionType)) // 알 수 없는 반응 확인
        { // 조건 시작
            continue; // 반응 제외
        } // 조건 끝

        const target = reactions[row.reaction as ReactionType]; // 대상 반응
        target.count += 1; // 반응 수 증가
        target.selectedBy.push(row.user_id); // 선택 회원 추가
    } // 반복 끝

    return reactions; // 반응 상태 반환
} // 함수 끝

function toImageUrl(client: SupabaseClient, path: string | null): string | null // 공개 이미지 주소 변환
{ // 함수 시작
    if (!path) // 이미지 없음 확인
    { // 조건 시작
        return null; // 주소 없음 반환
    } // 조건 끝

    return client.storage.from(COMMENT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl; // 공개 주소 반환
} // 함수 끝

function toNewsComment(client: SupabaseClient, row: CommentRow, nickname: string): NewsComment // 화면 댓글 변환
{ // 함수 시작
    return ( // 화면 댓글 반환
    { // 댓글 시작
        id: row.id, // 댓글 식별자
        newsId: row.news_id, // 뉴스 식별자
        parentId: row.parent_id, // 부모 댓글 식별자
        authorId: row.author_id, // 작성자 식별자
        nickname, // 작성자 이름
        content: row.content, // 댓글 내용
        imageUrl: toImageUrl(client, row.image_path), // 이미지 주소
        createdAt: row.created_at, // 작성 시각
        reactions: summarizeReactions(row.comment_reactions), // 반응 상태
    }); // 댓글 끝
} // 함수 끝

async function loadNicknames(client: SupabaseClient, authorIds: string[]): Promise<Map<string, string>> // 작성자 닉네임 조회
{ // 함수 시작
    const nicknames = new Map<string, string>(); // 닉네임 목록

    for (let start = 0; start < authorIds.length; start += PROFILE_CHUNK_SIZE) // 묶음 반복
    { // 반복 시작
        const chunk = authorIds.slice(start, start + PROFILE_CHUNK_SIZE); // 현재 묶음
        const result = await client.from("member_profiles").select("id, nickname").in("id", chunk); // 프로필 조회

        if (result.error) // 조회 오류 확인
        { // 조건 시작
            throw toCommentServiceError(result.error); // 조회 오류 발생
        } // 조건 끝

        for (const profile of (result.data ?? []) as unknown as ProfileRow[]) // 프로필 반복
        { // 반복 시작
            nicknames.set(profile.id, profile.nickname); // 닉네임 저장
        } // 반복 끝
    } // 반복 끝

    return nicknames; // 닉네임 목록 반환
} // 함수 끝

async function loadComment(client: SupabaseClient, commentId: string): Promise<NewsComment> // 단일 댓글 조회
{ // 함수 시작
    const result = await client.from("news_comments").select(COMMENT_WITH_REACTIONS).eq("id", commentId).eq("status", "visible").maybeSingle(); // 공개 댓글 조회

    if (result.error) // 조회 오류 확인
    { // 조건 시작
        throw toCommentServiceError(result.error); // 조회 오류 발생
    } // 조건 끝

    if (!result.data) // 댓글 없음 확인
    { // 조건 시작
        throw new CommentServiceError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 댓글 없음 오류 발생
    } // 조건 끝

    const row = result.data as unknown as CommentRow; // 댓글 행
    const nicknames = await loadNicknames(client, [row.author_id]); // 작성자 닉네임 조회
    return toNewsComment(client, row, nicknames.get(row.author_id) ?? UNKNOWN_COMMENT_NICKNAME); // 화면 댓글 반환
} // 함수 끝

export function createSupabaseCommentService(options: SupabaseCommentServiceOptions): CommentService // Supabase 댓글 서비스 생성
{ // 함수 시작
    const client = options.client; // Supabase 클라이언트
    const createId = options.createId ?? (() => crypto.randomUUID()); // 파일 이름 생성기 선택

    return ( // 댓글 서비스 반환
    { // 서비스 시작
        async list(newsId: string): Promise<NewsComment[]> // 뉴스 댓글 조회
        { // 메서드 시작
            const result = await client.from("news_comments").select(COMMENT_WITH_REACTIONS).eq("news_id", newsId).eq("status", "visible").order("created_at", { ascending: true }); // 공개 댓글 조회

            if (result.error) // 조회 오류 확인
            { // 조건 시작
                throw toCommentServiceError(result.error); // 조회 오류 발생
            } // 조건 끝

            const rows = (result.data ?? []) as unknown as CommentRow[]; // 댓글 행 목록
            const nicknames = await loadNicknames(client, [...new Set(rows.map((row) => row.author_id))]); // 작성자 닉네임 조회
            return rows.map((row) => toNewsComment(client, row, nicknames.get(row.author_id) ?? UNKNOWN_COMMENT_NICKNAME)); // 화면 댓글 반환
        }, // 메서드 끝
        async create(input: CreateCommentInput): Promise<NewsComment> // 댓글 작성
        { // 메서드 시작
            const content = requireCommentContent(input.content); // 댓글 내용 검증
            const image = requireCommentImage(input.image); // 이미지 규칙 검증

            if (image && !image.file) // 업로드 파일 누락 확인
            { // 조건 시작
                throw new CommentServiceError("INVALID_IMAGE", "이미지 파일을 다시 선택해 주세요."); // 파일 누락 오류 발생
            } // 조건 끝

            const imagePath = image ? `${input.authorId}/${createId()}.${IMAGE_EXTENSIONS[image.type] ?? "img"}` : null; // 본인 폴더 이미지 경로

            if (image?.file && imagePath) // 이미지 업로드 필요 확인
            { // 조건 시작
                const upload = await client.storage.from(COMMENT_IMAGE_BUCKET).upload(imagePath, image.file, { contentType: image.type, upsert: false }); // 이미지 업로드

                if (upload.error) // 업로드 실패 확인
                { // 조건 시작
                    throw new CommentServiceError("INVALID_IMAGE", "이미지를 올리지 못했습니다. 잠시 후 다시 시도해 주세요."); // 업로드 오류 발생
                } // 조건 끝
            } // 조건 끝

            const inserted = await client.from("news_comments").insert({ news_id: input.newsId, parent_id: input.parentId, author_id: input.authorId, content, image_path: imagePath }).select(COMMENT_COLUMNS).single(); // 댓글 저장

            if (inserted.error || !inserted.data) // 저장 실패 확인
            { // 조건 시작
                if (imagePath) // 업로드 이미지 확인
                { // 조건 시작
                    await client.storage.from(COMMENT_IMAGE_BUCKET).remove([imagePath]); // 남은 이미지 정리
                } // 조건 끝

                throw toCommentServiceError(inserted.error); // 저장 오류 발생
            } // 조건 끝

            return toNewsComment(client, inserted.data as unknown as CommentRow, input.nickname); // 작성 댓글 반환
        }, // 메서드 끝
        async toggleReaction(commentId: string, userId: string, reaction: ReactionType): Promise<NewsComment> // 댓글 반응 전환
        { // 메서드 시작
            const current = await client.from("comment_reactions").select("reaction").eq("comment_id", commentId).eq("user_id", userId).maybeSingle(); // 현재 반응 조회

            if (current.error) // 조회 오류 확인
            { // 조건 시작
                throw toCommentServiceError(current.error); // 조회 오류 발생
            } // 조건 끝

            const sameReaction = (current.data as { reaction?: string } | null)?.reaction === reaction; // 같은 반응 선택 여부
            const write = sameReaction // 반응 변경 요청
                ? await client.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", userId) // 같은 반응 취소
                : await client.from("comment_reactions").upsert({ comment_id: commentId, user_id: userId, reaction }, { onConflict: "comment_id,user_id" }); // 새 반응 저장·전환

            if (write.error) // 변경 오류 확인
            { // 조건 시작
                throw toCommentServiceError(write.error); // 변경 오류 발생
            } // 조건 끝

            return loadComment(client, commentId); // 최신 댓글 반환
        }, // 메서드 끝
        async report(input: ReportCommentInput): Promise<CommentReport> // 댓글 신고
        { // 메서드 시작
            const reason = requireReportReason(input.reason); // 신고 사유 검증
            const detail = requireReportDetail(input.detail); // 신고 상세 검증
            const inserted = await client.from("comment_reports").insert({ comment_id: input.commentId, reporter_id: input.reporterId, reason, detail }).select(REPORT_COLUMNS).single(); // 신고 저장

            if (inserted.error?.code === "23505") // 중복 신고 확인
            { // 조건 시작
                throw new CommentServiceError("DUPLICATE_REPORT", "이미 신고한 댓글입니다."); // 중복 신고 오류 발생
            } // 조건 끝

            if (inserted.error || !inserted.data) // 저장 실패 확인
            { // 조건 시작
                throw toCommentServiceError(inserted.error); // 저장 오류 발생
            } // 조건 끝

            const row = inserted.data as unknown as ReportRow; // 신고 행
            return { id: row.id, commentId: row.comment_id, reporterId: row.reporter_id, reason, detail: row.detail, createdAt: row.created_at }; // 신고 기록 반환
        }, // 메서드 끝
    }); // 서비스 끝
} // 함수 끝
