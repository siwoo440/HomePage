import type { StockSyncStatus } from "./types.ts"; // 재고 동기화 형식

export interface ProductStockSource // 재고 조회 상품 형식
{ // 형식 시작
    stockQuantity: number; // 저장 재고 수량
    externalProvider: string | null; // 외부 판매처 식별자
    externalProductId: string | null; // 외부 상품 식별자
} // 형식 끝

export interface StockSnapshot // 재고 조회 결과 형식
{ // 형식 시작
    quantity: number; // 확인 재고 수량
    status: StockSyncStatus; // 동기화 상태
    checkedAt: string; // 확인 시각
} // 형식 끝

export interface StockProvider // 재고 공급자 형식
{ // 형식 시작
    getStock(product: ProductStockSource): Promise<StockSnapshot>; // 재고 조회 계약
} // 형식 끝

export class ManualStockProvider implements StockProvider // 수동 재고 공급자
{ // 클래스 시작
    private readonly now: () => Date; // 현재 시각 공급 함수

    public constructor(now: () => Date = () => new Date()) // 공급자 생성
    { // 생성자 시작
        this.now = now; // 시각 공급 함수 저장
    } // 생성자 끝

    public async getStock(product: ProductStockSource): Promise<StockSnapshot> // 수동 재고 조회
    { // 함수 시작
        const safeQuantity = Number.isFinite(product.stockQuantity) ? Math.max(0, Math.trunc(product.stockQuantity)) : 0; // 안전한 재고 보정
        return { quantity: safeQuantity, status: "fresh", checkedAt: this.now().toISOString() }; // 재고 결과 반환
    } // 함수 끝
} // 클래스 끝
