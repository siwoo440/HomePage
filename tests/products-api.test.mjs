import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { ManualStockProvider } from "../lib/products/stock-provider.ts"; // 수동 재고 공급자
import { toPublicProduct } from "../lib/products/public-product.ts"; // 공개 상품 변환 함수

function productRow(overrides = {}) // 상품 행 생성
{ // 함수 시작
    return { // 상품 행 반환
        id: "product-1", // 상품 식별자
        name: "테스트 상품", // 상품명
        category: "테스트", // 상품 분류
        game_name: "테스트 게임", // 관련 게임
        description: "상품 설명", // 상품 설명
        price: 10000, // 판매가
        original_price: null, // 할인 전 가격
        badge: "new", // 상품 배지
        image_path: "/images/goods/test.png", // 이미지 경로
        sales_url: null, // 판매 주소
        stock_mode: "manual", // 재고 방식
        stock_quantity: 7, // 재고 수량
        external_provider: null, // 외부 판매처
        external_product_id: null, // 외부 상품 식별자
        publication_status: "published", // 공개 상태
        display_order: 1, // 노출 순서
        ...overrides, // 변경 값
    }; // 상품 행 끝
} // 함수 끝

test("수동 재고 공급자는 저장 수량과 조회 시각을 반환한다", async () => // 수동 재고 검증
{ // 테스트 시작
    const provider = new ManualStockProvider(() => new Date("2026-09-11T00:00:00.000Z")); // 고정 시각 공급자
    const result = await provider.getStock({ stockQuantity: 8, externalProvider: null, externalProductId: null }); // 재고 조회
    assert.deepEqual(result, { quantity: 8, status: "fresh", checkedAt: "2026-09-11T00:00:00.000Z" }); // 조회 결과 확인
}); // 테스트 끝

test("수동 재고 공급자는 잘못된 음수 재고를 0으로 보정한다", async () => // 재고 보정 검증
{ // 테스트 시작
    const provider = new ManualStockProvider(() => new Date("2026-09-11T00:00:00.000Z")); // 고정 시각 공급자
    const result = await provider.getStock({ stockQuantity: -3, externalProvider: null, externalProductId: null }); // 음수 재고 조회
    assert.equal(result.quantity, 0); // 0 보정 확인
}); // 테스트 끝

test("비공개 상품은 공개 응답에서 제외한다", () => // 공개 필터 검증
{ // 테스트 시작
    const result = toPublicProduct(productRow({ publication_status: "hidden" }), () => "https://cdn.example.com/image.png"); // 비공개 변환
    assert.equal(result, null); // 제외 확인
}); // 테스트 끝

test("정적 이미지 경로와 준비 중 상태를 공개 상품으로 변환한다", () => // 정적 상품 변환 검증
{ // 테스트 시작
    const result = toPublicProduct(productRow(), () => "https://cdn.example.com/image.png"); // 공개 상품 변환
    assert.deepEqual(result, { // 공개 응답 확인
        id: "product-1", // 상품 식별자
        name: "테스트 상품", // 상품명
        category: "테스트", // 상품 분류
        gameName: "테스트 게임", // 관련 게임
        description: "상품 설명", // 상품 설명
        price: 10000, // 판매가
        originalPrice: null, // 할인 전 가격
        badge: "new", // 상품 배지
        imageUrl: "/images/goods/test.png", // 정적 이미지 주소
        salesUrl: null, // 판매 주소
        stockQuantity: 7, // 재고 수량
        saleState: "preparing", // 판매 상태
    }); // 공개 응답 끝
}); // 테스트 끝

test("저장소 이미지 경로를 공개 URL로 변환한다", () => // 저장 이미지 변환 검증
{ // 테스트 시작
    const result = toPublicProduct(productRow({ image_path: "admin/product.png" }), (path) => `https://cdn.example.com/${path}`); // 저장 이미지 변환
    assert.equal(result?.imageUrl, "https://cdn.example.com/admin/product.png"); // 공개 이미지 주소 확인
}); // 테스트 끝
