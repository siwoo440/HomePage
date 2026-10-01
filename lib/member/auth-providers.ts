export const SOCIAL_PROVIDERS = // 간편 로그인 지원 목록
[ // 목록 시작
    { id: "kakao", label: "카카오", action: "카카오로 계속하기" }, // 카카오 로그인
    { id: "google", label: "Google", action: "Google로 계속하기" }, // 구글 로그인
    { id: "apple", label: "Apple", action: "Apple로 계속하기" }, // 애플 로그인
    { id: "discord", label: "Discord", action: "Discord로 계속하기" }, // 디스코드 로그인
    { id: "x", label: "X", action: "X로 계속하기" }, // 엑스 로그인
    { id: "facebook", label: "Facebook", action: "Facebook으로 계속하기" }, // 페이스북 로그인
] as const; // 목록 끝

export type SocialProviderId = typeof SOCIAL_PROVIDERS[number]["id"]; // 간편 로그인 식별자

export interface AuthSettings // 인증 설정 요약
{ // 형식 시작
    providers: SocialProviderId[]; // 켜진 간편 로그인
    emailEnabled: boolean; // 이메일 로그인 사용 여부
    signupEnabled: boolean; // 신규 가입 허용 여부
    autoConfirm: boolean; // 이메일 인증 생략 여부
} // 형식 끝

interface PublicConfig // 공개 연결 설정
{ // 형식 시작
    url: string; // 프로젝트 주소
    publishableKey: string; // 공개 키
} // 형식 끝

export const FALLBACK_AUTH_SETTINGS: AuthSettings = { providers: [], emailEnabled: true, signupEnabled: true, autoConfirm: false }; // 설정 조회 실패 대체값

export function findSocialProvider(id: string): typeof SOCIAL_PROVIDERS[number] | null // 간편 로그인 찾기
{ // 함수 시작
    return SOCIAL_PROVIDERS.find((provider) => provider.id === id) ?? null; // 일치 항목 반환
} // 함수 끝

export function parseAuthSettings(value: unknown): AuthSettings | null // 인증 설정 응답 해석
{ // 함수 시작
    if (!value || typeof value !== "object") // 객체 형식 확인
    { // 조건 시작
        return null; // 해석 불가 반환
    } // 조건 끝

    const record = value as { external?: unknown; disable_signup?: unknown; mailer_autoconfirm?: unknown }; // 설정 응답
    const external = record.external && typeof record.external === "object" ? record.external as Record<string, unknown> : {}; // 외부 로그인 사용 목록
    return ( // 설정 요약 반환
    { // 요약 시작
        providers: SOCIAL_PROVIDERS.filter((provider) => external[provider.id] === true).map((provider) => provider.id), // 켜진 간편 로그인
        emailEnabled: external.email !== false, // 이메일 로그인 사용 여부
        signupEnabled: record.disable_signup !== true, // 신규 가입 허용 여부
        autoConfirm: record.mailer_autoconfirm === true, // 이메일 인증 생략 여부
    }); // 요약 끝
} // 함수 끝

export async function fetchAuthSettings(config: PublicConfig, fetchImpl: typeof fetch = fetch, timeoutMs = 3000): Promise<AuthSettings | null> // 인증 설정 조회
{ // 함수 시작
    const controller = new AbortController(); // 요청 중단 도구
    const timer = setTimeout(() => controller.abort(), timeoutMs); // 시간 제한 설정

    try // 설정 요청 시도
    { // 시도 시작
        const response = await fetchImpl(`${config.url.replace(/\/+$/, "")}/auth/v1/settings`, { headers: { apikey: config.publishableKey }, signal: controller.signal, cache: "no-store" }); // 설정 요청

        if (!response.ok) // 요청 실패 확인
        { // 조건 시작
            return null; // 조회 실패 반환
        } // 조건 끝

        return parseAuthSettings(await response.json()); // 설정 요약 반환
    } // 시도 끝
    catch // 연결 실패 처리
    { // 오류 처리 시작
        return null; // 조회 실패 반환
    } // 오류 처리 끝
    finally // 요청 정리
    { // 정리 시작
        clearTimeout(timer); // 시간 제한 해제
    } // 정리 끝
} // 함수 끝
