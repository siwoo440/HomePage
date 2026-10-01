export function setAllFaqItems(root, open) // 전체 질문 열기·닫기
{ // 함수 시작
    const items = [...(root?.querySelectorAll?.(".faq-item") ?? [])]; // 질문 항목 목록
    for (const item of items) // 질문 반복
    { // 반복 시작
        item.open = open; // 열림 상태 적용
    } // 반복 끝
    return items.length; // 변경 항목 수 반환
} // 함수 끝

export function openFaqFromHash(root, hash) // 주소 해시 질문 열기
{ // 함수 시작
    if (!hash || hash.length < 2) // 해시 없음 확인
    { // 조건 시작
        return null; // 처리 생략
    } // 조건 끝
    const target = root?.getElementById?.(decodeURIComponent(hash.slice(1))); // 해시 대상 요소
    const item = target?.closest?.(".faq-item") ?? target?.querySelector?.(".faq-item") ?? null; // 대상 질문 항목
    if (item) // 질문 항목 확인
    { // 조건 시작
        item.open = true; // 대상 질문 열기
    } // 조건 끝
    return item; // 열린 질문 반환
} // 함수 끝

export function initializeContactFaq(root = document, view = window) // 문의하기 질문 초기화
{ // 함수 시작
    root.addEventListener("click", (event) => // 전체 열기 버튼 처리
    { // 처리 시작
        const button = event.target?.closest?.("[data-faq-expand]"); // 전체 열기 버튼 조회
        if (button) // 버튼 확인
        { // 조건 시작
            setAllFaqItems(root, button.dataset.faqExpand === "open"); // 전체 상태 적용
        } // 조건 끝
    }); // 처리 끝
    openFaqFromHash(root, view.location?.hash ?? ""); // 첫 해시 질문 열기
    view.addEventListener?.("hashchange", () => openFaqFromHash(root, view.location?.hash ?? "")); // 해시 변경 질문 열기
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeContactFaq(document, window); // 질문 기능 초기화
} // 브라우저 실행 끝
