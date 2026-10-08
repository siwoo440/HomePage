import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { cache } from "react"; // 요청 안에서 결과를 다시 쓰는 도구
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

interface LoadedNewsPost // 조회한 뉴스와 시연 여부
{ // 형식 시작
    post: PublicNewsPost | null; // 표시할 뉴스
    demoPost: PublicNewsPost | null; // 시연 뉴스(실제 뉴스면 없음)
} // 형식 끝

const loadNewsPost = cache(async (id: string): Promise<LoadedNewsPost> => // 뉴스 한 건 조회(제목 정보와 화면이 함께 사용)
{ // 함수 시작
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

    return { post, demoPost }; // 조회 결과 반환
}); // 함수 끝

export async function generateMetadata({ params }: NewsDetailPageProps): Promise<Metadata> // 글 제목을 브라우저 제목과 공유 정보로 사용
{ // 함수 시작
    const { id } = await params; // 게시물 식별자 읽기
    const { post } = await loadNewsPost(id); // 뉴스 조회
    if (!post) // 공개 게시물 없음 확인
    { // 조건 시작
        return { title: "개발 뉴스 · Palettra Games" }; // 기본 제목 반환
    } // 조건 끝
    const title = `${post.title} · Palettra Games`; // 글 제목을 넣은 브라우저 제목
    const images = post.coverImageUrl ? [post.coverImageUrl] : undefined; // 대표 이미지가 있으면 공유 이미지로 사용
    return { title, description: post.summary, openGraph: { title, description: post.summary, type: "article", images }, twitter: { card: images ? "summary_large_image" : "summary" } }; // 제목·요약·공유 이미지 반환
} // 함수 끝

export default async function NewsDetailPage({ params }: NewsDetailPageProps) // 공개 뉴스 상세 화면
{ // 함수 시작
    const { id } = await params; // 게시물 식별자 읽기
    const { post, demoPost } = await loadNewsPost(id); // 뉴스 조회

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
                    {post === demoPost ? <span data-demo-tag>시연</span> : null} {/* 시연 콘텐츠 표시 */}
                    {post.tags.map((tag: string) => <span key={tag}>{TAG_LABELS[tag] ?? tag}</span>)} {/* 태그 표시 */}
                </div> {/* 태그 목록 끝 */}
                <h1>{post.title}</h1> {/* 뉴스 제목 */}
                <time dateTime={post.publishedAt || undefined}>{publishedDate}</time> {/* 공개 날짜 */}
                {post.coverImageUrl ? <img className={styles.cover} src={post.coverImageUrl} alt="" /> : null} {/* 대표 이미지 */}
                <div className={styles.content}>{post.content}</div> {/* 뉴스 본문 내용 */}
            </article> {/* 뉴스 본문 끝 */}
            <CommentsPanel newsId={post.id} demoMode={commentsDemoMode} /> {/* 시연·실제 모드 댓글 */}
        </main> {/* 뉴스 상세 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 상세 화면 반환 끝
} // 함수 끝
