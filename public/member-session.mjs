export const MEMBER_DEMO_STORAGE_KEY = "devforge_demo_member"; // 시연 저장 키

export function readDemoMemberProfile(storage = window.sessionStorage) // 시연 회원 읽기
{ // 함수 시작
    try // 저장 값 해석 시도
    { // 시도 시작
        const candidate = JSON.parse(storage.getItem(MEMBER_DEMO_STORAGE_KEY) ?? "null"); // 저장 값 해석
        const sensitiveKeys = ["email", "password", "token", "accessToken", "refreshToken"]; // 민감 항목 목록
        const hasSensitiveValue = candidate && sensitiveKeys.some((key) => key in candidate); // 민감 항목 확인

        if (!candidate || hasSensitiveValue || candidate.id !== "demo-member" || candidate.demo !== true || typeof candidate.nickname !== "string") // 안전 형식 확인
        { // 조건 시작
            return null; // 회원 없음 반환
        } // 조건 끝

        return candidate; // 정상 회원 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return null; // 회원 없음 반환
    } // 오류 처리 끝
} // 함수 끝

export function initializeMemberActions(root = document, locationValue = window.location) // 회원 버튼 초기화
{ // 함수 시작
    const profile = readDemoMemberProfile(); // 시연 회원 읽기
    const returnTo = `${locationValue.pathname}${locationValue.search}${locationValue.hash}`; // 현재 주소 생성
    const actions = root.querySelectorAll("[data-member-action]"); // 회원 버튼 목록

    for (const action of actions) // 버튼 반복
    { // 반복 시작
        action.textContent = profile ? profile.nickname : "로그인"; // 버튼 문구 설정
        action.setAttribute("href", `/login?returnTo=${encodeURIComponent(returnTo)}`); // 로그인 주소 설정
        action.setAttribute("aria-label", profile ? `${profile.nickname} 회원 메뉴` : "회원 로그인"); // 접근성 이름 설정
    } // 반복 끝
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeMemberActions(); // 회원 버튼 초기화
} // 브라우저 실행 끝
