export const MEMBER_DEMO_STORAGE_KEY = "devforge_demo_member"; // 시연 저장 키
export const MEMBER_STATUS_ENDPOINT = "/api/member/status"; // 실제 회원 상태 주소

const SUPABASE_AUTH_COOKIE_PATTERN = /(?:^|;\s*)sb-[^=;]+-auth-token(?:\.\d+)?=/; // Supabase 로그인 쿠키 형식
let serverMemberProfile = null; // 서버 확인 회원

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

export function hasSupabaseAuthCookie(cookieText) // Supabase 로그인 쿠키 확인
{ // 함수 시작
    return typeof cookieText === "string" && SUPABASE_AUTH_COOKIE_PATTERN.test(cookieText); // 로그인 쿠키 존재 결과
} // 함수 끝

export function parseServerMemberStatus(value) // 서버 회원 상태 해석
{ // 함수 시작
    if (!value || value.mode !== "supabase" || value.signedIn !== true) // 로그인 상태 확인
    { // 조건 시작
        return null; // 회원 없음 반환
    } // 조건 끝

    const nickname = typeof value.nickname === "string" ? value.nickname.trim().slice(0, 20) : ""; // 공개 닉네임 정리
    return { nickname: nickname || "회원", hasNickname: Boolean(nickname) }; // 표시 회원 반환
} // 함수 끝

export function setServerMemberProfile(profile) // 서버 확인 회원 저장
{ // 함수 시작
    serverMemberProfile = profile ?? null; // 확인 회원 갱신
} // 함수 끝

export async function loadServerMemberProfile(fetchImpl = globalThis.fetch, cookieText = globalThis.document?.cookie ?? "") // 실제 회원 상태 조회
{ // 함수 시작
    if (!hasSupabaseAuthCookie(cookieText) || typeof fetchImpl !== "function") // 로그인 쿠키·요청 도구 확인
    { // 조건 시작
        return null; // 조회 생략
    } // 조건 끝

    try // 상태 요청 시도
    { // 시도 시작
        const response = await fetchImpl(MEMBER_STATUS_ENDPOINT, { credentials: "same-origin", cache: "no-store" }); // 회원 상태 요청

        if (!response.ok) // 요청 실패 확인
        { // 조건 시작
            return null; // 회원 없음 반환
        } // 조건 끝

        return parseServerMemberStatus(await response.json()); // 회원 상태 반환
    } // 시도 끝
    catch // 연결 실패 처리
    { // 오류 처리 시작
        return null; // 회원 없음 반환
    } // 오류 처리 끝
} // 함수 끝

export function initializeMemberActions(root = document, locationValue = globalThis.location, storage = getSessionStorage()) // 회원 버튼 초기화
{ // 함수 시작
    const profile = readDemoMemberProfile(storage) ?? serverMemberProfile; // 시연·실제 회원 읽기
    const returnTo = `${locationValue?.pathname ?? "/main.html"}${locationValue?.search ?? ""}${locationValue?.hash ?? ""}`; // 현재 주소 생성
    const actions = root?.querySelectorAll?.("[data-member-action]") ?? []; // 회원 버튼 목록
    const label = !profile ? "회원 로그인" : profile.hasNickname === false ? "회원 메뉴 (닉네임 설정·로그아웃 가능)" : `${profile.nickname} 회원 메뉴 (로그아웃 가능)`; // 접근성 이름

    for (const action of actions) // 버튼 반복
    { // 반복 시작
        action.textContent = profile ? profile.nickname : "로그인"; // 버튼 문구 설정
        action.setAttribute("href", `/login?returnTo=${encodeURIComponent(returnTo)}`); // 회원 화면 주소 설정
        action.setAttribute("aria-label", label); // 접근성 이름 설정
        action.dataset.memberState = profile ? "signed-in" : "signed-out"; // 로그인 상태 표시
    } // 반복 끝

    return profile; // 현재 회원 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    const demoProfile = initializeMemberActions(document, window.location, getSessionStorage(window)); // 회원 버튼 초기화

    if (!demoProfile) // 시연 회원 없음 확인
    { // 조건 시작
        void loadServerMemberProfile(window.fetch?.bind(window), document.cookie).then((profile) => // 실제 회원 확인
        { // 결과 처리 시작
            if (profile) // 로그인 회원 확인
            { // 조건 시작
                setServerMemberProfile(profile); // 확인 회원 저장
                initializeMemberActions(document, window.location, getSessionStorage(window)); // 회원 버튼 다시 표시
            } // 조건 끝
        }); // 결과 처리 끝
    } // 조건 끝
} // 브라우저 실행 끝
