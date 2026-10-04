import { createClient, type SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 도구
import { getSupabasePublicConfig } from "./config.ts"; // 프로젝트 주소 설정

// 서버 전용 비밀 키 연결입니다. 브라우저 코드("use client")에서 불러오지 않으며, 지금은 출시 알림 확인 메일에만 씁니다.
export const SUPABASE_SECRET_ENV_NAME = "SUPABASE_SECRET_KEY"; // 서버 전용 비밀 키 항목 이름

type SecretEnvironment = Record<string, string | undefined>; // 환경 변수 집합

export function getSupabaseSecretKey(environment: SecretEnvironment = process.env): string | null // 서버 전용 비밀 키 읽기
{ // 함수 시작
    const key = environment[SUPABASE_SECRET_ENV_NAME]?.trim() ?? ""; // 비밀 키 값

    if (!key || key.startsWith("sb_publishable_")) // 빈 값·공개 키 확인
    { // 조건 시작
        return null; // 비밀 키 없음
    } // 조건 끝

    return key.startsWith("sb_secret_") || key.split(".").length === 3 ? key : null; // 새 비밀 키 또는 이전 방식 토큰만 허용
} // 함수 끝

export function createSecretSupabaseClient(environment: SecretEnvironment = process.env): SupabaseClient | null // 서버 전용 연결 생성
{ // 함수 시작
    const secretKey = getSupabaseSecretKey(environment); // 비밀 키
    const config = getSupabasePublicConfig({ NEXT_PUBLIC_SUPABASE_URL: environment.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY }); // 프로젝트 주소

    if (!secretKey || !config) // 설정 누락 확인
    { // 조건 시작
        return null; // 연결 없음
    } // 조건 끝

    return createClient(config.url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } }); // 로그인 상태를 저장하지 않는 서버 연결 반환
} // 함수 끝
