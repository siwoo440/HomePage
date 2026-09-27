const SUPPORT_SCRIPT_URL = "https://cdn.channel.io/plugin/ch-plugin-web.js"; // 상담 스크립트 주소

export function isValidSupportPluginKey(value) // 상담 키 판정
{ // 함수 시작
    return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); // UUID 형식 반환
} // 함수 끝

export function initializeSupportWidget(root = document, view = window) // 상담 기능 초기화
{ // 함수 시작
    const keyElement = root.querySelector?.('meta[name="devforge-support-plugin-key"]'); // 상담 키 요소 조회
    const pluginKey = keyElement?.getAttribute?.("content")?.trim() ?? ""; // 상담 키 읽기

    if (!isValidSupportPluginKey(pluginKey) || view.ChannelIOInitialized === true) // 비활성 조건 확인
    { // 조건 시작
        return null; // 외부 요청 차단
    } // 조건 끝

    const queue = function(...args) // 상담 호출 대기열
    { // 함수 시작
        queue.calls.push(args); // 호출 저장
    }; // 함수 끝
    queue.calls = []; // 호출 목록 생성
    view.ChannelIO = queue; // 상담 함수 공개
    view.ChannelIOInitialized = true; // 초기화 표시
    view.ChannelIO("boot", { pluginKey }); // 상담 시작 예약

    const script = root.createElement("script"); // 외부 스크립트 생성
    script.src = SUPPORT_SCRIPT_URL; // 스크립트 주소 설정
    script.async = true; // 비동기 로드 설정
    script.dataset.devforgeSupport = "true"; // 상담 스크립트 표시
    root.head.append(script); // 문서에 스크립트 추가
    return script; // 생성 스크립트 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    initializeSupportWidget(document, window); // 상담 기능 초기화
} // 조건 끝
