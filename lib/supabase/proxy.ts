import { createServerClient } from "@supabase/ssr"; // 서버 인증 도구
import { NextResponse, type NextRequest } from "next/server"; // 요청 응답 도구
import { getSupabasePublicConfig } from "./config"; // 공개 설정 판정

export async function updateSupabaseSession(request: NextRequest): Promise<NextResponse> // 세션 쿠키 갱신
{ // 함수 시작
    const config = getSupabasePublicConfig(); // 공개 설정 읽기
    let response = NextResponse.next({ request }); // 기본 응답 생성

    if (!config) // 설정 누락 확인
    { // 조건 시작
        return response; // 갱신 없는 응답
    } // 조건 끝

    const supabase = createServerClient( // 프록시 클라이언트 생성
        config.url, // 프로젝트 주소
        config.publishableKey, // 공개 키
        { // 클라이언트 선택지 시작
            cookies: // 쿠키 연결 시작
            { // 쿠키 연결 객체
                getAll() // 전체 쿠키 읽기
                { // 함수 시작
                    return request.cookies.getAll(); // 요청 쿠키 반환
                }, // 함수 끝
                setAll(cookiesToSet) // 전체 쿠키 쓰기
                { // 함수 시작
                    for (const cookie of cookiesToSet) // 요청 쿠키 반복
                    { // 반복 시작
                        request.cookies.set(cookie.name, cookie.value); // 요청 쿠키 갱신
                    } // 반복 끝
                    response = NextResponse.next({ request }); // 갱신 응답 재생성
                    for (const cookie of cookiesToSet) // 응답 쿠키 반복
                    { // 반복 시작
                        response.cookies.set(cookie.name, cookie.value, cookie.options); // 응답 쿠키 갱신
                    } // 반복 끝
                }, // 함수 끝
            }, // 쿠키 연결 끝
        }, // 클라이언트 선택지 끝
    ); // 프록시 클라이언트 생성 끝
    await supabase.auth.getClaims(); // 인증 토큰 갱신
    return response; // 갱신 응답 반환
} // 함수 끝
