import { notFound } from "next/navigation"; // 없음 화면 도구
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import AdminHeader from "../../admin-header"; // 관리자 상단 메뉴
import NewsEditor from "../../news-editor"; // 뉴스 편집 화면
import { updateNewsPost } from "../../actions"; // 뉴스 수정 액션

interface EditNewsPageProps // 수정 화면 속성
{ // 형식 시작
    params: Promise<{ id: string }>; // 주소 식별자
} // 형식 끝

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function EditNewsPage({ params }: EditNewsPageProps) // 뉴스 수정 화면
{ // 함수 시작
    const { id } = await params; // 게시물 식별자 읽기
    await requireAdmin(`/admin/news/${id}/edit`); // 관리자 권한 확인
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("news_posts").select("title, summary, content, tags, status").eq("id", id).single(); // 기존 게시물 조회

    if (result.error || !result.data) // 게시물 없음 확인
    { // 조건 시작
        notFound(); // 없음 화면 이동
    } // 조건 끝

    const action = updateNewsPost.bind(null, id); // 게시물별 수정 액션

    return ( // 수정 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 상단 메뉴 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">// EDIT NEWS</p> {/* 영문 분류 */}
                    <h1>개발 뉴스 수정</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
            </section> {/* 화면 제목 영역 끝 */}
            <NewsEditor action={action} submitLabel="수정 내용 저장" initialValue={result.data} /> {/* 기존 뉴스 편집기 */}
        </main> // 관리자 전체 영역 끝
    ); // 수정 화면 반환 끝
} // 함수 끝
