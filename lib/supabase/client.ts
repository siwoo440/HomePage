"use client"; // 브라우저 전용 모듈

import { createBrowserClient } from "@supabase/ssr"; // 브라우저 인증 도구
import { getSupabasePublicConfig } from "./config"; // 공개 설정 판정

export function createBrowserSupabaseClient() // 브라우저 클라이언트 생성
{ // 함수 시작
    const config = getSupabasePublicConfig(); // 공개 설정 읽기

    if (!config) // 설정 누락 확인
    { // 조건 시작
        throw new Error("SUPABASE_NOT_CONFIGURED"); // 설정 누락 오류
    } // 조건 끝

    return createBrowserClient(config.url, config.publishableKey); // 브라우저 클라이언트 반환
} // 함수 끝
