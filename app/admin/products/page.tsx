import Link from "next/link"; // 내부 이동 링크
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import { getProductSaleState } from "@/lib/products/status"; // 판매 상태 계산 함수
import AdminHeader from "../news/admin-header"; // 관리자 공통 메뉴
import DeleteProductButton from "./delete-product-button"; // 삭제 확인 버튼
import { deleteProduct } from "./actions"; // 상품 삭제 액션

interface ProductsAdminPageProps // 관리 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

const STATUS_MESSAGES: Record<string, string> = { created: "새 상품을 저장했습니다.", updated: "상품을 수정했습니다.", deleted: "상품을 삭제했습니다.", "delete-error": "상품 삭제에 실패했습니다." }; // 처리 결과 안내
const SALE_LABELS: Record<string, string> = { in_stock: "판매 중", low_stock: "재고 부족", sold_out: "품절", preparing: "판매 준비 중", hidden: "비공개", checking: "재고 확인 중" }; // 판매 상태 이름

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function ProductsAdminPage({ searchParams }: ProductsAdminPageProps) // 상품 관리 화면
{ // 함수 시작
    await requireAdmin("/admin/products"); // 관리자 권한 확인
    const parameters = await searchParams; // 검색 값 읽기
    const status = typeof parameters.status === "string" ? parameters.status : ""; // 처리 상태 읽기
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("products").select("id, name, price, image_path, sales_url, stock_mode, stock_quantity, publication_status, updated_at").order("display_order", { ascending: true }); // 상품 목록 조회
    const products = result.data ?? []; // 상품 목록

    return ( // 관리 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 공통 메뉴 */}
            <section className="admin-page-heading"><div><p className="admin-eyebrow">// GOODS CONTROL</p><h1>상품 관리</h1></div><Link className="admin-primary-button admin-button-link" href="/admin/products/new">새 상품 등록</Link></section> {/* 화면 제목 */}
            {STATUS_MESSAGES[status] ? <p className={`admin-message ${status === "delete-error" ? "admin-message-error" : "admin-message-success"}`} role="status">{STATUS_MESSAGES[status]}</p> : null} {/* 처리 안내 */}
            {result.error ? <p className="admin-message admin-message-error" role="alert">상품 목록을 불러오지 못했습니다.</p> : null} {/* 조회 실패 안내 */}
            {!result.error && products.length === 0 ? <p className="admin-empty-state">등록된 상품이 없습니다.</p> : null} {/* 빈 목록 안내 */}
            <div className="admin-product-list"> {/* 상품 목록 */}
                {products.map((product) => // 상품 반복
                { // 반복 시작
                    const saleState = getProductSaleState({ publicationStatus: product.publication_status, stockQuantity: product.stock_quantity, salesUrl: product.sales_url, stockSyncStatus: product.stock_mode === "external" ? "stale" : "fresh" }); // 판매 상태 계산
                    const imageUrl = product.image_path?.startsWith("/") ? product.image_path : product.image_path ? supabase.storage.from("product-images").getPublicUrl(product.image_path).data.publicUrl : "/placeholder.svg"; // 이미지 주소 계산
                    return ( // 상품 행 반환
                        <article className="admin-product-row" key={product.id}> {/* 상품 행 */}
                            <img src={imageUrl} alt="" /> {/* 상품 미리보기 */}
                            <div className="admin-product-copy"><span className={`admin-status state-${saleState}`}>{SALE_LABELS[saleState]}</span><h2>{product.name}</h2><p>{product.price.toLocaleString("ko-KR")}원 · 재고 {product.stock_quantity.toLocaleString("ko-KR")}개</p></div> {/* 상품 정보 */}
                            <div className="admin-row-actions"><Link href={`/admin/products/${product.id}/edit`}>수정</Link><form action={deleteProduct}><input name="id" type="hidden" value={product.id} /><DeleteProductButton /></form></div> {/* 상품 작업 */}
                        </article> // 상품 행 끝
                    ); // 상품 행 반환 끝
                })} {/* 상품 반복 끝 */}
            </div> {/* 상품 목록 끝 */}
        </main> // 관리자 전체 영역 끝
    ); // 화면 반환 끝
} // 함수 끝
