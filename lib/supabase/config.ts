type SupabaseEnvironment = Record<string, string | undefined>; // 환경 변수 집합

export interface SupabasePublicConfig // 공개 설정 형식
{ // 형식 시작
    url: string; // 프로젝트 주소
    publishableKey: string; // 공개 키
} // 형식 끝

export function getSupabasePublicConfig(environment: SupabaseEnvironment = process.env): SupabasePublicConfig | null // 공개 설정 판정
{ // 함수 시작
    const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim(); // 프로젝트 주소
    const publishableKey = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(); // 공개 키

    if (!url || !publishableKey) // 설정 누락 확인
    { // 조건 시작
        return null; // 미설정 결과
    } // 조건 끝

    const config = // 정상 설정 시작
    { // 정상 설정 객체
        url, // 프로젝트 주소 반환
        publishableKey, // 공개 키 반환
    }; // 정상 설정 끝
    return config; // 정상 설정 반환
} // 함수 끝

export function isSupabaseConfigured(): boolean // 설정 여부 판정
{ // 함수 시작
    return getSupabasePublicConfig() !== null; // 설정 존재 결과
} // 함수 끝
