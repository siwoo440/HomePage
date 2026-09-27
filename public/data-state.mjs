const DATA_STATE_DEFAULTS = // 데이터 상태 기본값
{ // 기본값 시작
    loading: { hidden: false, title: "데이터 확인 중", message: "최신 정보를 불러오고 있습니다.", iconUrl: "/images/states/loading.svg", retryLabel: null }, // 로딩 상태
    demo: { hidden: false, title: "데모 콘텐츠 표시 중", message: "외부 연결 전이라 준비된 데모 정보를 표시합니다.", iconUrl: "/images/states/demo.svg", retryLabel: null }, // 데모 상태
    empty: { hidden: false, title: "표시할 항목이 없습니다", message: "아직 등록된 정보가 없습니다. 잠시 후 다시 확인해 주세요.", iconUrl: "/images/states/empty.svg", retryLabel: "다시 확인" }, // 빈 결과 상태
    error: { hidden: false, title: "정보를 불러오지 못했습니다", message: "연결 상태를 확인한 뒤 다시 시도해 주세요.", iconUrl: "/images/states/error.svg", retryLabel: "다시 시도" }, // 오류 상태
    ready: { hidden: true, title: "", message: "", iconUrl: "", retryLabel: null }, // 준비 완료 상태
}; // 기본값 끝

export class DataStateRequestError extends Error // 데이터 요청 오류
{ // 클래스 시작
    constructor(code, message) // 오류 생성자
    { // 생성자 시작
        super(message); // 기본 오류 생성
        this.name = "DataStateRequestError"; // 오류 이름 지정
        this.code = code; // 오류 코드 저장
    } // 생성자 끝
} // 클래스 끝

export function createDataStateModel(kind, overrides = {}) // 데이터 상태 모델 생성
{ // 함수 시작
    const safeKind = Object.hasOwn(DATA_STATE_DEFAULTS, kind) ? kind : "error"; // 안전한 상태 선택
    return { kind: safeKind, ...DATA_STATE_DEFAULTS[safeKind], ...overrides }; // 상태 모델 반환
} // 함수 끝

export function resolveCollectionState(response, collectionKey) // 목록 응답 상태 판정
{ // 함수 시작
    if (!response || typeof response !== "object" || !Array.isArray(response[collectionKey])) // 응답 구조 확인
    { // 조건 시작
        return "error"; // 잘못된 응답 반환
    } // 조건 끝

    if (response.configured !== true) // 외부 설정 확인
    { // 조건 시작
        return "demo"; // 데모 상태 반환
    } // 조건 끝

    return response[collectionKey].length > 0 ? "ready" : "empty"; // 목록 존재 상태 반환
} // 함수 끝

export async function requestJson(url, options = {}) // 시간 제한 JSON 요청
{ // 함수 시작
    const fetchImpl = options.fetchImpl ?? globalThis.fetch; // 요청 함수 선택
    const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0 ? options.timeoutMs : 8000; // 안전한 제한 시간
    const controller = new AbortController(); // 요청 중단 제어기
    let timedOut = false; // 시간 초과 여부
    const timeoutId = setTimeout(() => // 시간 제한 예약
    { // 예약 처리 시작
        timedOut = true; // 시간 초과 기록
        controller.abort(); // 요청 중단
    }, timeoutMs); // 제한 시간 지정

    try // 요청 시도
    { // 시도 시작
        if (typeof fetchImpl !== "function") // 요청 함수 확인
        { // 조건 시작
            throw new DataStateRequestError("DATA_REQUEST_FAILED", "데이터 요청 기능을 사용할 수 없습니다."); // 요청 기능 오류 발생
        } // 조건 끝

        const response = await fetchImpl(url, { headers: { Accept: "application/json" }, signal: controller.signal }); // JSON 요청 실행

        if (!response?.ok) // 응답 성공 확인
        { // 조건 시작
            throw new DataStateRequestError("DATA_REQUEST_FAILED", "데이터를 불러오지 못했습니다."); // HTTP 오류 발생
        } // 조건 끝

        return await response.json(); // JSON 응답 반환
    } // 시도 끝
    catch (error) // 요청 오류 처리
    { // 오류 처리 시작
        if (timedOut) // 시간 초과 확인
        { // 조건 시작
            throw new DataStateRequestError("DATA_TIMEOUT", "요청 시간이 초과되었습니다."); // 시간 초과 오류 발생
        } // 조건 끝

        if (error instanceof DataStateRequestError) // 정규화 오류 확인
        { // 조건 시작
            throw error; // 기존 오류 재발생
        } // 조건 끝

        throw new DataStateRequestError("DATA_REQUEST_FAILED", "데이터를 불러오지 못했습니다."); // 안전한 요청 오류 발생
    } // 오류 처리 끝
    finally // 요청 정리
    { // 정리 시작
        clearTimeout(timeoutId); // 제한 시간 해제
    } // 정리 끝
} // 함수 끝

function createTextElement(tagName, className, value) // 상태 글자 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 글자 요소 생성
    element.className = className; // 글자 클래스 지정
    element.textContent = value; // 안전한 글자 지정
    return element; // 글자 요소 반환
} // 함수 끝

export function createDataStateController(host) // 데이터 상태 화면 제어기 생성
{ // 함수 시작
    if (!host || typeof host.replaceChildren !== "function") // 상태 호스트 확인
    { // 조건 시작
        return { show() {}, hide() {} }; // 빈 제어기 반환
    } // 조건 끝

    let retryInFlight = false; // 재시도 실행 여부

    function show(kind, overrides = {}, onRetry = null) // 상태 표시
    { // 함수 시작
        const model = createDataStateModel(kind, overrides); // 상태 모델 생성
        const retryHandler = typeof onRetry === "function" ? onRetry : overrides.onRetry; // 재시도 함수 선택
        host.dataset.state = model.kind; // 상태 값 저장
        host.hidden = model.hidden; // 숨김 상태 적용
        host.setAttribute("role", "status"); // 상태 역할 지정
        host.setAttribute("aria-live", "polite"); // 변경 안내 설정
        host.setAttribute("aria-busy", String(model.kind === "loading")); // 로딩 상태 설정

        if (model.hidden) // 숨김 상태 확인
        { // 조건 시작
            host.replaceChildren(); // 이전 상태 제거
            return; // 표시 처리 종료
        } // 조건 끝

        const icon = document.createElement("img"); // 상태 아이콘 생성
        icon.className = "data-state-icon"; // 아이콘 클래스 지정
        icon.src = model.iconUrl; // 아이콘 주소 지정
        icon.alt = ""; // 장식 이미지 설명 제거
        icon.setAttribute("aria-hidden", "true"); // 보조 기술 숨김
        const copy = document.createElement("div"); // 상태 문구 묶음 생성
        copy.className = "data-state-copy"; // 문구 묶음 클래스 지정
        copy.append(createTextElement("strong", "data-state-title", model.title)); // 상태 제목 추가
        copy.append(createTextElement("p", "data-state-message", model.message)); // 상태 설명 추가
        const children = [icon, copy]; // 상태 요소 목록

        if (model.retryLabel && typeof retryHandler === "function") // 재시도 가능 확인
        { // 조건 시작
            const retryButton = createTextElement("button", "data-state-retry", model.retryLabel); // 재시도 버튼 생성
            retryButton.type = "button"; // 버튼 유형 지정
            retryButton.addEventListener("click", async () => // 재시도 클릭 처리
            { // 클릭 처리 시작
                if (retryInFlight) // 중복 실행 확인
                { // 조건 시작
                    return; // 중복 재시도 차단
                } // 조건 끝

                retryInFlight = true; // 재시도 실행 기록
                retryButton.disabled = true; // 재시도 버튼 비활성

                try // 재시도 실행
                { // 시도 시작
                    await retryHandler(); // 페이지 재시도 호출
                } // 시도 끝
                finally // 재시도 정리
                { // 정리 시작
                    retryInFlight = false; // 재시도 상태 해제
                    retryButton.disabled = false; // 재시도 버튼 복원
                } // 정리 끝
            }); // 클릭 처리 끝
            children.push(retryButton); // 재시도 버튼 추가
        } // 조건 끝

        host.replaceChildren(...children); // 상태 화면 교체
    } // 함수 끝

    function hide() // 상태 숨김
    { // 함수 시작
        show("ready"); // 준비 완료 상태 적용
    } // 함수 끝

    return { show, hide }; // 상태 제어기 반환
} // 함수 끝
