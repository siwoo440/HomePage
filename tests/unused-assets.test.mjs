import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구

const PUBLIC_ROOT = "public"; // 공개 파일 폴더

function readPublicFile(relativePath) // 공개 파일 읽기
{ // 함수 시작
    return fs.readFileSync(path.join(PUBLIC_ROOT, relativePath), "utf8"); // 파일 내용 반환
} // 함수 끝

function listProjectDirectories() // 프로젝트 폴더 목록
{ // 함수 시작
    return fs.readdirSync(PUBLIC_ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")).map((entry) => entry.name); // 프로젝트 폴더 이름 반환
} // 함수 끝

test("프로젝트 폴더의 스크립트·스타일 파일은 모두 같은 폴더 HTML에서 연결된다", () => // 미사용 자원 검사
{ // 테스트 시작
    for (const directory of listProjectDirectories()) // 프로젝트 폴더 반복
    { // 반복 시작
        const names = fs.readdirSync(path.join(PUBLIC_ROOT, directory)); // 폴더 파일 목록
        const htmlText = names.filter((name) => name.endsWith(".html")).map((name) => readPublicFile(path.join(directory, name))).join("\n"); // 폴더 HTML 내용
        for (const asset of names.filter((name) => /_(script\.js|style\.css)$/i.test(name))) // 전용 자원 반복
        { // 반복 시작
            assert.ok(htmlText.includes(asset), `${directory}/${asset} 미연결 파일`); // 연결 여부 확인
        } // 반복 끝
    } // 반복 끝
}); // 테스트 끝

test("어디에서도 불러오지 않던 공통 style.css·script.js가 남아 있지 않다", () => // 예전 공통 자원 검사
{ // 테스트 시작
    assert.equal(fs.existsSync(path.join(PUBLIC_ROOT, "style.css")), false); // 예전 공통 스타일 제거 확인
    assert.equal(fs.existsSync(path.join(PUBLIC_ROOT, "script.js")), false); // 예전 공통 스크립트 제거 확인
}); // 테스트 끝

test("공통 헤더로 대체된 예전 헤더 규칙이 남아 있지 않다", () => // 예전 헤더 규칙 검사
{ // 테스트 시작
    const mainStyle = readPublicFile("main.html").match(/<style>([\s\S]*?)<\/style>/)?.[1] ?? ""; // 메인 인라인 스타일
    const legacyHeader = /^\s*\.(nav-logo|nav-menu|nav-actions|btn-nav|news-shortcut|member-login-link|top-nav)\b/m; // 예전 헤더 선택자
    assert.doesNotMatch(mainStyle, legacyHeader); // 메인 예전 헤더 제거 확인
    assert.doesNotMatch(mainStyle, /^\s*\.(modal-|legal-)/m); // 메인 미사용 모달 스타일 제거 확인
    assert.match(mainStyle, /\.navbar \/\* 공통 헤더 배경 전환 \*\/\s*\{[^}]*transition: all 0\.3s ease;[^}]*\}/); // 스크롤 배경 전환 유지 확인
    assert.doesNotMatch(readPublicFile("devlog.css"), legacyHeader); // 뉴스 스타일 예전 헤더 제거 확인
    assert.doesNotMatch(readPublicFile("devlog.css"), /^\s*\.(navbar|brand|back-link)\b/m); // 뉴스 스타일 예전 메뉴 제거 확인
    assert.doesNotMatch(readPublicFile("project-page.css"), /\.project-(nav|logo|button)/); // 공개 소개 예전 메뉴 제거 확인
}); // 테스트 끝

test("프로젝트 B·L에는 연결 대상이 없는 예전 메뉴 코드가 없다", () => // 예전 메뉴 코드 검사
{ // 테스트 시작
    for (const [script, style] of [["project_b/ProjectB_Script.js", "project_b/ProjectB_Style.css"], ["project_l/ProjectL_Script.js", "project_l/ProjectL_Style.css"]]) // 프로젝트 반복
    { // 반복 시작
        assert.doesNotMatch(readPublicFile(script), /menuToggle|topNav|connectMenu/, script); // 예전 메뉴 스크립트 제거 확인
        assert.doesNotMatch(readPublicFile(style), /\.(top-header|brand-logo|top-nav|menu-toggle)\b/, style); // 예전 메뉴 스타일 제거 확인
    } // 반복 끝
}); // 테스트 끝

test("사용하는 화면이 없는 대화상자 스타일이 공통·페이지 스타일에 남아 있지 않다", () => // 대화상자 잔여 스타일 검사
{ // 테스트 시작
    const unusedDialog = /\.(modal-box|modal-overlay|contact-dialog|dialog-link|dialog-close)\b/; // 미사용 대화상자 선택자
    for (const file of ["responsive-shell.css", "playful-lab-theme.css", "devlog.css"]) // 스타일 반복
    { // 반복 시작
        assert.doesNotMatch(readPublicFile(file), unusedDialog, file); // 잔여 대화상자 스타일 제거 확인
    } // 반복 끝
    assert.match(readPublicFile("responsive-shell.css"), /body\.dialog-open/); // 보관 모듈용 스크롤 잠금 유지 확인
}); // 테스트 끝

test("공통 헤더로 대체된 예전 프로젝트 메뉴 지원 코드가 남아 있지 않다", () => // 예전 프로젝트 메뉴 검사
{ // 테스트 시작
    for (const file of ["responsive-shell.css", "responsive-nav.mjs"]) // 공통 메뉴 파일 반복
    { // 반복 시작
        assert.doesNotMatch(readPublicFile(file), /project-nav|nav-cta|eta-brand/, file); // 예전 메뉴 지원 제거 확인
    } // 반복 끝
    assert.doesNotMatch(readPublicFile("project_eta/ProjectEta_Style.css"), /\.(eta-nav|eta-brand|nav-cta)\b/); // 에타 예전 헤더 제거 확인
}); // 테스트 끝

test("쓰는 곳이 없던 템플릿 잔여 파일과 의존성이 남아 있지 않다", () => // 템플릿 잔여물 검사
{ // 테스트 시작
    for (const leftover of ["placeholder-logo.png", "placeholder-logo.svg", "placeholder-user.jpg", "placeholder.jpg", "project_d/README.txt"]) // 지운 공개 파일 반복
    { // 반복 시작
        assert.equal(fs.existsSync(path.join(PUBLIC_ROOT, leftover)), false, `${leftover} 다시 추가됨`); // 재등장 여부 확인
    } // 반복 끝
    assert.equal(fs.existsSync(path.join(PUBLIC_ROOT, "placeholder.svg")), true); // 상품 이미지 대체 그림은 유지
    assert.match(readPublicFile("goods-card.mjs"), /"\/placeholder\.svg"/); // 대체 그림을 쓰는 곳 확인
    assert.equal(fs.existsSync("scripts/optimize_goods_images.py"), false); // 원본이 없어 다시 쓸 수 없는 변환 도구 제거 확인
    const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8")); // 패키지 설정
    for (const name of ["@vercel/analytics", "shadcn", "tw-animate-css"]) // 지운 의존성 반복
    { // 반복 시작
        assert.equal(name in { ...packageJson.dependencies, ...packageJson.devDependencies }, false, `${name} 다시 추가됨`); // 의존성 재등장 여부 확인
    } // 반복 끝
    const globalsCss = fs.readFileSync("app/globals.css", "utf8"); // Next 화면 전역 스타일
    assert.doesNotMatch(globalsCss, /tw-animate-css|shadcn|--sidebar|--chart-|\.dark\b/); // 쓰지 않는 템플릿 값 제거 확인
    assert.match(globalsCss, /@import 'tailwindcss';/); // 기본 초기화 스타일 유지 확인
}); // 테스트 끝
