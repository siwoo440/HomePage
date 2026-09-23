import type { ProductSaleState, ProductSaleStateInput } from "./types.ts"; // 판매 상태 형식

export function getProductSaleState(product: ProductSaleStateInput): ProductSaleState // 상품 판매 상태 계산
{ // 함수 시작
    if (product.publicationStatus === "hidden") // 비공개 확인
    { // 조건 시작
        return "hidden"; // 비공개 상태 반환
    } // 조건 끝

    if (product.stockSyncStatus === "stale") // 재고 오류 확인
    { // 조건 시작
        return "checking"; // 재고 확인 상태 반환
    } // 조건 끝

    if (!product.salesUrl) // 판매 주소 없음 확인
    { // 조건 시작
        return "preparing"; // 준비 상태 반환
    } // 조건 끝

    if (product.stockQuantity <= 0) // 재고 없음 확인
    { // 조건 시작
        return "sold_out"; // 품절 상태 반환
    } // 조건 끝

    if (product.stockQuantity <= 5) // 적은 재고 확인
    { // 조건 시작
        return "low_stock"; // 재고 부족 반환
    } // 조건 끝

    return "in_stock"; // 판매 중 상태 반환
} // 함수 끝
