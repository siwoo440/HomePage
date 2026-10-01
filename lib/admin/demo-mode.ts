import { getSupabasePublicConfig } from "../supabase/config.ts"; // Supabase 설정 판정
import { readCoverImage, readNewsValues, validateCoverImage, validateNewsPost } from "../news/validation.ts"; // 뉴스 검증 도구
import { readProductImage, readProductValues, validateProduct, validateProductImage } from "../products/validation.ts"; // 상품 검증 도구
import { getProductSaleState } from "../products/status.ts"; // 판매 상태 계산
import type { NewsActionState, ValidatedNewsPost } from "../news/types.ts"; // 뉴스 형식
import type { ProductActionState, ProductSaleState, ValidatedProduct } from "../products/types.ts"; // 상품 형식

type DemoEnvironment = Record<string, string | undefined>; // 환경 변수 집합

export const ADMIN_DEMO_NOTICE = "데모 모드: 입력 검증을 통과했습니다. 실제로 저장되거나 공개되지 않았습니다."; // 데모 성공 안내

export interface NewsDemoPreview // 뉴스 미리보기 형식
{ // 형식 시작
    post: ValidatedNewsPost; // 검증된 뉴스
    coverImage: File | null; // 선택한 대표 이미지
} // 형식 끝

export interface ProductDemoPreview // 상품 미리보기 형식
{ // 형식 시작
    product: ValidatedProduct; // 검증된 상품
    saleState: ProductSaleState; // 공개 화면 판매 상태
    productImage: File | null; // 선택한 상품 이미지
} // 형식 끝

export function isAdminDemoAvailable(environment: DemoEnvironment = process.env): boolean // 관리자 데모 사용 가능 판정
{ // 함수 시작
    return environment.NODE_ENV !== "production" && getSupabasePublicConfig(environment) === null; // 개발 환경·설정 누락 시 허용
} // 함수 끝

export function runNewsDemo(formData: FormData): { state: NewsActionState; preview: NewsDemoPreview | null } // 뉴스 데모 검증
{ // 함수 시작
    const values = readNewsValues(formData); // 폼 입력 읽기
    const validation = validateNewsPost(values); // 뉴스 입력 검증
    const coverImage = readCoverImage(formData); // 대표 이미지 읽기
    const coverImageError = validateCoverImage(coverImage); // 대표 이미지 검증

    if (!validation.value || coverImageError) // 입력 오류 확인
    { // 조건 시작
        return { state: { message: "입력한 내용을 확인해 주세요.", errors: { ...validation.errors, coverImage: coverImageError ?? undefined }, values }, preview: null }; // 오류 상태 반환
    } // 조건 끝

    return { state: { message: "", errors: {}, values, notice: ADMIN_DEMO_NOTICE }, preview: { post: validation.value, coverImage } }; // 성공 상태 반환
} // 함수 끝

export function runProductDemo(formData: FormData): { state: ProductActionState; preview: ProductDemoPreview | null } // 상품 데모 검증
{ // 함수 시작
    const values = readProductValues(formData); // 폼 입력 읽기
    const validation = validateProduct(values); // 상품 입력 검증
    const productImage = readProductImage(formData); // 상품 이미지 읽기
    const productImageError = validateProductImage(productImage); // 상품 이미지 검증

    if (!validation.value || productImageError) // 입력 오류 확인
    { // 조건 시작
        return { state: { message: "입력한 상품 정보를 확인해 주세요.", errors: { ...validation.errors, productImage: productImageError ?? undefined }, values }, preview: null }; // 오류 상태 반환
    } // 조건 끝

    const product = validation.value; // 검증된 상품
    const saleState = getProductSaleState({ publicationStatus: product.publicationStatus, salesUrl: product.salesUrl, stockQuantity: product.stockQuantity, stockSyncStatus: "fresh" }); // 공개 판매 상태
    return { state: { message: "", errors: {}, values, notice: ADMIN_DEMO_NOTICE }, preview: { product, saleState, productImage } }; // 성공 상태 반환
} // 함수 끝
