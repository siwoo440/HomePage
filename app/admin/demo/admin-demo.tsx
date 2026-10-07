"use client"; // 브라우저 데모 모듈

import { useEffect, useRef, useState } from "react"; // 화면 상태 도구
import NewsEditor from "../news/news-editor"; // 뉴스 편집기
import ProductEditor from "../products/product-editor"; // 상품 편집기
import { runNewsDemo, runProductDemo, type NewsDemoPreview, type ProductDemoPreview } from "@/lib/admin/demo-mode"; // 데모 검증 도구
import type { NewsActionState } from "@/lib/news/types"; // 뉴스 상태 형식
import type { ProductActionState } from "@/lib/products/types"; // 상품 상태 형식

interface AdminDemoProps // 데모 화면 속성
{ // 형식 시작
    form: "news" | "products"; // 점검 폼 종류
} // 형식 끝

const TAG_LABELS: Record<string, string> = { update: "업데이트", feature: "신기능", devlog: "데브로그", fix: "버그픽스" }; // 태그 표시 이름
const SALE_LABELS: Record<string, string> = { in_stock: "판매 중", low_stock: "재고 부족", sold_out: "품절", preparing: "판매 준비 중", hidden: "비공개 · 공개 화면 미표시", checking: "재고 확인 중" }; // 판매 상태 이름

function createPreviewUrl(file: File | null): string | null // 선택 이미지 임시 주소 생성
{ // 함수 시작
    return file && file.size > 0 ? URL.createObjectURL(file) : null; // 브라우저 임시 주소 반환
} // 함수 끝

function formatWon(value: number): string // 원화 표시
{ // 함수 시작
    return `₩${value.toLocaleString("ko-KR")}`; // 원화 문구 반환
} // 함수 끝

function NewsPreview({ preview, imageUrl }: { preview: NewsDemoPreview; imageUrl: string | null }) // 뉴스 공개 화면 미리보기
{ // 함수 시작
    const published = preview.post.status === "published"; // 공개 상태 여부
    return ( // 미리보기 반환
        <article className="demo-preview-card"> {/* 뉴스 미리보기 카드 */}
            <p className={`admin-status admin-status-${preview.post.status}`}>{published ? "공개 · 개발 뉴스 목록에 표시" : "초안 · 관리자 화면에만 표시"}</p> {/* 공개 상태 */}
            {imageUrl ? <img className="demo-preview-image" src={imageUrl} alt="선택한 대표 이미지 미리보기" /> : null} {/* 대표 이미지 */}
            <div className="demo-preview-tags">{preview.post.tags.map((tag) => <span key={tag}>{TAG_LABELS[tag] ?? tag}</span>)}</div> {/* 태그 목록 */}
            <h3>{preview.post.title}</h3> {/* 뉴스 제목 */}
            <time>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date())}</time> {/* 표시 날짜 */}
            {preview.post.summary ? <p className="demo-preview-summary">{preview.post.summary}</p> : null} {/* 목록 요약 */}
            <p className="demo-preview-content">{preview.post.content.length > 240 ? `${preview.post.content.slice(0, 240)}…` : preview.post.content}</p> {/* 본문 일부 */}
        </article> // 뉴스 미리보기 카드 끝
    ); // 미리보기 반환 끝
} // 함수 끝

function ProductPreview({ preview, imageUrl }: { preview: ProductDemoPreview; imageUrl: string | null }) // 상품 공개 카드 미리보기
{ // 함수 시작
    const product = preview.product; // 검증된 상품
    return ( // 미리보기 반환
        <article className="demo-preview-card"> {/* 상품 미리보기 카드 */}
            <p className={`admin-status state-${preview.saleState}`}>{SALE_LABELS[preview.saleState]}</p> {/* 판매 상태 */}
            {imageUrl ? <img className="demo-preview-image" src={imageUrl} alt="선택한 상품 이미지 미리보기" /> : <div className="demo-preview-placeholder">이미지 없음</div>} {/* 상품 이미지 */}
            <div className="demo-preview-tags"><span>{product.category}</span>{product.badge !== "none" ? <span>{product.badge.toUpperCase()}</span> : null}</div> {/* 분류와 배지 */}
            <h3>{product.name}</h3> {/* 상품명 */}
            <p className="demo-preview-summary">{product.gameName || "Palettra Games"}</p> {/* 관련 게임 */}
            {product.description ? <p className="demo-preview-content">{product.description}</p> : null} {/* 상품 설명 */}
            <p className="demo-preview-price">{product.originalPrice && product.originalPrice > product.price ? <s>{formatWon(product.originalPrice)}</s> : null} <strong>{formatWon(product.price)}</strong> · 재고 {product.stockQuantity.toLocaleString("ko-KR")}개</p> {/* 가격과 재고 */}
        </article> // 상품 미리보기 카드 끝
    ); // 미리보기 반환 끝
} // 함수 끝

export default function AdminDemo({ form }: AdminDemoProps) // 관리자 데모 화면
{ // 함수 시작
    const [dirty, setDirty] = useState(false); // 입력 변경 여부
    const [newsPreview, setNewsPreview] = useState<NewsDemoPreview | null>(null); // 뉴스 미리보기
    const [productPreview, setProductPreview] = useState<ProductDemoPreview | null>(null); // 상품 미리보기
    const [imageUrl, setImageUrl] = useState<string | null>(null); // 미리보기 이미지 주소
    const imageUrlRef = useRef<string | null>(null); // 해제 대상 이미지 주소

    useEffect(() => () => // 화면 해제 시 이미지 주소 정리
    { // 정리 시작
        if (imageUrlRef.current) // 남은 주소 확인
        { // 조건 시작
            URL.revokeObjectURL(imageUrlRef.current); // 임시 주소 해제
        } // 조건 끝
    }, []); // 최초 1회 등록

    function replaceImageUrl(file: File | null) // 미리보기 이미지 교체
    { // 함수 시작
        if (imageUrlRef.current) // 이전 주소 확인
        { // 조건 시작
            URL.revokeObjectURL(imageUrlRef.current); // 이전 주소 해제
        } // 조건 끝
        imageUrlRef.current = createPreviewUrl(file); // 새 주소 생성
        setImageUrl(imageUrlRef.current); // 새 주소 반영
    } // 함수 끝

    useEffect(() => // 페이지 이탈 경고 연결
    { // 효과 시작
        if (!dirty) // 변경 없음 확인
        { // 조건 시작
            return; // 경고 생략
        } // 조건 끝
        function warnBeforeUnload(event: BeforeUnloadEvent) // 이탈 경고 처리
        { // 함수 시작
            event.preventDefault(); // 브라우저 경고 요청
            event.returnValue = ""; // 구형 브라우저 경고 요청
        } // 함수 끝
        window.addEventListener("beforeunload", warnBeforeUnload); // 경고 등록
        return () => window.removeEventListener("beforeunload", warnBeforeUnload); // 경고 해제
    }, [dirty]); // 변경 여부 감시

    async function newsDemoAction(_state: NewsActionState, formData: FormData): Promise<NewsActionState> // 뉴스 데모 처리
    { // 함수 시작
        const result = runNewsDemo(formData); // 저장 없는 검증
        replaceImageUrl(result.preview?.coverImage ?? null); // 대표 이미지 주소 교체
        setNewsPreview(result.preview); // 미리보기 반영
        return result.state; // 폼 상태 반환
    } // 함수 끝

    async function productDemoAction(_state: ProductActionState, formData: FormData): Promise<ProductActionState> // 상품 데모 처리
    { // 함수 시작
        const result = runProductDemo(formData); // 저장 없는 검증
        replaceImageUrl(result.preview?.productImage ?? null); // 상품 이미지 주소 교체
        setProductPreview(result.preview); // 미리보기 반영
        return result.state; // 폼 상태 반환
    } // 함수 끝

    return ( // 데모 화면 반환
        <div className="admin-demo-layout" onInput={() => setDirty(true)}> {/* 데모 편집 영역 */}
            <div className="admin-demo-editor"> {/* 편집기 영역 */}
                {form === "news" ? <NewsEditor action={newsDemoAction} submitLabel="검증하고 미리보기" /> : <ProductEditor action={productDemoAction} submitLabel="검증하고 미리보기" />} {/* 선택 편집기 */}
            </div> {/* 편집기 영역 끝 */}
            <section className="admin-demo-preview" aria-labelledby="demo-preview-title" aria-live="polite"> {/* 미리보기 영역 */}
                <h2 id="demo-preview-title">{form === "news" ? "공개 화면 미리보기" : "상품 카드 미리보기"}</h2> {/* 미리보기 제목 */}
                {form === "news" && newsPreview ? <NewsPreview preview={newsPreview} imageUrl={imageUrl} /> : null} {/* 뉴스 미리보기 */}
                {form === "products" && productPreview ? <ProductPreview preview={productPreview} imageUrl={imageUrl} /> : null} {/* 상품 미리보기 */}
                {(form === "news" ? !newsPreview : !productPreview) ? <p className="admin-empty-state">내용을 입력하고 &ldquo;검증하고 미리보기&rdquo;를 누르면 방문자에게 보일 모습이 여기에 표시됩니다.</p> : null} {/* 미리보기 빈 상태 */}
            </section> {/* 미리보기 영역 끝 */}
        </div> // 데모 편집 영역 끝
    ); // 데모 화면 반환 끝
} // 함수 끝
