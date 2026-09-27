import { createDataStateController, requestJson, resolveCollectionState } from "./data-state.mjs"; // 공통 데이터 상태 도구
import { applyProductLimit, replaceProducts } from "./goods-card.mjs"; // 상품 카드 도구

function initializeGoods() // 공개 상품 초기화
{ // 함수 시작
    const container = document.querySelector("[data-product-source]"); // 상품 목록 영역
    const stateController = createDataStateController(document.querySelector("[data-product-status]")); // 조회 상태 제어기
    let requestVersion = 0; // 최신 요청 번호

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

    async function loadProducts() // 공개 상품 조회
    { // 조회 함수 시작
        const currentVersion = ++requestVersion; // 현재 요청 번호
        stateController.show("loading", { title: "상품 정보 확인 중", message: "등록된 최신 상품을 불러오고 있습니다." }); // 로딩 상태 표시

        try // 상품 조회 시도
        { // 시도 시작
            const response = await requestJson("/api/products"); // 공개 상품 요청

            if (currentVersion !== requestVersion) // 오래된 요청 확인
            { // 조건 시작
                return; // 오래된 결과 폐기
            } // 조건 끝

            const dataState = resolveCollectionState(response, "products"); // 상품 응답 상태 판정

            if (dataState === "ready") // 실제 상품 확인
            { // 조건 시작
                replaceProducts(container, response.products, limit); // 원격 상품 표시
                stateController.hide(); // 상태 안내 숨김
                return; // 성공 처리 종료
            } // 조건 끝

            if (dataState === "demo") // 시연 응답 확인
            { // 조건 시작
                stateController.show("demo", { title: "시연 상품 표시 중", message: "상품 서버 연결 전이라 준비된 시연 상품을 표시합니다." }); // 시연 상태 표시
                return; // 시연 처리 종료
            } // 조건 끝

            if (dataState === "empty") // 빈 상품 확인
            { // 조건 시작
                stateController.show("empty", { title: "등록된 상품이 없습니다", message: "현재는 준비된 시연 상품을 표시합니다.", onRetry: loadProducts }); // 빈 결과 표시
                return; // 빈 결과 처리 종료
            } // 조건 끝

            throw new Error("PRODUCT_RESPONSE_INVALID"); // 잘못된 응답 발생
        } // 시도 끝
        catch (error) // 상품 조회 오류 처리
        { // 오류 처리 시작
            if (currentVersion !== requestVersion) // 오래된 오류 확인
            { // 조건 시작
                return; // 오래된 오류 폐기
            } // 조건 끝

            const message = error?.code === "DATA_TIMEOUT" ? "응답이 늦어 시연 상품을 유지합니다." : "상품 서버에 연결하지 못해 시연 상품을 유지합니다."; // 오류별 안내 문구
            stateController.show("error", { title: "상품 연결 확인 필요", message, onRetry: loadProducts }); // 오류 상태 표시
        } // 오류 처리 끝
    } // 조회 함수 끝

    void loadProducts(); // 첫 상품 조회 시작
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
