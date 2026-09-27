"use client"; // 브라우저 편집 모듈

import { useActionState, useState } from "react"; // 폼 상태 도구
import { getProductSaleState } from "@/lib/products/status"; // 상품 상태 계산 함수
import type { ProductActionState, ProductEditorInitialValue } from "@/lib/products/types"; // 상품 편집 형식

interface ProductEditorProps // 편집기 속성
{ // 형식 시작
    action: (state: ProductActionState, formData: FormData) => Promise<ProductActionState>; // 저장 서버 액션
    initialValue?: ProductEditorInitialValue; // 기존 상품 값
    submitLabel: string; // 제출 버튼 문구
} // 형식 끝

const INITIAL_STATE: ProductActionState = { message: "", errors: {}, values: null }; // 초기 폼 상태
const EMPTY_VALUE: ProductEditorInitialValue = { name: "", category: "", gameName: "", description: "", price: "0", originalPrice: "", badge: "none", salesUrl: "", stockMode: "manual", stockQuantity: "0", externalProvider: "", externalProductId: "", publicationStatus: "hidden", displayOrder: "0" }; // 빈 상품 값
const STATE_LABELS = { in_stock: "판매 중", low_stock: "재고 부족", sold_out: "품절", preparing: "판매 준비 중", hidden: "비공개", checking: "재고 확인 중" }; // 판매 상태 이름

export default function ProductEditor({ action, initialValue, submitLabel }: ProductEditorProps) // 상품 편집 화면
{ // 함수 시작
    const [state, formAction, isPending] = useActionState(action, INITIAL_STATE); // 서버 액션 상태
    const values = state.values ?? initialValue ?? EMPTY_VALUE; // 표시할 입력 값
    const [publicationStatus, setPublicationStatus] = useState(values.publicationStatus); // 공개 상태 값
    const [salesUrl, setSalesUrl] = useState(values.salesUrl); // 판매 주소 값
    const [stockQuantity, setStockQuantity] = useState(values.stockQuantity); // 재고 수량 값
    const saleState = getProductSaleState({ publicationStatus, salesUrl, stockQuantity: Number(stockQuantity) || 0, stockSyncStatus: "fresh" }); // 미리보기 상태 계산

    return ( // 편집 화면 반환
        <form className="product-editor" action={formAction}> {/* 상품 편집 폼 */}
            <section className="editor-main"> {/* 주요 입력 영역 */}
                <label className="editor-field"><span>상품명</span><input name="name" defaultValue={values.name} maxLength={120} required />{state.errors.name ? <small className="field-error">{state.errors.name}</small> : null}</label> {/* 상품명 입력 */}
                <div className="product-field-grid"> {/* 분류 입력 묶음 */}
                    <label className="editor-field"><span>상품 분류</span><input name="category" defaultValue={values.category} maxLength={40} required />{state.errors.category ? <small className="field-error">{state.errors.category}</small> : null}</label> {/* 분류 입력 */}
                    <label className="editor-field"><span>관련 게임</span><input name="gameName" defaultValue={values.gameName} maxLength={80} />{state.errors.gameName ? <small className="field-error">{state.errors.gameName}</small> : null}</label> {/* 관련 게임 입력 */}
                </div> {/* 분류 입력 묶음 끝 */}
                <label className="editor-field"><span>상품 설명</span><textarea name="description" defaultValue={values.description} maxLength={500} rows={6} />{state.errors.description ? <small className="field-error">{state.errors.description}</small> : null}</label> {/* 설명 입력 */}
                <div className="product-field-grid"> {/* 가격 입력 묶음 */}
                    <label className="editor-field"><span>판매가</span><input name="price" type="number" min="0" step="1" defaultValue={values.price} required />{state.errors.price ? <small className="field-error">{state.errors.price}</small> : null}</label> {/* 판매가 입력 */}
                    <label className="editor-field"><span>할인 전 가격</span><input name="originalPrice" type="number" min="0" step="1" defaultValue={values.originalPrice} />{state.errors.originalPrice ? <small className="field-error">{state.errors.originalPrice}</small> : null}</label> {/* 기존 가격 입력 */}
                </div> {/* 가격 입력 묶음 끝 */}
                <label className="editor-field"><span>판매 주소</span><input name="salesUrl" type="url" placeholder="https://" defaultValue={values.salesUrl} onChange={(event) => setSalesUrl(event.target.value)} />{state.errors.salesUrl ? <small className="field-error">{state.errors.salesUrl}</small> : null}</label> {/* 판매 주소 입력 */}
                <div className="product-field-grid"> {/* 외부 식별 입력 묶음 */}
                    <label className="editor-field"><span>외부 판매처</span><input name="externalProvider" defaultValue={values.externalProvider} readOnly /></label> {/* 외부 판매처 입력 */}
                    <label className="editor-field"><span>외부 상품 ID</span><input name="externalProductId" defaultValue={values.externalProductId} readOnly /></label> {/* 외부 상품 식별자 입력 */}
                </div> {/* 외부 식별 입력 묶음 끝 */}
            </section> {/* 주요 입력 영역 끝 */}
            <aside className="editor-sidebar"> {/* 상품 설정 영역 */}
                <label className="editor-panel editor-field"><span>상품 이미지</span><input name="productImage" type="file" accept="image/jpeg,image/png,image/webp" /><small>JPG, PNG, WebP · 최대 5MB<br />임시 목업은 실제 판매 전 실물 사진으로 교체</small>{state.errors.productImage ? <small className="field-error">{state.errors.productImage}</small> : null}</label> {/* 이미지 입력 */}
                <label className="editor-panel editor-field"><span>재고 관리</span><select name="stockMode" defaultValue={values.stockMode}><option value="manual">직접 입력</option><option value="external" disabled>외부 API · 준비 중</option></select>{state.errors.stockMode ? <small className="field-error">{state.errors.stockMode}</small> : null}</label> {/* 재고 방식 입력 */}
                <label className="editor-panel editor-field"><span>재고 수량</span><input name="stockQuantity" type="number" min="0" step="1" defaultValue={values.stockQuantity} onChange={(event) => setStockQuantity(event.target.value)} required />{state.errors.stockQuantity ? <small className="field-error">{state.errors.stockQuantity}</small> : null}</label> {/* 재고 수량 입력 */}
                <label className="editor-panel editor-field"><span>상품 배지</span><select name="badge" defaultValue={values.badge}><option value="none">없음</option><option value="new">NEW</option><option value="hot">HOT</option><option value="limited">LIMITED</option></select>{state.errors.badge ? <small className="field-error">{state.errors.badge}</small> : null}</label> {/* 배지 입력 */}
                <label className="editor-panel editor-field"><span>공개 상태</span><select name="publicationStatus" defaultValue={values.publicationStatus} onChange={(event) => setPublicationStatus(event.target.value)}><option value="hidden">비공개</option><option value="published">공개</option></select>{state.errors.publicationStatus ? <small className="field-error">{state.errors.publicationStatus}</small> : null}</label> {/* 공개 상태 입력 */}
                <label className="editor-panel editor-field"><span>노출 순서</span><input name="displayOrder" type="number" min="0" step="1" defaultValue={values.displayOrder} required />{state.errors.displayOrder ? <small className="field-error">{state.errors.displayOrder}</small> : null}</label> {/* 노출 순서 입력 */}
                <section className={`product-state-preview state-${saleState}`} aria-live="polite"><small>상품 상태 미리보기</small><strong>{STATE_LABELS[saleState]}</strong>{saleState === "low_stock" ? <span>재고 {Number(stockQuantity) || 0}개</span> : null}</section> {/* 상태 미리보기 */}
                {state.message ? <p className="admin-message admin-message-error" role="alert">{state.message}</p> : null} {/* 저장 오류 안내 */}
                <button className="admin-primary-button" type="submit" disabled={isPending}>{isPending ? "저장 중…" : submitLabel}</button> {/* 저장 버튼 */}
            </aside> {/* 상품 설정 영역 끝 */}
        </form> // 상품 편집 폼 끝
    ); // 편집 화면 반환 끝
} // 함수 끝
