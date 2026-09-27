import { notFound } from "next/navigation"; // 찾을 수 없음 처리
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import AdminHeader from "../../../news/admin-header"; // 관리자 공통 메뉴
import ProductEditor from "../../product-editor"; // 상품 편집기
import { updateProduct } from "../../actions"; // 상품 수정 액션

interface EditProductPageProps // 수정 화면 속성
{ // 형식 시작
    params: Promise<{ id: string }>; // 상품 주소 값
} // 형식 끝

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function EditProductPage({ params }: EditProductPageProps) // 상품 수정 화면
{ // 함수 시작
    const { id } = await params; // 상품 식별자 읽기
    await requireAdmin(`/admin/products/${id}/edit`); // 관리자 권한 확인
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("products").select("name, category, game_name, description, price, original_price, badge, sales_url, stock_mode, stock_quantity, external_provider, external_product_id, publication_status, display_order").eq("id", id).single(); // 기존 상품 조회

    if (result.error || !result.data) // 상품 없음 확인
    { // 조건 시작
        notFound(); // 찾을 수 없음 표시
    } // 조건 끝

    const product = result.data; // 상품 값
    const initialValue = { name: product.name, category: product.category, gameName: product.game_name, description: product.description, price: String(product.price), originalPrice: product.original_price === null ? "" : String(product.original_price), badge: product.badge, salesUrl: product.sales_url ?? "", stockMode: product.stock_mode, stockQuantity: String(product.stock_quantity), externalProvider: product.external_provider ?? "", externalProductId: product.external_product_id ?? "", publicationStatus: product.publication_status, displayOrder: String(product.display_order) }; // 편집기 초기값
    const action = updateProduct.bind(null, id); // 상품 수정 액션 연결
    return ( // 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 공통 메뉴 */}
            <section className="admin-page-heading"><div><p className="admin-eyebrow">// EDIT GOODS</p><h1>상품 수정</h1></div></section> {/* 화면 제목 */}
            <ProductEditor action={action} initialValue={initialValue} submitLabel="변경 저장" /> {/* 상품 편집기 */}
        </main> // 관리자 전체 영역 끝
    ); // 화면 반환 끝
} // 함수 끝
