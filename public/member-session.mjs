export const MEMBER_DEMO_STORAGE_KEY = "devforge_demo_member"; // 시연 저장 키

export function getSessionStorage(view = globalThis) // 안전한 세션 저장소 조회
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        return view?.sessionStorage ?? null; // 세션 저장소 반환
    } // 시도 끝
    catch // 접근 차단 처리
    { // 오류 처리 시작
        return null; // 사용 불가 반환
    } // 오류 처리 끝
} // 함수 끝

export function readDemoMemberProfile(storage = getSessionStorage()) // 시연 회원 읽기
{ // 함수 시작
    try // 저장 값 해석 시도
    { // 시도 시작
        const candidate = JSON.parse(storage?.getItem(MEMBER_DEMO_STORAGE_KEY) ?? "null"); // 저장 값 해석
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

export function clearDemoMemberProfile(storage = getSessionStorage()) // 시연 로그아웃
{ // 함수 시작
    try // 삭제 시도
    { // 시도 시작
        storage?.removeItem(MEMBER_DEMO_STORAGE_KEY); // 시연 회원 삭제
        return true; // 삭제 성공 반환
    } // 시도 끝
    catch // 삭제 실패 처리
    { // 오류 처리 시작
        return false; // 삭제 실패 반환
    } // 오류 처리 끝
} // 함수 끝

export function initializeMemberActions(root = document, locationValue = globalThis.location, storage = getSessionStorage()) // 회원 버튼 초기화
{ // 함수 시작
    const profile = readDemoMemberProfile(storage); // 시연 회원 읽기
    const returnTo = `${locationValue?.pathname ?? "/main.html"}${locationValue?.search ?? ""}${locationValue?.hash ?? ""}`; // 현재 주소 생성
    const actions = root?.querySelectorAll?.("[data-member-action]") ?? []; // 회원 버튼 목록

    for (const action of actions) // 버튼 반복
    { // 반복 시작
        action.textContent = profile ? profile.nickname : "로그인"; // 버튼 문구 설정
        action.setAttribute("href", `/login?returnTo=${encodeURIComponent(returnTo)}`); // 회원 화면 주소 설정
        action.setAttribute("aria-label", profile ? `${profile.nickname} 회원 메뉴 (로그아웃 가능)` : "회원 로그인"); // 접근성 이름 설정
        action.dataset.memberState = profile ? "signed-in" : "signed-out"; // 로그인 상태 표시
    } // 반복 끝

    return profile; // 현재 회원 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeMemberActions(document, window.location, getSessionStorage(window)); // 회원 버튼 초기화
} // 브라우저 실행 끝
