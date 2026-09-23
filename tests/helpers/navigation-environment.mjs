function toDatasetKey(name) // 데이터 키 변환
{ // 함수 시작
    return name.slice(5).replace(/-([a-z])/g, (match, letter) => letter.toUpperCase()); // 낙타 표기 반환
} // 함수 끝

class FakeClassList // 클래스 목록 대역
{ // 클래스 시작
    constructor() // 목록 초기화
    { // 생성 시작
        this.values = new Set(); // 클래스 저장소
    } // 생성 끝

    add(...names) // 클래스 추가
    { // 추가 시작
        names.forEach((name) => this.values.add(name)); // 클래스 저장
    } // 추가 끝

    remove(...names) // 클래스 제거
    { // 제거 시작
        names.forEach((name) => this.values.delete(name)); // 클래스 삭제
    } // 제거 끝

    contains(name) // 클래스 확인
    { // 확인 시작
        return this.values.has(name); // 포함 여부 반환
    } // 확인 끝
} // 클래스 끝

class FakeElement // 요소 대역
{ // 클래스 시작
    constructor(tagName, root) // 요소 초기화
    { // 생성 시작
        this.tagName = tagName.toUpperCase(); // 태그 이름
        this.root = root; // 문서 대역
        this.children = []; // 하위 요소
        this.parentNode = null; // 부모 요소
        this.dataset = {}; // 데이터 속성
        this.attributes = new Map(); // 일반 속성
        this.classList = new FakeClassList(); // 클래스 목록
        this.className = ""; // 클래스 이름
        this.id = ""; // 요소 식별자
        this.href = ""; // 링크 주소
        this.hidden = false; // 숨김 상태
        this.textContent = ""; // 요소 문구
        this.type = ""; // 버튼 형식
        this.listeners = new Map(); // 이벤트 목록
    } // 생성 끝

    append(...children) // 하위 요소 연결
    { // 연결 시작
        for (const child of children) // 하위 요소 반복
        { // 반복 시작
            child.parentNode = this; // 부모 연결
            this.children.push(child); // 하위 요소 저장
        } // 반복 끝
    } // 연결 끝

    remove() // 요소 제거
    { // 제거 시작
        if (!this.parentNode) // 부모 확인
        { // 조건 시작
            return; // 제거 생략
        } // 조건 끝

        this.parentNode.children = this.parentNode.children.filter((child) => child !== this); // 부모 목록 정리
        this.parentNode = null; // 부모 연결 해제
    } // 제거 끝

    setAttribute(name, value) // 속성 설정
    { // 설정 시작
        const textValue = String(value); // 문자 값 생성
        this.attributes.set(name, textValue); // 속성 저장

        if (name === "id") // 식별자 확인
        { // 조건 시작
            this.id = textValue; // 식별자 저장
        } // 조건 끝

        if (name.startsWith("data-")) // 데이터 속성 확인
        { // 조건 시작
            this.dataset[toDatasetKey(name)] = textValue; // 데이터 값 저장
        } // 조건 끝
    } // 설정 끝

    getAttribute(name) // 속성 조회
    { // 조회 시작
        return this.attributes.get(name) ?? null; // 속성 값 반환
    } // 조회 끝

    addEventListener(name, listener) // 이벤트 등록
    { // 등록 시작
        const listeners = this.listeners.get(name) ?? new Set(); // 이벤트 저장소
        listeners.add(listener); // 처리기 추가
        this.listeners.set(name, listeners); // 저장소 반영
    } // 등록 끝

    removeEventListener(name, listener) // 이벤트 해제
    { // 해제 시작
        this.listeners.get(name)?.delete(listener); // 처리기 삭제
    } // 해제 끝

    dispatch(name, detail = {}) // 이벤트 실행
    { // 실행 시작
        const event = // 이벤트 객체
        { // 객체 시작
            target: detail.target ?? this, // 이벤트 대상
            currentTarget: this, // 현재 대상
            key: detail.key ?? "", // 키 값
            shiftKey: detail.shiftKey === true, // 보조 키 상태
            defaultPrevented: false, // 기본 동작 상태
            preventDefault() // 기본 동작 차단
            { // 차단 시작
                event.defaultPrevented = true; // 차단 상태 저장
            }, // 차단 끝
        }; // 이벤트 객체 끝

        for (const listener of this.listeners.get(name) ?? []) // 처리기 반복
        { // 반복 시작
            listener(event); // 처리기 실행
        } // 반복 끝

        return event; // 이벤트 반환
    } // 실행 끝

    focus() // 요소 초점
    { // 초점 시작
        this.root.activeElement = this; // 현재 초점 저장
    } // 초점 끝
} // 클래스 끝

export function createNavigationEnvironment(options = {}) // 내비게이션 환경 생성
{ // 함수 시작
    const allElements = []; // 전체 요소 저장소
    const documentListeners = new Map(); // 문서 이벤트 저장소
    const viewListeners = new Map(); // 창 이벤트 저장소
    const root = // 문서 대역
    { // 객체 시작
        activeElement: null, // 현재 초점
        __devforgeResponsiveNav: null, // 내비게이션 제어기
        createElement(tagName) // 요소 생성
        { // 생성 시작
            const element = new FakeElement(tagName, root); // 요소 대역 생성
            allElements.push(element); // 요소 목록 저장
            return element; // 요소 반환
        }, // 생성 끝
        querySelector(selector) // 요소 조회
        { // 조회 시작
            if (selector === "[data-responsive-nav-root]") // 헤더 조회 확인
            { // 조건 시작
                return options.withRoot === false ? null : header; // 헤더 반환
            } // 조건 끝

            if (selector === "#contact-modal") // 문의창 조회 확인
            { // 조건 시작
                return contactModal; // 문의창 반환
            } // 조건 끝

            return null; // 요소 없음 반환
        }, // 조회 끝
        addEventListener(name, listener) // 문서 이벤트 등록
        { // 등록 시작
            const listeners = documentListeners.get(name) ?? new Set(); // 이벤트 저장소
            listeners.add(listener); // 처리기 추가
            documentListeners.set(name, listeners); // 저장소 반영
        }, // 등록 끝
        removeEventListener(name, listener) // 문서 이벤트 해제
        { // 해제 시작
            documentListeners.get(name)?.delete(listener); // 처리기 삭제
        }, // 해제 끝
    }; // 문서 대역 끝
    const header = root.createElement("nav"); // 헤더 요소
    header.dataset.responsiveNavRoot = "true"; // 헤더 식별자
    const body = root.createElement("body"); // 본문 요소
    root.body = body; // 본문 연결
    body.dataset.theme = options.theme ?? ""; // 테마 식별자
    const contactModal = options.withContact === true ? root.createElement("dialog") : null; // 문의창 요소

    if (contactModal) // 문의창 확인
    { // 조건 시작
        contactModal.id = "contact-modal"; // 문의창 식별자
    } // 조건 끝

    const location = // 주소 대역
    { // 객체 시작
        pathname: options.pathname ?? "/main.html", // 현재 경로
        hash: options.hash ?? "", // 현재 해시
    }; // 주소 끝
    const historyCalls = []; // 주소 변경 기록
    const storageValues = new Map(); // 저장 값 모음
    const storageWrites = []; // 저장 변경 기록

    if (typeof options.storedColorMode === "string") // 저장 모드 확인
    { // 조건 시작
        storageValues.set("devforge-color-mode", options.storedColorMode); // 저장 모드 등록
    } // 조건 끝

    const view = // 창 대역
    { // 객체 시작
        innerWidth: options.width ?? 390, // 화면 너비
        location, // 주소 정보
        history: // 주소 기록 도구
        { // 객체 시작
            replaceState(state, title, url) // 현재 주소 교체
            { // 교체 시작
                historyCalls.push({ state, title, url }); // 교체 기록 저장
                location.hash = url.includes("#") ? url.slice(url.indexOf("#")) : ""; // 해시 상태 갱신
            }, // 교체 끝
        }, // 주소 기록 끝
        localStorage: // 로컬 저장소 대역
        { // 객체 시작
            getItem(key) // 저장 값 조회
            { // 조회 시작
                return storageValues.get(key) ?? null; // 저장 값 반환
            }, // 조회 끝
            setItem(key, value) // 저장 값 변경
            { // 변경 시작
                const textValue = String(value); // 문자 값 생성
                storageValues.set(key, textValue); // 저장 값 반영
                storageWrites.push({ key, value: textValue }); // 저장 변경 기록
            }, // 변경 끝
        }, // 저장소 끝
        matchMedia(query) // 화면 설정 조회
        { // 조회 시작
            return { matches: query === "(prefers-color-scheme: dark)" && options.prefersDark === true }; // 다크 선호 반환
        }, // 조회 끝
        addEventListener(name, listener) // 창 이벤트 등록
        { // 등록 시작
            const listeners = viewListeners.get(name) ?? new Set(); // 이벤트 저장소
            listeners.add(listener); // 처리기 추가
            viewListeners.set(name, listeners); // 저장소 반영
        }, // 등록 끝
        removeEventListener(name, listener) // 창 이벤트 해제
        { // 해제 시작
            viewListeners.get(name)?.delete(listener); // 처리기 삭제
        }, // 해제 끝
    }; // 창 대역 끝

    function createdByRole(role) // 역할 요소 조회
    { // 함수 시작
        return allElements.filter((element) => element.dataset.responsiveRole === role); // 역할 요소 반환
    } // 함수 끝

    function resizeTo(width) // 화면 너비 변경
    { // 함수 시작
        view.innerWidth = width; // 새 너비 저장

        for (const listener of viewListeners.get("resize") ?? []) // 크기 처리기 반복
        { // 반복 시작
            listener(); // 크기 처리기 실행
        } // 반복 끝
    } // 함수 끝

    function pressKey(key, shiftKey = false) // 키 입력
    { // 함수 시작
        const event = // 키 이벤트
        { // 객체 시작
            key, // 키 값
            shiftKey, // 보조 키 상태
            defaultPrevented: false, // 기본 동작 상태
            preventDefault() // 기본 동작 차단
            { // 차단 시작
                event.defaultPrevented = true; // 차단 상태 저장
            }, // 차단 끝
        }; // 이벤트 끝

        for (const listener of documentListeners.get("keydown") ?? []) // 키 처리기 반복
        { // 반복 시작
            listener(event); // 키 처리기 실행
        } // 반복 끝

        return event; // 키 이벤트 반환
    } // 함수 끝

    return { // 환경 반환
        root, // 문서 대역
        view, // 창 대역
        header, // 헤더 요소
        contactModal, // 문의창 요소
        historyCalls, // 주소 변경 기록
        storageWrites, // 저장 변경 기록
        createdByRole, // 역할 조회 기능
        resizeTo, // 너비 변경 기능
        pressKey, // 키 입력 기능
        get drawer() // 메뉴 패널 조회
        { // 조회 시작
            return createdByRole("drawer")[0] ?? null; // 메뉴 패널 반환
        }, // 조회 끝
        get toggle() // 메뉴 버튼 조회
        { // 조회 시작
            return createdByRole("toggle")[0] ?? null; // 메뉴 버튼 반환
        }, // 조회 끝
    }; // 환경 끝
} // 함수 끝
