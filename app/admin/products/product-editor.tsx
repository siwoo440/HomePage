"use client"; // 브라우저 편집 모듈

import { useActionState, useEffect, useRef, useState } from "react"; // 폼 상태 도구
import type { ChangeEvent, FormEvent } from "react"; // 폼 이벤트 형식
import { createCompleteFieldErrors, focusFirstInvalidField, getFieldErrorId, hasFieldErrors, preventInvalidFormSubmission } from "@/lib/forms/validation"; // 공용 오류 도구
import { getProductSaleState } from "@/lib/products/status"; // 상품 상태 계산 함수
import { readProductImage, readProductValues, validateProduct, validateProductImage } from "@/lib/products/validation"; // 상품 검증 도구
import type { ProductActionState, ProductEditorInitialValue } from "@/lib/products/types"; // 상품 편집 형식

interface ProductEditorProps // 편집기 속성
{ // 형식 시작
    action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>; // 저장 서버 액션
    initialValue?: ProductEditorInitialValue; // 기존 상품 값
    submitLabel: string; // 제출 버튼 문구
} // 형식 끝

const INITIAL_STATE: ProductActionState = { message: "", errors: {}, values: null }; // 초기 폼 상태
const EMPTY_VALUE: ProductEditorInitialValue = { name: "", category: "", gameName: "", description: "", price: "0", originalPrice: "", badge: "none", salesUrl: "", stockMode: "manual", stockQuantity: "0", externalProvider: "", externalProductId: "", publicationStatus: "hidden", displayOrder: "0" }; // 빈 상품 값
const PRODUCT_FORM_ID = "product-editor"; // 폼 식별자
const PRODUCT_FIELD_ORDER = ["name", "category", "gameName", "description", "price", "originalPrice", "salesUrl", "productImage", "stockMode", "stockQuantity", "badge", "publicationStatus", "displayOrder"] as const; // 화면 필드 순서
type ProductFieldName = typeof PRODUCT_FIELD_ORDER[number]; // 상품 필드 이름
const STATE_LABELS = { in_stock: "판매 중", low_stock: "재고 부족", sold_out: "품절", preparing: "판매 준비 중", hidden: "비공개", checking: "재고 확인 중" }; // 판매 상태 이름

function isProductFieldName(fieldName: string): fieldName is ProductFieldName // 상품 필드 이름 판정
{ // 함수 시작
    return PRODUCT_FIELD_ORDER.includes(fieldName as ProductFieldName); // 허용 필드 포함 결과
} // 함수 끝

export default function ProductEditor({ action, initialValue, submitLabel }: ProductEditorProps) // 상품 편집 화면
{ // 함수 시작
    const [state, formAction, isPending] = useActionState(action, INITIAL_STATE); // 서버 액션 상태
    const [clientErrors, setClientErrors] = useState<ProductActionState["errors"]>({}); // 브라우저 오류 상태
    const formRef = useRef<HTMLFormElement>(null); // 폼 참조
    const values = state.values ?? initialValue ?? EMPTY_VALUE; // 표시할 입력 값
    const [publicationStatus, setPublicationStatus] = useState(values.publicationStatus); // 공개 상태 값
    const [salesUrl, setSalesUrl] = useState(values.salesUrl); // 판매 주소 값
    const [stockQuantity, setStockQuantity] = useState(values.stockQuantity); // 재고 수량 값
    const serverErrors = isPending ? {} : state.errors; // 제출 중 이전 서버 오류 제외
    const errors = { ...serverErrors, ...clientErrors }; // 통합 오류 목록
    const visibleMessage = hasFieldErrors(errors) ? hasFieldErrors(clientErrors) ? "입력한 상품 정보를 확인해 주세요." : state.message : hasFieldErrors(serverErrors) ? "" : isPending ? "" : state.message; // 현재 오류 안내
    const saleState = getProductSaleState({ publicationStatus, salesUrl, stockQuantity: Number(stockQuantity) || 0, stockSyncStatus: "fresh" }); // 미리보기 상태 계산

    useEffect(() => // 서버 오류 포커스 처리
    { // 효과 시작
        if (hasFieldErrors(state.errors)) // 서버 오류 확인
        { // 조건 시작
            focusFirstInvalidField(formRef.current, PRODUCT_FIELD_ORDER, state.errors); // 첫 서버 오류 포커스
        } // 조건 끝
    }, [state.errors]); // 서버 오류 변경 감시

    function handleChange(event: ChangeEvent<HTMLFormElement>): void // 입력 변경 처리
    { // 함수 시작
        const fieldName = event.target.name; // 변경 필드 이름

        if (isProductFieldName(fieldName) && errors[fieldName]) // 기존 오류 확인
        { // 조건 시작
            setClientErrors((current) => ({ ...current, [fieldName]: undefined })); // 변경 필드 오류 해제
        } // 조건 끝
    } // 함수 끝

    function handleSubmit(event: FormEvent<HTMLFormElement>): void // 제출 전 검증
    { // 함수 시작
        const formData = new FormData(event.currentTarget); // 현재 폼 데이터
        const validation = validateProduct(readProductValues(formData)); // 상품 입력 검증
        const productImageError = validateProductImage(readProductImage(formData)); // 상품 이미지 검증
        const nextErrors: ProductActionState["errors"] = { ...validation.errors, productImage: productImageError ?? undefined }; // 통합 검증 오류

        if (!preventInvalidFormSubmission(event, PRODUCT_FIELD_ORDER, nextErrors)) // 정상 입력 확인
        { // 조건 시작
            setClientErrors({}); // 브라우저 오류 초기화
            return; // 서버 제출 허용
        } // 조건 끝

        setClientErrors(createCompleteFieldErrors(PRODUCT_FIELD_ORDER, nextErrors)); // 브라우저 오류 저장
    } // 함수 끝

    return ( // 편집 화면 반환
        <form ref={formRef} className="product-editor" action={formAction} onSubmit={handleSubmit} noValidate aria-busy={isPending} onChange={handleChange}> {/* 상품 편집 폼 */}
            <section className="editor-main"> {/* 주요 입력 영역 */}
                <label className="editor-field"> {/* 상품명 입력 묶음 */}
                    <span>상품명</span> {/* 상품명 이름 */}
                    <input name="name" defaultValue={values.name} maxLength={120} required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? getFieldErrorId(PRODUCT_FORM_ID, "name") : undefined} /> {/* 상품명 입력 */}
                    {errors.name ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "name")}>{errors.name}</small> : null} {/* 상품명 오류 */}
                </label> {/* 상품명 입력 묶음 끝 */}
                <div className="product-field-grid"> {/* 분류 입력 묶음 */}
                    <label className="editor-field"> {/* 분류 입력 묶음 */}
                        <span>상품 분류</span> {/* 분류 이름 */}
                        <input name="category" defaultValue={values.category} maxLength={40} required aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? getFieldErrorId(PRODUCT_FORM_ID, "category") : undefined} /> {/* 분류 입력 */}
                        {errors.category ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "category")}>{errors.category}</small> : null} {/* 분류 오류 */}
                    </label> {/* 분류 입력 묶음 끝 */}
                    <label className="editor-field"> {/* 관련 게임 입력 묶음 */}
                        <span>관련 게임</span> {/* 관련 게임 이름 */}
                        <input name="gameName" defaultValue={values.gameName} maxLength={80} aria-invalid={Boolean(errors.gameName)} aria-describedby={errors.gameName ? getFieldErrorId(PRODUCT_FORM_ID, "gameName") : undefined} /> {/* 관련 게임 입력 */}
                        {errors.gameName ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "gameName")}>{errors.gameName}</small> : null} {/* 관련 게임 오류 */}
                    </label> {/* 관련 게임 입력 묶음 끝 */}
                </div> {/* 분류 입력 묶음 끝 */}
                <label className="editor-field"> {/* 설명 입력 묶음 */}
                    <span>상품 설명</span> {/* 설명 이름 */}
                    <textarea name="description" defaultValue={values.description} maxLength={500} rows={6} aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? getFieldErrorId(PRODUCT_FORM_ID, "description") : undefined} /> {/* 설명 입력 */}
                    {errors.description ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "description")}>{errors.description}</small> : null} {/* 설명 오류 */}
                </label> {/* 설명 입력 묶음 끝 */}
                <div className="product-field-grid"> {/* 가격 입력 묶음 */}
                    <label className="editor-field"> {/* 판매가 입력 묶음 */}
                        <span>판매가</span> {/* 판매가 이름 */}
                        <input name="price" type="number" min="0" step="1" defaultValue={values.price} required aria-invalid={Boolean(errors.price)} aria-describedby={errors.price ? getFieldErrorId(PRODUCT_FORM_ID, "price") : undefined} /> {/* 판매가 입력 */}
                        {errors.price ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "price")}>{errors.price}</small> : null} {/* 판매가 오류 */}
                    </label> {/* 판매가 입력 묶음 끝 */}
                    <label className="editor-field"> {/* 기존 가격 입력 묶음 */}
                        <span>할인 전 가격</span> {/* 기존 가격 이름 */}
                        <input name="originalPrice" type="number" min="0" step="1" defaultValue={values.originalPrice} aria-invalid={Boolean(errors.originalPrice)} aria-describedby={errors.originalPrice ? getFieldErrorId(PRODUCT_FORM_ID, "originalPrice") : undefined} /> {/* 기존 가격 입력 */}
                        {errors.originalPrice ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "originalPrice")}>{errors.originalPrice}</small> : null} {/* 기존 가격 오류 */}
                    </label> {/* 기존 가격 입력 묶음 끝 */}
                </div> {/* 가격 입력 묶음 끝 */}
                <label className="editor-field"> {/* 판매 주소 입력 묶음 */}
                    <span>판매 주소</span> {/* 판매 주소 이름 */}
                    <input name="salesUrl" type="url" placeholder="https://" defaultValue={values.salesUrl} onChange={(event) => setSalesUrl(event.target.value)} aria-invalid={Boolean(errors.salesUrl)} aria-describedby={errors.salesUrl ? getFieldErrorId(PRODUCT_FORM_ID, "salesUrl") : undefined} /> {/* 판매 주소 입력 */}
                    {errors.salesUrl ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "salesUrl")}>{errors.salesUrl}</small> : null} {/* 판매 주소 오류 */}
                </label> {/* 판매 주소 입력 묶음 끝 */}
                <div className="product-field-grid"> {/* 외부 식별 입력 묶음 */}
                    <label className="editor-field"><span>외부 판매처</span><input name="externalProvider" defaultValue={values.externalProvider} readOnly /></label> {/* 외부 판매처 입력 */}
                    <label className="editor-field"><span>외부 상품 ID</span><input name="externalProductId" defaultValue={values.externalProductId} readOnly /></label> {/* 외부 상품 식별자 입력 */}
                </div> {/* 외부 식별 입력 묶음 끝 */}
            </section> {/* 주요 입력 영역 끝 */}
            <aside className="editor-sidebar"> {/* 상품 설정 영역 */}
                <label className="editor-panel editor-field"> {/* 이미지 입력 묶음 */}
                    <span>상품 이미지</span> {/* 이미지 이름 */}
                    <input name="productImage" type="file" accept="image/jpeg,image/png,image/webp" aria-invalid={Boolean(errors.productImage)} aria-describedby={errors.productImage ? getFieldErrorId(PRODUCT_FORM_ID, "productImage") : undefined} /> {/* 이미지 입력 */}
                    <small>JPG, PNG, WebP · 최대 5MB<br />임시 목업은 실제 판매 전 실물 사진으로 교체</small> {/* 이미지 안내 */}
                    {errors.productImage ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "productImage")}>{errors.productImage}</small> : null} {/* 이미지 오류 */}
                </label> {/* 이미지 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 재고 방식 입력 묶음 */}
                    <span>재고 관리</span> {/* 재고 방식 이름 */}
                    <select name="stockMode" defaultValue={values.stockMode} aria-invalid={Boolean(errors.stockMode)} aria-describedby={errors.stockMode ? getFieldErrorId(PRODUCT_FORM_ID, "stockMode") : undefined}> {/* 재고 방식 선택 */}
                        <option value="manual">직접 입력</option> {/* 직접 입력 선택 */}
                        <option value="external" disabled>외부 API · 준비 중</option> {/* 외부 연동 선택 */}
                    </select> {/* 재고 방식 선택 끝 */}
                    {errors.stockMode ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "stockMode")}>{errors.stockMode}</small> : null} {/* 재고 방식 오류 */}
                </label> {/* 재고 방식 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 재고 입력 묶음 */}
                    <span>재고 수량</span> {/* 재고 이름 */}
                    <input name="stockQuantity" type="number" min="0" step="1" defaultValue={values.stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} required aria-invalid={Boolean(errors.stockQuantity)} aria-describedby={errors.stockQuantity ? getFieldErrorId(PRODUCT_FORM_ID, "stockQuantity") : undefined} /> {/* 재고 입력 */}
                    {errors.stockQuantity ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "stockQuantity")}>{errors.stockQuantity}</small> : null} {/* 재고 오류 */}
                </label> {/* 재고 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 배지 입력 묶음 */}
                    <span>상품 배지</span> {/* 배지 이름 */}
                    <select name="badge" defaultValue={values.badge} aria-invalid={Boolean(errors.badge)} aria-describedby={errors.badge ? getFieldErrorId(PRODUCT_FORM_ID, "badge") : undefined}> {/* 배지 선택 */}
                        <option value="none">없음</option> {/* 배지 없음 */}
                        <option value="new">NEW</option> {/* 신규 배지 */}
                        <option value="hot">HOT</option> {/* 인기 배지 */}
                        <option value="limited">LIMITED</option> {/* 한정 배지 */}
                    </select> {/* 배지 선택 끝 */}
                    {errors.badge ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "badge")}>{errors.badge}</small> : null} {/* 배지 오류 */}
                </label> {/* 배지 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 공개 상태 입력 묶음 */}
                    <span>공개 상태</span> {/* 공개 상태 이름 */}
                    <select name="publicationStatus" defaultValue={values.publicationStatus} onChange={(event) => setPublicationStatus(event.target.value)} aria-invalid={Boolean(errors.publicationStatus)} aria-describedby={errors.publicationStatus ? getFieldErrorId(PRODUCT_FORM_ID, "publicationStatus") : undefined}> {/* 공개 상태 선택 */}
                        <option value="hidden">비공개</option> {/* 비공개 선택 */}
                        <option value="published">공개</option> {/* 공개 선택 */}
                    </select> {/* 공개 상태 선택 끝 */}
                    {errors.publicationStatus ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "publicationStatus")}>{errors.publicationStatus}</small> : null} {/* 공개 상태 오류 */}
                </label> {/* 공개 상태 입력 묶음 끝 */}
                <label className="editor-panel editor-field"> {/* 노출 순서 입력 묶음 */}
                    <span>노출 순서</span> {/* 노출 순서 이름 */}
                    <input name="displayOrder" type="number" min="0" step="1" defaultValue={values.displayOrder} required aria-invalid={Boolean(errors.displayOrder)} aria-describedby={errors.displayOrder ? getFieldErrorId(PRODUCT_FORM_ID, "displayOrder") : undefined} /> {/* 노출 순서 입력 */}
                    {errors.displayOrder ? <small className="field-error" id={getFieldErrorId(PRODUCT_FORM_ID, "displayOrder")}>{errors.displayOrder}</small> : null} {/* 노출 순서 오류 */}
                </label> {/* 노출 순서 입력 묶음 끝 */}
                <section className={`product-state-preview state-${saleState}`} aria-live="polite"><small>상품 상태 미리보기</small><strong>{STATE_LABELS[saleState]}</strong>{saleState === "low_stock" ? <span>재고 {Number(stockQuantity) || 0}개</span> : null}</section> {/* 상태 미리보기 */}
                {visibleMessage ? <p className="admin-message admin-message-error" role="alert">{visibleMessage}</p> : null} {/* 저장 오류 안내 */}
                <button className="admin-primary-button" type="submit" disabled={isPending}>{isPending ? "저장 중…" : submitLabel}</button> {/* 저장 버튼 */}
            </aside> {/* 상품 설정 영역 끝 */}
        </form> // 상품 편집 폼 끝
    ); // 편집 화면 반환 끝
} // 함수 끝
