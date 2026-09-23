import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { getProductSaleState } from "../lib/products/status.ts"; // 판매 상태 계산 함수

test("비공개 상품을 비공개로 판정한다", () => // 비공개 상태 검증
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "hidden", stockQuantity: 10, salesUrl: "https://shop.example.com/item", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "hidden"); // 비공개 확인
}); // 테스트 끝

test("판매 주소가 없으면 판매 준비 중으로 판정한다", () => // 준비 상태 검증
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "published", stockQuantity: 10, salesUrl: "", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "preparing"); // 준비 상태 확인
}); // 테스트 끝

test("재고가 없으면 품절로 판정한다", () => // 품절 상태 검증
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "published", stockQuantity: 0, salesUrl: "https://shop.example.com/item", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "sold_out"); // 품절 확인
}); // 테스트 끝

test("재고가 다섯 개 이하면 재고 부족으로 판정한다", () => // 재고 부족 판정
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "published", stockQuantity: 5, salesUrl: "https://shop.example.com/item", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "low_stock"); // 재고 부족 확인
}); // 테스트 끝

test("재고가 여섯 개 이상이면 판매 중으로 판정한다", () => // 판매 상태 검증
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "published", stockQuantity: 6, salesUrl: "https://shop.example.com/item", stockSyncStatus: "fresh" }); // 상태 계산
    assert.equal(result, "in_stock"); // 판매 상태 확인
}); // 테스트 끝

test("외부 재고 오류는 재고 확인 중으로 판정한다", () => // 확인 상태 검증
{ // 테스트 시작
    const result = getProductSaleState({ publicationStatus: "published", stockQuantity: 6, salesUrl: "https://shop.example.com/item", stockSyncStatus: "stale" }); // 상태 계산
    assert.equal(result, "checking"); // 확인 상태 검증
}); // 테스트 끝
