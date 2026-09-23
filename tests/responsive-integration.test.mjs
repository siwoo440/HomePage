import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구

const CORE_PAGES = Object.freeze( // 핵심 페이지 목록
[ // 목록 시작
    Object.freeze({ file: "main.html", page: "main", stylesheet: "</style>" }), // 메인 페이지 정보
    Object.freeze({ file: "goods.html", page: "goods", stylesheet: "goods.css" }), // 굿즈 페이지 정보
    Object.freeze({ file: "devlog.html", page: "news", stylesheet: "devlog.css" }), // 뉴스 페이지 정보
    Object.freeze({ file: "community.html", page: "community", stylesheet: "community.css" }), // 커뮤니티 페이지 정보
    Object.freeze({ file: "project_eta/ProjectEta_Main.html", page: "eta", stylesheet: "ProjectEta_Style.css" }), // 에타 페이지 정보
]); // 목록 끝

function readPublicFile(relativePath) // 공개 파일 읽기
{ // 함수 시작
    return fs.readFileSync(path.join("public", relativePath), "utf8"); // 파일 내용 반환
} // 함수 끝

test("핵심 페이지가 공통 반응형 자원을 한 번씩 불러온다", () => // 공통 연결 테스트
{ // 테스트 시작
    for (const page of CORE_PAGES) // 페이지 반복
    { // 반복 시작
        const html = readPublicFile(page.file); // HTML 읽기
        assert.equal((html.match(/responsive-shell\.css/g) ?? []).length, 1, page.file); // CSS 한 번 확인
        assert.equal((html.match(/responsive-nav\.mjs/g) ?? []).length, 1, page.file); // 모듈 한 번 확인
        assert.match(html, /data-responsive-nav-root/, page.file); // 헤더 마운트 확인
        assert.match(html, new RegExp(`<body[^>]*data-responsive-page=["']${page.page}["']`), page.file); // 페이지 식별자 확인
    } // 반복 끝
}); // 테스트 끝

test("공통 자원은 페이지 스타일 뒤와 개인정보 모듈 앞에 놓인다", () => // 자원 순서 테스트
{ // 테스트 시작
    for (const page of CORE_PAGES) // 페이지 반복
    { // 반복 시작
        const html = readPublicFile(page.file); // HTML 읽기
        const pageStyleIndex = html.indexOf(page.stylesheet); // 기존 스타일 위치
        const sharedStyleIndex = html.indexOf("/responsive-shell.css"); // 공통 스타일 위치
        const sharedModuleIndex = html.indexOf("/responsive-nav.mjs"); // 공통 모듈 위치
        const privacyModuleIndex = html.indexOf("/privacy-consent.mjs"); // 개인정보 모듈 위치
        assert.ok(pageStyleIndex >= 0 && pageStyleIndex < sharedStyleIndex, page.file); // 스타일 순서 확인
        assert.ok(sharedModuleIndex >= 0 && sharedModuleIndex < privacyModuleIndex, page.file); // 모듈 순서 확인
    } // 반복 끝
}); // 테스트 끝

test("메인 페이지가 홈 로고와 문의 해시 대상 창을 제공한다", () => // 메인 연결 테스트
{ // 테스트 시작
    const html = readPublicFile("main.html"); // 메인 HTML 읽기
    assert.match(html, /<a href="\/main\.html" class="nav-logo">DEVFORGE<\/a>/); // 홈 로고 확인
    assert.match(html, /id="contact-modal"/); // 문의창 식별자 확인
}); // 테스트 끝

test("공개 메인 헤더는 개발용 기기 선택기를 노출하지 않는다", () => // 공개 헤더 테스트
{ // 테스트 시작
    const html = readPublicFile("main.html"); // 메인 HTML 읽기
    const actions = html.match(/<div class="nav-actions">[\s\S]*?<\/div>/)?.[0] ?? ""; // 상단 작업 영역 추출
    assert.doesNotMatch(actions, /data-site-device-picker|device-preview\.html/); // 개발 제어기 제외 확인
    assert.match(actions, />문의하기<\/button>[\s\S]*?data-member-action/); // 문의와 로그인 순서 확인
}); // 테스트 끝

test("개인정보 설정 버튼은 비활성 상담 버튼 자리를 남기지 않는다", () => // 개인정보 버튼 간격 테스트
{ // 테스트 시작
    const css = readPublicFile("privacy-consent.css"); // 개인정보 스타일 읽기
    const settingsRule = css.match(/\.privacy-consent-settings \/\* 설정 고정 버튼 \*\/[\s\S]*?\}/)?.[0] ?? ""; // 설정 버튼 규칙 추출
    assert.match(settingsRule, /right:\s*1rem/); // 오른쪽 기본 간격 확인
}); // 테스트 끝

test("메인 페이지가 키보드 이동과 충분한 터치 영역을 제공한다", () => // 접근성 보완 테스트
{ // 테스트 시작
    const html = readPublicFile("main.html"); // 메인 HTML 읽기
    const css = readPublicFile("site-experience.css"); // 경험 CSS 읽기
    assert.match(html, /class="skip-link"[^>]*href="#main-content"/); // 본문 건너뛰기 확인
    assert.match(html, /id="main-content"[^>]*tabindex="-1"/); // 본문 초점 대상 확인
    assert.match(css, /\.game-filter-options \.filter-btn[\s\S]*?min-height:\s*44px/); // 필터 터치 높이 확인
    assert.match(css, /:focus-visible[\s\S]*?outline:/); // 키보드 초점 확인
}); // 테스트 끝

test("공통 스타일이 모바일 태블릿 PC 경계를 모두 정의한다", () => // 공통 화면 구간 테스트
{ // 테스트 시작
    const css = readPublicFile("responsive-shell.css"); // 공통 CSS 읽기
    assert.match(css, /@media \(max-width: 767px\)/); // 모바일 상한 확인
    assert.match(css, /@media \(min-width: 768px\) and \(max-width: 959px\)/); // 서랍 태블릿 구간 확인
    assert.match(css, /@media \(min-width: 960px\) and \(max-width: 1279px\)/); // 가로 태블릿 구간 확인
    assert.match(css, /@media \(min-width: 1280px\)/); // PC 하한 확인
    assert.match(css, /width:\s*calc\(100vw - 32px\)/); // 모바일 모달 너비 확인
    assert.match(css, /max-height:\s*calc\(100dvh - 32px\)/); // 모바일 모달 높이 확인
}); // 테스트 끝

test("메인과 굿즈가 모바일 한 열과 태블릿 두세 열을 제공한다", () => // 카드 격자 테스트
{ // 테스트 시작
    const mainHtml = readPublicFile("main.html"); // 메인 HTML 읽기
    const goodsCss = readPublicFile("goods.css"); // 굿즈 CSS 읽기
    assert.match(mainHtml, /@media \(max-width: 767px\)[\s\S]*?\.games-grid[\s\S]*?grid-template-columns:\s*1fr/); // 메인 모바일 게임 한 열 확인
    assert.match(mainHtml, /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.games-grid[\s\S]*?repeat\(2,/); // 메인 태블릿 게임 두 열 확인
    assert.match(mainHtml, /@media \(min-width: 1024px\) and \(max-width: 1279px\)[\s\S]*?\.games-grid[\s\S]*?repeat\(3,/); // 메인 태블릿 게임 세 열 확인
    assert.match(goodsCss, /@media \(max-width: 767px\)[\s\S]*?\.goods-grid[\s\S]*?grid-template-columns:\s*1fr/); // 굿즈 모바일 한 열 확인
    assert.match(goodsCss, /@media \(min-width: 768px\) and \(max-width: 1023px\)[\s\S]*?\.goods-grid[\s\S]*?repeat\(2,/); // 굿즈 태블릿 두 열 확인
    assert.match(goodsCss, /@media \(min-width: 1024px\) and \(max-width: 1279px\)[\s\S]*?\.goods-grid[\s\S]*?repeat\(3,/); // 굿즈 태블릿 세 열 확인
}); // 테스트 끝

test("뉴스 커뮤니티 에타가 기기별 안전한 구성을 제공한다", () => // 특수 화면 테스트
{ // 테스트 시작
    const newsCss = readPublicFile("devlog.css"); // 뉴스 CSS 읽기
    const communityCss = readPublicFile("community.css"); // 커뮤니티 CSS 읽기
    const etaCss = readPublicFile("project_eta/ProjectEta_Style.css"); // 에타 CSS 읽기
    assert.match(newsCss, /@media \(max-width: 767px\)[\s\S]*?\.news-row[\s\S]*?grid-template-columns:\s*1fr/); // 뉴스 모바일 세로 확인
    assert.match(newsCss, /@media \(min-width: 900px\) and \(max-width: 1279px\)[\s\S]*?\.news-row[\s\S]*?grid-template-columns:/); // 뉴스 태블릿 가로 확인
    assert.match(communityCss, /@media \(min-width: 768px\) and \(max-width: 1279px\)[\s\S]*?\.platform-stack[\s\S]*?repeat\(3,/); // 커뮤니티 태블릿 세 열 확인
    assert.match(communityCss, /@media \(max-width: 767px\)[\s\S]*?\.platform-stack[\s\S]*?repeat\(2,/); // 커뮤니티 모바일 두 열 확인
    assert.match(communityCss, /@media \(max-width: 419px\)[\s\S]*?\.platform-stack[\s\S]*?grid-template-columns:\s*1fr/); // 커뮤니티 작은 모바일 한 열 확인
    assert.match(etaCss, /@media \(max-width: 1279px\)[\s\S]*?\.fusion-tree-shell[\s\S]*?overflow-x:\s*auto/); // 에타 트리 가로 이동 확인
}); // 테스트 끝

function collectPublicHtmlFiles(directory = "public") // 공개 HTML 수집
{ // 함수 시작
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 폴더 항목 반복
    { // 반복 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로 생성
        return entry.isDirectory() ? collectPublicHtmlFiles(entryPath) : entry.name.endsWith(".html") ? [entryPath] : []; // HTML 경로 반환
    }); // 반복 끝
} // 함수 끝

test("모든 공개 HTML이 공통 모바일 메뉴를 제공한다", () => // 전체 페이지 연결 테스트
{ // 테스트 시작
    const files = collectPublicHtmlFiles().filter((file) => !file.endsWith("device-preview.html")); // 공개 페이지 수집
    assert.equal(files.length, 44); // 법적 문서 포함 페이지 수 확인

    for (const file of files) // 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(file, "utf8"); // HTML 읽기
        assert.match(html, /data-responsive-nav-root/, file); // 메뉴 마운트 확인
        assert.equal((html.match(/responsive-shell\.css/g) ?? []).length, 1, file); // CSS 중복 방지
        assert.equal((html.match(/responsive-nav\.mjs/g) ?? []).length, 1, file); // 모듈 중복 방지
    } // 반복 끝
}); // 테스트 끝

test("중첩 페이지는 루트 절대 공통 자원을 사용하고 미리보기는 공개 메뉴를 제외한다", () => // 중첩 경로 테스트
{ // 테스트 시작
    const nestedFiles = collectPublicHtmlFiles().filter((file) => file.includes(path.sep + "project_")); // 중첩 페이지 수집

    for (const file of nestedFiles) // 중첩 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(file, "utf8"); // HTML 읽기
        assert.match(html, /href="\/responsive-shell\.css"/, file); // 루트 CSS 확인
        assert.match(html, /src="\/responsive-nav\.mjs"/, file); // 루트 모듈 확인
    } // 반복 끝

    const previewHtml = readPublicFile("device-preview.html"); // 미리보기 HTML 읽기
    assert.doesNotMatch(previewHtml, /responsive-nav\.mjs/); // 공개 메뉴 제외 확인
    assert.doesNotMatch(previewHtml, /data-responsive-nav-root/); // 공개 마운트 제외 확인
}); // 테스트 끝
