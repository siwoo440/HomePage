import { NextResponse } from "next/server"; // 응답 생성 도구
import { fetchMemberProfile } from "@/lib/member/profile"; // 회원 프로필 조회
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 인증 도구

export const dynamic = "force-dynamic"; // 요청별 실행 설정

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" }; // 회원 상태 캐시 차단

export async function GET() // 회원 상태 요청
{ // 함수 시작
    if (!getSupabasePublicConfig()) // 시연 모드 확인
    { // 조건 시작
        return NextResponse.json({ mode: "demo", signedIn: false, nickname: null }, { headers: NO_STORE_HEADERS }); // 시연 상태 반환
    } // 조건 끝

    try // 실제 세션 확인 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 인증 도구
        const result = await supabase.auth.getUser(); // 현재 사용자 조회
        const user = result.data.user; // 사용자 정보

        if (!user) // 로그아웃 상태 확인
        { // 조건 시작
            return NextResponse.json({ mode: "supabase", signedIn: false, nickname: null }, { headers: NO_STORE_HEADERS }); // 로그아웃 상태 반환
        } // 조건 끝

        const profile = await fetchMemberProfile(supabase, user.id).catch(() => null); // 공개 닉네임 조회
        return NextResponse.json({ mode: "supabase", signedIn: true, nickname: profile?.nickname ?? null }, { headers: NO_STORE_HEADERS }); // 공개 정보만 반환
    } // 시도 끝
    catch // 인증 서버 오류 처리
    { // 오류 처리 시작
        return NextResponse.json({ mode: "supabase", signedIn: false, nickname: null }, { status: 503, headers: NO_STORE_HEADERS }); // 확인 불가 상태 반환
    } // 오류 처리 끝
} // 함수 끝
