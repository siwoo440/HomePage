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
        for (const pattern of [/<meta name="description" content="[^"]{10,}">/, /property="og:title" content="[^"]+"/, /property="og:description" content="[^"]+"/, /property="og:type" content="website"/, /property="og:site_name" content="Palettra Games"/]) // 필수 태그 반복
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
    assert.match(newsPage, /<CommentsPanel newsId=\{post\.id\} demoMode=\{commentsDemoMode\} \/>/); // 시연·실제 모드 댓글 연결 확인
    assert.doesNotMatch(newsPage, /data-comments-closed/); // 준비 안내 제거 확인
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

test("커뮤니티 소개는 가운데, 해시태그 복사는 태그 오른쪽, 플랫폼은 한 줄에 하나씩 배치한다", () => // 커뮤니티 배치 계약
{ // 테스트 시작
    const html = fs.readFileSync("public/community.html", "utf8"); // 커뮤니티 문서
    const css = fs.readFileSync("public/community.css", "utf8"); // 커뮤니티 스타일
    assert.match(css, /\.community-hero \/\* 커뮤니티 소개 \*\/\s*\{[^}]*justify-items: center;[^}]*text-align: center;/); // 소개 가운데 정렬 확인
    assert.match(html, /<div class="active-tag-row">\s*<!--[^>]*-->\s*<strong id="active-hashtag"( data-i18n-skip)?>[^<]*<\/strong>[^\n]*\n\s*<button class="hashtag-copy-button"/); // 태그와 버튼 같은 줄 구조 확인
    assert.match(css, /\.active-tag-row[^{]*\{[^}]*display: flex;[^}]*align-items: center;[^}]*justify-content: space-between;/); // 태그 왼쪽 버튼 오른쪽 확인
    assert.match(css, /\.platform-stack \/\* 플랫폼 전체 묶음 \*\/\s*\{[^}]*grid-template-columns: minmax\(0, 1fr\)/); // 플랫폼 한 줄 하나 확인
    assert.match(css, /\.hashtag-copy-button \/\* 해시태그 복사 버튼 \*\/\s*\{[^}]*height: 1\.65rem;/); // 복사 버튼 글자 높이 확인
    assert.match(fs.readFileSync("public/playful-lab-theme.css", "utf8"), /\[data-responsive-page="community"\] \.hashtag-copy-button[^{]*\{[^}]*min-height: 0;/); // 공통 버튼 최소 높이 해제 확인
}); // 테스트 끝

test("개발 뉴스 소개와 필터는 카드 안쪽 여백을 두고 버튼과 개수를 한 줄에 배치한다", () => // 뉴스 상단 배치 계약
{ // 테스트 시작
    const css = fs.readFileSync("public/devlog.css", "utf8"); // 공통 하위 페이지 스타일
    assert.match(css, /\.site-header \/\* 상단 소개 \*\/\s*\{[^}]*padding: 0 clamp\(/); // 소개 안쪽 여백 확인
    assert.match(css, /\.filter-panel \/\* 필터 영역 \*\/\s*\{[^}]*padding: clamp\([^;]*\) clamp\(/); // 필터 안쪽 여백 확인
    assert.match(css, /\.filter-panel > div:first-child[^{]*\{[^}]*grid-column: 1 \/ -1;/); // 필터 제목 한 줄 확인
    assert.match(css, /\.result-count \/\* 결과 개수 \*\/\s*\{(?![^}]*Consolas)[^}]*white-space: nowrap;/); // 개수 문구 자연 글꼴 확인
}); // 테스트 끝

function contrastRatio(foreground, background) // 두 색 대비율 계산
{ // 함수 시작
    const luminance = (rgb) => rgb.map((value) => value / 255).map((value) => value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0); // 상대 휘도
    const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a); // 밝은 색과 어두운 색
    return (light + 0.05) / (dark + 0.05); // 대비율 반환
} // 함수 끝

function readBorderColor(file, token) // 경계선 토큰 색 읽기
{ // 함수 시작
    const value = fs.readFileSync(file, "utf8").match(new RegExp(`${token}:\s*([^;]+);`))?.[1].trim() ?? ""; // 토큰 값
    const hex = value.match(/^#([0-9a-f]{6})$/i)?.[1]; // 16진수 값
    if (hex) // 불투명 색 확인
    { // 조건 시작
        return { rgb: [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)), alpha: 1 }; // 불투명 색 반환
    } // 조건 끝
    const [r, g, b, alpha] = value.match(/rgba\(([^)]+)\)/)?.[1].split(",").map(Number) ?? []; // 반투명 색 분해
    return { rgb: [r, g, b], alpha }; // 반투명 색 반환
} // 함수 끝

test("게임 소개 페이지 경계선은 카드 배경과 2:1 이상으로 구분된다", () => // 상세 경계선 대비 계약
{ // 테스트 시작
    const pages = // 페이지별 경계선과 카드 배경
    [ // 목록 시작
        ["public/project-page.css", "--project-line", [13, 25, 45]], // 공통 28개 페이지
        ["public/project_b/ProjectB_Style.css", "--line", [13, 17, 34]], // 프로젝트 B
        ["public/project_c/ProjectC_style.css", "--line", [30, 25, 21]], // 프로젝트 C
        ["public/project_d/style.css", "--line", [16, 29, 44]], // 프로젝트 D
        ["public/project_h/ProjectH_Style.css", "--line", [17, 16, 38]], // 프로젝트 H
        ["public/project_l/ProjectL_Style.css", "--line", [20, 23, 42]], // 프로젝트 L
        ["public/project_eta/ProjectEta_Style.css", "--line-dark", [17, 19, 24]], // 프로젝트 η 어두운 영역
        ["public/project_eta/ProjectEta_Style.css", "--line-light", [238, 233, 220]], // 프로젝트 η 밝은 영역
    ]; // 목록 끝
    for (const [file, token, background] of pages) // 페이지 반복
    { // 반복 시작
        const { rgb, alpha } = readBorderColor(file, token); // 경계선 색
        const blended = rgb.map((value, index) => Math.round(value * alpha + background[index] * (1 - alpha))); // 배경 위 실제 색
        assert.ok(contrastRatio(blended, background) >= 2, `${file} ${token} 대비 부족`); // 2:1 이상 확인
    } // 반복 끝
}); // 테스트 끝

test("휴대폰에서 해시태그 복사 버튼은 보이는 크기를 유지하고 누르는 영역만 44px로 넓힌다", () => // 터치 영역 계약
{ // 테스트 시작
    const css = fs.readFileSync("public/community.css", "utf8"); // 커뮤니티 스타일
    const mobile = css.match(/@media \(max-width: 767px\) \/\* 휴대폰 화면 \*\/[\s\S]*?\} \/\* 구간 끝 \*\//)?.[0] ?? ""; // 휴대폰 구간
    assert.match(mobile, /\.hashtag-copy-button::before[^{]*\{[^}]*height: 44px;/); // 44px 터치 영역 확인
    assert.match(css, /\.hashtag-copy-button \/\* 해시태그 복사 버튼 \*\/\s*\{[^}]*height: 1\.65rem;/); // 보이는 높이 유지 확인
}); // 테스트 끝

test("관리자 화면도 공통 상단 헤더를 쓰고 고정 헤더 높이만큼 내용을 내린다", () => // 관리자 헤더 계약
{ // 테스트 시작
    const layout = fs.readFileSync("app/admin/layout.tsx", "utf8"); // 관리자 화면 틀
    const css = fs.readFileSync("app/admin/admin.css", "utf8"); // 관리자 스타일
    assert.match(layout, /<SiteHeader \/>/); // 공통 헤더 사용 확인
    assert.match(css, /\.admin-shell \/\* 관리자 전체 영역 \*\/\s*\{[^}]*padding-top: 70px;/); // 관리자 내용 위치 확인
    assert.match(css, /\.admin-login-shell \/\* 로그인 전체 영역 \*\/\s*\{[^}]*padding-top: calc\(70px \+ 48px\);/); // 관리자 로그인 위치 확인
}); // 테스트 끝

test("게임 소개와 Next 화면의 제목은 페이지 이름과 회사 이름을 함께 쓴다", () => // 페이지 제목 형식 검사
{ // 테스트 시작
    const gameFiles = fs.readdirSync("public", { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")).flatMap((entry) => fs.readdirSync(path.join("public", entry.name)).filter((name) => name.endsWith(".html")).map((name) => path.join("public", entry.name, name))); // 게임 소개 화면 목록
    assert.equal(gameFiles.length, 38); // 첫 화면 35개와 추가 화면 3개
    for (const file of gameFiles) // 게임 소개 화면 반복
    { // 반복 시작
        const html = fs.readFileSync(file, "utf8"); // 화면 원문
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ""; // 브라우저 제목
        assert.match(title, /^.+ · Palettra Games$/, `${file} 제목 형식`); // 이름과 회사 이름 형식
        assert.doesNotMatch(title, /\| 게임 소개|^Project /, `${file} 예전 제목 형식`); // 예전 형식 재발 방지
        assert.ok(html.includes(`property="og:title" content="${title}"`), `${file} 공유 제목 불일치`); // 공유 제목과 일치
    } // 반복 끝
    for (const [file, title] of [["app/login/page.tsx", "로그인"], ["app/age-verification/page.tsx", "성인 확인"], ["app/admin/login/page.tsx", "관리자 로그인"]]) // 고정 제목 화면 반복
    { // 반복 시작
        assert.ok(fs.readFileSync(file, "utf8").includes(`export const metadata: Metadata = { title: "${title} · Palettra Games" };`), `${file} 제목 누락`); // 페이지별 제목 확인
    } // 반복 끝
    const newsPage = fs.readFileSync("app/news/[id]/page.tsx", "utf8"); // 뉴스 상세 원문
    assert.match(newsPage, /export async function generateMetadata/); // 글마다 제목 정보 생성
    assert.match(newsPage, /const title = `\$\{post\.title\} · Palettra Games`;/); // 글 제목을 넣은 브라우저 제목
    assert.match(newsPage, /const loadNewsPost = cache\(/); // 제목 정보와 화면이 같은 조회 결과 사용
}); // 테스트 끝

test("공통 형식 게임 소개는 한글을 단어 단위로 줄바꿈한다", () => // 줄바꿈 규칙 검사
{ // 테스트 시작
    const css = fs.readFileSync("public/project-page.css", "utf8"); // 공통 게임 소개 스타일
    const mainRule = css.match(/\nmain \/\* 주요 내용 \*\/\s*\{[^}]+\}/)?.[0] ?? ""; // 본문 영역 규칙
    assert.match(mainRule, /word-break: keep-all;/); // 단어 중간 줄바꿈 방지
    assert.match(mainRule, /overflow-wrap: break-word;/); // 긴 문자열 넘침 방지
}); // 테스트 끝
