"use client"; // 브라우저 메뉴 연결 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect } from "react"; // 화면 연결 도구

type SiteMenuId = "games" | "goods" | "news" | "community" | "contact" | ""; // 현재 메뉴 식별자

interface SiteHeaderProps // 공통 헤더 속성
{ // 형식 시작
    current?: SiteMenuId; // 현재 메뉴
} // 형식 끝

interface ResponsiveNavWindow extends Window // 공통 메뉴 전역 형식
{ // 형식 시작
    __devforgeResponsiveNavInit?: (root: Document, view: Window) => unknown; // 공통 메뉴 초기화 함수
} // 형식 끝

interface ResponsiveNavDocument extends Document // 공통 메뉴 문서 형식
{ // 형식 시작
    __devforgeResponsiveNav?: { destroy?: () => void } | null; // 현재 메뉴 제어기
} // 형식 끝

const MENU_ITEMS: { id: SiteMenuId; label: string; href: string }[] = // 공통 주요 메뉴 목록
[ // 목록 시작
    { id: "games", label: "게임", href: "/main.html#games" }, // 게임 메뉴
    { id: "goods", label: "굿즈", href: "/goods.html" }, // 굿즈 메뉴
    { id: "news", label: "개발 뉴스", href: "/devlog.html" }, // 개발 뉴스 메뉴
    { id: "community", label: "커뮤니티", href: "/community.html" }, // 커뮤니티 메뉴
]; // 목록 끝

export default function SiteHeader({ current = "" }: SiteHeaderProps) // 공통 상단 헤더
{ // 함수 시작
    useEffect(() => // 반응형 메뉴와 회원 상태 연결
    { // 효과 시작
        const view = window as ResponsiveNavWindow; // 전역 화면 객체
        const root = document as ResponsiveNavDocument; // 문서 객체
        if (typeof view.__devforgeResponsiveNavInit === "function") // 공통 메뉴 모듈 확인
        { // 조건 시작
            root.__devforgeResponsiveNav?.destroy?.(); // 이전 화면 메뉴 해제
            view.__devforgeResponsiveNavInit(root, view); // 현재 화면 메뉴 연결
        } // 조건 끝
        else if (!root.querySelector("script[data-site-header-nav]")) // 모듈 미로드 확인
        { // 조건 시작
            const script = root.createElement("script"); // 모듈 스크립트 생성
            script.type = "module"; // 모듈 형식
            script.src = "/responsive-nav.mjs"; // 공통 메뉴 주소
            script.dataset.siteHeaderNav = "true"; // 중복 방지 표시
            root.body.append(script); // 스크립트 연결
        } // 조건 끝
        return () => root.__devforgeResponsiveNav?.destroy?.(); // 화면 이동 시 메뉴 해제
    }, []); // 최초 연결

    return ( // 헤더 반환
        <> {/* 헤더 묶음 */}
            <nav className="navbar" id="navbar" aria-label="주요 메뉴" data-responsive-nav-root="" data-site-header=""> {/* 공통 상단 메뉴 */}
                <a href="/main.html" className="nav-logo">PALETTRA</a> {/* 메인 이동 로고 */}
                <ul className="nav-menu"> {/* 주요 메뉴 목록 */}
                    {MENU_ITEMS.map((item) => <li key={item.id}><a href={item.href} aria-current={item.id === current ? "page" : undefined}>{item.label}</a></li>)} {/* 메뉴 항목 */}
                </ul> {/* 주요 메뉴 목록 끝 */}
                <div className="nav-actions"> {/* 상단 작업 묶음 */}
                    <a href="/contact.html" className="btn-nav nav-contact-link" aria-current={current === "contact" ? "page" : undefined}>문의하기</a> {/* 문의하기 페이지 이동 */}
                    <Link href="/login" className="btn-nav member-login-link" data-member-action="" data-analytics-event="login_start" data-analytics-destination="member-login" suppressHydrationWarning>로그인</Link> {/* 회원 로그인 이동 */}
                </div> {/* 상단 작업 묶음 끝 */}
            </nav> {/* 공통 상단 메뉴 끝 */}
        </> // 헤더 묶음 끝
    ); // 헤더 반환 끝
} // 함수 끝
