type MemberEnvironment = Record<string, string | undefined>; // 환경 변수 집합

export type MemberMode = "demo" | "supabase"; // 회원 모드 형식

export function getMemberMode(environment: MemberEnvironment = process.env): MemberMode // 회원 모드 판정
{ // 함수 시작
    const url = environment.NEXT_PUBLIC_SUPABASE_URL?.trim(); // 프로젝트 주소
    const key = environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(); // 공개 키
    return url && key ? "supabase" : "demo"; // 회원 모드 반환
} // 함수 끝

export function sanitizeMemberReturnTo(value: string | null | undefined): string // 복귀 주소 정리
{ // 함수 시작
    if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f\u007f]/.test(value)) // 위험 주소 확인
    { // 조건 시작
        return "/main.html"; // 기본 주소 반환
    } // 조건 끝

    return value; // 안전 주소 반환
} // 함수 끝
