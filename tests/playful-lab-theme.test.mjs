import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile, readdir } from "node:fs/promises"; // 비동기 파일 도구
import path from "node:path"; // 경로 조합 도구
import test from "node:test"; // 테스트 실행 도구

const themeUrl = new URL("../public/playful-lab-theme.css", import.meta.url); // 공통 테마 경로
const publicRoot = new URL("../public/", import.meta.url); // 공개 폴더 경로
const themedPages = ["main.html", "goods.html", "devlog.html", "community.html", "terms.html", "privacy.html"]; // 테마 대상 문서

test("플레이풀 랩 테마가 승인된 공통 토큰을 제공한다", async () => // 토큰 계약 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 파일 읽기
    assert.match(css, /\[data-theme="playful-lab"\]/); // 테마 범위 확인
    assert.match(css, /--pl-canvas:\s*#FFFFFF/i); // 기본 배경 확인
    assert.match(css, /--pl-surface:\s*#F7FBFF/i); // 보조 배경 확인
    assert.match(css, /--pl-panel:\s*#EEF3F8/i); // 카드 배경 확인
    assert.match(css, /--pl-ink:\s*#172A49/i); // 주요 글자 확인
    assert.match(css, /--pl-muted:\s*#53677E/i); // 보조 글자 확인
    assert.match(css, /--pl-border:\s*#DCE7F0/i); // 경계선 확인
    assert.match(css, /--pl-mint:\s*#43D7C3/i); // 민트 확인
    assert.match(css, /--pl-violet:\s*#7768F8/i); // 바이올렛 확인
    assert.match(css, /--pl-orange:\s*#FF9256/i); // 오렌지 확인
    assert.match(css, /--pl-danger:\s*#D94B64/i); // 오류 확인
    assert.match(css, /--pl-success:\s*#218A76/i); // 성공 확인
    assert.match(css, /--pl-focus-ring:\s*0\.18rem solid var\(--pl-violet\)/); // 초점 외곽선 확인
}); // 테스트 끝

test("주요 콘텐츠 영역은 선명한 외곽선과 은은한 깊이 효과를 사용한다", async () => // 영역 구분 회귀 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 공통 테마 읽기
    const loginCss = await readFile(new URL("../app/login/member-login.module.css", import.meta.url), "utf8"); // 로그인 스타일 읽기
    const ageCss = await readFile(new URL("../app/age-verification/age-verification.module.css", import.meta.url), "utf8"); // 성인 인증 스타일 읽기
    const newsCss = await readFile(new URL("../app/news/[id]/news-detail.module.css", import.meta.url), "utf8"); // 뉴스 상세 스타일 읽기
    const adminCss = await readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"); // 관리자 스타일 읽기
    assert.match(css, /--pl-border-strong:\s*#AEBFD0/i); // 밝은 강한 경계선 확인
    assert.match(css, /data-color-mode="dark"[\s\S]*?--pl-border-strong:\s*#526985/i); // 다크 강한 경계선 확인
    assert.match(css, /--pl-shadow-small:\s*0 0\.5rem 1\.5rem rgba\(23, 42, 73, 0\.1\)/i); // 밝은 깊이 효과 확인
    assert.match(css, /\.game-catalog-toolbar[\s\S]*?border:[^;]*var\(--pl-border-strong\)/); // 메인 주요 영역 확인
    assert.match(css, /data-responsive-page="goods"\] \.goods-card[\s\S]*?border-color:\s*var\(--pl-border-strong\)/); // 상품 주요 영역 확인
    assert.match(css, /data-responsive-page="news"\] \.filter-panel[\s\S]*?border-color:\s*var\(--pl-border-strong\)/); // 뉴스 주요 영역 확인
    assert.match(css, /data-responsive-page="community"\] :is\(\.game-selector, \.featured-feed, \.platform-section\)[\s\S]*?border-color:\s*var\(--pl-border-strong\)/); // 커뮤니티 주요 영역 확인
    assert.match(css, /data-responsive-page="legal"\] \.legal-document[\s\S]*?border:[^;]*var\(--pl-border-strong\)/); // 법적 문서 주요 영역 확인
    assert.match(loginCss, /\.panel[\s\S]*?border:[^;]*var\(--pl-border-strong\)/); // 로그인 카드 확인
    assert.match(ageCss, /\.card[\s\S]*?border:[^;]*var\(--pl-border-strong\)/); // 인증 카드 확인
    assert.match(newsCss, /\.article[\s\S]*?border:[^;]*var\(--pl-border-strong\)/); // 뉴스 상세 본문 확인
    assert.match(adminCss, /--admin-line:\s*var\(--pl-border-strong\)/); // 관리자 영역 확인
}); // 테스트 끝

test("대상 정적 페이지는 테마를 마지막 스타일로 한 번만 연결한다", async () => // 정적 연결 검사
{ // 테스트 시작
    for (const fileName of themedPages) // 대상 문서 반복
    { // 반복 시작
        const html = await readFile(new URL(fileName, publicRoot), "utf8"); // 문서 읽기
        assert.equal((html.match(/playful-lab-theme\.css/g) ?? []).length, 1, fileName); // 단일 연결 확인
        assert.match(html, /<body[^>]*data-theme="playful-lab"/, fileName); // 테마 식별자 확인
        assert.equal(html.indexOf('<link rel="stylesheet" href="/playful-lab-theme.css">'), html.lastIndexOf('<link rel="stylesheet"'), fileName); // 마지막 스타일 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 페이지와 기기 미리보기는 공통 테마에서 제외된다", async () => // 제외 범위 검사
{ // 테스트 시작
    const entries = await readdir(publicRoot, { withFileTypes: true }); // 공개 항목 읽기
    const projectFolders = entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")); // 프로젝트 폴더 추출
    for (const folder of projectFolders) // 프로젝트 폴더 반복
    { // 반복 시작
        const files = await readdir(new URL(`${folder.name}/`, publicRoot)); // 프로젝트 파일 읽기
        for (const fileName of files.filter((name) => name.endsWith(".html"))) // HTML 파일 반복
        { // 파일 시작
            const html = await readFile(new URL(`${folder.name}/${fileName}`, publicRoot), "utf8"); // 프로젝트 문서 읽기
            assert.doesNotMatch(html, /playful-lab-theme|data-theme="playful-lab"/, path.join(folder.name, fileName)); // 테마 부재 확인
        } // 파일 끝
    } // 반복 끝
    const preview = await readFile(new URL("device-preview.html", publicRoot), "utf8"); // 미리보기 읽기
    assert.doesNotMatch(preview, /playful-lab-theme|data-theme="playful-lab"/); // 미리보기 제외 확인
}); // 테스트 끝

test("공통 테마가 탐색·버튼·카드·대화상자 계약을 제공한다", async () => // 공통 구성 요소 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /\[data-theme="playful-lab"\] \.navbar/); // 상단 메뉴 확인
    assert.match(css, /\[data-theme="playful-lab"\] \.nav-logo/); // 브랜드 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.btn-nav, \.hero-action, \.filter-btn, \.dialog-link\)/); // 버튼 묶음 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(input, textarea, select\)/); // 입력 요소 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.goods-card, \.community-card, \.news-row/); // 카드 묶음 확인
    assert.match(css, /\[data-theme="playful-lab"\] :is\(\.contact-dialog, \.modal-box\)/); // 대화상자 확인
}); // 테스트 끝

test("메인 테마가 히어로·캐러셀·게임·질문 영역을 밝게 표현한다", async () => // 메인 시각 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    const mainHtml = await readFile(new URL("main.html", publicRoot), "utf8"); // 메인 문서 읽기
    assert.match(css, /data-responsive-page="main"[\s\S]*?\.hero/); // 메인 히어로 범위 확인
    assert.match(css, /\.hero-carousel-progress-fill[\s\S]*?var\(--pl-violet\)/); // 진행 게이지 확인
    assert.match(css, /\.hero-carousel-control[\s\S]*?var\(--pl-ink\)/); // 방향 버튼 확인
    assert.match(css, /\.game-card[\s\S]*?var\(--pl-canvas\)/); // 게임 카드 확인
    assert.match(css, /\.faq-list details[\s\S]*?var\(--pl-panel\)/); // 질문 카드 확인
    assert.match(css, /\.hero-title \.line1[\s\S]*?var\(--pl-ink\)/); // 히어로 제목 확인
    assert.match(css, /\.hero-subtitle[\s\S]*?var\(--pl-muted\)/); // 히어로 설명 확인
    assert.match(css, /:is\(\.section, footer\)[\s\S]*?var\(--pl-surface\)/); // 메인 구역 배경 확인
    assert.match(css, /\.section-title[\s\S]*?var\(--pl-ink\)/); // 구역 제목 확인
    assert.match(css, /\.game-desc[\s\S]*?var\(--pl-muted\)/); // 게임 설명 확인
    assert.match(mainHtml, /href="http:\/\/localhost:3001\/"[^>]*>ChatBot 시작하기/); // 캐챗 주소 보존 확인
}); // 테스트 끝

test("메인 게임 검색·필터 패널이 공통 카드 토큰과 선택 상태를 사용한다", async () => // 필터 패널 회귀 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /data-responsive-page="main"\] \.game-catalog-toolbar[\s\S]*?background:\s*var\(--pl-canvas\)/); // 필터 카드 배경 확인
    assert.match(css, /data-responsive-page="main"\] \.game-catalog-toolbar[\s\S]*?border-radius:\s*var\(--pl-radius-medium\)/); // 필터 카드 모서리 확인
    assert.match(css, /data-responsive-page="main"\] \.game-search-field[\s\S]*?background:\s*var\(--pl-surface\)/); // 검색창 배경 확인
    assert.match(css, /data-responsive-page="main"\] \.game-search-input:focus-visible[\s\S]*?outline:\s*none/); // 검색 초점 중복 방지 확인
    assert.match(css, /data-responsive-page="main"\] \.game-catalog-toolbar \.filter-btn\.active[\s\S]*?background:\s*var\(--pl-link\)/); // 선택 버튼 배경 확인
}); // 테스트 끝

test("질문 카드 제목은 밝은 카드에서 주요 글자 토큰을 사용한다", async () => // 질문 대비 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /\[data-theme="playful-lab"\] \.faq-list summary\s*\/\*[\s\S]*?color:\s*var\(--pl-ink\)/); // 질문 제목 대비 확인
}); // 테스트 끝

test("메인 카드의 제목·설명·링크가 밝은 화면용 글자 토큰을 사용한다", async () => // 메인 글자 대비 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /data-responsive-page="main"\] :is\(\.games-subheading, \.goods-name, \.community-name\)[\s\S]*?color:\s*var\(--pl-ink\)/); // 카드 제목 대비 확인
    assert.match(css, /data-responsive-page="main"\] :is\(\.experience-lead, \.goods-game, \.community-desc\)[\s\S]*?color:\s*var\(--pl-muted\)/); // 카드 설명 대비 확인
    assert.match(css, /data-responsive-page="main"\] :is\(\.game-link, \.goods-price, \.section-detail-link\)[\s\S]*?color:\s*var\(--pl-link\)/); // 카드 링크 대비 확인
    assert.match(css, /--pl-on-accent:\s*#172A49/i); // 강조 배경 글자 확인
    assert.match(css, /--pl-link:\s*#5746D9/i); // 밝은 화면 링크 확인
}); // 테스트 끝

test("공통 테마가 저장 가능한 다크 모드 토큰을 제공한다", async () => // 다크 토큰 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /\[data-theme="playful-lab"\]\[data-color-mode="dark"\]/); // 다크 범위 확인
    assert.match(css, /data-color-mode="dark"[\s\S]*?--pl-canvas:\s*#0B1220/i); // 다크 배경 확인
    assert.match(css, /data-color-mode="dark"[\s\S]*?--pl-ink:\s*#F4F7FB/i); // 다크 글자 확인
    assert.match(css, /data-color-mode="dark"[\s\S]*?color-scheme:\s*dark/); // 입력 색상 체계 확인
}); // 테스트 끝

test("콘텐츠와 법적 문서가 페이지별 공통 테마 계약을 제공한다", async () => // 하위 페이지 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    const goodsHtml = await readFile(new URL("goods.html", publicRoot), "utf8"); // 상품 문서 읽기
    assert.match(css, /data-responsive-page="goods"[\s\S]*?\.goods-card/); // 상품 카드 확인
    assert.match(css, /data-responsive-page="news"[\s\S]*?\.news-row/); // 뉴스 행 확인
    assert.match(css, /data-responsive-page="community"[\s\S]*?\.platform-section/); // 커뮤니티 카드 확인
    assert.match(css, /data-responsive-page="legal"[\s\S]*?\.legal-document/); // 법적 문서 확인
    assert.match(css, /\.state-preparing[\s\S]*?var\(--pl-orange\)/); // 준비 상태 확인
    assert.match(css, /\.load-status[\s\S]*?var\(--pl-muted\)/); // 조회 상태 확인
    assert.match(goodsHtml, /판매 준비 중/); // 상태 문구 보존 확인
}); // 테스트 끝

test("로그인과 성인 인증 화면이 밝은 공통 토큰을 사용한다", async () => // 인증 화면 검사
{ // 테스트 시작
    const loginCss = await readFile(new URL("../app/login/member-login.module.css", import.meta.url), "utf8"); // 로그인 스타일 읽기
    const ageCss = await readFile(new URL("../app/age-verification/age-verification.module.css", import.meta.url), "utf8"); // 성인 인증 스타일 읽기
    assert.match(loginCss, /background:[^;]*var\(--pl-surface\)/); // 로그인 밝은 배경 확인
    assert.match(loginCss, /color:\s*var\(--pl-ink\)/); // 로그인 기본 글자 확인
    assert.match(loginCss, /var\(--pl-violet\)/); // 로그인 강조색 확인
    assert.match(ageCss, /background:[^;]*var\(--pl-surface\)/); // 인증 밝은 배경 확인
    assert.match(ageCss, /var\(--pl-orange\)/); // 인증 경고색 확인
    assert.match(ageCss, /color-scheme:\s*light/); // 날짜 입력 밝은 모드 확인
}); // 테스트 끝

test("뉴스 상세와 관리자 화면이 공통 토큰과 상태색을 사용한다", async () => // 운영 화면 검사
{ // 테스트 시작
    const newsCss = await readFile(new URL("../app/news/[id]/news-detail.module.css", import.meta.url), "utf8"); // 뉴스 스타일 읽기
    const adminCss = await readFile(new URL("../app/admin/admin.css", import.meta.url), "utf8"); // 관리자 스타일 읽기
    assert.match(newsCss, /background:\s*var\(--pl-surface\)/); // 뉴스 배경 확인
    assert.match(newsCss, /var\(--pl-violet\)/); // 뉴스 강조 확인
    assert.match(newsCss, /var\(--pl-danger\)/); // 댓글 오류 확인
    assert.match(adminCss, /body\[data-theme="playful-lab"\][\s\S]*?--admin-bg:\s*var\(--pl-surface\)/); // 관리자 배경 연결 확인
    assert.match(adminCss, /--admin-accent:\s*var\(--pl-orange\)/); // 관리자 강조 연결 확인
    assert.match(adminCss, /--admin-danger:\s*var\(--pl-danger\)/); // 관리자 오류 연결 확인
    assert.match(adminCss, /--admin-success:\s*var\(--pl-success\)/); // 관리자 성공 연결 확인
}); // 테스트 끝

test("공통 테마가 반응형·상태·움직임 축소 계약을 제공한다", async () => // 안전 규칙 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /@media \(max-width:\s*767px\)/); // 모바일 구간 확인
    assert.match(css, /@media \(min-width:\s*768px\) and \(max-width:\s*1279px\)/); // 태블릿 구간 확인
    assert.match(css, /@media \(min-width:\s*1280px\)/); // 데스크톱 구간 확인
    assert.match(css, /:focus-visible[\s\S]*?var\(--pl-violet\)/); // 초점 표시 확인
    assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?0\.01ms/); // 움직임 축소 확인
    assert.match(css, /:is\(\.load-status, \.admin-empty-state\)/); // 로딩·빈 상태 확인
    assert.match(css, /:is\(\.error, \.admin-message-error, \.field-error\)/); // 오류 상태 확인
    assert.match(css, /min-height:\s*44px/); // 터치 높이 확인
    assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?\.hero-carousel-timer[\s\S]*?bottom:\s*4\.75rem/); // 모바일 게이지 위치 확인
    assert.match(css, /@media \(max-width:\s*767px\)[\s\S]*?:is\(\.modal-box, \.contact-dialog\)[\s\S]*?width:\s*calc\(100vw - 2rem\)/); // 모바일 대화상자 너비 확인
}); // 테스트 끝

test("메인 커뮤니티 카드는 화면 폭이 바뀌어도 최대 크기를 넘지 않는다", async () => // 커뮤니티 크기 회귀 검사
{ // 테스트 시작
    const css = await readFile(themeUrl, "utf8"); // 테마 읽기
    assert.match(css, /data-responsive-page="main"\] \.community-grid[\s\S]*?grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*8\.5rem\),\s*10rem\)\)/); // 유동 열 크기 확인
    assert.match(css, /data-responsive-page="main"\] \.community-card[\s\S]*?max-width:\s*10rem/); // 카드 최대 너비 확인
    assert.match(css, /data-responsive-page="main"\] \.community-card[\s\S]*?justify-self:\s*center/); // 단일 카드 중앙 정렬 확인
    assert.match(css, /data-responsive-page="main"\] \.community-icon-wrap[\s\S]*?width:\s*clamp\(3rem,\s*8vw,\s*5rem\)/); // 아이콘 유동 크기 확인
}); // 테스트 끝
