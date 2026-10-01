import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식

export const ACCOUNT_DELETE_CONFIRM_TEXT = "탈퇴"; // 탈퇴 확인 입력 문구
export const ACCOUNT_DELETE_CONFIRM_TEXT_EN = "DELETE"; // 영어 화면 탈퇴 확인 문구
export const MY_COMMENTS_LIMIT = 50; // 내 댓글 최대 표시 수
const COMMENT_IMAGE_BUCKET = "comment-images"; // 댓글 이미지 버킷

export interface MyComment // 내 댓글 요약
{ // 형식 시작
    id: string; // 댓글 식별자
    newsId: string; // 뉴스 식별자
    newsTitle: string; // 뉴스 제목
    content: string; // 댓글 내용
    status: "visible" | "hidden"; // 공개 상태
    imagePath: string | null; // 첨부 이미지 경로
    createdAt: string; // 작성 시각
} // 형식 끝

export type AccountErrorCode = "SIGN_IN_REQUIRED" | "ADMIN_ACCOUNT" | "IMAGES_REMAIN" | "NOT_FOUND" | "UNKNOWN"; // 내 정보 오류 코드

export class AccountError extends Error // 내 정보 처리 오류
{ // 형식 시작
    readonly code: AccountErrorCode; // 오류 코드

    constructor(code: AccountErrorCode, message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "AccountError"; // 오류 이름
        this.code = code; // 오류 코드 저장
    } // 생성 끝
} // 형식 끝

const ACCOUNT_ERROR_MESSAGES = // 오류 안내 문구
{ // 문구 시작
    SIGN_IN_REQUIRED: "로그인이 끝났습니다. 다시 로그인한 뒤 시도해 주세요.", // 세션 만료
    ADMIN_ACCOUNT: "관리자 계정은 이 화면에서 탈퇴할 수 없습니다. Supabase 대시보드에서 처리해 주세요.", // 관리자 계정
    IMAGES_REMAIN: "첨부 이미지를 모두 지우지 못했습니다. 잠시 후 다시 시도해 주세요.", // 이미지 남음
    NOT_FOUND: "댓글을 찾을 수 없습니다. 이미 삭제되었을 수 있습니다.", // 댓글 없음
    UNKNOWN: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", // 기타 오류
} as const; // 문구 끝

export function isDeleteConfirmed(value: string): boolean // 탈퇴 확인 입력 판정
{ // 함수 시작
    const text = value.trim(); // 입력 정리
    return text === ACCOUNT_DELETE_CONFIRM_TEXT || text === ACCOUNT_DELETE_CONFIRM_TEXT_EN; // 한국어·영어 확인어 일치 여부 반환
} // 함수 끝

export function toAccountError(error: unknown): AccountError // 서버 오류 변환
{ // 함수 시작
    const text = error instanceof Error ? error.message : typeof error === "object" && error && "message" in error ? String((error as { message: unknown }).message) : ""; // 오류 문구
    const code = (["SIGN_IN_REQUIRED", "ADMIN_ACCOUNT", "IMAGES_REMAIN"] as const).find((candidate) => text.includes(candidate)) ?? "UNKNOWN"; // 오류 코드 판정
    return new AccountError(code, ACCOUNT_ERROR_MESSAGES[code]); // 안내 오류 반환
} // 함수 끝

interface CommentRow // 댓글 조회 행
{ // 형식 시작
    id: string; // 댓글 식별자
    news_id: string; // 뉴스 식별자
    content: string; // 댓글 내용
    status: string; // 공개 상태
    image_path: string | null; // 이미지 경로
    created_at: string; // 작성 시각
    news_posts: { title: string | null } | { title: string | null }[] | null; // 뉴스 제목
} // 형식 끝

export async function listMyComments(client: SupabaseClient, userId: string, limit = MY_COMMENTS_LIMIT): Promise<MyComment[]> // 내 댓글 조회
{ // 함수 시작
    const result = await client.from("news_comments").select("id, news_id, content, status, image_path, created_at, news_posts(title)").eq("author_id", userId).neq("status", "deleted").order("created_at", { ascending: false }).limit(limit); // 본인 댓글 요청
    if (result.error) // 조회 실패 확인
    { // 조건 시작
        throw toAccountError(result.error); // 안내 오류 전달
    } // 조건 끝
    return ((result.data ?? []) as CommentRow[]).map((row) => // 화면 형식 변환
    { // 변환 시작
        const news = Array.isArray(row.news_posts) ? row.news_posts[0] : row.news_posts; // 뉴스 정보
        return { id: row.id, newsId: row.news_id, newsTitle: news?.title?.trim() || "삭제되었거나 비공개인 뉴스", content: row.content, status: row.status === "hidden" ? "hidden" : "visible", imagePath: row.image_path, createdAt: row.created_at }; // 내 댓글 반환
    }); // 변환 끝
} // 함수 끝

export async function deleteMyComment(client: SupabaseClient, userId: string, comment: Pick<MyComment, "id" | "imagePath">): Promise<void> // 내 댓글 삭제
{ // 함수 시작
    const result = await client.from("news_comments").delete().eq("id", comment.id).eq("author_id", userId).select("id"); // 본인 댓글 삭제
    if (result.error) // 삭제 실패 확인
    { // 조건 시작
        throw toAccountError(result.error); // 안내 오류 전달
    } // 조건 끝
    if (!result.data || result.data.length === 0) // 삭제 대상 확인
    { // 조건 시작
        throw new AccountError("NOT_FOUND", ACCOUNT_ERROR_MESSAGES.NOT_FOUND); // 대상 없음 안내
    } // 조건 끝
    if (comment.imagePath) // 첨부 이미지 확인
    { // 조건 시작
        await client.storage.from(COMMENT_IMAGE_BUCKET).remove([comment.imagePath]).catch(() => undefined); // 이미지 정리(실패해도 탈퇴 때 다시 정리)
    } // 조건 끝
} // 함수 끝

export async function removeAllCommentImages(client: SupabaseClient, userId: string): Promise<number> // 내 댓글 이미지 전체 삭제
{ // 함수 시작
    let removed = 0; // 삭제 수
    for (let round = 0; round < 20; round += 1) // 1000개씩 반복(최대 2만 개)
    { // 반복 시작
        const listed = await client.storage.from(COMMENT_IMAGE_BUCKET).list(userId, { limit: 1000 }); // 본인 폴더 조회
        if (listed.error) // 조회 실패 확인
        { // 조건 시작
            throw toAccountError(listed.error); // 안내 오류 전달
        } // 조건 끝
        const paths = (listed.data ?? []).filter((item) => item.name && item.name !== ".emptyFolderPlaceholder").map((item) => `${userId}/${item.name}`); // 삭제 경로
        if (paths.length === 0) // 남은 파일 확인
        { // 조건 시작
            return removed; // 삭제 수 반환
        } // 조건 끝
        const deleted = await client.storage.from(COMMENT_IMAGE_BUCKET).remove(paths); // 파일 삭제
        if (deleted.error) // 삭제 실패 확인
        { // 조건 시작
            throw toAccountError(deleted.error); // 안내 오류 전달
        } // 조건 끝
        removed += paths.length; // 삭제 수 누적
    } // 반복 끝
    throw new AccountError("IMAGES_REMAIN", ACCOUNT_ERROR_MESSAGES.IMAGES_REMAIN); // 너무 많은 파일 안내
} // 함수 끝

export async function deleteOwnAccount(client: SupabaseClient, userId: string): Promise<void> // 회원 탈퇴
{ // 함수 시작
    await removeAllCommentImages(client, userId); // 첨부 이미지 먼저 삭제
    const result = await client.rpc("delete_own_account"); // 본인 계정 삭제 요청
    if (result.error) // 삭제 실패 확인
    { // 조건 시작
        throw toAccountError(result.error); // 안내 오류 전달
    } // 조건 끝
    await client.auth.signOut({ scope: "local" }).catch(() => undefined); // 이 브라우저 세션 정리
} // 함수 끝
