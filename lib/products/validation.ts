import { PRODUCT_BADGES, PRODUCT_PUBLICATION_STATUSES, PRODUCT_STOCK_MODES } from "./types.ts"; // 상품 허용 값
import type { ImageLike, ProductBadge, ProductInput, ProductPublicationStatus, ProductStockMode, ProductValidationErrors, ProductValidationResult, ValidatedProduct } from "./types.ts"; // 상품 형식 목록

const MAX_NAME_LENGTH = 120; // 상품명 최대 길이
const MAX_CATEGORY_LENGTH = 40; // 분류 최대 길이
const MAX_GAME_NAME_LENGTH = 80; // 관련 게임명 최대 길이
const MAX_DESCRIPTION_LENGTH = 500; // 설명 최대 길이
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 이미지 최대 크기
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]); // 허용 이미지 형식

function isNonNegativeInteger(value: string): boolean // 0 이상 정수 판정
{ // 함수 시작
    return /^\d+$/.test(value) && Number.isSafeInteger(Number(value)); // 정수 문자열과 안전 범위 확인
} // 함수 끝

function isProductBadge(value: string): value is ProductBadge // 배지 허용 판정
{ // 함수 시작
    return PRODUCT_BADGES.includes(value as ProductBadge); // 허용 배지 포함 결과
} // 함수 끝

function isStockMode(value: string): value is ProductStockMode // 재고 방식 판정
{ // 함수 시작
    return PRODUCT_STOCK_MODES.includes(value as ProductStockMode); // 허용 방식 포함 결과
} // 함수 끝

function isPublicationStatus(value: string): value is ProductPublicationStatus // 공개 상태 판정
{ // 함수 시작
    return PRODUCT_PUBLICATION_STATUSES.includes(value as ProductPublicationStatus); // 허용 상태 포함 결과
} // 함수 끝

function isSecureSalesUrl(value: string): boolean // 안전한 판매 주소 판정
{ // 함수 시작
    if (!value) // 빈 주소 확인
    { // 조건 시작
        return true; // 빈 주소 허용
    } // 조건 끝

    try // 주소 해석 시도
    { // 시도 시작
        return new URL(value).protocol === "https:"; // HTTPS 주소 확인
    } // 시도 끝
    catch // 주소 해석 실패
    { // 오류 처리 시작
        return false; // 잘못된 주소 반환
    } // 오류 처리 끝
} // 함수 끝

export function validateProduct(input: ProductInput): ProductValidationResult // 상품 입력 검증
{ // 함수 시작
    const name = input.name.trim(); // 상품명 정리
    const category = input.category.trim(); // 분류 정리
    const gameName = input.gameName.trim(); // 관련 게임명 정리
    const description = input.description.trim(); // 설명 정리
    const originalPriceInput = input.originalPrice.trim(); // 기존 가격 정리
    const salesUrl = input.salesUrl.trim(); // 판매 주소 정리
    const externalProvider = input.externalProvider.trim(); // 외부 판매처 정리
    const externalProductId = input.externalProductId.trim(); // 외부 상품 식별자 정리
    const errors: ProductValidationErrors = {}; // 오류 저장소

    if (!name) // 상품명 누락 확인
    { // 조건 시작
        errors.name = "상품명을 입력해 주세요."; // 상품명 오류 기록
    } // 조건 끝
    else if (name.length > MAX_NAME_LENGTH) // 상품명 길이 확인
    { // 조건 시작
        errors.name = `상품명은 ${MAX_NAME_LENGTH}자 이하여야 합니다.`; // 상품명 길이 오류
    } // 조건 끝

    if (!category) // 분류 누락 확인
    { // 조건 시작
        errors.category = "상품 분류를 입력해 주세요."; // 분류 오류 기록
    } // 조건 끝
    else if (category.length > MAX_CATEGORY_LENGTH) // 분류 길이 확인
    { // 조건 시작
        errors.category = `상품 분류는 ${MAX_CATEGORY_LENGTH}자 이하여야 합니다.`; // 분류 길이 오류
    } // 조건 끝

    if (gameName.length > MAX_GAME_NAME_LENGTH) // 관련 게임명 길이 확인
    { // 조건 시작
        errors.gameName = `관련 게임명은 ${MAX_GAME_NAME_LENGTH}자 이하여야 합니다.`; // 관련 게임명 오류
    } // 조건 끝

    if (description.length > MAX_DESCRIPTION_LENGTH) // 설명 길이 확인
    { // 조건 시작
        errors.description = `상품 설명은 ${MAX_DESCRIPTION_LENGTH}자 이하여야 합니다.`; // 설명 길이 오류
    } // 조건 끝

    if (!isNonNegativeInteger(input.price)) // 판매가 형식 확인
    { // 조건 시작
        errors.price = "판매가는 0 이상의 정수여야 합니다."; // 판매가 오류 기록
    } // 조건 끝

    if (originalPriceInput && !isNonNegativeInteger(originalPriceInput)) // 기존 가격 형식 확인
    { // 조건 시작
        errors.originalPrice = "할인 전 가격은 0 이상의 정수여야 합니다."; // 기존 가격 오류 기록
    } // 조건 끝
    else if (originalPriceInput && isNonNegativeInteger(input.price) && Number(originalPriceInput) <= Number(input.price)) // 가격 관계 확인
    { // 조건 시작
        errors.originalPrice = "할인 전 가격은 현재 판매가보다 커야 합니다."; // 가격 관계 오류 기록
    } // 조건 끝

    if (!isSecureSalesUrl(salesUrl)) // 판매 주소 형식 확인
    { // 조건 시작
        errors.salesUrl = "판매 주소는 https://로 시작해야 합니다."; // 판매 주소 오류 기록
    } // 조건 끝

    if (!isStockMode(input.stockMode)) // 재고 방식 확인
    { // 조건 시작
        errors.stockMode = "재고 관리 방식을 확인해 주세요."; // 재고 방식 오류 기록
    } // 조건 끝

    if (!isNonNegativeInteger(input.stockQuantity)) // 재고 수량 형식 확인
    { // 조건 시작
        errors.stockQuantity = "재고는 0 이상의 정수여야 합니다."; // 재고 오류 기록
    } // 조건 끝

    if (!isPublicationStatus(input.publicationStatus)) // 공개 상태 확인
    { // 조건 시작
        errors.publicationStatus = "공개 상태를 확인해 주세요."; // 공개 상태 오류 기록
    } // 조건 끝

    if (!isNonNegativeInteger(input.displayOrder)) // 노출 순서 형식 확인
    { // 조건 시작
        errors.displayOrder = "노출 순서는 0 이상의 정수여야 합니다."; // 노출 순서 오류 기록
    } // 조건 끝

    if (!isProductBadge(input.badge)) // 배지 허용 확인
    { // 조건 시작
        errors.badge = "상품 배지를 확인해 주세요."; // 배지 오류 기록
    } // 조건 끝

    if (Object.keys(errors).length > 0) // 오류 존재 확인
    { // 조건 시작
        return { errors, value: null }; // 실패 결과 반환
    } // 조건 끝

    const value: ValidatedProduct = // 검증 값 시작
    { // 상품 객체 시작
        name, // 정리된 상품명
        category, // 정리된 분류
        gameName, // 정리된 관련 게임명
        description, // 정리된 설명
        price: Number(input.price), // 판매가 숫자 변환
        originalPrice: originalPriceInput ? Number(originalPriceInput) : null, // 기존 가격 숫자 변환
        badge: input.badge as ProductBadge, // 검증된 배지
        salesUrl: salesUrl || null, // 정리된 판매 주소
        stockMode: input.stockMode as ProductStockMode, // 검증된 재고 방식
        stockQuantity: Number(input.stockQuantity), // 재고 숫자 변환
        externalProvider: externalProvider || null, // 외부 판매처 정리
        externalProductId: externalProductId || null, // 외부 상품 식별자 정리
        publicationStatus: input.publicationStatus as ProductPublicationStatus, // 검증된 공개 상태
        displayOrder: Number(input.displayOrder), // 노출 순서 숫자 변환
    }; // 상품 객체 끝
    return { errors, value }; // 성공 결과 반환
} // 함수 끝

export function validateProductImage(file: ImageLike | null): string | null // 상품 이미지 검증
{ // 함수 시작
    if (!file) // 이미지 없음 확인
    { // 조건 시작
        return null; // 이미지 없음 허용
    } // 조건 끝

    if (file.size > MAX_IMAGE_SIZE) // 이미지 크기 확인
    { // 조건 시작
        return "이미지는 5MB 이하여야 합니다."; // 크기 오류 반환
    } // 조건 끝

    if (!ALLOWED_IMAGE_TYPES.has(file.type)) // 이미지 형식 확인
    { // 조건 시작
        return "JPG, PNG, WebP 이미지만 사용할 수 있습니다."; // 형식 오류 반환
    } // 조건 끝

    return null; // 정상 이미지 결과
} // 함수 끝
