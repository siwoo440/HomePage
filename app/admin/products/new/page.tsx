import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import AdminHeader from "../../news/admin-header"; // 관리자 공통 메뉴
import ProductEditor from "../product-editor"; // 상품 편집기
import { createProduct } from "../actions"; // 상품 등록 액션

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function NewProductPage() // 새 상품 화면
{ // 함수 시작
    await requireAdmin("/admin/products/new"); // 관리자 권한 확인
    return ( // 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 공통 메뉴 */}
            <section className="admin-page-heading"><div><p className="admin-eyebrow">// NEW GOODS</p><h1>새 상품 등록</h1></div></section> {/* 화면 제목 */}
            <ProductEditor action={createProduct} submitLabel="상품 저장" /> {/* 상품 편집기 */}
        </main> // 관리자 전체 영역 끝
    ); // 화면 반환 끝
} // 함수 끝
