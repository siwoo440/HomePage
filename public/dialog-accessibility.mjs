const FOCUSABLE_SELECTOR = "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"; // 초점 요소 선택자

function isNativeDialog(dialog) // 네이티브 창 판정
{ // 함수 시작
    return dialog?.tagName === "DIALOG"; // 태그 판정 반환
} // 함수 끝

function getFocusableElements(dialog) // 초점 요소 조회
{ // 함수 시작
    return Array.from(dialog?.querySelectorAll?.(FOCUSABLE_SELECTOR) ?? []).filter((element) => element.hidden !== true && element.disabled !== true); // 사용 가능 요소 반환
} // 함수 끝

function findContainingDialog(dialogs, target) // 포함 대화상자 조회
{ // 함수 시작
    return dialogs.find((dialog) => dialog.contains?.(target)) ?? null; // 포함 창 반환
} // 함수 끝

export function initializeDialogAccessibility(root = document) // 대화상자 접근성 초기화
{ // 함수 시작
    if (root.__devforgeDialogController) // 기존 제어기 확인
    { // 조건 시작
        return root.__devforgeDialogController; // 기존 제어기 반환
    } // 조건 끝

    const dialogs = Array.from(root.querySelectorAll?.("[data-dialog]") ?? []); // 대화상자 목록
    const triggers = new WeakMap(); // 실행 요소 저장소
    const nativeClosePreferences = new WeakMap(); // 네이티브 복원 설정
    const nativeCloseListeners = new Map(); // 네이티브 처리기 저장소
    const backgroundInertStates = new Map(); // 배경 비활성 이전 상태
    let backgroundObserver = null; // 동적 배경 감시자
    let activeDialog = null; // 현재 대화상자

    function setBodyLocked(locked) // 본문 잠금 설정
    { // 함수 시작
        if (locked) // 잠금 요청 확인
        { // 조건 시작
            root.body?.classList?.add("dialog-open"); // 본문 잠금 추가
            return; // 처리 종료
        } // 조건 끝

        root.body?.classList?.remove("dialog-open"); // 본문 잠금 제거
    } // 함수 끝

    function makeBackgroundInert(element, dialog) // 배경 요소 조작 차단
    { // 함수 시작
        if (!element || element === dialog || element.contains?.(dialog) || !("inert" in element)) // 차단 제외 요소 확인
        { // 조건 시작
            return; // 차단 생략
        } // 조건 끝
        if (!backgroundInertStates.has(element)) // 이전 상태 미저장 확인
        { // 조건 시작
            backgroundInertStates.set(element, element.inert === true); // 이전 비활성 상태 저장
        } // 조건 끝
        element.inert = true; // 배경 조작 차단
    } // 함수 끝

    function setBackgroundInert(dialog, inert) // 배경 조작 차단 설정
    { // 함수 시작
        if (!inert) // 차단 해제 확인
        { // 조건 시작
            backgroundObserver?.disconnect(); // 동적 배경 감시 종료
            backgroundObserver = null; // 감시자 참조 해제
            for (const [element, previousState] of backgroundInertStates) // 이전 상태 반복
            { // 반복 시작
                element.inert = previousState; // 이전 비활성 상태 복원
            } // 반복 끝
            backgroundInertStates.clear(); // 이전 상태 정리
            return; // 처리 종료
        } // 조건 끝

        const bodyChildren = Array.from(root.body?.children ?? []); // 본문 직계 요소 목록
        for (const element of bodyChildren) // 본문 요소 반복
        { // 반복 시작
            makeBackgroundInert(element, dialog); // 현재 배경 요소 차단
        } // 반복 끝

        const Observer = root.defaultView?.MutationObserver ?? globalThis.MutationObserver; // 변화 감시자 생성자
        if (!backgroundObserver && typeof Observer === "function" && root.body) // 동적 감시 가능 확인
        { // 조건 시작
            backgroundObserver = new Observer((records) => // 본문 변화 처리기
            { // 처리 시작
                for (const record of records) // 변화 기록 반복
                { // 반복 시작
                    for (const element of record.addedNodes ?? []) // 추가 요소 반복
                    { // 반복 시작
                        makeBackgroundInert(element, dialog); // 추가 배경 요소 차단
                    } // 반복 끝
                } // 반복 끝
            }); // 감시자 생성 끝
            backgroundObserver.observe(root.body, { childList: true }); // 본문 직계 추가 감시
        } // 조건 끝
    } // 함수 끝

    function restoreTrigger(dialog) // 실행 요소 초점 복원
    { // 함수 시작
        const trigger = triggers.get(dialog); // 실행 요소 조회
        if (trigger?.isConnected !== false && typeof trigger?.focus === "function") // 복원 가능 확인
        { // 조건 시작
            trigger.focus(); // 실행 요소 초점
        } // 조건 끝
    } // 함수 끝

    function finalizeClose(dialog, restoreFocus) // 닫기 상태 마무리
    { // 함수 시작
        dialog.hidden = true; // 대화상자 숨김
        dialog.classList?.remove("open"); // 열림 클래스 제거
        dialog.removeAttribute?.("open"); // 대체 열림 속성 제거
        if (activeDialog === dialog) // 현재 창 확인
        { // 조건 시작
            activeDialog = null; // 현재 창 해제
            setBackgroundInert(dialog, false); // 배경 조작 복원
        } // 조건 끝
        setBodyLocked(activeDialog !== null); // 본문 잠금 갱신
        if (restoreFocus) // 초점 복원 확인
        { // 조건 시작
            restoreTrigger(dialog); // 실행 요소 복원
        } // 조건 끝
    } // 함수 끝

    function close(dialogId, restoreFocus = true) // 대화상자 닫기
    { // 함수 시작
        const dialog = dialogId ? root.getElementById?.(dialogId) : activeDialog; // 닫을 창 조회
        if (!dialog || !dialogs.includes(dialog)) // 등록 창 확인
        { // 조건 시작
            return false; // 닫기 실패 반환
        } // 조건 끝

        if (isNativeDialog(dialog) && typeof dialog.close === "function" && dialog.hasAttribute?.("open")) // 네이티브 닫기 확인
        { // 조건 시작
            nativeClosePreferences.set(dialog, restoreFocus); // 복원 설정 저장
            dialog.close(); // 네이티브 창 닫기
            nativeClosePreferences.delete(dialog); // 복원 설정 정리
            if (activeDialog === dialog) // 비동기 닫힘 이벤트 확인
            { // 조건 시작
                finalizeClose(dialog, restoreFocus); // 즉시 닫힘 상태 반영
            } // 조건 끝
            return true; // 닫기 성공 반환
        } // 조건 끝

        finalizeClose(dialog, restoreFocus); // 대체 닫기 처리
        return true; // 닫기 성공 반환
    } // 함수 끝

    function open(dialogId, trigger = root.activeElement) // 대화상자 열기
    { // 함수 시작
        const dialog = root.getElementById?.(dialogId); // 대상 창 조회
        if (!dialog || !dialogs.includes(dialog)) // 등록 창 확인
        { // 조건 시작
            return false; // 열기 실패 반환
        } // 조건 끝

        const alreadyOpen = activeDialog === dialog && (isNativeDialog(dialog) ? dialog.hasAttribute?.("open") : dialog.classList?.contains("open") && dialog.hidden !== true); // 기존 열림 상태
        if (alreadyOpen) // 반복 열기 확인
        { // 조건 시작
            return true; // 기존 상태 유지
        } // 조건 끝

        if (activeDialog && activeDialog !== dialog) // 기존 창 확인
        { // 조건 시작
            close(activeDialog.id, false); // 기존 창 닫기
        } // 조건 끝

        if (trigger) // 실행 요소 확인
        { // 조건 시작
            triggers.set(dialog, trigger); // 실행 요소 저장
        } // 조건 끝

        dialog.setAttribute?.("role", "dialog"); // 대화상자 역할 설정
        dialog.setAttribute?.("aria-modal", "true"); // 모달 상태 설정
        dialog.hidden = false; // 대화상자 표시
        if (isNativeDialog(dialog)) // 네이티브 창 확인
        { // 조건 시작
            nativeClosePreferences.delete(dialog); // 이전 복원 설정 초기화
            if (typeof dialog.showModal === "function" && !dialog.hasAttribute?.("open")) // 기본 열기 가능 확인
            { // 조건 시작
                dialog.showModal(); // 네이티브 창 열기
            } // 조건 끝
            else // 대체 열기 확인
            { // 대안 시작
                dialog.setAttribute?.("open", ""); // 열림 속성 설정
            } // 대안 끝
        } // 조건 끝
        else // 사용자 정의 창 확인
        { // 대안 시작
            dialog.classList?.add("open"); // 열림 클래스 추가
        } // 대안 끝

        activeDialog = dialog; // 현재 창 저장
        setBodyLocked(true); // 본문 잠금 적용
        setBackgroundInert(dialog, true); // 배경 조작 차단
        const focusable = getFocusableElements(dialog); // 초점 요소 목록
        if (focusable.length > 0) // 조작 요소 확인
        { // 조건 시작
            focusable[0].focus?.(); // 첫 요소 초점
        } // 조건 끝
        else // 조작 요소 없음 확인
        { // 대안 시작
            dialog.setAttribute?.("tabindex", "-1"); // 대체 초점 속성 설정
            dialog.focus?.(); // 창 본체 초점
        } // 대안 끝

        return true; // 열기 성공 반환
    } // 함수 끝

    function onClick(event) // 클릭 처리
    { // 함수 시작
        const opener = event.target?.closest?.("[data-dialog-open]"); // 열기 요소 조회
        if (opener) // 열기 요소 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 이동 차단
            open(opener.dataset.dialogOpen, opener); // 대상 창 열기
            return; // 처리 종료
        } // 조건 끝

        const closer = event.target?.closest?.("[data-dialog-close]"); // 닫기 요소 조회
        if (closer) // 닫기 요소 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 동작 차단
            const dialog = findContainingDialog(dialogs, closer); // 포함 창 조회
            close(dialog?.id); // 포함 창 닫기
            return; // 처리 종료
        } // 조건 끝

        if (activeDialog && event.target === activeDialog) // 배경 클릭 확인
        { // 조건 시작
            close(activeDialog.id); // 현재 창 닫기
        } // 조건 끝
    } // 함수 끝

    function onKeyDown(event) // 키 입력 처리
    { // 함수 시작
        if (!activeDialog) // 열린 창 확인
        { // 조건 시작
            return; // 처리 종료
        } // 조건 끝

        if (event.key === "Escape") // 닫기 키 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 동작 차단
            close(activeDialog.id); // 현재 창 닫기
            return; // 처리 종료
        } // 조건 끝

        if (event.key !== "Tab") // 초점 이동 키 확인
        { // 조건 시작
            return; // 처리 종료
        } // 조건 끝

        const focusable = getFocusableElements(activeDialog); // 초점 요소 목록
        if (focusable.length === 0) // 빈 목록 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 이동 차단
            activeDialog.focus?.(); // 창 본체 초점
            return; // 처리 종료
        } // 조건 끝

        const first = focusable[0]; // 첫 초점 요소
        const last = focusable.at(-1); // 마지막 초점 요소
        const focusInside = activeDialog.contains?.(root.activeElement) === true; // 창 내부 초점 확인
        if (!focusInside) // 외부 초점 확인
        { // 조건 시작
            event.preventDefault?.(); // 외부 이동 차단
            const fallback = event.shiftKey ? last : first; // 이동 방향 복구 대상
            fallback.focus?.(); // 창 내부 초점 복구
        } // 조건 끝
        else if (!event.shiftKey && root.activeElement === last) // 정방향 끝 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 이동 차단
            first.focus?.(); // 첫 요소 초점
        } // 조건 끝
        else if (event.shiftKey && root.activeElement === first) // 역방향 끝 확인
        { // 대안 시작
            event.preventDefault?.(); // 기본 이동 차단
            last.focus?.(); // 마지막 요소 초점
        } // 대안 끝
    } // 함수 끝

    for (const dialog of dialogs) // 대화상자 반복
    { // 반복 시작
        dialog.setAttribute?.("role", "dialog"); // 역할 보강
        dialog.setAttribute?.("aria-modal", "true"); // 모달 상태 보강
        if (!dialog.classList?.contains("open") && !dialog.hasAttribute?.("open")) // 초기 닫힘 확인
        { // 조건 시작
            dialog.hidden = true; // 초기 숨김 적용
        } // 조건 끝
        if (isNativeDialog(dialog)) // 네이티브 창 확인
        { // 조건 시작
            const onNativeClose = () => // 네이티브 닫힘 처리기
            { // 함수 시작
                if (activeDialog !== dialog || dialog.hasAttribute?.("open")) // 비활성 또는 다시 열린 창 확인
                { // 조건 시작
                    return; // 이전 닫힘 이벤트 무시
                } // 조건 끝
                const restoreFocus = nativeClosePreferences.get(dialog) ?? true; // 초점 복원 설정 조회
                nativeClosePreferences.delete(dialog); // 복원 설정 정리
                finalizeClose(dialog, restoreFocus); // 네이티브 닫힘 마무리
            }; // 함수 끝
            nativeCloseListeners.set(dialog, onNativeClose); // 처리기 저장
            dialog.addEventListener?.("close", onNativeClose); // 닫힘 처리기 등록
        } // 조건 끝
    } // 반복 끝

    function destroy() // 제어기 정리
    { // 함수 시작
        root.removeEventListener?.("click", onClick); // 클릭 처리기 제거
        root.removeEventListener?.("keydown", onKeyDown); // 키 처리기 제거
        for (const dialog of dialogs) // 대화상자 반복
        { // 반복 시작
            const listener = nativeCloseListeners.get(dialog); // 네이티브 처리기 조회
            if (listener) // 처리기 확인
            { // 조건 시작
                dialog.removeEventListener?.("close", listener); // 닫힘 처리기 제거
            } // 조건 끝
            if (isNativeDialog(dialog) && typeof dialog.close === "function" && dialog.hasAttribute?.("open")) // 열린 네이티브 창 확인
            { // 조건 시작
                dialog.close(); // 기본 API로 문서 차단 해제
            } // 조건 끝
            dialog.hidden = true; // 창 숨김
            dialog.classList?.remove("open"); // 열림 클래스 제거
            dialog.removeAttribute?.("open"); // 열림 속성 제거
        } // 반복 끝
        activeDialog = null; // 현재 창 해제
        setBackgroundInert(null, false); // 배경 조작 복원
        setBodyLocked(false); // 본문 잠금 해제
        root.__devforgeDialogController = null; // 전역 참조 해제
    } // 함수 끝

    root.addEventListener?.("click", onClick); // 클릭 처리기 등록
    root.addEventListener?.("keydown", onKeyDown); // 키 처리기 등록
    const controller = Object.freeze({ open, close, destroy }); // 제어기 생성
    root.__devforgeDialogController = controller; // 전역 제어기 연결
    return controller; // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 문서 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 상태 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeDialogAccessibility(document), { once: true }); // 준비 뒤 초기화
    } // 조건 끝
    else // 문서 준비 완료 확인
    { // 대안 시작
        initializeDialogAccessibility(document); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
