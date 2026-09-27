export const PRODUCT_BADGES = ["none", "new", "hot", "limited"] as const; // 허용 상품 배지
export const PRODUCT_STOCK_MODES = ["manual", "external"] as const; // 허용 재고 방식
export const PRODUCT_PUBLICATION_STATUSES = ["published", "hidden"] as const; // 허용 공개 상태
export const PRODUCT_SALE_STATES = ["in_stock", "low_stock", "sold_out", "preparing", "hidden", "checking"] as const; // 허용 판매 상태

export type ProductBadge = typeof PRODUCT_BADGES[number]; // 상품 배지 형식
export type ProductStockMode = typeof PRODUCT_STOCK_MODES[number]; // 재고 방식 형식
export type ProductPublicationStatus = typeof PRODUCT_PUBLICATION_STATUSES[number]; // 공개 상태 형식
export type ProductSaleState = typeof PRODUCT_SALE_STATES[number]; // 판매 상태 형식
export type StockSyncStatus = "fresh" | "stale"; // 재고 동기화 상태

export interface ImageLike // 이미지 검사 형식
{ // 형식 시작
    size: number; // 파일 크기
    type: string; // 파일 형식
} // 형식 끝

export interface ProductInput // 상품 입력 형식
{ // 형식 시작
    name: string; // 상품명
    category: string; // 상품 분류
    gameName: string; // 관련 게임명
    description: string; // 상품 설명
    price: string; // 판매가 입력
    originalPrice: string; // 할인 전 가격 입력
    badge: string; // 상품 배지 입력
    salesUrl: string; // 판매 주소 입력
    stockMode: string; // 재고 방식 입력
    stockQuantity: string; // 재고 수량 입력
    externalProvider: string; // 외부 판매처 입력
    externalProductId: string; // 외부 상품 식별자 입력
    publicationStatus: string; // 공개 상태 입력
    displayOrder: string; // 노출 순서 입력
} // 형식 끝

export interface ValidatedProduct // 검증된 상품 형식
{ // 형식 시작
    name: string; // 정리된 상품명
    category: string; // 정리된 분류
    gameName: string; // 정리된 관련 게임명
    description: string; // 정리된 설명
    price: number; // 판매가
    originalPrice: number | null; // 할인 전 가격
    badge: ProductBadge; // 상품 배지
    salesUrl: string | null; // 판매 주소
    stockMode: ProductStockMode; // 재고 방식
    stockQuantity: number; // 재고 수량
    externalProvider: string | null; // 외부 판매처
    externalProductId: string | null; // 외부 상품 식별자
    publicationStatus: ProductPublicationStatus; // 공개 상태
    displayOrder: number; // 노출 순서
} // 형식 끝

export type ProductValidationErrors = Partial<Record<keyof ProductInput, string>>; // 상품 필드 오류 형식

export interface ProductValidationResult // 상품 검증 결과 형식
{ // 형식 시작
    errors: ProductValidationErrors; // 필드 오류 목록
    value: ValidatedProduct | null; // 검증된 상품
} // 형식 끝

export type ProductEditorInitialValue = ProductInput; // 편집기 초기값 형식

export interface ProductActionState // 상품 액션 상태 형식
{ // 형식 시작
    message: string; // 전체 안내 문구
    errors: ProductValidationErrors & { productImage?: string }; // 필드 오류 목록
    values: ProductEditorInitialValue | null; // 복원 입력 값
} // 형식 끝

export interface ProductRecord // 저장 상품 형식
{ // 형식 시작
    id: string; // 상품 식별자
    name: string; // 상품명
    category: string; // 상품 분류
    gameName: string; // 관련 게임명
    description: string; // 상품 설명
    price: number; // 판매가
    originalPrice: number | null; // 할인 전 가격
    badge: ProductBadge; // 상품 배지
    imagePath: string | null; // 이미지 경로
    salesUrl: string | null; // 판매 주소
    stockMode: ProductStockMode; // 재고 방식
    stockQuantity: number; // 재고 수량
    externalProvider: string | null; // 외부 판매처
    externalProductId: string | null; // 외부 상품 식별자
    publicationStatus: ProductPublicationStatus; // 공개 상태
    displayOrder: number; // 노출 순서
} // 형식 끝

export interface ProductSaleStateInput // 판매 상태 입력 형식
{ // 형식 시작
    publicationStatus: string; // 공개 상태
    stockQuantity: number; // 재고 수량
    salesUrl: string | null; // 판매 주소
    stockSyncStatus?: StockSyncStatus; // 재고 동기화 상태
} // 형식 끝
