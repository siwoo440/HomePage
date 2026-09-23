import { getProductSaleState } from "./status.ts"; // 판매 상태 계산 함수
import type { ProductBadge, ProductSaleState, ProductStockMode } from "./types.ts"; // 공개 상품 관련 형식

export interface ProductDatabaseRow // 데이터베이스 상품 행 형식
{ // 형식 시작
    id: string; // 상품 식별자
    name: string; // 상품명
    category: string; // 상품 분류
    game_name: string; // 관련 게임명
    description: string; // 상품 설명
    price: number; // 판매가
    original_price: number | null; // 할인 전 가격
    badge: ProductBadge; // 상품 배지
    image_path: string | null; // 이미지 경로
    sales_url: string | null; // 판매 주소
    stock_mode: ProductStockMode; // 재고 방식
    stock_quantity: number; // 재고 수량
    external_provider: string | null; // 외부 판매처 식별자
    external_product_id: string | null; // 외부 상품 식별자
    publication_status: string; // 공개 상태
    display_order: number; // 노출 순서
} // 형식 끝

export interface PublicProduct // 공개 상품 형식
{ // 형식 시작
    id: string; // 상품 식별자
    name: string; // 상품명
    category: string; // 상품 분류
    gameName: string; // 관련 게임명
    description: string; // 상품 설명
    price: number; // 판매가
    originalPrice: number | null; // 할인 전 가격
    badge: ProductBadge; // 상품 배지
    imageUrl: string | null; // 공개 이미지 주소
    salesUrl: string | null; // 판매 주소
    stockQuantity: number; // 재고 수량
    saleState: ProductSaleState; // 판매 상태
} // 형식 끝

export function toPublicProduct(row: ProductDatabaseRow, resolveStorageImage: (path: string) => string): PublicProduct | null // 공개 상품 변환
{ // 함수 시작
    if (row.publication_status !== "published") // 비공개 행 확인
    { // 조건 시작
        return null; // 공개 응답 제외
    } // 조건 끝

    const imageUrl = row.image_path?.startsWith("/") ? row.image_path : row.image_path ? resolveStorageImage(row.image_path) : null; // 공개 이미지 주소 계산
    const salesUrl = row.sales_url?.startsWith("https://") ? row.sales_url : null; // 안전한 판매 주소 제한
    const saleState = getProductSaleState( // 판매 상태 계산
    { // 상태 입력 시작
        publicationStatus: row.publication_status, // 공개 상태
        stockQuantity: row.stock_quantity, // 재고 수량
        salesUrl, // 판매 주소
        stockSyncStatus: row.stock_mode === "external" ? "stale" : "fresh", // 외부 미연결 상태
    }); // 상태 입력 끝
    return { // 공개 상품 반환
        id: row.id, // 상품 식별자
        name: row.name, // 상품명
        category: row.category, // 상품 분류
        gameName: row.game_name, // 관련 게임명
        description: row.description, // 상품 설명
        price: row.price, // 판매가
        originalPrice: row.original_price, // 할인 전 가격
        badge: row.badge, // 상품 배지
        imageUrl, // 공개 이미지 주소
        salesUrl, // 판매 주소
        stockQuantity: row.stock_quantity, // 재고 수량
        saleState, // 판매 상태
    }; // 공개 상품 끝
} // 함수 끝
