import Link from "next/link"; // 내부 이동 링크
import { notFound } from "next/navigation"; // 없음 화면 도구
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import { resolveDemoNewsPost, type PublicNewsPost } from "@/lib/news/demo-posts"; // 시연 뉴스 도구
import CommentsPanel from "./comments-panel"; // 댓글 상호작용 영역
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import styles from "./news-detail.module.css"; // 뉴스 상세 스타일

interface NewsDetailPageProps // 뉴스 상세 속성
{ // 형식 시작
    params: Promise<{ id: string }>; // 주소 식별자
} // 형식 끝

const TAG_LABELS: Record<string, string> = // 태그 표시 이름
{ // 이름 객체 시작
    update: "업데이트", // 업데이트 이름
    feature: "신기능", // 신기능 이름
    devlog: "데브로그", // 데브로그 이름
    fix: "버그픽스", // 버그픽스 이름
}; // 이름 객체 끝

export const dynamic = "force-dynamic"; // 항상 최신 글 조회

export default async function NewsDetailPage({ params }: NewsDetailPageProps) // 공개 뉴스 상세 화면
{ // 함수 시작
    const { id } = await params; // 게시물 식별자 읽기
    const demoPost = resolveDemoNewsPost(id); // 시연 뉴스 찾기
    let post: PublicNewsPost | null = demoPost; // 표시 뉴스 초기화

    if (!post && getSupabasePublicConfig()) // 실제 뉴스 조회 가능 확인
    { // 조건 시작
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        const result = await supabase.from("news_posts").select("id, title, summary, content, tags, cover_image_path, published_at").eq("id", id).eq("status", "published").single(); // 공개 게시물 조회

        if (!result.error && result.data) // 공개 게시물 존재 확인
        { // 조건 시작
            const imageResult = result.data.cover_image_path ? supabase.storage.from("news-images").getPublicUrl(result.data.cover_image_path) : null; // 공개 이미지 주소 생성
            post = { id: result.data.id, title: result.data.title, summary: result.data.summary, content: result.data.content, tags: result.data.tags ?? [], publishedAt: result.data.published_at ?? "", coverImageUrl: imageResult?.data.publicUrl ?? null }; // 공개 뉴스 변환
        } // 조건 끝
    } // 조건 끝

    if (!post) // 공개 게시물 없음 확인
    { // 조건 시작
        notFound(); // 없음 화면 이동
    } // 조건 끝

    const commentsDemoMode = !getSupabasePublicConfig() || Boolean(demoPost); // 시연 댓글 사용 여부
    const publishedDate = post.publishedAt ? new Intl.DateTimeFormat("ko-KR", { dateStyle: "long" }).format(new Date(post.publishedAt)) : "공개일 미정"; // 공개 날짜 표시

    return ( // 상세 화면 반환
        <> {/* 화면 묶음 */}
        <SiteHeader current="news" /> {/* 공통 상단 헤더 */}
        <main className={styles.shell}> {/* 뉴스 상세 전체 영역 */}
            <nav className={styles.navigation} aria-label="뉴스 이동"> {/* 뉴스 목록 복귀 메뉴 */}
                <Link className={styles.backLink} href="/devlog.html">← 개발 뉴스로 돌아가기</Link> {/* 뉴스 목록 복귀 */}
            </nav> {/* 뉴스 목록 복귀 메뉴 끝 */}
            <article className={styles.article}> {/* 뉴스 본문 */}
                <div className={styles.tags}> {/* 태그 목록 */}
                    {post.tags.map((tag: string) => <span key={tag}>{TAG_LABELS[tag] ?? tag}</span>)} {/* 태그 표시 */}
                </div> {/* 태그 목록 끝 */}
                <h1>{post.title}</h1> {/* 뉴스 제목 */}
                <time dateTime={post.publishedAt || undefined}>{publishedDate}</time> {/* 공개 날짜 */}
                {post.coverImageUrl ? <img className={styles.cover} src={post.coverImageUrl} alt="" /> : null} {/* 대표 이미지 */}
                <div className={styles.content}>{post.content}</div> {/* 뉴스 본문 내용 */}
            </article> {/* 뉴스 본문 끝 */}
            {commentsDemoMode ? <CommentsPanel newsId={post.id} demoMode /> : ( // 시연 댓글 또는 준비 안내
                <section className={styles.comments} aria-labelledby="comments-title"> {/* 댓글 준비 안내 영역 */}
                    <div className={styles.commentsHeading}> {/* 댓글 제목 묶음 */}
                        <div> {/* 제목 내용 */}
                            <p className={styles.commentEyebrow}>{"// COMMUNITY TALK"}</p> {/* 영문 분류 */}
                            <h2 id="comments-title">댓글과 반응</h2> {/* 댓글 제목 */}
                        </div> {/* 제목 내용 끝 */}
                    </div> {/* 댓글 제목 묶음 끝 */}
                    <p className={styles.demoNotice} data-comments-closed>댓글 서버 연결을 준비하고 있습니다. 연결이 끝나면 이곳에서 댓글과 반응을 남길 수 있습니다.</p> {/* 준비 안내 */}
                </section> // 댓글 준비 안내 영역 끝
            )} {/* 댓글 기능 */}
        </main> {/* 뉴스 상세 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 상세 화면 반환 끝
} // 함수 끝
