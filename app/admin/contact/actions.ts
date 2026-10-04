"use server"; // 서버 액션 모듈

import { revalidatePath } from "next/cache"; // 캐시 갱신 도구
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { CONTACT_DONE_MESSAGES, ContactInboxError, createSupabaseContactInbox, parseContactUpdate, type ContactActionResult } from "@/lib/contact/inbox"; // 문의함 도구
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export async function updateContactMessage(input: { id: string; status: string; note: string }): Promise<ContactActionResult> // 문의 처리
{ // 함수 시작
    const admin = await requireAdmin("/admin/contact"); // 관리자 권한 확인

    try // 처리 시도
    { // 시도 시작
        const parsed = parseContactUpdate(input); // 처리 입력 검증
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        const item = await createSupabaseContactInbox({ client: supabase }).update(parsed, admin.id); // 처리 적용
        revalidatePath("/admin/contact"); // 문의함 갱신
        return { ok: true, message: CONTACT_DONE_MESSAGES[parsed.status], item }; // 성공 결과 반환
    } // 시도 끝
    catch (error: unknown) // 처리 실패 처리
    { // 오류 처리 시작
        return { ok: false, message: error instanceof ContactInboxError ? error.message : "처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }; // 실패 결과 반환
    } // 오류 처리 끝
} // 함수 끝
