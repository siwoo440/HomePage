import { createServerClient } from "@supabase/ssr"; // 서버 인증 도구
import { cookies } from "next/headers"; // 요청 쿠키 도구
import { getSupabasePublicConfig } from "./config"; // 공개 설정 판정

export async function createServerSupabaseClient() // 서버 클라이언트 생성
{ // 함수 시작
    const config = getSupabasePublicConfig(); // 공개 설정 읽기

    if (!config) // 설정 누락 확인
    { // 조건 시작
        throw new Error("SUPABASE_NOT_CONFIGURED"); // 설정 누락 오류
    } // 조건 끝

    const cookieStore = await cookies(); // 요청 쿠키 저장소
    return createServerClient( // 서버 클라이언트 반환
        config.url, // 프로젝트 주소
        config.publishableKey, // 공개 키
        { // 클라이언트 선택지 시작
            cookies: // 쿠키 연결 시작
            { // 쿠키 연결 객체
                getAll() // 전체 쿠키 읽기
                { // 함수 시작
                    return cookieStore.getAll(); // 쿠키 목록 반환
                }, // 함수 끝
                setAll(cookiesToSet) // 전체 쿠키 쓰기
                { // 함수 시작
                    try // 서버 쓰기 시도
                    { // 시도 시작
                        for (const cookie of cookiesToSet) // 갱신 쿠키 반복
                        { // 반복 시작
                            cookieStore.set(cookie.name, cookie.value, cookie.options); // 쿠키 값 저장
                        } // 반복 끝
                    } // 시도 끝
                    catch // 읽기 전용 렌더링 대응
                    { // 오류 처리 시작
                        return; // 프록시 갱신 위임
                    } // 오류 처리 끝
                }, // 함수 끝
            }, // 쿠키 연결 끝
        }, // 클라이언트 선택지 끝
    ); // 서버 클라이언트 생성 끝
} // 함수 끝
