import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { notFound } from "next/navigation"; // 없음 화면 도구
import { isAdminDemoAvailable } from "@/lib/admin/demo-mode"; // 데모 사용 가능 판정
import AdminDemo from "./admin-demo"; // 데모 편집 화면
import DemoModeration from "./demo-moderation"; // 데모 댓글 관리 화면

interface AdminDemoPageProps // 데모 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export const dynamic = "force-dynamic"; // 요청별 동적 화면

export const metadata: Metadata = // 데모 문서 정보
{ // 문서 정보 시작
    title: "관리자 데모 모드 · DEVFORGE", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export default async function AdminDemoPage({ searchParams }: AdminDemoPageProps) // 관리자 데모 화면
{ // 함수 시작
    if (!isAdminDemoAvailable()) // 데모 허용 환경 확인
    { // 조건 시작
        notFound(); // 운영·설정 환경 차단
    } // 조건 끝

    const parameters = await searchParams; // 검색 값 읽기
    const form = parameters.form === "products" || parameters.form === "comments" ? parameters.form : "news"; // 점검 화면 종류
    const titles = { news: "개발 뉴스 폼 점검", products: "상품 폼 점검", comments: "댓글·신고 관리 점검" }; // 화면 제목 목록

    return ( // 데모 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <header className="admin-header"> {/* 데모 상단 메뉴 */}
                <Link className="admin-brand" href="/main.html">DEVFORGE</Link> {/* 메인 이동 브랜드 */}
                <nav className="admin-nav" aria-label="데모 메뉴"> {/* 데모 이동 메뉴 */}
                    <Link href="/admin/demo?form=news" aria-current={form === "news" ? "page" : undefined}>뉴스 폼</Link> {/* 뉴스 폼 이동 */}
                    <Link href="/admin/demo?form=products" aria-current={form === "products" ? "page" : undefined}>상품 폼</Link> {/* 상품 폼 이동 */}
                    <Link href="/admin/demo?form=comments" aria-current={form === "comments" ? "page" : undefined}>댓글 관리</Link> {/* 댓글 관리 이동 */}
                    <Link href="/admin/login">관리자 로그인</Link> {/* 로그인 이동 */}
                </nav> {/* 데모 이동 메뉴 끝 */}
            </header> {/* 데모 상단 메뉴 끝 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">{"// SAFE DEMO"}</p> {/* 영문 분류 */}
                    <h1>{titles[form]}</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
            </section> {/* 화면 제목 영역 끝 */}
            <p className="admin-demo-banner" role="note"><strong>데모 모드</strong> 입력 검증과 미리보기만 확인합니다. 서버·브라우저 어디에도 저장되지 않고 공개되지도 않습니다. 이 화면은 Supabase가 설정되지 않은 개발 환경에서만 열립니다.</p> {/* 데모 안내 */}
            {form === "comments" ? <DemoModeration /> : <AdminDemo key={form} form={form} />} {/* 데모 편집기·댓글 관리 */}
        </main> // 관리자 전체 영역 끝
    ); // 데모 화면 반환 끝
} // 함수 끝
