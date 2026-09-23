const STATE_CONTENT = // 판매 상태 표시 정보
{ // 상태 정보 시작
    in_stock: { stateLabel: "판매 중", buttonLabel: "구매하기" }, // 판매 중 표시
    low_stock: { stateLabel: "재고 부족", buttonLabel: "구매하기" }, // 재고 부족 표시
    sold_out: { stateLabel: "품절", buttonLabel: "품절" }, // 품절 표시
    preparing: { stateLabel: "판매 준비 중", buttonLabel: "준비 중" }, // 준비 표시
    checking: { stateLabel: "재고 확인 중", buttonLabel: "확인 중" }, // 확인 표시
}; // 상태 정보 끝

export function shouldUseRemoteProducts(response) // 원격 상품 사용 판정
{ // 함수 시작
    return response?.configured === true && Array.isArray(response.products) && response.products.length > 0; // 정상 원격 목록 확인
} // 함수 끝

export function getProductLoadStatus(response) // 상품 조회 안내 계산
{ // 함수 시작
    if (shouldUseRemoteProducts(response)) // 원격 상품 존재 확인
    { // 조건 시작
        return "등록된 최신 상품을 표시하고 있습니다."; // 원격 상품 안내 반환
    } // 조건 끝

    if (response?.configured === true) // 서버 설정 완료 확인
    { // 조건 시작
        return "등록된 상품이 없어 임시 상품을 표시합니다."; // 빈 목록 안내 반환
    } // 조건 끝

    return "서버 연결 전이라 임시 상품을 표시합니다."; // 미설정 안내 반환
} // 함수 끝

export function applyProductLimit(container, limit) // 상품 미리보기 개수 적용
{ // 함수 시작
    Array.from(container.children).forEach((child, index) => // 상품 카드 반복
    { // 반복 시작
        child.hidden = Number.isFinite(limit) && index >= limit; // 제한 이후 상품 숨김
    }); // 반복 끝
} // 함수 끝

export function getProductCardModel(product) // 상품 카드 표시 계산
{ // 함수 시작
    const state = STATE_CONTENT[product.saleState] ?? STATE_CONTENT.preparing; // 안전한 상태 정보
    const linkEnabled = (product.saleState === "in_stock" || product.saleState === "low_stock") && typeof product.salesUrl === "string" && product.salesUrl.startsWith("https://"); // 구매 링크 활성 판정
    let stockLabel = "판매 준비 중"; // 기본 재고 문구

    if (product.saleState === "in_stock" || product.saleState === "low_stock") // 판매 가능 확인
    { // 조건 시작
        stockLabel = `재고 ${Math.max(0, Number(product.stockQuantity) || 0).toLocaleString("ko-KR")}개`; // 현재 재고 표시
    } // 조건 끝
    else if (product.saleState === "sold_out") // 품절 확인
    { // 조건 시작
        stockLabel = "재고 없음"; // 품절 재고 표시
    } // 조건 끝
    else if (product.saleState === "checking") // 재고 확인 상태
    { // 조건 시작
        stockLabel = "재고 확인 중"; // 확인 문구 표시
    } // 조건 끝

    return { stateLabel: state.stateLabel, buttonLabel: state.buttonLabel, linkEnabled, stockLabel }; // 카드 표시 반환
} // 함수 끝

function textElement(tagName, className, text) // 안전한 글자 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 새 요소 생성
    element.className = className; // 요소 클래스 지정
    element.textContent = text; // 안전한 글자 지정
    return element; // 글자 요소 반환
} // 함수 끝

function formatPrice(value) // 원화 가격 표시
{ // 함수 시작
    return `₩${Math.max(0, Number(value) || 0).toLocaleString("ko-KR")}`; // 원화 문구 반환
} // 함수 끝

export function createProductCard(product) // 공개 상품 카드 생성
{ // 함수 시작
    const model = getProductCardModel(product); // 카드 표시 계산
    const card = document.createElement(model.linkEnabled ? "a" : "article"); // 링크 또는 일반 카드 생성
    card.className = `goods-card state-${product.saleState ?? "preparing"}`; // 상품 카드 클래스

    if (model.linkEnabled) // 구매 링크 활성 확인
    { // 조건 시작
        card.href = product.salesUrl; // 외부 판매 주소 지정
        card.target = "_blank"; // 새 창 열기
        card.rel = "noopener noreferrer"; // 새 창 보안 설정
    } // 조건 끝

    const thumb = document.createElement("div"); // 이미지 영역 생성
    thumb.className = "goods-thumb"; // 이미지 영역 클래스
    const image = document.createElement("img"); // 상품 이미지 생성
    image.className = "goods-image"; // 상품 이미지 클래스
    image.src = typeof product.imageUrl === "string" && product.imageUrl ? product.imageUrl : "/placeholder.svg"; // 상품 이미지 주소
    image.alt = `${String(product.name ?? "상품")} 임시 상품 목업`; // 상품 이미지 설명
    thumb.append(image); // 이미지 추가

    if (product.badge && product.badge !== "none") // 상품 배지 확인
    { // 조건 시작
        thumb.append(textElement("span", `goods-badge badge-${product.badge}`, String(product.badge).toUpperCase())); // 상품 배지 추가
    } // 조건 끝

    thumb.append(textElement("span", `goods-stock-badge state-${product.saleState ?? "preparing"}`, model.stateLabel)); // 판매 상태 배지 추가
    const info = document.createElement("div"); // 상품 정보 생성
    info.className = "goods-info"; // 상품 정보 클래스
    info.append(textElement("div", "goods-category", String(product.category ?? "굿즈"))); // 상품 분류 추가
    info.append(textElement("div", "goods-name", String(product.name ?? "상품"))); // 상품명 추가
    info.append(textElement("div", "goods-game", String(product.gameName ?? "DEVFORGE"))); // 관련 게임 추가
    info.append(textElement("p", "goods-description", String(product.description ?? ""))); // 상품 설명 추가
    const priceRow = document.createElement("div"); // 가격 영역 생성
    priceRow.className = "goods-price-row"; // 가격 영역 클래스
    const priceWrap = document.createElement("div"); // 가격 묶음 생성
    priceWrap.className = "goods-price-wrap"; // 가격 묶음 클래스

    if (Number(product.originalPrice) > Number(product.price)) // 할인 전 가격 확인
    { // 조건 시작
        priceWrap.append(textElement("span", "goods-original-price", formatPrice(product.originalPrice))); // 할인 전 가격 추가
    } // 조건 끝

    priceWrap.append(textElement("span", "goods-price", formatPrice(product.price))); // 판매가 추가
    priceWrap.append(textElement("span", "goods-stock-text", model.stockLabel)); // 재고 문구 추가
    priceRow.append(priceWrap); // 가격 묶음 추가
    priceRow.append(textElement("span", `goods-buy-btn${model.linkEnabled ? "" : " is-disabled"}`, model.buttonLabel)); // 구매 버튼 추가
    info.append(priceRow); // 가격 영역 추가
    card.append(thumb); // 이미지 영역 추가
    card.append(info); // 상품 정보 추가
    return card; // 완성 카드 반환
} // 함수 끝

export function replaceProducts(container, products, limit = Number.POSITIVE_INFINITY) // 상품 목록 교체
{ // 함수 시작
    const fragment = document.createDocumentFragment(); // 상품 조각 생성
    products.slice(0, limit).forEach((product) => fragment.append(createProductCard(product))); // 상품 카드 추가
    container.replaceChildren(fragment); // 기존 상품 교체
} // 함수 끝
