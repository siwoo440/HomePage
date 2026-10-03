export const FORM_SUBMIT_TIMEOUT_MS = 10000; // 기본 전송 제한 시간

const FAILURE_MESSAGES = Object.freeze( // 실패 종류별 안내
{ // 안내 시작
    validation: "입력 내용을 확인해 주세요.", // 입력 오류
    "rate-limit": "요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.", // 요청 제한
    server: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", // 서버 오류
    timeout: "응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.", // 시간 초과
    network: "연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.", // 연결 실패
}); // 안내 끝

function isRecord(value) // 객체 형식 확인
{ // 함수 시작
    return value !== null && typeof value === "object" && !Array.isArray(value); // 객체 여부 반환
} // 함수 끝

export function classifySubmitStatus(status) // 응답 상태 분류
{ // 함수 시작
    if (status >= 200 && status < 300) // 성공 확인
    { // 조건 시작
        return "success"; // 성공
    } // 조건 끝
    if (status === 429) // 요청 제한 확인
    { // 조건 시작
        return "rate-limit"; // 요청 제한
    } // 조건 끝
    return status >= 400 && status < 500 ? "validation" : "server"; // 입력 오류 또는 서버 오류
} // 함수 끝

export async function submitJson(url, payload, options = {}) // JSON 양식 전송
{ // 함수 시작
    const fetchImpl = options.fetchImpl ?? globalThis.fetch; // 요청 도구
    const timeoutMs = options.timeoutMs ?? FORM_SUBMIT_TIMEOUT_MS; // 제한 시간
    const controller = new AbortController(); // 요청 중단 도구
    const timer = setTimeout(() => controller.abort(), timeoutMs); // 제한 시간 설정
    try // 전송 시도
    { // 시도 시작
        const response = await fetchImpl(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal, cache: "no-store" }); // 전송 요청
        const data = await response.json().catch(() => null); // 응답 본문
        const kind = classifySubmitStatus(response.status); // 응답 분류
        const body = isRecord(data) ? data : {}; // 안전한 본문
        if (kind === "success" && body.ok !== false) // 성공 확인
        { // 조건 시작
            return { ok: true, kind: "success", status: response.status, data: body, message: typeof body.message === "string" ? body.message : "", fieldErrors: {} }; // 성공 결과
        } // 조건 끝
        const failureKind = kind === "success" ? "server" : kind; // 실패 종류
        return { ok: false, kind: failureKind, status: response.status, data: body, message: typeof body.message === "string" && body.message ? body.message : FAILURE_MESSAGES[failureKind], fieldErrors: isRecord(body.errors) ? body.errors : {} }; // 실패 결과
    } // 시도 끝
    catch (error) // 전송 실패 처리
    { // 오류 처리 시작
        const kind = error?.name === "AbortError" ? "timeout" : "network"; // 실패 종류
        return { ok: false, kind, status: 0, data: {}, message: FAILURE_MESSAGES[kind], fieldErrors: {} }; // 실패 결과
    } // 오류 처리 끝
    finally // 공통 정리
    { // 정리 시작
        clearTimeout(timer); // 제한 시간 해제
    } // 정리 끝
} // 함수 끝

export function applyFieldErrors(form, fieldOrder, errors) // 입력 오류 표시
{ // 함수 시작
    let firstInvalid = null; // 첫 오류 입력
    for (const name of fieldOrder) // 입력 반복
    { // 반복 시작
        const field = form.elements?.namedItem?.(name) ?? form.querySelector?.(`[name="${name}"]`); // 입력 요소
        const messageElement = form.querySelector?.(`[data-field-error="${name}"]`); // 오류 문구 요소
        const message = typeof errors?.[name] === "string" ? errors[name] : ""; // 오류 문구
        if (messageElement) // 문구 요소 확인
        { // 조건 시작
            messageElement.textContent = message; // 오류 문구 반영
            messageElement.hidden = !message; // 빈 문구 숨김
        } // 조건 끝
        if (!field?.setAttribute) // 입력 요소 확인
        { // 조건 시작
            continue; // 다음 입력
        } // 조건 끝
        if (message) // 오류 확인
        { // 조건 시작
            field.setAttribute("aria-invalid", "true"); // 오류 상태 표시
            firstInvalid ??= field; // 첫 오류 기록
        } // 조건 끝
        else // 정상 입력
        { // 대안 시작
            field.removeAttribute("aria-invalid"); // 오류 상태 해제
        } // 대안 끝
    } // 반복 끝
    firstInvalid?.focus?.(); // 첫 오류로 초점 이동
    return firstInvalid; // 첫 오류 반환
} // 함수 끝

export function connectJsonForm(form, options) // 양식과 전송 연결
{ // 함수 시작
    const { url, collect, validate, onSuccess, fieldOrder = [], submit = submitJson } = options; // 연결 설정
    const status = form.querySelector("[data-form-status]"); // 결과 안내 요소
    const button = form.querySelector('[type="submit"]'); // 제출 버튼
    let pending = false; // 전송 중 여부

    function announce(message, role) // 결과 안내
    { // 함수 시작
        if (!status) // 안내 요소 확인
        { // 조건 시작
            return; // 안내 생략
        } // 조건 끝
        status.setAttribute("role", role); // 안내 역할
        status.dataset.state = role === "alert" ? "error" : "success"; // 안내 모양
        status.textContent = message; // 안내 문구
        status.hidden = !message; // 빈 안내 숨김
    } // 함수 끝

    async function onSubmit(event) // 제출 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        if (pending) // 중복 제출 확인
        { // 조건 시작
            return; // 처리 종료
        } // 조건 끝
        const payload = collect(form); // 입력 값 모으기
        const localErrors = validate ? validate(payload) : {}; // 화면 검증
        if (applyFieldErrors(form, fieldOrder, localErrors)) // 입력 오류 확인
        { // 조건 시작
            announce(FAILURE_MESSAGES.validation, "alert"); // 입력 오류 안내
            return; // 처리 종료
        } // 조건 끝
        pending = true; // 전송 시작
        form.setAttribute("aria-busy", "true"); // 진행 상태 표시
        if (button) // 버튼 확인
        { // 조건 시작
            button.disabled = true; // 중복 제출 차단
        } // 조건 끝
        announce("", "status"); // 이전 안내 제거
        const result = await submit(url, payload); // 전송
        pending = false; // 전송 종료
        form.removeAttribute("aria-busy"); // 진행 상태 해제
        if (button) // 버튼 확인
        { // 조건 시작
            button.disabled = false; // 버튼 복구
        } // 조건 끝
        if (!result.ok) // 실패 확인
        { // 조건 시작
            applyFieldErrors(form, fieldOrder, result.fieldErrors); // 서버 입력 오류 표시
            announce(result.message, "alert"); // 실패 안내
            return; // 처리 종료
        } // 조건 끝
        announce(result.message, "status"); // 성공 안내
        onSuccess?.(result, form); // 성공 뒤 처리
    } // 함수 끝

    form.addEventListener("submit", onSubmit); // 제출 처리기 등록
    return Object.freeze({ destroy: () => form.removeEventListener("submit", onSubmit) }); // 해제 도구 반환
} // 함수 끝
