import { GAME_PROJECTS } from "./game-projects.mjs"; // 공개 프로젝트 목록
import { CONSENT_POLICY_VERSION, PRIVACY_CONSENT_EVENT, PRIVACY_CONSENT_STORAGE_KEY } from "./privacy-consent.mjs"; // 동의 저장 규칙

export const BROWSER_DATA_ITEMS = Object.freeze( // 사이트 브라우저 저장 항목 목록
[ // 목록 시작
    Object.freeze({ id: "privacy-consent", key: PRIVACY_CONSENT_STORAGE_KEY, storage: "local", label: "분석 동의 선택", purpose: "방문 분석 허용 여부와 선택 시각을 기억합니다.", clearAll: true }), // 분석 동의
    Object.freeze({ id: "favorite-projects", key: "devforge_favorite_projects_v1", storage: "local", label: "관심 프로젝트", purpose: "메인 보관함에 추가한 관심 프로젝트 식별자를 기억합니다.", clearAll: true }), // 관심 프로젝트
    Object.freeze({ id: "recent-projects", key: "devforge_recent_projects_v1", storage: "local", label: "최근 본 프로젝트", purpose: "최근 확인한 프로젝트 식별자를 최대 6개까지 기억합니다.", clearAll: true }), // 최근 프로젝트
    Object.freeze({ id: "demo-member", key: "devforge_demo_member", storage: "session", label: "시연 회원 닉네임", purpose: "시연 로그인에 사용한 닉네임을 현재 탭에서만 기억합니다.", clearAll: true }), // 시연 회원
    Object.freeze({ id: "eta-invitation", key: "etaInvitationSeen", storage: "session", label: "프로젝트 η 초대장 확인", purpose: "같은 탭에서 초대장 연출을 다시 재생하지 않도록 기억합니다.", clearAll: true }), // 초대장 기록
    Object.freeze({ id: "color-mode", key: "devforge-color-mode", storage: "local", label: "화면 모드", purpose: "라이트·다크 화면 선택을 기억합니다. 전체 삭제에서는 제외합니다.", clearAll: false }), // 화면 모드
]); // 목록 끝

const STORAGE_LABELS = Object.freeze({ local: "이 브라우저 (localStorage)", session: "현재 탭 (sessionStorage · 탭을 닫으면 삭제)" }); // 저장 위치 문구
const PROJECT_IDS = new Set(GAME_PROJECTS.map((project) => project.id)); // 공개 프로젝트 식별자

function isRecord(value) // 객체 형식 확인
{ // 함수 시작
    return value !== null && typeof value === "object" && !Array.isArray(value); // 객체 여부 반환
} // 함수 끝

function parseJson(rawValue) // 안전한 JSON 해석
{ // 함수 시작
    try // 해석 시도
    { // 시도 시작
        return { ok: true, value: JSON.parse(rawValue) }; // 해석 결과 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return { ok: false, value: null }; // 실패 결과 반환
    } // 오류 처리 끝
} // 함수 끝

export function formatStoredDate(value, timeZone) // 저장 시각 표시
{ // 함수 시작
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short", timeZone }).format(new Date(value)); // 한국어 날짜 반환
} // 함수 끝

function describeConsent(rawValue, timeZone) // 분석 동의 요약
{ // 함수 시작
    const parsed = parseJson(rawValue); // 저장값 해석
    if (!parsed.ok || !isRecord(parsed.value)) // 해석 실패 확인
    { // 조건 시작
        return { state: "invalid", summary: "손상된 값 · 삭제 후 다시 선택해 주세요" }; // 손상 상태 반환
    } // 조건 끝
    if (parsed.value.version !== CONSENT_POLICY_VERSION) // 정책 버전 확인
    { // 조건 시작
        return { state: "outdated", summary: "이전 정책 버전 · 다시 선택 필요" }; // 이전 버전 상태 반환
    } // 조건 끝
    if (typeof parsed.value.analytics !== "boolean" || typeof parsed.value.updatedAt !== "string" || Number.isNaN(Date.parse(parsed.value.updatedAt))) // 필수 값 확인
    { // 조건 시작
        return { state: "invalid", summary: "손상된 값 · 삭제 후 다시 선택해 주세요" }; // 손상 상태 반환
    } // 조건 끝
    return { state: "stored", summary: `분석 ${parsed.value.analytics ? "허용" : "거부"} · ${formatStoredDate(parsed.value.updatedAt, timeZone)} 선택` }; // 동의 요약 반환
} // 함수 끝

function describeProjects(rawValue) // 프로젝트 목록 요약
{ // 함수 시작
    const parsed = parseJson(rawValue); // 저장값 해석
    if (!parsed.ok || !Array.isArray(parsed.value)) // 목록 형식 확인
    { // 조건 시작
        return { state: "invalid", summary: "손상된 값 · 삭제해도 사이트 이용에 문제 없음" }; // 손상 상태 반환
    } // 조건 끝
    const validCount = new Set(parsed.value.filter((id) => PROJECT_IDS.has(id))).size; // 유효 프로젝트 수
    const ignoredCount = parsed.value.length - validCount; // 제외 항목 수
    const ignoredText = ignoredCount > 0 ? ` · 알 수 없는 항목 ${ignoredCount}개 제외` : ""; // 제외 안내
    return { state: "stored", summary: `프로젝트 ${validCount}개${ignoredText}` }; // 목록 요약 반환
} // 함수 끝

function describeDemoMember(rawValue) // 시연 회원 요약
{ // 함수 시작
    const parsed = parseJson(rawValue); // 저장값 해석
    if (!parsed.ok || !isRecord(parsed.value) || parsed.value.demo !== true || typeof parsed.value.nickname !== "string") // 시연 회원 형식 확인
    { // 조건 시작
        return { state: "invalid", summary: "손상된 값 · 삭제 후 다시 로그인해 주세요" }; // 손상 상태 반환
    } // 조건 끝
    return { state: "stored", summary: `닉네임 "${parsed.value.nickname}"` }; // 닉네임 요약 반환
} // 함수 끝

export function describeBrowserDataValue(item, rawValue, timeZone) // 저장 항목 상태 요약
{ // 함수 시작
    if (rawValue === null || rawValue === undefined) // 저장값 없음 확인
    { // 조건 시작
        return { state: "empty", summary: "저장된 값 없음" }; // 빈 상태 반환
    } // 조건 끝
    if (item.id === "privacy-consent") // 분석 동의 확인
    { // 조건 시작
        return describeConsent(rawValue, timeZone); // 동의 요약 반환
    } // 조건 끝
    if (item.id === "favorite-projects" || item.id === "recent-projects") // 프로젝트 목록 확인
    { // 조건 시작
        return describeProjects(rawValue); // 목록 요약 반환
    } // 조건 끝
    if (item.id === "demo-member") // 시연 회원 확인
    { // 조건 시작
        return describeDemoMember(rawValue); // 회원 요약 반환
    } // 조건 끝
    if (item.id === "eta-invitation") // 초대장 기록 확인
    { // 조건 시작
        return rawValue === "true" ? { state: "stored", summary: "초대장 확인함" } : { state: "invalid", summary: "손상된 값" }; // 초대장 요약 반환
    } // 조건 끝
    if (item.id === "color-mode") // 화면 모드 확인
    { // 조건 시작
        return rawValue === "light" || rawValue === "dark" ? { state: "stored", summary: rawValue === "dark" ? "다크 모드" : "라이트 모드" } : { state: "invalid", summary: "손상된 값 · 삭제하면 시스템 설정을 따름" }; // 화면 모드 요약 반환
    } // 조건 끝
    return { state: "stored", summary: "저장됨" }; // 기본 요약 반환
} // 함수 끝

export function resolveBrowserStorages(view = globalThis) // 사용 가능한 저장소 조회
{ // 함수 시작
    const storages = { local: null, session: null }; // 저장소 결과
    for (const type of ["local", "session"]) // 저장소 종류 반복
    { // 반복 시작
        try // 저장소 접근 시도
        { // 시도 시작
            const storage = view?.[`${type}Storage`] ?? null; // 저장소 조회
            storage?.getItem("devforge-storage-check"); // 읽기 가능 여부 확인
            storages[type] = storage; // 사용 가능 저장소 기록
        } // 시도 끝
        catch // 접근 차단 처리
        { // 오류 처리 시작
            storages[type] = null; // 사용 불가 기록
        } // 오류 처리 끝
    } // 반복 끝
    return storages; // 저장소 결과 반환
} // 함수 끝

export function readBrowserDataSnapshot(storages, timeZone) // 저장 항목 현황 읽기
{ // 함수 시작
    return BROWSER_DATA_ITEMS.map((item) => // 항목별 현황 생성
    { // 생성 시작
        const storage = storages?.[item.storage] ?? null; // 항목 저장소
        if (!storage) // 저장소 차단 확인
        { // 조건 시작
            return { ...item, available: false, state: "unavailable", summary: "브라우저가 저장소 접근을 막아 확인할 수 없음" }; // 차단 상태 반환
        } // 조건 끝
        let rawValue = null; // 원본 저장값
        try // 저장값 읽기 시도
        { // 시도 시작
            rawValue = storage.getItem(item.key); // 저장값 읽기
        } // 시도 끝
        catch // 읽기 실패 처리
        { // 오류 처리 시작
            return { ...item, available: false, state: "unavailable", summary: "브라우저가 저장소 접근을 막아 확인할 수 없음" }; // 차단 상태 반환
        } // 오류 처리 끝
        return { ...item, available: true, ...describeBrowserDataValue(item, rawValue, timeZone) }; // 항목 현황 반환
    }); // 생성 끝
} // 함수 끝

export function removeBrowserDataItems(storages, ids) // 저장 항목 삭제
{ // 함수 시작
    const removed = []; // 삭제 항목 목록
    for (const item of BROWSER_DATA_ITEMS.filter((candidate) => ids.includes(candidate.id))) // 대상 항목 반복
    { // 반복 시작
        const storage = storages?.[item.storage] ?? null; // 항목 저장소
        try // 삭제 시도
        { // 시도 시작
            if (storage && storage.getItem(item.key) !== null) // 저장값 존재 확인
            { // 조건 시작
                storage.removeItem(item.key); // 저장값 삭제
                removed.push(item); // 삭제 항목 기록
            } // 조건 끝
        } // 시도 끝
        catch // 삭제 실패 처리
        { // 오류 처리 시작
            continue; // 다음 항목 진행
        } // 오류 처리 끝
    } // 반복 끝
    return removed; // 삭제 항목 반환
} // 함수 끝

export function getClearAllIds() // 전체 삭제 대상 식별자
{ // 함수 시작
    return BROWSER_DATA_ITEMS.filter((item) => item.clearAll).map((item) => item.id); // 전체 삭제 대상 반환
} // 함수 끝

export function describeRemovalResult(removed) // 삭제 결과 안내 문구
{ // 함수 시작
    if (removed.length === 0) // 삭제 항목 없음 확인
    { // 조건 시작
        return "삭제할 저장 항목이 없습니다."; // 빈 결과 안내
    } // 조건 끝
    const notes = []; // 추가 안내 목록
    if (removed.some((item) => item.id === "privacy-consent")) // 동의 삭제 확인
    { // 조건 시작
        notes.push("방문 분석은 다시 선택하기 전까지 실행하지 않으며, 다음 페이지에서 선택 창이 다시 표시됩니다."); // 동의 삭제 안내
    } // 조건 끝
    if (removed.some((item) => item.id === "color-mode")) // 화면 모드 삭제 확인
    { // 조건 시작
        notes.push("화면 모드는 다음 페이지부터 기기 설정을 따릅니다."); // 화면 모드 삭제 안내
    } // 조건 끝
    if (removed.some((item) => item.id === "demo-member")) // 시연 회원 삭제 확인
    { // 조건 시작
        notes.push("시연 로그인이 해제되었습니다."); // 로그인 해제 안내
    } // 조건 끝
    return [`${removed.map((item) => item.label).join(", ")} ${removed.length}개 항목을 삭제했습니다.`, ...notes].join(" "); // 결과 안내 반환
} // 함수 끝

function createElement(root, tagName, className, text) // 화면 요소 생성
{ // 함수 시작
    const element = root.createElement(tagName); // 새 요소 생성
    if (className) // 클래스 확인
    { // 조건 시작
        element.className = className; // 클래스 지정
    } // 조건 끝
    if (text !== undefined) // 글자 확인
    { // 조건 시작
        element.textContent = text; // 안전한 글자 지정
    } // 조건 끝
    return element; // 요소 반환
} // 함수 끝

function createDetail(root, term, description) // 항목 세부 정보 생성
{ // 함수 시작
    const wrapper = createElement(root, "div", "browser-data-detail"); // 세부 정보 묶음
    wrapper.append(createElement(root, "dt", "", term), createElement(root, "dd", "", description)); // 이름과 값 연결
    return wrapper; // 세부 정보 반환
} // 함수 끝

export function initializeBrowserDataManager(root = document, view = window) // 브라우저 데이터 관리 화면 초기화
{ // 함수 시작
    const container = root.querySelector?.("[data-browser-data-manager]"); // 관리 영역 조회
    if (!container) // 관리 영역 누락 확인
    { // 조건 시작
        return null; // 초기화 생략
    } // 조건 끝
    const list = container.querySelector("[data-browser-data-list]"); // 항목 목록 영역
    const status = container.querySelector("[data-browser-data-status]"); // 결과 안내 영역
    const clearAllButton = container.querySelector("[data-browser-data-clear-all]"); // 전체 삭제 버튼
    const blockedNotice = container.querySelector("[data-browser-data-blocked]"); // 저장소 차단 안내
    const heading = container.querySelector("[data-browser-data-heading]"); // 관리 영역 제목
    const storages = resolveBrowserStorages(view); // 사용 가능 저장소

    function render() // 항목 목록 갱신
    { // 함수 시작
        const snapshot = readBrowserDataSnapshot(storages); // 현재 저장 현황
        const rows = snapshot.map((item) => // 항목 행 생성
        { // 생성 시작
            const row = createElement(root, "li", `browser-data-item is-${item.state}`); // 항목 행
            row.dataset.browserDataItem = item.id; // 항목 식별자
            const header = createElement(root, "div", "browser-data-item-header"); // 항목 머리
            header.append(createElement(root, "h3", "", item.label), createElement(root, "span", "browser-data-state", item.summary)); // 이름과 상태 연결
            const details = createElement(root, "dl", "browser-data-details"); // 세부 정보 목록
            details.append(createDetail(root, "용도", item.purpose), createDetail(root, "저장 위치", STORAGE_LABELS[item.storage]), createDetail(root, "서버 전송", "전송 안 함")); // 세부 정보 연결
            const button = createElement(root, "button", "browser-data-remove", "삭제"); // 개별 삭제 버튼
            button.type = "button"; // 일반 버튼 형식
            button.dataset.browserDataRemove = item.id; // 삭제 대상 식별자
            button.setAttribute("aria-label", `${item.label} 삭제`); // 접근성 이름
            button.disabled = !item.available || item.state === "empty"; // 삭제 가능 여부
            row.append(header, details, button); // 항목 행 구성
            return row; // 항목 행 반환
        }); // 생성 끝
        list?.replaceChildren(...rows); // 목록 교체
        const clearable = snapshot.some((item) => item.clearAll && item.available && item.state !== "empty"); // 전체 삭제 가능 여부
        if (clearAllButton) // 전체 삭제 버튼 확인
        { // 조건 시작
            clearAllButton.disabled = !clearable; // 전체 삭제 사용 가능 상태
        } // 조건 끝
        if (blockedNotice) // 차단 안내 확인
        { // 조건 시작
            blockedNotice.hidden = snapshot.every((item) => item.available); // 차단 안내 표시 여부
        } // 조건 끝
        return snapshot; // 현재 현황 반환
    } // 함수 끝

    function applyRemoval(ids) // 삭제 실행과 결과 안내
    { // 함수 시작
        const removed = removeBrowserDataItems(storages, ids); // 저장 항목 삭제
        if (removed.some((item) => item.id === "privacy-consent") && typeof view?.CustomEvent === "function") // 동의 삭제 확인
        { // 조건 시작
            view.dispatchEvent(new view.CustomEvent(PRIVACY_CONSENT_EVENT, { detail: null })); // 분석 중지 알림
        } // 조건 끝
        render(); // 목록 갱신
        if (status) // 결과 안내 영역 확인
        { // 조건 시작
            status.textContent = describeRemovalResult(removed); // 결과 안내 표시
        } // 조건 끝
        heading?.focus?.(); // 관리 영역 제목 초점 이동
        return removed; // 삭제 항목 반환
    } // 함수 끝

    container.addEventListener("click", (event) => // 삭제 버튼 처리
    { // 처리 시작
        const removeButton = event.target?.closest?.("[data-browser-data-remove]"); // 개별 삭제 버튼 조회
        if (removeButton) // 개별 삭제 확인
        { // 조건 시작
            applyRemoval([removeButton.dataset.browserDataRemove]); // 개별 항목 삭제
            return; // 처리 종료
        } // 조건 끝
        if (event.target?.closest?.("[data-browser-data-clear-all]")) // 전체 삭제 확인
        { // 조건 시작
            applyRemoval(getClearAllIds()); // 전체 대상 삭제
        } // 조건 끝
    }); // 처리 끝
    view?.addEventListener?.(PRIVACY_CONSENT_EVENT, () => render()); // 동의 변경 시 목록 갱신
    view?.addEventListener?.("storage", () => render()); // 다른 탭 변경 시 목록 갱신
    render(); // 최초 목록 표시
    return Object.freeze({ render, applyRemoval }); // 관리 제어기 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeBrowserDataManager(document, window); // 관리 화면 초기화
} // 브라우저 실행 끝
