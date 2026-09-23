import type { User } from "@supabase/supabase-js"; // Supabase 사용자 형식
import { redirect } from "next/navigation"; // 서버 이동 도구
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 인증 클라이언트
import { isSupabaseConfigured } from "@/lib/supabase/config"; // 설정 여부 판정
import { isAdminUser } from "@/lib/auth/admin-policy"; // 관리자 판정 함수

export { isAdminUser } from "@/lib/auth/admin-policy"; // 관리자 판정 공개

function safeReturnTo(returnTo: string): string // 복귀 주소 정리
{ // 함수 시작
    if (!returnTo.startsWith("/") || returnTo.startsWith("//")) // 외부 주소 확인
    { // 조건 시작
        return "/admin/news/new"; // 안전한 기본 주소
    } // 조건 끝

    return returnTo; // 내부 주소 반환
} // 함수 끝

export async function requireAdmin(returnTo = "/admin/news/new"): Promise<User> // 관리자 접근 보호
{ // 함수 시작
    const safeTarget = safeReturnTo(returnTo); // 안전한 복귀 주소

    if (!isSupabaseConfigured()) // 설정 누락 확인
    { // 조건 시작
        redirect("/admin/login?error=configuration"); // 설정 안내 이동
    } // 조건 끝

    const supabase = await createServerSupabaseClient(); // 서버 인증 도구
    const { data, error } = await supabase.auth.getUser(); // 검증된 사용자 조회

    if (error || !data.user) // 로그인 상태 확인
    { // 조건 시작
        redirect(`/admin/login?returnTo=${encodeURIComponent(safeTarget)}`); // 로그인 화면 이동
    } // 조건 끝

    if (!isAdminUser(data.user, process.env.ADMIN_EMAIL)) // 관리자 권한 확인
    { // 조건 시작
        redirect("/admin/login?error=forbidden"); // 권한 없음 이동
    } // 조건 끝

    return data.user; // 관리자 사용자 반환
} // 함수 끝
