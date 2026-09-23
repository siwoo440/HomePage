import Link from "next/link"; // 내부 이동 링크
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import AdminHeader from "./admin-header"; // 관리자 상단 메뉴
import { deleteNewsPost } from "./actions"; // 뉴스 삭제 액션

interface NewsAdminPageProps // 관리 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

const STATUS_MESSAGES: Record<string, string> = // 처리 결과 안내
{ // 안내 객체 시작
    created: "새 개발 뉴스를 저장했습니다.", // 작성 완료 안내
    updated: "개발 뉴스를 수정했습니다.", // 수정 완료 안내
    deleted: "개발 뉴스를 삭제했습니다.", // 삭제 완료 안내
}; // 안내 객체 끝

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function NewsAdminPage({ searchParams }: NewsAdminPageProps) // 뉴스 관리 화면
{ // 함수 시작
    await requireAdmin("/admin/news"); // 관리자 권한 확인
    const parameters = await searchParams; // 검색 값 읽기
    const status = typeof parameters.status === "string" ? parameters.status : ""; // 처리 상태 읽기
    const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
    const result = await supabase.from("news_posts").select("id, title, status, updated_at").order("updated_at", { ascending: false }); // 관리자 게시물 조회
    const posts = result.data ?? []; // 게시물 목록

    return ( // 관리 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 상단 메뉴 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">// NEWS CONTROL</p> {/* 영문 분류 */}
                    <h1>개발 뉴스 관리</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
                <Link className="admin-primary-button admin-button-link" href="/admin/news/new">새 글 작성</Link> {/* 새 글 이동 */}
            </section> {/* 화면 제목 영역 끝 */}
            {STATUS_MESSAGES[status] ? <p className="admin-message admin-message-success" role="status">{STATUS_MESSAGES[status]}</p> : null} {/* 처리 완료 안내 */}
            {result.error ? <p className="admin-message admin-message-error" role="alert">게시물 목록을 불러오지 못했습니다.</p> : null} {/* 조회 실패 안내 */}
            {!result.error && posts.length === 0 ? <p className="admin-empty-state">작성된 개발 뉴스가 없습니다.</p> : null} {/* 빈 목록 안내 */}
            <div className="admin-post-list"> {/* 게시물 목록 */}
                {posts.map((post) => ( // 게시물 반복 시작
                    <article className="admin-post-row" key={post.id}> {/* 게시물 행 */}
                        <div> {/* 게시물 정보 묶음 */}
                            <span className={`admin-status admin-status-${post.status}`}>{post.status === "published" ? "공개" : "초안"}</span> {/* 공개 상태 */}
                            <h2>{post.title}</h2> {/* 게시물 제목 */}
                            <time dateTime={post.updated_at}>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(post.updated_at))}</time> {/* 수정 시각 */}
                        </div> {/* 게시물 정보 묶음 끝 */}
                        <div className="admin-row-actions"> {/* 게시물 작업 묶음 */}
                            <Link href={`/admin/news/${post.id}/edit`}>수정</Link> {/* 수정 이동 */}
                            <form action={deleteNewsPost}> {/* 삭제 폼 */}
                                <input name="id" type="hidden" value={post.id} /> {/* 게시물 식별자 */}
                                <button className="admin-delete-button" type="submit">삭제</button> {/* 삭제 버튼 */}
                            </form> {/* 삭제 폼 끝 */}
                        </div> {/* 게시물 작업 묶음 끝 */}
                    </article> // 게시물 행 끝
                ))} {/* 게시물 반복 끝 */}
            </div> {/* 게시물 목록 끝 */}
        </main> // 관리자 전체 영역 끝
    ); // 관리 화면 반환 끝
} // 함수 끝
