export const DEVICE_PRESETS = Object.freeze( // 기기 프리셋
{ // 객체 시작
    desktop: Object.freeze({ width: 1440, height: 900, label: "PC" }), // PC 화면
    tablet: Object.freeze({ width: 1024, height: 768, label: "태블릿 가로" }), // 태블릿 화면
    mobile: Object.freeze({ width: 390, height: 844, label: "모바일" }), // 모바일 화면
}); // 객체 끝

export const PREVIEW_PAGES = Object.freeze( // 허용 페이지 목록
[ // 목록 시작
    "/main.html", // 메인 페이지
    "/goods.html", // 굿즈 페이지
    "/devlog.html", // 뉴스 페이지
    "/community.html", // 커뮤니티 페이지
    "/project_a/ProjectA_Main.html", // 프로젝트 A
    "/project_b/ProjectB_Main.html", // 프로젝트 B
    "/project_c/ProjectC_Main.html", // 프로젝트 C
    "/project_c/ProjectC_Cards.html", // 프로젝트 C 카드
    "/project_d/ProjectD_Main.html", // 프로젝트 D
    "/project_d/characters.html", // 프로젝트 D 인물
    "/project_d/factions.html", // 프로젝트 D 세력
    "/project_e/ProjectE_Main.html", // 프로젝트 E
    "/project_f/ProjectF_Main.html", // 프로젝트 F
    "/project_g/ProjectG_Main.html", // 프로젝트 G
    "/project_h/ProjectH_Main.html", // 프로젝트 H
    "/project_i/ProjectI_Main.html", // 프로젝트 I
    "/project_j/ProjectJ_Main.html", // 프로젝트 J
    "/project_k/ProjectK_Main.html", // 프로젝트 K
    "/project_l/ProjectL_Main.html", // 프로젝트 L
    "/project_m/ProjectM_Main.html", // 프로젝트 M
    "/project_n/ProjectN_Main.html", // 프로젝트 N
    "/project_o/ProjectO_Main.html", // 프로젝트 O
    "/project_p/ProjectP_Main.html", // 프로젝트 P
    "/project_q/ProjectQ_Main.html", // 프로젝트 Q
    "/project_r/ProjectR_Main.html", // 프로젝트 R
    "/project_s/ProjectS_Main.html", // 프로젝트 S
    "/project_t/ProjectT_Main.html", // 프로젝트 T
    "/project_u/ProjectU_Main.html", // 프로젝트 U
    "/project_v/ProjectV_Main.html", // 프로젝트 V
    "/project_w/ProjectW_Main.html", // 프로젝트 W
    "/project_x/ProjectX_Main.html", // 프로젝트 X
    "/project_y/ProjectY_Main.html", // 프로젝트 Y
    "/project_z/ProjectZ_Main.html", // 프로젝트 Z
    "/project_alpha/ProjectAlpha_Main.html", // 프로젝트 알파
    "/project_beta/ProjectBeta_Main.html", // 프로젝트 베타
    "/project_gamma/ProjectGamma_Main.html", // 프로젝트 감마
    "/project_delta/ProjectDelta_Main.html", // 프로젝트 델타
    "/project_epsilon/ProjectEpsilon_Main.html", // 프로젝트 엡실론
    "/project_zeta/ProjectZeta_Main.html", // 프로젝트 제타
    "/project_eta/ProjectEta_Main.html", // 프로젝트 에타
    "/project_theta/ProjectTheta_Main.html", // 프로젝트 세타
    "/project_iota/ProjectIota_Main.html", // 프로젝트 요타
]); // 목록 끝

const PREVIEW_PAGE_SET = new Set(PREVIEW_PAGES); // 허용 경로 집합

export function normalizePreviewPath(value) // 미리보기 경로 정리
{ // 함수 시작
    if (typeof value !== "string" || value.length === 0) // 입력 형식 확인
    { // 조건 시작
        return "/main.html"; // 기본 페이지 반환
    } // 조건 끝

    let decodedPath = value; // 해제 경로 준비

    try // 주소 해제 시도
    { // 시도 시작
        decodedPath = decodeURIComponent(value); // 한 번만 주소 해제
    } // 시도 끝
    catch // 잘못된 주소 처리
    { // 오류 시작
        return "/main.html"; // 기본 페이지 반환
    } // 오류 끝

    const segments = decodedPath.split("/"); // 경로 조각 분리
    const isUnsafe = !decodedPath.startsWith("/") || decodedPath.startsWith("//") || decodedPath.includes("\\") || decodedPath.includes(":") || segments.includes(".."); // 위험 경로 판정

    if (isUnsafe || !PREVIEW_PAGE_SET.has(decodedPath)) // 허용 경로 확인
    { // 조건 시작
        return "/main.html"; // 기본 페이지 반환
    } // 조건 끝

    return decodedPath; // 안전 경로 반환
} // 함수 끝

export function resolveDevicePreset(value) // 기기 프리셋 정리
{ // 함수 시작
    return Object.hasOwn(DEVICE_PRESETS, value) ? value : "desktop"; // 허용 기기 반환
} // 함수 끝

export function buildPreviewUrl(pagePath, deviceName) // 공유 주소 생성
{ // 함수 시작
    const parameters = new URLSearchParams(); // 검색 매개변수 생성
    parameters.set("page", normalizePreviewPath(pagePath)); // 안전 페이지 저장
    parameters.set("device", resolveDevicePreset(deviceName)); // 안전 기기 저장
    return "/device-preview.html?" + parameters.toString(); // 미리보기 주소 반환
} // 함수 끝

function setStyleProperty(element, name, value) // 스타일 값 설정
{ // 함수 시작
    if (typeof element.style?.setProperty === "function") // 브라우저 스타일 확인
    { // 조건 시작
        element.style.setProperty(name, value); // 브라우저 스타일 저장
        return; // 처리 종료
    } // 조건 끝

    element.style?.set?.(name, value); // 테스트 스타일 저장
} // 함수 끝

export function initializeDevicePreview(root = document, view = window) // 기기 미리보기 초기화
{ // 함수 시작
    if (root.__devforgeDevicePreview) // 기존 제어기 확인
    { // 조건 시작
        return root.__devforgeDevicePreview; // 기존 제어기 반환
    } // 조건 끝

    const iframe = root.querySelector("[data-preview-frame]"); // 미리보기 프레임 조회
    const frameShell = root.querySelector("[data-preview-shell]"); // 프레임 외곽 조회
    const error = root.querySelector("[data-preview-error]"); // 오류 문구 조회
    const iconSprite = root.querySelector(".preview-icon-sprite"); // 기기 아이콘 모음 조회
    const devicePicker = root.querySelector("[data-preview-device-picker]"); // 기기 선택기 조회
    const deviceTrigger = root.querySelector("[data-preview-device-trigger]"); // 대표 기기 버튼 조회
    const deviceMenu = root.querySelector("[data-preview-device-menu]"); // 기기 선택 목록 조회
    const deviceLabel = root.querySelector("[data-preview-device-label]"); // 대표 기기 문구 조회
    const deviceButtons = Array.from(root.querySelectorAll("[data-preview-device]")); // 기기 버튼 조회

    if (!iframe || !frameShell || !error || !iconSprite || !devicePicker || !deviceTrigger || !deviceMenu || !deviceLabel || deviceButtons.length === 0) // 필수 요소 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝

    const parameters = new URLSearchParams(view.location.search ?? ""); // 현재 검색 주소 읽기
    const state = // 현재 미리보기 상태
    { // 객체 시작
        page: normalizePreviewPath(parameters.get("page") ?? "/main.html"), // 현재 페이지
        device: resolveDevicePreset(parameters.get("device")), // 현재 기기
        fit: false, // 화면 맞춤 상태
        menuOpen: false, // 기기 목록 상태
    }; // 객체 끝
    let activeEmbeddedDocument = null; // 현재 내부 문서

    function setDeviceMenuOpen(isOpen, restoreFocus = false) // 기기 목록 상태 설정
    { // 함수 시작
        state.menuOpen = Boolean(isOpen); // 목록 상태 저장
        deviceMenu.hidden = !state.menuOpen; // 목록 표시 반영
        deviceTrigger.setAttribute("aria-expanded", String(state.menuOpen)); // 확장 상태 반영
        devicePicker.classList.toggle("is-open", state.menuOpen); // 열린 디자인 반영

        if (restoreFocus) // 초점 복귀 확인
        { // 조건 시작
            deviceTrigger.focus?.(); // 대표 버튼 초점
        } // 조건 끝
    } // 함수 끝

    function updateDeviceTrigger(deviceName, label) // 대표 기기 표시 갱신
    { // 함수 시작
        deviceTrigger.dataset.previewCurrentDevice = deviceName; // 대표 아이콘 상태 저장
        deviceLabel.textContent = label; // 대표 문구 반영
        deviceTrigger.setAttribute("aria-label", "미리보기 기기: " + label); // 접근성 이름 반영
    } // 함수 끝

    function focusDeviceButton(index) // 기기 항목 초점 이동
    { // 함수 시작
        const normalizedIndex = (index + deviceButtons.length) % deviceButtons.length; // 순환 위치 계산
        deviceButtons[normalizedIndex]?.focus?.(); // 대상 항목 초점
    } // 함수 끝

    function updateHistory() // 공유 주소 갱신
    { // 함수 시작
        const url = buildPreviewUrl(state.page, state.device); // 새 공유 주소 생성
        view.history.replaceState(null, "", url); // 현재 주소 교체
    } // 함수 끝

    function updateDevice(deviceName, writeHistory = true) // 기기 갱신
    { // 함수 시작
        state.device = resolveDevicePreset(deviceName); // 안전 기기 저장
        state.fit = false; // 맞춤 상태 해제
        const preset = DEVICE_PRESETS[state.device]; // 기기 크기 조회
        iframe.width = preset.width; // 프레임 너비 적용
        iframe.height = preset.height; // 프레임 높이 적용
        setStyleProperty(frameShell, "--preview-width", preset.width + "px"); // 외곽 너비 저장
        setStyleProperty(frameShell, "--preview-height", preset.height + "px"); // 외곽 높이 저장
        frameShell.classList.toggle("is-fit", false); // 맞춤 표시 해제
        updateDeviceTrigger(state.device, preset.label); // 대표 기기 표시 갱신

        for (const button of deviceButtons) // 기기 버튼 반복
        { // 반복 시작
            const isActive = button.dataset.previewDevice === state.device; // 선택 버튼 판정
            button.classList.toggle("is-active", isActive); // 선택 디자인 반영
            button.setAttribute("aria-checked", String(isActive)); // 선택 상태 반영
        } // 반복 끝

        setDeviceMenuOpen(false); // 기기 목록 닫기

        if (writeHistory) // 주소 기록 확인
        { // 조건 시작
            updateHistory(); // 공유 주소 갱신
        } // 조건 끝
    } // 함수 끝

    function enableFit() // 화면 맞춤 표시
    { // 함수 시작
        state.fit = true; // 맞춤 상태 저장
        const preset = DEVICE_PRESETS[state.device]; // 현재 기기 크기
        const availableWidth = Math.max(320, (view.innerWidth ?? preset.width) - 48); // 사용 가능 너비
        const availableHeight = Math.max(320, (view.innerHeight ?? preset.height) - 190); // 사용 가능 높이
        const scale = Math.min(1, availableWidth / preset.width, availableHeight / preset.height); // 맞춤 비율 계산
        setStyleProperty(frameShell, "--preview-scale", String(scale)); // 맞춤 비율 저장
        frameShell.classList.toggle("is-fit", true); // 맞춤 디자인 적용
        updateDeviceTrigger("fit", "화면 맞춤"); // 대표 맞춤 표시 갱신

        for (const button of deviceButtons) // 기기 버튼 반복
        { // 반복 시작
            const isActive = button.dataset.previewDevice === "fit"; // 맞춤 버튼 판정
            button.classList.toggle("is-active", isActive); // 선택 디자인 반영
            button.setAttribute("aria-checked", String(isActive)); // 선택 상태 반영
        } // 반복 끝

        setDeviceMenuOpen(false); // 기기 목록 닫기
        updateHistory(); // 공유 주소 갱신
    } // 함수 끝

    function onResize() // 도구 화면 변경 처리
    { // 함수 시작
        if (state.fit) // 맞춤 상태 확인
        { // 조건 시작
            enableFit(); // 맞춤 비율 다시 계산
        } // 조건 끝
    } // 함수 끝

    function onDeviceClick(event) // 기기 버튼 처리
    { // 함수 시작
        const deviceName = event.currentTarget.dataset.previewDevice; // 선택 기기 읽기

        if (deviceName === "fit") // 맞춤 버튼 확인
        { // 조건 시작
            enableFit(); // 맞춤 표시 적용
            return; // 처리 종료
        } // 조건 끝

        updateDevice(deviceName); // 기기 크기 적용
    } // 함수 끝

    function onDeviceTriggerClick() // 대표 기기 버튼 처리
    { // 함수 시작
        setDeviceMenuOpen(!state.menuOpen); // 기기 목록 전환
    } // 함수 끝

    function onDeviceTriggerKeydown(event) // 대표 버튼 키보드 처리
    { // 함수 시작
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") // 이동 키 확인
        { // 조건 시작
            return; // 일반 키 종료
        } // 조건 끝

        event.preventDefault(); // 기본 이동 차단
        setDeviceMenuOpen(true); // 기기 목록 열기
        const activeName = state.fit ? "fit" : state.device; // 현재 선택 이름
        const activeIndex = deviceButtons.findIndex((button) => button.dataset.previewDevice === activeName); // 현재 선택 위치
        focusDeviceButton(activeIndex >= 0 ? activeIndex : 0); // 현재 항목 초점
    } // 함수 끝

    function onDeviceButtonKeydown(event) // 기기 항목 키보드 처리
    { // 함수 시작
        const currentIndex = deviceButtons.indexOf(event.currentTarget); // 현재 항목 위치

        if (event.key === "Escape") // Escape 키 확인
        { // 조건 시작
            event.preventDefault(); // 기본 동작 차단
            setDeviceMenuOpen(false, true); // 목록 닫기와 초점 복귀
            return; // 처리 종료
        } // 조건 끝

        const movement = // 이동 방향
        { // 객체 시작
            ArrowDown: 1, // 아래 항목
            ArrowUp: -1, // 위 항목
            Home: -currentIndex, // 첫 항목
            End: deviceButtons.length - 1 - currentIndex, // 마지막 항목
        }; // 객체 끝

        if (!Object.hasOwn(movement, event.key)) // 이동 키 확인
        { // 조건 시작
            return; // 일반 키 종료
        } // 조건 끝

        event.preventDefault(); // 기본 이동 차단
        focusDeviceButton(currentIndex + movement[event.key]); // 다음 항목 초점
    } // 함수 끝

    function onDocumentKeydown(event) // 문서 키보드 처리
    { // 함수 시작
        if (event.key === "Escape" && state.menuOpen) // 열린 목록 Escape 확인
        { // 조건 시작
            event.preventDefault(); // 기본 동작 차단
            setDeviceMenuOpen(false, true); // 목록 닫기와 초점 복귀
        } // 조건 끝
    } // 함수 끝

    function onDocumentPointerDown(event) // 문서 바깥 선택 처리
    { // 함수 시작
        if (state.menuOpen && !devicePicker.contains(event.target)) // 선택기 바깥 확인
        { // 조건 시작
            setDeviceMenuOpen(false); // 기기 목록 닫기
        } // 조건 끝
    } // 함수 끝

    function mountDevicePicker() // 내부 헤더 기기 선택기 연결
    { // 함수 시작
        const embeddedDocument = iframe.contentDocument; // 내부 페이지 문서 조회

        if (!embeddedDocument) // 내부 문서 확인
        { // 조건 시작
            return false; // 연결 실패 반환
        } // 조건 끝

        if (!embeddedDocument.querySelector("link[data-preview-device-style]")) // 전용 스타일 중복 확인
        { // 조건 시작
            const styleLink = embeddedDocument.createElement("link"); // 스타일 링크 생성
            styleLink.rel = "stylesheet"; // 스타일 관계 설정
            styleLink.href = "/device-preview-control.css"; // 전용 스타일 주소 설정
            styleLink.dataset.previewDeviceStyle = "true"; // 스타일 연결 표시
            embeddedDocument.head.appendChild(styleLink); // 내부 문서 스타일 연결
        } // 조건 끝

        const actionGroup = embeddedDocument.querySelector(".nav-actions"); // 작업 버튼 묶음 조회
        const contactButton = embeddedDocument.querySelector("#contact-open, .nav-actions button"); // 문의 버튼 조회
        const navigation = embeddedDocument.querySelector("[data-responsive-nav-root]"); // 사이트 메뉴 조회
        const mountTarget = actionGroup ?? navigation; // 연결 대상 결정

        if (!mountTarget) // 연결 대상 확인
        { // 조건 시작
            return false; // 연결 실패 반환
        } // 조건 끝

        mountTarget.insertBefore(iconSprite, contactButton); // 아이콘 모음 배치
        mountTarget.insertBefore(devicePicker, contactButton); // 기기 선택기 배치
        devicePicker.hidden = false; // 기기 선택기 표시

        if (activeEmbeddedDocument !== embeddedDocument) // 내부 문서 변경 확인
        { // 조건 시작
            activeEmbeddedDocument?.removeEventListener("keydown", onDocumentKeydown); // 이전 키보드 처리기 해제
            activeEmbeddedDocument?.removeEventListener("pointerdown", onDocumentPointerDown); // 이전 선택 처리기 해제
            embeddedDocument.addEventListener("keydown", onDocumentKeydown); // 내부 키보드 처리기 등록
            embeddedDocument.addEventListener("pointerdown", onDocumentPointerDown); // 내부 선택 처리기 등록
            activeEmbeddedDocument = embeddedDocument; // 현재 내부 문서 저장
        } // 조건 끝

        return true; // 연결 성공 반환
    } // 함수 끝

    function onFrameLoad() // 프레임 완료 처리
    { // 함수 시작
        error.hidden = true; // 오류 숨김
        error.textContent = ""; // 오류 문구 지움
        mountDevicePicker(); // 내부 헤더 기기 선택기 연결
    } // 함수 끝

    function onFrameError() // 프레임 오류 처리
    { // 함수 시작
        error.hidden = false; // 오류 표시
        error.textContent = "페이지를 불러오지 못했습니다. 미리보기 주소를 확인해 주세요."; // 오류 안내
    } // 함수 끝

    function destroy() // 미리보기 해제
    { // 함수 시작
        deviceButtons.forEach((button) => button.removeEventListener("click", onDeviceClick)); // 버튼 처리기 해제
        deviceButtons.forEach((button) => button.removeEventListener("keydown", onDeviceButtonKeydown)); // 버튼 키보드 해제
        deviceTrigger.removeEventListener("click", onDeviceTriggerClick); // 대표 버튼 처리기 해제
        deviceTrigger.removeEventListener("keydown", onDeviceTriggerKeydown); // 대표 키보드 해제
        iframe.removeEventListener("load", onFrameLoad); // 완료 처리기 해제
        iframe.removeEventListener("error", onFrameError); // 오류 처리기 해제
        root.removeEventListener?.("keydown", onDocumentKeydown); // 문서 키보드 해제
        root.removeEventListener?.("pointerdown", onDocumentPointerDown); // 문서 선택 해제
        activeEmbeddedDocument?.removeEventListener("keydown", onDocumentKeydown); // 내부 키보드 해제
        activeEmbeddedDocument?.removeEventListener("pointerdown", onDocumentPointerDown); // 내부 선택 해제
        activeEmbeddedDocument = null; // 내부 문서 연결 해제
        view.removeEventListener?.("resize", onResize); // 화면 처리기 해제
        root.__devforgeDevicePreview = null; // 제어기 연결 해제
    } // 함수 끝

    deviceButtons.forEach((button) => button.addEventListener("click", onDeviceClick)); // 버튼 처리기 등록
    deviceButtons.forEach((button) => button.addEventListener("keydown", onDeviceButtonKeydown)); // 버튼 키보드 등록
    deviceTrigger.addEventListener("click", onDeviceTriggerClick); // 대표 버튼 처리기 등록
    deviceTrigger.addEventListener("keydown", onDeviceTriggerKeydown); // 대표 키보드 등록
    iframe.addEventListener("load", onFrameLoad); // 완료 처리기 등록
    iframe.addEventListener("error", onFrameError); // 오류 처리기 등록
    root.addEventListener?.("keydown", onDocumentKeydown); // 문서 키보드 등록
    root.addEventListener?.("pointerdown", onDocumentPointerDown); // 문서 선택 등록
    view.addEventListener?.("resize", onResize); // 화면 처리기 등록
    iframe.src = state.page; // 초기 페이지 적용
    error.hidden = true; // 초기 오류 숨김
    error.textContent = ""; // 초기 오류 지움
    updateDevice(state.device, false); // 초기 기기 적용
    updateHistory(); // 초기 공유 주소 정리
    const controller = Object.freeze({ updateDevice, enableFit, destroy }); // 제어기 생성
    root.__devforgeDevicePreview = controller; // 제어기 저장
    return controller; // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeDevicePreview(document, window), { once: true }); // 준비 후 초기화
    } // 조건 끝
    else // 준비 완료 확인
    { // 대안 시작
        initializeDevicePreview(document, window); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
