import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import AdminHeader from "../admin-header"; // 관리자 상단 메뉴
import NewsEditor from "../news-editor"; // 뉴스 편집 화면
import { createNewsPost } from "../actions"; // 뉴스 작성 액션

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function NewNewsPage() // 새 뉴스 화면
{ // 함수 시작
    await requireAdmin("/admin/news/new"); // 관리자 권한 확인

    return ( // 새 뉴스 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 상단 메뉴 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">// WRITE NEWS</p> {/* 영문 분류 */}
                    <h1>새 개발 뉴스</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
            </section> {/* 화면 제목 영역 끝 */}
            <NewsEditor action={createNewsPost} submitLabel="뉴스 저장" /> {/* 새 뉴스 편집기 */}
        </main> // 관리자 전체 영역 끝
    ); // 새 뉴스 화면 반환 끝
} // 함수 끝
