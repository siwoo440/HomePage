import assert from "node:assert/strict"; // 엄격 비교 도구
import test from "node:test"; // 테스트 실행 도구
import { buildPreviewUrl, DEVICE_PRESETS, initializeDevicePreview, normalizePreviewPath, resolveDevicePreset } from "../public/device-preview.mjs"; // 미리보기 도구

class FakeClassList // 클래스 목록 대역
{ // 클래스 시작
    constructor() // 목록 초기화
    { // 생성 시작
        this.values = new Set(); // 클래스 저장소
    } // 생성 끝

    toggle(name, force) // 클래스 전환
    { // 전환 시작
        const enabled = force ?? !this.values.has(name); // 전환 상태 계산
        enabled ? this.values.add(name) : this.values.delete(name); // 클래스 상태 반영
        return enabled; // 전환 상태 반환
    } // 전환 끝

    contains(name) // 클래스 확인
    { // 확인 시작
        return this.values.has(name); // 포함 상태 반환
    } // 확인 끝
} // 클래스 끝

class FakeElement // 요소 대역
{ // 클래스 시작
    constructor(dataset = {}) // 요소 초기화
    { // 생성 시작
        this.dataset = dataset; // 데이터 속성
        this.listeners = new Map(); // 이벤트 저장소
        this.classList = new FakeClassList(); // 클래스 목록
        this.style = new Map(); // 스타일 저장소
        this.value = ""; // 선택 값
        this.src = ""; // 프레임 주소
        this.href = ""; // 링크 주소
        this.width = 0; // 프레임 너비
        this.height = 0; // 프레임 높이
        this.textContent = ""; // 상태 문구
        this.hidden = false; // 숨김 상태
        this.disabled = false; // 비활성 상태
        this.focused = false; // 초점 상태
        this.children = []; // 하위 요소 목록
        this.parent = null; // 상위 요소
    } // 생성 끝

    addEventListener(name, listener) // 이벤트 등록
    { // 등록 시작
        const listeners = this.listeners.get(name) ?? new Set(); // 이벤트 목록
        listeners.add(listener); // 처리기 추가
        this.listeners.set(name, listeners); // 목록 저장
    } // 등록 끝

    removeEventListener(name, listener) // 이벤트 해제
    { // 해제 시작
        this.listeners.get(name)?.delete(listener); // 처리기 삭제
    } // 해제 끝

    dispatch(name, details = {}) // 이벤트 실행
    { // 실행 시작
        for (const listener of this.listeners.get(name) ?? []) // 처리기 반복
        { // 반복 시작
            listener({ currentTarget: this, target: this, preventDefault() {}, ...details }); // 처리기 실행
        } // 반복 끝
    } // 실행 끝

    appendChild(child) // 하위 요소 추가
    { // 추가 시작
        child.parent?.children.splice(child.parent.children.indexOf(child), 1); // 기존 위치 제거
        this.children.push(child); // 하위 요소 저장
        child.parent = this; // 상위 요소 연결
        return child; // 추가 요소 반환
    } // 추가 끝

    insertBefore(child, reference) // 지정 위치 요소 추가
    { // 추가 시작
        child.parent?.children.splice(child.parent.children.indexOf(child), 1); // 기존 위치 제거
        const referenceIndex = this.children.indexOf(reference); // 기준 위치 조회
        const insertIndex = referenceIndex >= 0 ? referenceIndex : this.children.length; // 추가 위치 계산
        this.children.splice(insertIndex, 0, child); // 지정 위치 추가
        child.parent = this; // 상위 요소 연결
        return child; // 추가 요소 반환
    } // 추가 끝

    contains(element) // 포함 여부 확인
    { // 확인 시작
        return element === this || this.children.includes(element) || this.children.some((child) => child.contains(element)); // 하위 포함 반환
    } // 확인 끝

    focus() // 요소 초점
    { // 초점 시작
        this.focused = true; // 초점 상태 저장
    } // 초점 끝

    setAttribute(name, value) // 속성 설정
    { // 설정 시작
        this[name] = String(value); // 속성 값 저장
    } // 설정 끝
} // 클래스 끝

function createEmbeddedDocument() // 내부 페이지 문서 생성
{ // 함수 시작
    const head = new FakeElement(); // 문서 머리 생성
    const navRoot = new FakeElement(); // 사이트 메뉴 생성
    const navActions = new FakeElement(); // 작업 묶음 생성
    const contactButton = new FakeElement(); // 문의 버튼 생성
    const loginLink = new FakeElement(); // 로그인 링크 생성
    navActions.appendChild(contactButton); // 문의 버튼 연결
    navActions.appendChild(loginLink); // 로그인 링크 연결
    navRoot.appendChild(navActions); // 작업 묶음 연결
    const listeners = new Map(); // 문서 이벤트 저장소
    const embeddedDocument = // 내부 문서 대역
    { // 객체 시작
        head, // 문서 머리 연결
        querySelector(selector) // 요소 조회
        { // 조회 시작
            if (selector === ".nav-actions") // 작업 묶음 확인
            { // 조건 시작
                return navActions; // 작업 묶음 반환
            } // 조건 끝

            if (selector === "#contact-open, .nav-actions button") // 문의 버튼 확인
            { // 조건 시작
                return contactButton; // 문의 버튼 반환
            } // 조건 끝

            if (selector === "[data-responsive-nav-root]") // 사이트 메뉴 확인
            { // 조건 시작
                return navRoot; // 사이트 메뉴 반환
            } // 조건 끝

            if (selector === "link[data-preview-device-style]") // 전용 스타일 확인
            { // 조건 시작
                return head.children.find((child) => child.dataset.previewDeviceStyle === "true") ?? null; // 스타일 링크 반환
            } // 조건 끝

            return null; // 미등록 요소 반환
        }, // 조회 끝
        createElement() // 요소 생성
        { // 생성 시작
            return new FakeElement(); // 새 요소 반환
        }, // 생성 끝
        addEventListener(name, listener) // 문서 이벤트 등록
        { // 등록 시작
            const eventListeners = listeners.get(name) ?? new Set(); // 이벤트 목록
            eventListeners.add(listener); // 처리기 추가
            listeners.set(name, eventListeners); // 목록 저장
        }, // 등록 끝
        removeEventListener(name, listener) // 문서 이벤트 해제
        { // 해제 시작
            listeners.get(name)?.delete(listener); // 처리기 삭제
        }, // 해제 끝
        dispatch(name, details = {}) // 문서 이벤트 실행
        { // 실행 시작
            for (const listener of listeners.get(name) ?? []) // 처리기 반복
            { // 반복 시작
                listener({ target: embeddedDocument, preventDefault() {}, ...details }); // 처리기 실행
            } // 반복 끝
        }, // 실행 끝
    }; // 객체 끝
    return { embeddedDocument, navActions, contactButton, loginLink }; // 내부 문서 반환
} // 함수 끝

function createPreviewEnvironment(search = "") // 미리보기 환경 생성
{ // 함수 시작
    const iframe = new FakeElement(); // 미리보기 프레임
    const frameShell = new FakeElement(); // 프레임 외곽
    const error = new FakeElement(); // 오류 문구
    const devicePicker = new FakeElement(); // 기기 선택기
    devicePicker.hidden = true; // 이동 전 선택기 숨김
    const iconSprite = new FakeElement(); // 기기 아이콘 모음
    const deviceTrigger = new FakeElement({ previewCurrentDevice: "desktop" }); // 대표 선택 버튼
    const deviceMenu = new FakeElement(); // 기기 선택 목록
    const deviceLabel = new FakeElement(); // 대표 선택 문구
    const desktopButton = new FakeElement({ previewDevice: "desktop" }); // PC 버튼
    const tabletButton = new FakeElement({ previewDevice: "tablet" }); // 태블릿 버튼
    const mobileButton = new FakeElement({ previewDevice: "mobile" }); // 모바일 버튼
    const fitButton = new FakeElement({ previewDevice: "fit" }); // 맞춤 버튼
    const deviceButtons = [desktopButton, tabletButton, mobileButton, fitButton]; // 기기 버튼 목록
    devicePicker.appendChild(deviceTrigger); // 대표 버튼 연결
    devicePicker.appendChild(deviceMenu); // 선택 목록 연결
    deviceTrigger.appendChild(deviceLabel); // 대표 문구 연결
    deviceButtons.forEach((button) => deviceMenu.appendChild(button)); // 기기 버튼 연결
    const selectors = new Map( // 요소 선택 지도
    [ // 지도 시작
        ["[data-preview-frame]", iframe], // 프레임 연결
        ["[data-preview-shell]", frameShell], // 프레임 외곽 연결
        ["[data-preview-error]", error], // 오류 연결
        ["[data-preview-device-picker]", devicePicker], // 기기 선택기 연결
        [".preview-icon-sprite", iconSprite], // 기기 아이콘 연결
        ["[data-preview-device-trigger]", deviceTrigger], // 대표 버튼 연결
        ["[data-preview-device-menu]", deviceMenu], // 선택 목록 연결
        ["[data-preview-device-label]", deviceLabel], // 대표 문구 연결
    ]); // 지도 끝
    const rootListeners = new Map(); // 문서 이벤트 저장소
    const root = // 문서 대역
    { // 객체 시작
        __devforgeDevicePreview: null, // 제어기 저장소
        querySelector(selector) // 단일 요소 조회
        { // 조회 시작
            return selectors.get(selector) ?? null; // 요소 반환
        }, // 조회 끝
        querySelectorAll(selector) // 다중 요소 조회
        { // 조회 시작
            return selector === "[data-preview-device]" ? deviceButtons : []; // 버튼 목록 반환
        }, // 조회 끝
        addEventListener(name, listener) // 문서 이벤트 등록
        { // 등록 시작
            const listeners = rootListeners.get(name) ?? new Set(); // 이벤트 목록
            listeners.add(listener); // 처리기 추가
            rootListeners.set(name, listeners); // 목록 저장
        }, // 등록 끝
        removeEventListener(name, listener) // 문서 이벤트 해제
        { // 해제 시작
            rootListeners.get(name)?.delete(listener); // 처리기 삭제
        }, // 해제 끝
        dispatch(name, details = {}) // 문서 이벤트 실행
        { // 실행 시작
            for (const listener of rootListeners.get(name) ?? []) // 처리기 반복
            { // 반복 시작
                listener({ target: root, preventDefault() {}, ...details }); // 처리기 실행
            } // 반복 끝
        }, // 실행 끝
    }; // 문서 대역 끝
    const historyCalls = []; // 주소 변경 기록
    const location = { pathname: "/device-preview.html", search }; // 주소 대역
    const view = // 창 대역
    { // 객체 시작
        location, // 현재 주소
        history: // 주소 기록 도구
        { // 객체 시작
            replaceState(state, title, url) // 주소 교체
            { // 교체 시작
                historyCalls.push({ state, title, url }); // 주소 변경 기록
                location.search = url.includes("?") ? url.slice(url.indexOf("?")) : ""; // 검색 주소 반영
            }, // 교체 끝
        }, // 주소 기록 끝
    }; // 창 대역 끝

    return { root, view, iframe, frameShell, error, iconSprite, devicePicker, deviceTrigger, deviceMenu, deviceLabel, deviceButtons, historyCalls }; // 환경 반환
} // 함수 끝

test("세 기기 프리셋은 고정된 크기를 사용한다", () => // 기기 크기 테스트
{ // 테스트 시작
    assert.deepEqual(DEVICE_PRESETS.desktop, { width: 1440, height: 900, label: "PC" }); // PC 크기 확인
    assert.deepEqual(DEVICE_PRESETS.tablet, { width: 1024, height: 768, label: "태블릿 가로" }); // 태블릿 크기 확인
    assert.deepEqual(DEVICE_PRESETS.mobile, { width: 390, height: 844, label: "모바일" }); // 모바일 크기 확인
}); // 테스트 끝

test("외부 주소와 경로 이동은 메인 페이지로 되돌린다", () => // 주소 안전성 테스트
{ // 테스트 시작
    assert.equal(normalizePreviewPath("https://example.com"), "/main.html"); // 외부 주소 차단
    assert.equal(normalizePreviewPath("javascript:alert(1)"), "/main.html"); // 스크립트 주소 차단
    assert.equal(normalizePreviewPath("/../secret"), "/main.html"); // 상위 경로 차단
    assert.equal(normalizePreviewPath("/%2e%2e/secret"), "/main.html"); // 인코딩 경로 차단
    assert.equal(normalizePreviewPath("/unknown.html"), "/main.html"); // 미등록 페이지 차단
    assert.equal(normalizePreviewPath("/goods.html"), "/goods.html"); // 등록 페이지 허용
}); // 테스트 끝

test("잘못된 기기 이름은 PC로 되돌린다", () => // 기기 복구 테스트
{ // 테스트 시작
    assert.equal(resolveDevicePreset("watch"), "desktop"); // 기본 기기 확인
    assert.equal(buildPreviewUrl("/goods.html", "mobile"), "/device-preview.html?page=%2Fgoods.html&device=mobile"); // 공유 주소 확인
}); // 테스트 끝

test("모바일과 태블릿 버튼이 실제 프레임 크기를 바꾼다", () => // 프레임 전환 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment("?page=%2Fgoods.html&device=mobile"); // 모바일 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    assert.equal(environment.iframe.src, "/goods.html"); // 상품 프레임 주소 확인
    assert.equal(environment.iframe.width, 390); // 모바일 너비 확인
    assert.equal(environment.iframe.height, 844); // 모바일 높이 확인
    environment.deviceButtons[1].dispatch("click"); // 태블릿 선택
    assert.equal(environment.iframe.width, 1024); // 태블릿 너비 확인
    assert.equal(environment.iframe.height, 768); // 태블릿 높이 확인
}); // 테스트 끝

test("화면 맞춤은 프레임 크기를 유지하고 외곽 표시만 바꾼다", () => // 맞춤 표시 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment("?device=mobile"); // 모바일 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.deviceButtons[3].dispatch("click"); // 화면 맞춤 선택
    assert.equal(environment.iframe.width, 390); // 프레임 너비 유지 확인
    assert.equal(environment.iframe.height, 844); // 프레임 높이 유지 확인
    assert.equal(environment.frameShell.classList.contains("is-fit"), true); // 맞춤 외곽 확인
}); // 테스트 끝

test("프레임 오류 뒤에도 도구 모음을 계속 사용할 수 있다", () => // 프레임 오류 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.iframe.dispatch("error"); // 프레임 오류 실행
    assert.match(environment.error.textContent, /불러오지 못했습니다/); // 한국어 오류 확인
    assert.equal(environment.deviceButtons.some((button) => button.disabled), false); // 버튼 사용 가능 확인
}); // 테스트 끝

test("반복 초기화는 기존 미리보기 제어기를 재사용한다", () => // 중복 초기화 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    const first = initializeDevicePreview(environment.root, environment.view); // 첫 초기화
    const second = initializeDevicePreview(environment.root, environment.view); // 반복 초기화
    assert.equal(first, second); // 제어기 재사용 확인
}); // 테스트 끝

test("대표 기기 버튼은 목록을 열고 선택 결과를 표시한다", () => // 기기 선택 목록 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    assert.equal(environment.deviceMenu.hidden, true); // 초기 목록 닫힘 확인
    environment.deviceTrigger.dispatch("click"); // 대표 버튼 선택
    assert.equal(environment.deviceMenu.hidden, false); // 목록 열림 확인
    assert.equal(environment.deviceTrigger["aria-expanded"], "true"); // 확장 상태 확인
    environment.deviceButtons[2].dispatch("click"); // 모바일 항목 선택
    assert.equal(environment.iframe.width, 390); // 모바일 너비 확인
    assert.equal(environment.deviceLabel.textContent, "모바일"); // 대표 문구 확인
    assert.equal(environment.deviceTrigger.dataset.previewCurrentDevice, "mobile"); // 대표 아이콘 상태 확인
    assert.equal(environment.deviceTrigger["aria-label"], "미리보기 기기: 모바일"); // 접근성 이름 확인
    assert.equal(environment.deviceMenu.hidden, true); // 선택 후 목록 닫힘 확인
}); // 테스트 끝

test("Escape 키는 기기 목록을 닫고 대표 버튼으로 초점을 돌린다", () => // 기기 목록 닫기 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.deviceTrigger.dispatch("click"); // 목록 열기
    environment.root.dispatch("keydown", { key: "Escape" }); // Escape 입력
    assert.equal(environment.deviceMenu.hidden, true); // 목록 닫힘 확인
    assert.equal(environment.deviceTrigger["aria-expanded"], "false"); // 축소 상태 확인
    assert.equal(environment.deviceTrigger.focused, true); // 대표 버튼 초점 확인
}); // 테스트 끝

test("방향키는 열린 기기 목록의 다음 항목으로 이동한다", () => // 기기 목록 키보드 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.deviceTrigger.dispatch("keydown", { key: "ArrowDown" }); // 목록 키보드 열기
    assert.equal(environment.deviceButtons[0].focused, true); // 첫 항목 초점 확인
    environment.deviceButtons[0].dispatch("keydown", { key: "ArrowDown" }); // 다음 항목 이동
    assert.equal(environment.deviceButtons[1].focused, true); // 다음 항목 초점 확인
}); // 테스트 끝

test("기기 선택기 바깥을 누르면 열린 목록이 닫힌다", () => // 기기 목록 바깥 선택 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    const outsideElement = new FakeElement(); // 바깥 요소 생성
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.deviceTrigger.dispatch("click"); // 목록 열기
    environment.root.dispatch("pointerdown", { target: outsideElement }); // 바깥 영역 선택
    assert.equal(environment.deviceMenu.hidden, true); // 목록 닫힘 확인
}); // 테스트 끝

test("간소화된 상단바에서도 기기 미리보기를 초기화한다", () => // 간소화 상단바 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment("?page=%2Fmain.html&device=tablet"); // 간소화 환경 생성
    const controller = initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    assert.notEqual(controller, null); // 제어기 생성 확인
    assert.equal(environment.iframe.src, "/main.html"); // 주소 페이지 적용 확인
    assert.equal(environment.iframe.width, 1024); // 태블릿 너비 적용 확인
    assert.equal(environment.deviceLabel.textContent, "태블릿 가로"); // 대표 문구 확인
}); // 테스트 끝

test("내부 페이지가 열리면 기기 선택기를 문의하기 바로 앞에 배치한다", () => // 내부 헤더 배치 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    const embedded = createEmbeddedDocument(); // 내부 페이지 생성
    environment.iframe.contentDocument = embedded.embeddedDocument; // 내부 문서 연결
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.iframe.dispatch("load"); // 내부 페이지 완료 실행
    assert.deepEqual(embedded.navActions.children, [environment.iconSprite, environment.devicePicker, embedded.contactButton, embedded.loginLink]); // 문의 앞 배치 확인
    assert.equal(environment.devicePicker.hidden, false); // 기기 선택기 표시 확인
    assert.equal(embedded.embeddedDocument.head.children.length, 1); // 전용 스타일 한 번 연결 확인
}); // 테스트 끝

test("내부 페이지 바깥 영역을 누르면 기기 선택 목록을 닫는다", () => // 내부 문서 닫기 테스트
{ // 테스트 시작
    const environment = createPreviewEnvironment(); // 기본 환경 생성
    const embedded = createEmbeddedDocument(); // 내부 페이지 생성
    const outsideElement = new FakeElement(); // 바깥 요소 생성
    environment.iframe.contentDocument = embedded.embeddedDocument; // 내부 문서 연결
    initializeDevicePreview(environment.root, environment.view); // 미리보기 초기화
    environment.iframe.dispatch("load"); // 내부 페이지 완료 실행
    environment.deviceTrigger.dispatch("click"); // 기기 목록 열기
    embedded.embeddedDocument.dispatch("pointerdown", { target: outsideElement }); // 내부 바깥 영역 선택
    assert.equal(environment.deviceMenu.hidden, true); // 목록 닫힘 확인
}); // 테스트 끝
