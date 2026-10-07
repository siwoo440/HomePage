export const SITE_HEADER_START = "<!-- site-header:start -->"; // 공통 헤더 시작 표시
export const SITE_HEADER_END = "<!-- site-header:end -->"; // 공통 헤더 끝 표시

export const SITE_MENU_ITEMS = Object.freeze( // 공통 주요 메뉴 목록
[ // 목록 시작
    Object.freeze({ id: "games", label: "게임", href: "/main.html#games" }), // 게임 메뉴
    Object.freeze({ id: "goods", label: "굿즈", href: "/goods.html" }), // 굿즈 메뉴
    Object.freeze({ id: "news", label: "개발 뉴스", href: "/devlog.html" }), // 개발 뉴스 메뉴
    Object.freeze({ id: "community", label: "커뮤니티", href: "/community.html" }), // 커뮤니티 메뉴
]); // 목록 끝

function escapeHtml(value) // HTML 특수 문자 처리
{ // 함수 시작
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); // 안전 문구 반환
} // 함수 끝

export function renderSiteHeader({ current = "", indent = "    ", subnav = null } = {}) // 공통 상단 헤더 생성
{ // 함수 시작
    const menu = SITE_MENU_ITEMS.map((item) => `${indent}        <li><a href="${item.href}"${item.id === current ? ' aria-current="page"' : ""}>${item.label}</a></li> <!-- ${item.label} 메뉴 -->`).join("\n"); // 메뉴 항목 생성
    const contactCurrent = current === "contact" ? ' aria-current="page"' : ""; // 문의 현재 표시
    return [ // 헤더 줄 목록
        `${indent}${SITE_HEADER_START}`, // 공통 헤더 시작
        `${indent}<nav class="navbar" id="navbar" aria-label="주요 메뉴" data-responsive-nav-root data-site-header> <!-- 공통 상단 메뉴 -->`, // 헤더 시작
        `${indent}    <a href="/main.html" class="nav-logo">PALETTRA</a> <!-- 메인 이동 로고 -->`, // 로고
        `${indent}    <ul class="nav-menu"> <!-- 주요 메뉴 목록 -->`, // 메뉴 시작
        menu, // 메뉴 항목
        `${indent}    </ul> <!-- 주요 메뉴 목록 끝 -->`, // 메뉴 끝
        `${indent}    <div class="nav-actions"> <!-- 상단 작업 묶음 -->`, // 작업 묶음 시작
        `${indent}        <a href="/contact.html" class="btn-nav nav-contact-link"${contactCurrent}>문의하기</a> <!-- 문의하기 페이지 이동 -->`, // 문의 버튼
        `${indent}        <a href="/login" class="btn-nav member-login-link" data-member-action data-analytics-event="login_start" data-analytics-destination="member-login">로그인</a> <!-- 회원 로그인 이동 -->`, // 로그인 버튼
        `${indent}    </div> <!-- 상단 작업 묶음 끝 -->`, // 작업 묶음 끝
        `${indent}</nav> <!-- 공통 상단 메뉴 끝 -->`, // 헤더 끝
        ...(subnav ? [renderSiteSubnav({ ...subnav, indent })] : []), // 페이지 내부 보조 메뉴
        `${indent}${SITE_HEADER_END}`, // 공통 헤더 끝
    ].join("\n"); // 헤더 문자열 반환
} // 함수 끝

export function renderSiteSubnav({ title, label, links, indent = "    " }) // 페이지 내부 보조 메뉴 생성
{ // 함수 시작
    const items = links.map((link) => `${indent}    <a href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a> <!-- ${escapeHtml(link.label)} 이동 -->`).join("\n"); // 보조 링크 생성
    return [ // 보조 메뉴 줄 목록
        `${indent}<nav class="site-subnav" aria-label="${escapeHtml(label)}" data-site-subnav> <!-- 페이지 내부 이동 메뉴 -->`, // 보조 메뉴 시작
        `${indent}    <span class="site-subnav-title">${escapeHtml(title)}</span> <!-- 현재 페이지 이름 -->`, // 페이지 이름
        items, // 보조 링크
        `${indent}</nav> <!-- 페이지 내부 이동 메뉴 끝 -->`, // 보조 메뉴 끝
    ].join("\n"); // 보조 메뉴 문자열 반환
} // 함수 끝
