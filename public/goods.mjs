import { applyProductLimit, getProductLoadStatus, replaceProducts, shouldUseRemoteProducts } from "./goods-card.mjs"; // 상품 카드 도구

function initializeGoods() // 공개 상품 초기화
{ // 함수 시작
    const container = document.querySelector("[data-product-source]"); // 상품 목록 영역
    const loadStatus = document.querySelector("#goods-load-status"); // 조회 상태 영역

    if (!container) // 상품 영역 없음 확인
    { // 조건 시작
        return; // 초기화 종료
    } // 조건 끝

    for (const placeholderLink of container.querySelectorAll('a.goods-card[href="https://smartstore.naver.com/"]')) // 임시 판매 링크 반복
    { // 반복 시작
        placeholderLink.removeAttribute("href"); // 임시 판매 이동 제거
        placeholderLink.removeAttribute("target"); // 새 창 설정 제거
        placeholderLink.removeAttribute("rel"); // 링크 보안 설정 제거
        placeholderLink.setAttribute("aria-disabled", "true"); // 비활성 상태 안내
        placeholderLink.classList.add("state-preparing"); // 준비 상태 클래스 추가
        const button = placeholderLink.querySelector(".goods-buy-btn"); // 구매 버튼 찾기

        if (button) // 구매 버튼 존재 확인
        { // 조건 시작
            button.textContent = "준비 중"; // 준비 문구 표시
            button.classList.add("is-disabled"); // 비활성 버튼 표시
        } // 조건 끝
    } // 반복 끝

    const limitValue = Number(container.dataset.productLimit); // 미리보기 개수 읽기
    const limit = Number.isInteger(limitValue) && limitValue > 0 ? limitValue : Number.POSITIVE_INFINITY; // 안전한 개수 결정
    applyProductLimit(container, limit); // 임시 상품 미리보기 제한
    fetch("/api/products", { headers: { Accept: "application/json" } }) // 공개 상품 조회
        .then((response) => // 응답 처리 시작
        { // 응답 처리 함수 시작
            if (!response.ok) // 응답 실패 확인
            { // 조건 시작
                throw new Error("PRODUCT_REQUEST_FAILED"); // 조회 실패 발생
            } // 조건 끝

            return response.json(); // JSON 응답 읽기
        }) // 응답 처리 끝
        .then((response) => // 상품 처리 시작
        { // 상품 처리 함수 시작
            if (loadStatus) // 상태 영역 확인
            { // 조건 시작
                loadStatus.textContent = getProductLoadStatus(response); // 조회 완료 안내 표시
            } // 조건 끝

            if (!shouldUseRemoteProducts(response)) // 원격 목록 사용 여부 확인
            { // 조건 시작
                return; // 기존 임시 상품 유지
            } // 조건 끝

            replaceProducts(container, response.products, limit); // 원격 상품 표시
        }) // 상품 처리 끝
        .catch(() => // 조회 오류 처리 시작
        { // 오류 처리 함수 시작
            if (loadStatus) // 상태 영역 확인
            { // 조건 시작
                loadStatus.textContent = "상품 서버에 연결되지 않아 임시 상품을 표시합니다."; // 임시 상품 안내
            } // 조건 끝
        }); // 조회 오류 처리 끝
} // 함수 끝

function initializeContactDialog() // 문의 창 초기화
{ // 함수 시작
    const openButton = document.querySelector("#contact-open"); // 문의 열기 버튼
    const dialog = document.querySelector("#contact-dialog"); // 문의 대화상자

    if (!openButton || !dialog) // 필수 요소 확인
    { // 조건 시작
        return; // 초기화 종료
    } // 조건 끝

    openButton.addEventListener("click", () => // 열기 이벤트 등록
    { // 클릭 처리 시작
        if (typeof dialog.showModal === "function") // 대화상자 지원 확인
        { // 조건 시작
            dialog.showModal(); // 대화상자 열기
        } // 조건 끝
    }); // 클릭 처리 끝
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 문서 환경 확인
{ // 브라우저 실행 시작
    initializeGoods(); // 상품 기능 시작
    initializeContactDialog(); // 문의 창 기능 시작
} // 브라우저 실행 끝
