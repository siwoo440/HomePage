"use server"; // 서버 액션 모듈

import { revalidatePath } from "next/cache"; // 캐시 갱신 도구
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createSupabaseModerationService, MODERATION_DONE_MESSAGES, ModerationError, parseModerationInput, type ModerationActionResult } from "@/lib/comments/moderation"; // 댓글 관리 도구
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export async function moderateComment(input: { commentId: string; action: string; note: string }): Promise<ModerationActionResult> // 댓글 관리 처리
{ // 함수 시작
    const admin = await requireAdmin("/admin/comments"); // 관리자 권한 확인

    try // 처리 시도
    { // 시도 시작
        const parsed = parseModerationInput(input); // 처리 입력 검증
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        const item = await createSupabaseModerationService({ client: supabase }).apply(parsed, admin.id); // 처리 적용
        revalidatePath("/admin/comments"); // 관리 목록 갱신
        revalidatePath(`/news/${item.newsId}`); // 공개 뉴스 갱신
        return { ok: true, message: MODERATION_DONE_MESSAGES[parsed.action], item }; // 성공 결과 반환
    } // 시도 끝
    catch (error: unknown) // 처리 실패 처리
    { // 오류 처리 시작
        return { ok: false, message: error instanceof ModerationError ? error.message : "처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }; // 실패 결과 반환
    } // 오류 처리 끝
} // 함수 끝
