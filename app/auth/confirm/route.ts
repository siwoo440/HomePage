import type { EmailOtpType } from "@supabase/supabase-js"; // 이메일 인증 형식
import { NextResponse, type NextRequest } from "next/server"; // 요청 응답 도구
import { sanitizeMemberReturnTo } from "@/lib/member/config"; // 복귀 주소 정리
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 인증 도구

const EMAIL_OTP_TYPES = new Set<EmailOtpType>(["signup", "recovery", "email", "email_change", "invite", "magiclink"]); // 허용 인증 종류

export async function GET(request: NextRequest) // 이메일 링크 인증 처리
{ // 함수 시작
    const tokenHash = request.nextUrl.searchParams.get("token_hash"); // 인증 토큰 읽기
    const type = request.nextUrl.searchParams.get("type") as EmailOtpType | null; // 인증 종류 읽기
    const fallback = type === "recovery" ? "/login/reset" : "/main.html"; // 종류별 기본 이동
    const next = sanitizeMemberReturnTo(request.nextUrl.searchParams.get("next") ?? fallback); // 인증 뒤 주소
    const failed = new URL("/login", request.url); // 실패 이동 주소
    failed.searchParams.set("auth", "failed"); // 실패 안내 표시

    if (!tokenHash || !type || !EMAIL_OTP_TYPES.has(type)) // 인증 정보 확인
    { // 조건 시작
        return NextResponse.redirect(failed); // 실패 안내 이동
    } // 조건 끝

    try // 링크 인증 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 인증 도구 생성
        const result = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }); // 링크 인증 확인
        return NextResponse.redirect(result.error ? failed : new URL(next, request.url)); // 결과별 이동
    } // 시도 끝
    catch // 설정 오류 처리
    { // 오류 처리 시작
        return NextResponse.redirect(failed); // 실패 안내 이동
    } // 오류 처리 끝
} // 함수 끝
