import { NextResponse, type NextRequest } from "next/server"; // 요청 응답 도구
import { sanitizeMemberReturnTo } from "@/lib/member/config"; // 복귀 주소 정리
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 인증 도구

export async function GET(request: NextRequest) // 인증 복귀 처리
{ // 함수 시작
    const code = request.nextUrl.searchParams.get("code"); // 인증 코드 읽기
    const returnTo = sanitizeMemberReturnTo(request.nextUrl.searchParams.get("returnTo")); // 복귀 주소 정리

    if (!code) // 인증 코드 누락 확인
    { // 조건 시작
        return NextResponse.redirect(new URL("/login", request.url)); // 로그인 화면 이동
    } // 조건 끝

    try // 세션 교환 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 인증 도구 생성
        const result = await supabase.auth.exchangeCodeForSession(code); // 인증 세션 교환

        if (result.error) // 인증 실패 확인
        { // 조건 시작
            return NextResponse.redirect(new URL("/login", request.url)); // 로그인 화면 이동
        } // 조건 끝

        return NextResponse.redirect(new URL(returnTo, request.url)); // 이전 화면 이동
    } // 시도 끝
    catch // 설정 오류 처리
    { // 오류 처리 시작
        return NextResponse.redirect(new URL("/login", request.url)); // 로그인 화면 이동
    } // 오류 처리 끝
} // 함수 끝
