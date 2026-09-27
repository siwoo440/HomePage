export const PRIVACY_CONSENT_STORAGE_KEY = "devforge_privacy_consent_v1"; // 동의 저장 키
export const CONSENT_POLICY_VERSION = 1; // 동의 정책 버전
export const PRIVACY_CONSENT_EVENT = "devforge:privacy-consent-changed"; // 동의 변경 이벤트

function isRecord(value) // 객체 형식 확인
{ // 함수 시작
    return value !== null && typeof value === "object" && !Array.isArray(value); // 객체 여부 반환
} // 함수 끝

export function readPrivacyConsent(storage = window.localStorage) // 저장 동의 읽기
{ // 함수 시작
    try // 저장 값 해석 시도
    { // 시도 시작
        const candidate = JSON.parse(storage.getItem(PRIVACY_CONSENT_STORAGE_KEY) ?? "null"); // 저장 값 해석

        if (!isRecord(candidate)) // 객체 여부 확인
        { // 조건 시작
            return null; // 미동의 반환
        } // 조건 끝

        if (candidate.version !== CONSENT_POLICY_VERSION) // 정책 버전 확인
        { // 조건 시작
            return null; // 재동의 필요 반환
        } // 조건 끝

        if (typeof candidate.analytics !== "boolean" || typeof candidate.ads !== "boolean") // 선택 형식 확인
        { // 조건 시작
            return null; // 잘못된 선택 차단
        } // 조건 끝

        if (typeof candidate.updatedAt !== "string" || Number.isNaN(Date.parse(candidate.updatedAt))) // 갱신 시각 확인
        { // 조건 시작
            return null; // 잘못된 시각 차단
        } // 조건 끝

        const consent = // 안전 동의 객체
        {
            version: CONSENT_POLICY_VERSION, // 정책 버전
            analytics: candidate.analytics, // 분석 선택
            ads: candidate.ads, // 광고 선택
            updatedAt: candidate.updatedAt, // 갱신 시각
        }; // 동의 객체 끝

        return consent; // 안전 동의 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return null; // 미동의 반환
    } // 오류 처리 끝
} // 함수 끝

export function writePrivacyConsent(choice, storage = window.localStorage) // 동의 값 저장
{ // 함수 시작
    const consent = // 저장 동의 객체
    {
        version: CONSENT_POLICY_VERSION, // 정책 버전
        analytics: choice?.analytics === true, // 분석 선택 정규화
        ads: choice?.ads === true, // 광고 선택 정규화
        updatedAt: new Date().toISOString(), // 갱신 시각 생성
    }; // 동의 객체 끝

    storage.setItem(PRIVACY_CONSENT_STORAGE_KEY, JSON.stringify(consent)); // 동의 값 저장

    return consent; // 저장 결과 반환
} // 함수 끝

export function hasAnalyticsConsent(storage = window.localStorage) // 분석 동의 확인
{ // 함수 시작
    return readPrivacyConsent(storage)?.analytics === true; // 동의 결과 반환
} // 함수 끝

function notifyConsentChanged(consent, view = window) // 동의 변경 알림
{ // 함수 시작
    if (typeof view.CustomEvent !== "function") // 이벤트 지원 확인
    { // 조건 시작
        return; // 알림 생략
    } // 조건 끝

    view.dispatchEvent(new view.CustomEvent(PRIVACY_CONSENT_EVENT, { detail: consent })); // 변경 이벤트 전달
} // 함수 끝

function createButton(root, label, action, className) // 동의 버튼 생성
{ // 함수 시작
    const button = root.createElement("button"); // 버튼 요소 생성
    button.type = "button"; // 기본 제출 방지
    button.textContent = label; // 버튼 문구 설정
    button.dataset.consentAction = action; // 버튼 동작 설정
    button.className = className; // 버튼 스타일 설정
    return button; // 버튼 반환
} // 함수 끝

function ensureConsentStyles(root) // 동의 스타일 연결
{ // 함수 시작
    if (root.querySelector("link[data-privacy-consent-style]")) // 기존 스타일 확인
    { // 조건 시작
        return; // 중복 연결 방지
    } // 조건 끝

    const link = root.createElement("link"); // 스타일 링크 생성
    link.rel = "stylesheet"; // 스타일 관계 설정
    link.href = "/privacy-consent.css"; // 스타일 주소 설정
    link.dataset.privacyConsentStyle = "true"; // 스타일 식별자 설정
    root.head.append(link); // 문서 머리에 연결
} // 함수 끝

export function initializePrivacyConsent(root = document, storage = window.localStorage, view = window) // 동의 화면 초기화
{ // 함수 시작
    const existing = root.querySelector("[data-privacy-consent]"); // 기존 화면 조회

    if (existing) // 기존 화면 확인
    { // 조건 시작
        return existing; // 기존 화면 반환
    } // 조건 끝

    ensureConsentStyles(root); // 공통 스타일 연결

    const panel = root.createElement("aside"); // 동의 패널 생성
    panel.id = "privacy-consent-panel"; // 패널 식별자 설정
    panel.className = "privacy-consent"; // 패널 스타일 설정
    panel.dataset.privacyConsent = "true"; // 패널 식별자 설정
    panel.setAttribute("role", "dialog"); // 대화 상자 역할 설정
    panel.setAttribute("aria-labelledby", "privacy-consent-title"); // 제목 연결
    panel.hidden = readPrivacyConsent(storage) !== null; // 최초 노출 결정

    const title = root.createElement("h2"); // 제목 생성
    title.id = "privacy-consent-title"; // 제목 식별자 설정
    title.textContent = "개인정보 선택"; // 제목 문구 설정

    const description = root.createElement("p"); // 설명 생성
    description.textContent = "필수 기능은 항상 사용하며, 방문 분석은 동의한 경우에만 실행합니다."; // 설명 문구 설정

    const actions = root.createElement("div"); // 버튼 영역 생성
    actions.className = "privacy-consent__actions"; // 버튼 영역 스타일 설정
    actions.append(createButton(root, "선택 거부", "reject", "privacy-consent__button privacy-consent__button--secondary")); // 거부 버튼 추가
    actions.append(createButton(root, "분석 허용", "accept", "privacy-consent__button privacy-consent__button--primary")); // 허용 버튼 추가

    const status = root.createElement("p"); // 상태 문구 생성
    status.className = "privacy-consent__status"; // 상태 스타일 설정
    status.setAttribute("aria-live", "polite"); // 상태 읽기 설정

    panel.append(title, description, actions, status); // 패널 내용 추가

    const settings = createButton(root, "개인정보 설정", "settings", "privacy-consent-settings"); // 설정 버튼 생성
    settings.setAttribute("aria-controls", "privacy-consent-panel"); // 설정 대상 연결

    root.body.append(panel, settings); // 화면 요소 연결

    root.addEventListener("click", (event) => // 동의 버튼 처리
    { // 처리 시작
        const button = event.target.closest?.("[data-consent-action]"); // 동작 버튼 조회

        if (!button) // 버튼 여부 확인
        { // 조건 시작
            return; // 관련 없는 클릭 종료
        } // 조건 끝

        const action = button.dataset.consentAction; // 버튼 동작 읽기

        if (action === "settings") // 설정 열기 확인
        { // 조건 시작
            panel.hidden = false; // 패널 표시
            status.textContent = "분석 사용 여부를 다시 선택할 수 있습니다."; // 설정 안내 표시
            panel.focus?.(); // 패널 초점 이동
            return; // 설정 처리 종료
        } // 조건 끝

        const consent = writePrivacyConsent({ analytics: action === "accept", ads: false }, storage); // 선택 저장
        panel.hidden = true; // 패널 숨김
        status.textContent = action === "accept" ? "분석 사용에 동의했습니다." : "선택 기능을 사용하지 않습니다."; // 결과 안내 표시
        notifyConsentChanged(consent, view); // 변경 이벤트 전달
    }); // 처리 끝

    return panel; // 패널 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializePrivacyConsent(); // 동의 화면 초기화
} // 브라우저 실행 끝
