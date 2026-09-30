import assert from "node:assert/strict"; // 엄격 검증 도구

function createClassList() // 클래스 목록 생성
{ // 함수 시작
    const values = new Set(); // 클래스 저장소
    return Object.freeze( // 클래스 도구 반환
    { // 객체 시작
        add(...names) // 클래스 추가
        { // 추가 시작
            names.forEach((name) => values.add(name)); // 이름 저장
        }, // 추가 끝
        remove(...names) // 클래스 제거
        { // 제거 시작
            names.forEach((name) => values.delete(name)); // 이름 삭제
        }, // 제거 끝
        contains(name) // 클래스 확인
        { // 확인 시작
            return values.has(name); // 포함 여부 반환
        }, // 확인 끝
    }); // 객체 끝
} // 함수 끝

function createElement(root, options = {}) // 요소 대역 생성
{ // 함수 시작
    const listeners = new Map(); // 이벤트 저장소
    const element = // 요소 대역
    { // 객체 시작
        tagName: (options.tagName ?? "DIV").toUpperCase(), // 태그 이름
        id: options.id ?? "", // 요소 식별자
        dataset: { ...(options.dataset ?? {}) }, // 데이터 속성
        attributes: {}, // 일반 속성
        children: [], // 자식 목록
        parentNode: null, // 부모 요소
        hidden: options.hidden ?? true, // 숨김 상태
        disabled: options.disabled ?? false, // 비활성 상태
        inert: options.inert ?? false, // 배경 비활성 상태
        isConnected: true, // 문서 연결 상태
        focusable: options.focusable ?? false, // 초점 가능 상태
        classList: createClassList(), // 클래스 목록
        append(...children) // 자식 연결
        { // 연결 시작
            for (const child of children) // 자식 반복
            { // 반복 시작
                child.parentNode = element; // 부모 연결
                element.children.push(child); // 자식 저장
            } // 반복 끝
        }, // 연결 끝
        setAttribute(name, value) // 속성 설정
        { // 설정 시작
            element.attributes[name] = String(value); // 문자열 속성 저장
        }, // 설정 끝
        getAttribute(name) // 속성 조회
        { // 조회 시작
            return element.attributes[name] ?? null; // 속성 반환
        }, // 조회 끝
        removeAttribute(name) // 속성 제거
        { // 제거 시작
            delete element.attributes[name]; // 속성 삭제
        }, // 제거 끝
        hasAttribute(name) // 속성 확인
        { // 확인 시작
            return name in element.attributes; // 존재 여부 반환
        }, // 확인 끝
        addEventListener(type, listener) // 이벤트 등록
        { // 등록 시작
            const values = listeners.get(type) ?? []; // 기존 처리기 조회
            values.push(listener); // 처리기 추가
            listeners.set(type, values); // 처리기 저장
        }, // 등록 끝
        removeEventListener(type, listener) // 이벤트 해제
        { // 해제 시작
            listeners.set(type, (listeners.get(type) ?? []).filter((value) => value !== listener)); // 처리기 제거
        }, // 해제 끝
        dispatch(type, init = {}) // 이벤트 전달
        { // 전달 시작
            const event = createEvent(type, element, init); // 이벤트 생성
            for (const listener of listeners.get(type) ?? []) // 처리기 반복
            { // 반복 시작
                listener(event); // 처리기 실행
            } // 반복 끝
            return event; // 이벤트 반환
        }, // 전달 끝
        focus() // 초점 이동
        { // 초점 시작
            root.activeElement = element; // 활성 요소 설정
        }, // 초점 끝
        contains(candidate) // 포함 확인
        { // 확인 시작
            if (candidate === element) // 본인 확인
            { // 조건 시작
                return true; // 본인 포함 반환
            } // 조건 끝
            return element.children.some((child) => child.contains(candidate)); // 자식 포함 반환
        }, // 확인 끝
        closest(selector) // 가까운 요소 조회
        { // 조회 시작
            if (selector === "[data-dialog-close]" && "dialogClose" in element.dataset) // 닫기 요소 확인
            { // 조건 시작
                return element; // 현재 요소 반환
            } // 조건 끝
            if (selector === "[data-dialog-open]" && "dialogOpen" in element.dataset) // 열기 요소 확인
            { // 조건 시작
                return element; // 현재 요소 반환
            } // 조건 끝
            return element.parentNode?.closest(selector) ?? null; // 부모 조회 반환
        }, // 조회 끝
        querySelectorAll() // 초점 요소 조회
        { // 조회 시작
            const results = []; // 결과 목록
            const visit = (candidate) => // 자식 방문 도구
            { // 방문 시작
                if (candidate.focusable && !candidate.hidden && !candidate.disabled) // 초점 가능 확인
                { // 조건 시작
                    results.push(candidate); // 결과 추가
                } // 조건 끝
                candidate.children.forEach(visit); // 하위 방문
            }; // 방문 도구 끝
            element.children.forEach(visit); // 자식 방문
            return results; // 결과 반환
        }, // 조회 끝
    }; // 객체 끝

    if (options.native === true) // 네이티브 창 확인
    { // 조건 시작
        element.showModal = () => // 네이티브 열기 도구
        { // 열기 시작
            element.setAttribute("open", ""); // 열림 속성 설정
            element.hidden = false; // 표시 상태 설정
            element.showModalCalls += 1; // 호출 횟수 증가
        }; // 열기 도구 끝
        element.close = () => // 네이티브 닫기 도구
        { // 닫기 시작
            element.removeAttribute("open"); // 열림 속성 제거
            element.hidden = true; // 숨김 상태 설정
            element.closeCalls += 1; // 호출 횟수 증가
            element.dispatch("close"); // 닫힘 이벤트 전달
        }; // 닫기 도구 끝
        element.showModalCalls = 0; // 열기 호출 횟수
        element.closeCalls = 0; // 닫기 호출 횟수
    } // 조건 끝

    return element; // 요소 반환
} // 함수 끝

function createEvent(type, target, init = {}) // 이벤트 대역 생성
{ // 함수 시작
    const event = // 이벤트 객체
    { // 객체 시작
        type, // 이벤트 종류
        target: init.target ?? target, // 이벤트 대상
        key: init.key ?? "", // 키 입력
        shiftKey: init.shiftKey === true, // 역방향 여부
        defaultPrevented: false, // 기본 동작 차단 상태
        preventDefault() // 기본 동작 차단
        { // 차단 시작
            this.defaultPrevented = true; // 차단 상태 설정
        }, // 차단 끝
    }; // 객체 끝
    return event; // 이벤트 반환
} // 함수 끝

export function createDialogEnvironment() // 대화상자 환경 생성
{ // 함수 시작
    const listeners = new Map(); // 문서 이벤트 저장소
    const dialogs = []; // 대화상자 목록
    let bodyObserverCallback = null; // 본문 변화 감시 처리기
    const root = // 문서 대역
    { // 객체 시작
        activeElement: null, // 현재 초점 요소
        defaultView: // 창 대역
        { // 객체 시작
            MutationObserver: class // 변화 감시자 대역
            { // 클래스 시작
                constructor(callback) // 감시자 생성
                { // 생성 시작
                    this.callback = callback; // 변화 처리기 저장
                } // 생성 끝
                observe() // 감시 시작
                { // 함수 시작
                    bodyObserverCallback = this.callback; // 현재 처리기 저장
                } // 함수 끝
                disconnect() // 감시 종료
                { // 함수 시작
                    bodyObserverCallback = null; // 감시 처리기 해제
                } // 함수 끝
            }, // 클래스 끝
        }, // 객체 끝
        body: // 본문 대역
        { // 본문 시작
            classList: createClassList(), // 본문 클래스 목록
            children: [], // 본문 자식 목록
            append(...children) // 본문 자식 연결
            { // 연결 시작
                root.body.children.push(...children); // 본문 자식 저장
                bodyObserverCallback?.([{ addedNodes: children }]); // 추가 요소 변화 전달
            }, // 연결 끝
        }, // 본문 끝
        querySelectorAll(selector) // 문서 목록 조회
        { // 조회 시작
            return selector === "[data-dialog]" ? dialogs : []; // 대화상자 반환
        }, // 조회 끝
        getElementById(id) // 식별자 조회
        { // 조회 시작
            return dialogs.find((dialog) => dialog.id === id) ?? null; // 대화상자 반환
        }, // 조회 끝
        addEventListener(type, listener) // 문서 이벤트 등록
        { // 등록 시작
            const values = listeners.get(type) ?? []; // 처리기 목록 조회
            values.push(listener); // 처리기 추가
            listeners.set(type, values); // 목록 저장
        }, // 등록 끝
        removeEventListener(type, listener) // 문서 이벤트 해제
        { // 해제 시작
            listeners.set(type, (listeners.get(type) ?? []).filter((value) => value !== listener)); // 처리기 제거
        }, // 해제 끝
        dispatch(type, init = {}) // 문서 이벤트 전달
        { // 전달 시작
            const event = createEvent(type, init.target ?? root, init); // 이벤트 생성
            for (const listener of listeners.get(type) ?? []) // 처리기 반복
            { // 반복 시작
                listener(event); // 처리기 실행
            } // 반복 끝
            return event; // 이벤트 반환
        }, // 전달 끝
    }; // 문서 대역 끝

    function addDialog(id, options = {}) // 대화상자 추가
    { // 함수 시작
        const dialog = createElement(root, { id, dataset: { dialog: "" }, hidden: true, native: options.native === true, focusable: false, tagName: options.native === true ? "dialog" : "div" }); // 대화상자 생성
        const first = options.empty === true ? null : createElement(root, { tagName: "button", focusable: true, hidden: false }); // 첫 조작 요소
        const last = options.empty === true ? null : createElement(root, { tagName: "button", focusable: true, hidden: false }); // 마지막 조작 요소
        if (first && last) // 조작 요소 확인
        { // 조건 시작
            dialog.append(first, last); // 조작 요소 연결
        } // 조건 끝
        dialogs.push(dialog); // 대화상자 저장
        root.body.append(dialog); // 본문에 대화상자 연결
        return { dialog, first, last }; // 대화상자 정보 반환
    } // 함수 끝

    function createTrigger(dialogId) // 실행 요소 생성
    { // 함수 시작
        const trigger = createElement(root, { tagName: "button", dataset: { dialogOpen: dialogId }, focusable: true, hidden: false }); // 실행 요소 생성
        root.body.append(trigger); // 본문에 실행 요소 연결
        return trigger; // 실행 요소 반환
    } // 함수 끝

    function createCloseButton(dialog) // 닫기 요소 생성
    { // 함수 시작
        const button = createElement(root, { tagName: "button", dataset: { dialogClose: "" }, focusable: true, hidden: false }); // 닫기 버튼 생성
        dialog.append(button); // 대화상자 연결
        return button; // 닫기 버튼 반환
    } // 함수 끝

    function assertFocused(element) // 초점 검증
    { // 함수 시작
        assert.equal(root.activeElement, element); // 활성 요소 확인
    } // 함수 끝

    return { root, addDialog, createTrigger, createCloseButton, assertFocused }; // 환경 반환
} // 함수 끝
