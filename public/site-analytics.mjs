import { GA_MEASUREMENT_ID } from "./analytics-config.mjs"; // 분석 설정 값
import { hasAnalyticsConsent, PRIVACY_CONSENT_EVENT } from "./privacy-consent.mjs"; // 동의 확인 도구

export const ALLOWED_ANALYTICS_EVENTS = new Set( // 허용 이벤트 목록
[
    "select_game", // 게임 선택 이벤트
    "view_development_news", // 개발 뉴스 이동 이벤트
    "view_goods", // 굿즈 이동 이벤트
    "view_community", // 커뮤니티 이동 이벤트
    "outbound_store", // 외부 판매처 이동 이벤트
    "select_video", // 영상 선택 이벤트
    "login_start", // 로그인 시작 이벤트
    "login_complete", // 로그인 완료 이벤트
]); // 허용 이벤트 끝

const ALLOWED_ANALYTICS_PARAMS = new Set( // 허용 매개변수 목록
[
    "item_id", // 항목 식별자
    "item_name", // 항목 이름
    "destination", // 이동 대상
    "content_type", // 콘텐츠 종류
    "source_page", // 출발 페이지
]); // 허용 매개변수 끝

export function isValidMeasurementId(value) // 측정 ID 확인
{ // 함수 시작
    return typeof value === "string" && /^G-[A-Z0-9]{6,20}$/.test(value); // ID 형식 반환
} // 함수 끝

export function sanitizeAnalyticsParams(params) // 이벤트 매개변수 정리
{ // 함수 시작
    const safe = {}; // 안전 값 저장소

    if (params === null || typeof params !== "object" || Array.isArray(params)) // 객체 형식 확인
    { // 조건 시작
        return safe; // 빈 값 반환
    } // 조건 끝

    for (const [key, value] of Object.entries(params)) // 입력 값 반복
    { // 반복 시작
        if (!ALLOWED_ANALYTICS_PARAMS.has(key)) // 허용 키 확인
        { // 조건 시작
            continue; // 미허용 값 제외
        } // 조건 끝

        if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") // 안전 값 형식 확인
        { // 조건 시작
            continue; // 복합 값 제외
        } // 조건 끝

        safe[key] = typeof value === "string" ? value.slice(0, 120) : value; // 안전 값 저장
    } // 반복 끝

    return safe; // 정리 결과 반환
} // 함수 끝

function appendGoogleScript(documentRef, measurementId) // Google 스크립트 연결
{ // 함수 시작
    const existing = documentRef.getElementById("devforge-ga4-script"); // 기존 스크립트 조회

    if (existing) // 기존 스크립트 확인
    { // 조건 시작
        return existing; // 기존 스크립트 반환
    } // 조건 끝

    const script = documentRef.createElement("script"); // 스크립트 요소 생성
    script.id = "devforge-ga4-script"; // 스크립트 식별자 설정
    script.async = true; // 비동기 다운로드 설정
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`; // 안전 주소 설정
    documentRef.head.append(script); // 문서 머리에 연결
    return script; // 새 스크립트 반환
} // 함수 끝

export function createAnalyticsRuntime(options = {}) // 분석 실행기 생성
{ // 함수 시작
    const measurementId = options.measurementId ?? ""; // 측정 ID 설정
    const documentRef = options.documentRef ?? document; // 문서 객체 설정
    const windowRef = options.windowRef ?? window; // 창 객체 설정
    const hasConsent = options.hasConsent ?? (() => hasAnalyticsConsent()); // 동의 확인 함수
    let started = false; // 시작 상태
    let enabled = false; // 전송 상태

    function gtag() // 분석 큐 추가
    { // 함수 시작
        windowRef.dataLayer.push(arguments); // Google 명령 형식 저장
    } // 함수 끝

    function start() // 분석 시작
    { // 함수 시작
        enabled = hasConsent() === true; // 현재 동의 반영

        if (!enabled || !isValidMeasurementId(measurementId)) // 실행 조건 확인
        { // 조건 시작
            return false; // 시작 차단
        } // 조건 끝

        if (started) // 기존 시작 확인
        { // 조건 시작
            return true; // 중복 시작 방지
        } // 조건 끝

        windowRef.dataLayer = Array.isArray(windowRef.dataLayer) ? windowRef.dataLayer : []; // 전송 큐 준비
        windowRef[`ga-disable-${measurementId}`] = false; // GA4 전송 허용
        appendGoogleScript(documentRef, measurementId); // Google 스크립트 연결
        gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); // 기본 동의 설정
        gtag("js", new Date()); // GA4 시작 시각 등록
        gtag("config", measurementId, { anonymize_ip: true, allow_google_signals: false }); // 개인정보 최소 설정
        started = true; // 시작 상태 저장
        return true; // 시작 성공 반환
    } // 함수 끝

    function refresh(consent) // 동의 상태 갱신
    { // 함수 시작
        enabled = consent?.analytics === true; // 새 동의 반영

        if (enabled) // 분석 허용 확인
        { // 조건 시작
            const startedNow = start(); // 분석 지연 시작

            if (startedNow && started) // 시작 상태 확인
            { // 조건 시작
                windowRef[`ga-disable-${measurementId}`] = false; // GA4 전송 허용
                gtag("consent", "update", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); // Google 동의 허용
            } // 조건 끝
        } // 조건 끝
        else if (started) // 철회 상태 확인
        { // 조건 시작
            windowRef[`ga-disable-${measurementId}`] = true; // GA4 자동 전송 차단
            gtag("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" }); // Google 동의 철회
        } // 조건 끝

        return enabled; // 전송 상태 반환
    } // 함수 끝

    function track(name, params = {}) // 사이트 이벤트 전송
    { // 함수 시작
        enabled = hasConsent() === true; // 현재 동의 재확인

        if (!enabled || !started || !ALLOWED_ANALYTICS_EVENTS.has(name)) // 전송 조건 확인
        { // 조건 시작
            return false; // 이벤트 차단
        } // 조건 끝

        gtag("event", name, sanitizeAnalyticsParams(params)); // 안전 이벤트 저장
        return true; // 전송 성공 반환
    } // 함수 끝

    const runtime = // 분석 실행기 객체
    {
        start, // 시작 기능
        refresh, // 동의 갱신 기능
        track, // 이벤트 전송 기능
    }; // 실행기 객체 끝

    return runtime; // 분석 실행기 반환
} // 함수 끝

let activeRuntime = null; // 현재 분석 실행기

export function trackSiteEvent(name, params = {}) // 공통 이벤트 전송
{ // 함수 시작
    return activeRuntime?.track(name, params) ?? false; // 현재 실행기 전달
} // 함수 끝

function readElementParams(element, locationValue) // 요소 매개변수 읽기
{ // 함수 시작
    const params = // 요소 매개변수
    {
        item_id: element.dataset.analyticsItemId ?? "", // 항목 식별자
        item_name: element.dataset.analyticsItemName ?? "", // 항목 이름
        destination: element.dataset.analyticsDestination ?? "", // 이동 대상
        content_type: element.dataset.analyticsContentType ?? "", // 콘텐츠 종류
        source_page: locationValue.pathname, // 출발 페이지
    }; // 매개변수 객체 끝

    return sanitizeAnalyticsParams(params); // 안전 매개변수 반환
} // 함수 끝

export function findAnalyticsElement(target) // 분석 클릭 요소 조회
{ // 함수 시작
    const interactive = target?.closest?.("a, button, [role='button']"); // 실제 조작 요소 조회

    if (!interactive) // 조작 요소 확인
    { // 조건 시작
        return null; // 일반 영역 클릭 제외
    } // 조건 끝

    return interactive.closest?.("[data-analytics-event]") ?? null; // 분석 영역 반환
} // 함수 끝

export function initializeSiteAnalytics(root = document, view = window, measurementId = GA_MEASUREMENT_ID) // 사이트 분석 초기화
{ // 함수 시작
    const runtime = createAnalyticsRuntime({ measurementId, documentRef: root, windowRef: view }); // 분석 실행기 생성
    activeRuntime = runtime; // 현재 실행기 저장
    runtime.start(); // 동의 기반 시작

    view.addEventListener(PRIVACY_CONSENT_EVENT, (event) => // 동의 변경 처리
    { // 처리 시작
        runtime.refresh(event.detail); // 새 동의 반영
    }); // 처리 끝

    root.addEventListener("click", (event) => // 분석 대상 클릭 처리
    { // 처리 시작
        const element = findAnalyticsElement(event.target); // 분석 요소 조회

        if (!element) // 분석 요소 확인
        { // 조건 시작
            return; // 관련 없는 클릭 종료
        } // 조건 끝

        runtime.track(element.dataset.analyticsEvent, readElementParams(element, view.location)); // 클릭 이벤트 전송
    }); // 처리 끝

    return runtime; // 분석 실행기 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeSiteAnalytics(); // 사이트 분석 초기화
} // 브라우저 실행 끝
