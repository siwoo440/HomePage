import Link from "next/link"; // 내부 이동 링크
import { signOutAdmin } from "./actions"; // 로그아웃 액션

export default function AdminHeader() // 관리자 상단 메뉴
{ // 함수 시작
    return ( // 상단 메뉴 반환
        <header className="admin-header"> {/* 관리자 상단 영역 */}
            <Link className="admin-brand" href="/main.html">DEVFORGE</Link> {/* 메인 이동 브랜드 */}
            <nav className="admin-nav" aria-label="관리자 메뉴"> {/* 관리자 이동 메뉴 */}
                <Link href="/admin/news">글 관리</Link> {/* 글 관리 이동 */}
                <Link href="/admin/news/new">새 글</Link> {/* 새 글 이동 */}
                <Link href="/admin/products">상품 관리</Link> {/* 상품 관리 이동 */}
                <Link href="/admin/products/new">새 상품</Link> {/* 새 상품 이동 */}
                <Link href="/devlog.html">공개 뉴스</Link> {/* 공개 뉴스 이동 */}
                <Link href="/goods.html">공개 굿즈</Link> {/* 공개 굿즈 이동 */}
                <form action={signOutAdmin}> {/* 로그아웃 폼 */}
                    <button type="submit">로그아웃</button> {/* 로그아웃 버튼 */}
                </form> {/* 로그아웃 폼 끝 */}
            </nav> {/* 관리자 이동 메뉴 끝 */}
        </header> // 관리자 상단 영역 끝
    ); // 상단 메뉴 반환 끝
} // 함수 끝
