export const MEMBER_DEMO_STORAGE_KEY = "devforge_demo_member"; // 시연 저장 키

export interface DemoMemberProfile // 시연 회원 형식
{ // 형식 시작
    id: "demo-member"; // 시연 식별자
    nickname: string; // 표시 이름
    avatarUrl: null; // 프로필 이미지
    createdAt: string; // 생성 시각
    demo: true; // 시연 표시
} // 형식 끝

export function createDemoMemberProfile(nickname: string): DemoMemberProfile // 시연 회원 생성
{ // 함수 시작
    const normalizedNickname = nickname.trim().slice(0, 20) || "DEVFORGE 팬"; // 닉네임 정리
    return { id: "demo-member", nickname: normalizedNickname, avatarUrl: null, createdAt: new Date().toISOString(), demo: true }; // 공개 정보 반환
} // 함수 끝

export function parseDemoMemberProfile(value: string | null): DemoMemberProfile | null // 시연 회원 복원
{ // 함수 시작
    if (!value) // 빈 값 확인
    { // 조건 시작
        return null; // 회원 없음 반환
    } // 조건 끝

    try // JSON 해석 시도
    { // 시도 시작
        const candidate = JSON.parse(value) as Record<string, unknown>; // 저장 값 해석
        const sensitiveKeys = ["email", "password", "token", "accessToken", "refreshToken"]; // 민감 항목 목록
        const hasSensitiveValue = sensitiveKeys.some((key) => key in candidate); // 민감 항목 확인

        if (hasSensitiveValue || candidate.id !== "demo-member" || candidate.demo !== true || typeof candidate.nickname !== "string" || candidate.nickname.length < 1 || candidate.nickname.length > 20 || candidate.avatarUrl !== null || typeof candidate.createdAt !== "string" || Number.isNaN(Date.parse(candidate.createdAt))) // 안전 형식 확인
        { // 조건 시작
            return null; // 잘못된 값 반환
        } // 조건 끝

        return candidate as unknown as DemoMemberProfile; // 정상 회원 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return null; // 회원 없음 반환
    } // 오류 처리 끝
} // 함수 끝
