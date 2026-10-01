import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { applyPageMeta, listMetaTargetPages } from "../scripts/apply-page-meta.mjs"; // 검색·공유 정보 도구
import { ADMIN_PAGE_SIZE, getAdminPageInfo, getAdminTotalPages, parseAdminPage } from "../lib/admin/pagination.ts"; // 관리자 페이지 계산

function listPublicHtml(directory = "public") // 공개 HTML 목록
{ // 함수 시작
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 항목 반복
    { // 반복 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로
        return entry.isDirectory() ? listPublicHtml(entryPath) : entryPath.endsWith(".html") && !entryPath.endsWith("device-preview.html") ? [entryPath] : []; // 공개 HTML 선택
    }); // 반복 끝
} // 함수 끝

test("모든 공개 페이지는 검색 설명과 공유 미리보기 정보를 가진다", () => // 검색·공유 정보 검사
{ // 테스트 시작
    for (const file of listPublicHtml()) // 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(file, "utf8"); // 문서 읽기
        for (const pattern of [/<meta name="description" content="[^"]{10,}">/, /property="og:title" content="[^"]+"/, /property="og:description" content="[^"]+"/, /property="og:type" content="website"/, /property="og:site_name" content="DEVFORGE"/]) // 필수 태그 반복
        { // 반복 시작
            assert.match(html, pattern, `${file} ${pattern}`); // 태그 존재 확인
        } // 반복 끝
        assert.equal((html.match(/property="og:title"/g) ?? []).length, 1, `${file} 공유 제목 중복`); // 중복 방지 확인
    } // 반복 끝
    for (const file of listMetaTargetPages("public")) // 적용 대상 반복
    { // 반복 시작
        const html = fs.readFileSync(path.join("public", file), "utf8"); // 문서 읽기
        assert.equal(applyPageMeta(html, file), html, `${file} 검색 정보 재적용 필요`); // 최신 적용 확인
    } // 반복 끝
    assert.match(fs.readFileSync("app/layout.tsx", "utf8"), /openGraph:/); // Next 화면 공유 정보 확인
}); // 테스트 끝

test("관리자 목록 페이지 번호와 범위를 안전하게 계산한다", () => // 관리자 페이지 계산 검사
{ // 테스트 시작
    assert.equal(parseAdminPage("3"), 3); // 정상 번호 확인
    assert.equal(parseAdminPage("0"), 1); // 0 번호 기본값 확인
    assert.equal(parseAdminPage("-2"), 1); // 음수 기본값 확인
    assert.equal(parseAdminPage("abc"), 1); // 문자 기본값 확인
    assert.equal(parseAdminPage(["2", "5"]), 2); // 첫 값 사용 확인
    assert.deepEqual(getAdminPageInfo(2), { page: 2, from: ADMIN_PAGE_SIZE, to: ADMIN_PAGE_SIZE * 2 - 1 }); // 두 번째 페이지 범위 확인
    assert.equal(getAdminTotalPages(0), 1); // 빈 목록 최소 페이지 확인
    assert.equal(getAdminTotalPages(ADMIN_PAGE_SIZE + 1), 2); // 다음 페이지 계산 확인
    for (const page of ["app/admin/news/page.tsx", "app/admin/products/page.tsx"]) // 관리자 목록 반복
    { // 반복 시작
        const source = fs.readFileSync(page, "utf8"); // 목록 화면
        assert.match(source, /\{ count: "exact" \}\)[\s\S]*?\.range\(pageInfo\.from, pageInfo\.to\)/, `${page} 범위 조회`); // 범위 조회 확인
        assert.match(source, /<AdminPagination /, `${page} 페이지 이동`); // 페이지 이동 확인
    } // 반복 끝
}); // 테스트 끝

test("실제 모드 댓글·성인 확인·뉴스 수정·헤더 테마 버튼이 상황에 맞게 동작한다", () => // 화면 상태 계약
{ // 테스트 시작
    const newsPage = fs.readFileSync("app/news/[id]/page.tsx", "utf8"); // 뉴스 상세
    const ageForm = fs.readFileSync("app/age-verification/age-verification-form.tsx", "utf8"); // 성인 확인 입력
    const agePage = fs.readFileSync("app/age-verification/page.tsx", "utf8"); // 성인 확인 화면
    const editPage = fs.readFileSync("app/admin/news/[id]/edit/page.tsx", "utf8"); // 뉴스 수정 화면
    const editor = fs.readFileSync("app/admin/news/news-editor.tsx", "utf8"); // 뉴스 편집기
    const navigation = fs.readFileSync("public/responsive-nav.mjs", "utf8"); // 공통 메뉴
    assert.match(newsPage, /commentsDemoMode \? <CommentsPanel newsId=\{post\.id\} demoMode \/> :/); // 실제 모드 댓글 닫힘 확인
    assert.match(newsPage, /data-comments-closed/); // 준비 안내 확인
    assert.match(agePage, /resolveAgeGateSecret\(process\.env\.NODE_ENV, process\.env\.AGE_GATE_SECRET\) !== null/); // 설정 확인 확인
    assert.match(ageForm, /disabled=\{!available \|\| submitting\}/); // 설정 누락 시 제출 차단 확인
    assert.match(ageForm, /성인 확인 설정이 아직 준비되지 않아/); // 설정 누락 안내 확인
    assert.match(editPage, /cover_image_path/); // 기존 이미지 조회 확인
    assert.match(editor, /현재 대표 이미지/); // 기존 이미지 표시 확인
    assert.match(navigation, /"site-theme-toggle"/); // 헤더 테마 버튼 확인
    assert.match(navigation, /headerThemeToggle\?\.addEventListener\("click", onThemeToggleClick\)/); // 헤더 테마 전환 연결 확인
}); // 테스트 끝

test("메인 개발 뉴스 카드와 헤더는 라이트·다크 모드 토큰을 따른다", () => // 뉴스 카드 테마 계약
{ // 테스트 시작
    const theme = fs.readFileSync("public/playful-lab-theme.css", "utf8"); // 공통 테마
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서
    const headerCss = fs.readFileSync("public/site-header.css", "utf8"); // 공통 헤더 스타일
    assert.match(theme, /\[data-theme="playful-lab"\] \.devlog-card[^{]*\{[^}]*background: var\(--pl-canvas\)/); // 카드 배경 토큰 확인
    assert.match(theme, /\[data-theme="playful-lab"\] \.devlog-title[^{]*\{[^}]*color: var\(--pl-ink\)/); // 제목 글자 토큰 확인
    assert.match(theme, /:not\(\[data-color-mode="dark"\]\) \.tag-devlog/); // 밝은 화면 태그 대비 확인
    assert.doesNotMatch(mainHtml, /navbar\.style\.background/); // 헤더 배경 직접 변경 제거 확인
    assert.match(mainHtml, /navbar\.classList\.toggle\('is-scrolled', window\.scrollY > 50\)/); // 스크롤 상태 클래스 확인
    assert.match(headerCss, /nav\.navbar\[data-site-header\]\.is-scrolled/); // 스크롤 헤더 토큰 확인
}); // 테스트 끝

test("메인 소개 카드·현황판·보관함·개인정보 패널은 라이트·다크 모드 토큰을 따른다", () => // 메인 카드 테마 계약
{ // 테스트 시작
    const theme = fs.readFileSync("public/playful-lab-theme.css", "utf8"); // 공통 테마
    for (const selector of [":is(.experience-card, .project-status-board)", ".project-shelf-panel", ":is(.privacy-consent, .privacy-consent-settings)"]) // 카드 선택자 반복
    { // 반복 시작
        const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // 정규식 안전 선택자
        assert.match(theme, new RegExp(`\\[data-theme="playful-lab"\\] ${escaped}[^{]*\\{[^}]*background: var\\(--pl-canvas\\)`), selector); // 배경 토큰 확인
    } // 반복 끝
    assert.match(theme, /\.status-board-grid article[^{]*\{[^}]*background: var\(--pl-surface\)/); // 현황 숫자 카드 확인
    assert.match(theme, /\.status-board-grid strong[^{]*\{[^}]*color: var\(--pl-violet\)/); // 현황 숫자 강조 확인
}); // 테스트 끝

test("라이트 모드 경계선은 흰 배경과 구분되는 진한 색을 쓴다", () => // 라이트 경계선 대비 계약
{ // 테스트 시작
    const theme = fs.readFileSync("public/playful-lab-theme.css", "utf8"); // 공통 테마
    const headerCss = fs.readFileSync("public/site-header.css", "utf8"); // 공통 헤더 스타일
    const luminance = (hex) => // 색상 밝기 계산
    { // 함수 시작
        const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4); // 채널 선형화
        return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]; // 상대 밝기 반환
    }; // 함수 끝
    const contrastOnWhite = (hex) => 1.05 / (luminance(hex) + 0.05); // 흰 배경 대비
    const lightTokens = theme.slice(0, theme.indexOf('[data-color-mode="dark"]')); // 밝은 토큰 구역
    const border = lightTokens.match(/--pl-border: (#[0-9A-Fa-f]{6});/)[1]; // 공통 경계선
    const strong = lightTokens.match(/--pl-border-strong: (#[0-9A-Fa-f]{6});/)[1]; // 주요 경계선
    const header = headerCss.match(/--sh-border: (#[0-9A-Fa-f]{6});/)[1]; // 헤더 경계선
    assert.ok(contrastOnWhite(border) >= 1.9, `공통 경계선 대비 ${contrastOnWhite(border)}`); // 공통 경계선 대비 확인
    assert.ok(contrastOnWhite(strong) >= 3, `주요 경계선 대비 ${contrastOnWhite(strong)}`); // 주요 경계선 대비 확인
    assert.ok(contrastOnWhite(header) >= 1.9, `헤더 경계선 대비 ${contrastOnWhite(header)}`); // 헤더 경계선 대비 확인
    assert.match(theme, /:not\(\[data-color-mode="dark"\]\)\[data-responsive-page="community"\] \.platform-section[^{]*\{[^}]*--platform-border: color-mix/); // 커뮤니티 플랫폼 경계선 확인
    assert.match(theme, /:not\(\[data-color-mode="dark"\]\)\[data-responsive-page="community"\] \.media-card[^{]*\{[^}]*border-color: var\(--pl-border-strong\)/); // 커뮤니티 영상 카드 확인
    assert.match(theme, /:not\(\[data-color-mode="dark"\]\) \.game-load-more[^{]*\{[^}]*border-color: var\(--pl-link\)/); // 더 보기 버튼 확인
}); // 테스트 끝
