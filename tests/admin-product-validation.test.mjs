import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { validateProduct, validateProductImage } from "../lib/products/validation.ts"; // 상품 검증 함수

function validProduct(overrides = {}) // 정상 상품 입력 생성
{ // 함수 시작
    return { // 상품 입력 반환
        name: "아비스 크로니클 키링", // 상품명
        category: "아크릴 키링", // 상품 분류
        gameName: "아비스 크로니클", // 관련 게임
        description: "주인공 아크릴 키링", // 상품 설명
        price: "9900", // 판매가
        originalPrice: "", // 기존 가격
        badge: "new", // 상품 배지
        salesUrl: "https://shop.example.com/item", // 판매 주소
        stockMode: "manual", // 재고 방식
        stockQuantity: "10", // 재고 수량
        externalProvider: "", // 외부 판매처
        externalProductId: "", // 외부 상품 식별자
        publicationStatus: "published", // 공개 상태
        displayOrder: "1", // 노출 순서
        ...overrides, // 변경 입력
    }; // 상품 입력 끝
} // 함수 끝

test("필수 상품명과 분류를 거부한다", () => // 필수 입력 검증
{ // 테스트 시작
    const result = validateProduct(validProduct({ name: " ", category: " " })); // 빈 입력 검증
    assert.equal(result.errors.name, "상품명을 입력해 주세요."); // 상품명 오류 확인
    assert.equal(result.errors.category, "상품 분류를 입력해 주세요."); // 분류 오류 확인
}); // 테스트 끝

test("가격과 재고의 음수와 소수를 거부한다", () => // 정수 입력 검증
{ // 테스트 시작
    const negativeResult = validateProduct(validProduct({ price: "-1", stockQuantity: "-2" })); // 음수 입력 검증
    assert.equal(negativeResult.errors.price, "판매가는 0 이상의 정수여야 합니다."); // 음수 가격 오류 확인
    assert.equal(negativeResult.errors.stockQuantity, "재고는 0 이상의 정수여야 합니다."); // 음수 재고 오류 확인
    const decimalResult = validateProduct(validProduct({ price: "10.5", stockQuantity: "2.5" })); // 소수 입력 검증
    assert.equal(decimalResult.errors.price, "판매가는 0 이상의 정수여야 합니다."); // 소수 가격 오류 확인
    assert.equal(decimalResult.errors.stockQuantity, "재고는 0 이상의 정수여야 합니다."); // 소수 재고 오류 확인
}); // 테스트 끝

test("할인 전 가격은 현재 판매가보다 커야 한다", () => // 할인 가격 검증
{ // 테스트 시작
    const result = validateProduct(validProduct({ price: "10000", originalPrice: "9000" })); // 역전 가격 검증
    assert.equal(result.errors.originalPrice, "할인 전 가격은 현재 판매가보다 커야 합니다."); // 가격 관계 오류 확인
}); // 테스트 끝

test("HTTP 판매 주소를 거부한다", () => // 판매 주소 검증
{ // 테스트 시작
    const result = validateProduct(validProduct({ salesUrl: "http://shop.example.com/item" })); // HTTP 주소 검증
    assert.equal(result.errors.salesUrl, "판매 주소는 https://로 시작해야 합니다."); // 주소 오류 확인
}); // 테스트 끝

test("정상 상품 입력을 정리한다", () => // 정상 입력 정규화
{ // 테스트 시작
    const result = validateProduct(validProduct({ name: "  상품  ", originalPrice: "12000", salesUrl: "  https://shop.example.com/item  " })); // 공백 포함 입력 검증
    assert.deepEqual(result.errors, {}); // 오류 없음 확인
    assert.equal(result.value?.name, "상품"); // 상품명 정리 확인
    assert.equal(result.value?.price, 9900); // 판매가 숫자 변환 확인
    assert.equal(result.value?.originalPrice, 12000); // 기존 가격 숫자 변환 확인
    assert.equal(result.value?.salesUrl, "https://shop.example.com/item"); // 주소 공백 정리 확인
}); // 테스트 끝

test("5MB 초과 상품 이미지와 잘못된 형식을 거부한다", () => // 이미지 제한 검증
{ // 테스트 시작
    assert.equal(validateProductImage({ size: 5 * 1024 * 1024 + 1, type: "image/png" }), "이미지는 5MB 이하여야 합니다."); // 크기 오류 확인
    assert.equal(validateProductImage({ size: 1024, type: "image/gif" }), "JPG, PNG, WebP 이미지만 사용할 수 있습니다."); // 형식 오류 확인
    assert.equal(validateProductImage({ size: 1024, type: "image/webp" }), null); // 정상 이미지 확인
    assert.equal(validateProductImage(null), null); // 이미지 없음 확인
}); // 테스트 끝
