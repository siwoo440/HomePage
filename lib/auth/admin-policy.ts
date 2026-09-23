import type { User } from "@supabase/supabase-js"; // Supabase 사용자 형식

export function isAdminUser(user: Pick<User, "email" | "app_metadata"> | null, adminEmail: string | undefined): boolean // 관리자 판정
{ // 함수 시작
    const normalizedAdminEmail = adminEmail?.trim().toLowerCase(); // 관리자 이메일 정리

    if (!user?.email || !normalizedAdminEmail) // 필수 정보 확인
    { // 조건 시작
        return false; // 권한 없음 결과
    } // 조건 끝

    const hasAdminEmail = user.email.trim().toLowerCase() === normalizedAdminEmail; // 관리자 이메일 일치
    const hasAdminRole = user.app_metadata?.role === "admin"; // 관리자 역할 일치
    return hasAdminEmail && hasAdminRole; // 이중 조건 결과
} // 함수 끝
