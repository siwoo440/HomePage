const ERROR_MESSAGES: Record<string, string> = // 오류 안내 목록
{ // 오류 안내 객체
    configuration: "Supabase 설정이 아직 등록되지 않았습니다.", // 설정 누락 안내
    forbidden: "이 계정에는 관리자 권한이 없습니다.", // 권한 없음 안내
}; // 오류 안내 끝

export function getLoginMessage(configured: boolean, errorCode: string): string // 초기 로그인 안내 판정
{ // 함수 시작
    if (!configured) // 설정 누락 확인
    { // 조건 시작
        return ERROR_MESSAGES.configuration; // 설정 누락 안내
    } // 조건 끝

    return ERROR_MESSAGES[errorCode] ?? ""; // 오류 코드 안내
} // 함수 끝
