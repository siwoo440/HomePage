import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { GAME_PROJECTS, SPECIAL_PROJECT_IDS } from "../public/game-projects.mjs"; // 프로젝트 공개 데이터
import { resolveProjectView } from "../public/project-page.mjs"; // 프로젝트 화면 도구
import { renderProjectHtml } from "../scripts/generate-project-pages.mjs"; // 페이지 생성 도구

test("공통 프로젝트는 공개 소개 문서만 생성한다", () => // 공통 페이지 생성 테스트
{ // 테스트 시작
    const project = GAME_PROJECTS.find((item) => item.id === "project-e"); // 준비 중 프로젝트 조회
    const html = renderProjectHtml(project); // 공개 HTML 생성
    assert.match(html, /data-public-project-page/); // 공개 루트 확인
    assert.match(html, /data-project-mode="planning"/); // 준비 중 상태 확인
    assert.doesNotMatch(html, /기획서|기획 초안|메인 아카이브|기획 준비 중/); // 내부 문구 제거 확인
    assert.match(html, /새로운 정보가 준비되는 대로 공개됩니다/); // 공개 안내 확인
}); // 테스트 끝

test("생성기는 같은 입력에 같은 문서를 반환한다", () => // 결정적 생성 테스트
{ // 테스트 시작
    const project = GAME_PROJECTS.find((item) => item.id === "project-a"); // 소개 프로젝트 조회
    assert.equal(renderProjectHtml(project), renderProjectHtml(project)); // 동일 결과 확인
}); // 테스트 끝

test("알 수 없는 프로젝트는 안전한 복귀 화면을 반환한다", () => // 누락 화면 테스트
{ // 테스트 시작
    const view = resolveProjectView(null); // 누락 화면 계산
    assert.equal(view.mode, "missing"); // 누락 모드 확인
    assert.equal(view.title, "프로젝트를 찾을 수 없습니다"); // 누락 제목 확인
    assert.equal(view.returnPath, "/main.html#games"); // 안전 복귀 주소 확인
}); // 테스트 끝

test("공통 문서는 필수 공통 자원을 한 번씩 사용한다", () => // 공통 자원 테스트
{ // 테스트 시작
    const project = GAME_PROJECTS.find((item) => item.id === "project-a"); // 소개 프로젝트 조회
    const html = renderProjectHtml(project); // 공개 HTML 생성
    const resources = ["project-page.css", "responsive-shell.css", "device-preview-control.css", "project-page.mjs", "responsive-nav.mjs", "privacy-consent.mjs", "site-analytics.mjs"]; // 필수 자원 목록
    for (const resource of resources) // 자원 반복
    { // 반복 시작
        assert.equal((html.match(new RegExp(resource.replace(".", "\\."), "g")) ?? []).length, 1); // 자원 한 번 확인
    } // 반복 끝
    assert.equal(fs.existsSync(`public${project.heroImage}`), true); // 대표 이미지 확인
}); // 테스트 끝

const specialProjects = [ // 특화 프로젝트 목록
    { id: "project-b", path: "public/project_b/ProjectB_Main.html", selector: 'id="archiveGrid"' }, // 프로젝트 B 계약
    { id: "project-c", path: "public/project_c/ProjectC_Main.html", selector: 'href="ProjectC_Cards.html"' }, // 프로젝트 C 계약
    { id: "project-d", path: "public/project_d/ProjectD_Main.html", selector: 'href="characters.html"' }, // 프로젝트 D 계약
    { id: "project-h", path: "public/project_h/ProjectH_Main.html", selector: 'data-adult-project="true"' }, // 프로젝트 H 계약
    { id: "project-l", path: "public/project_l/ProjectL_Main.html", selector: 'id="combatSlideCard"' }, // 프로젝트 L 계약
    { id: "project-eta", path: "public/project_eta/ProjectEta_Main.html", selector: 'id="invitation-intro"' }, // 프로젝트 에타 계약
]; // 특화 프로젝트 목록 끝

test("특화 프로젝트는 공개 페이지 계약과 고유 기능을 유지한다", () => // 특화 페이지 계약 테스트
{ // 테스트 시작
    for (const project of specialProjects) // 특화 프로젝트 반복
    { // 반복 시작
        const html = fs.readFileSync(project.path, "utf8"); // 특화 페이지 읽기
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ""; // 브라우저 제목 추출
        assert.doesNotMatch(title, /기획서|기획 초안|메인 아카이브/); // 내부 제목 제거 확인
        assert.match(html, new RegExp(`data-project-id="${project.id}"`)); // 프로젝트 식별자 확인
        assert.match(html, /data-public-project-page/); // 공개 페이지 표시 확인
        assert.match(html, /\/responsive-shell\.css/); // 반응형 스타일 확인
        assert.match(html, /\/responsive-nav\.mjs/); // 반응형 메뉴 확인
        assert.match(html, /\/privacy-consent\.mjs/); // 개인정보 모듈 확인
        assert.match(html, new RegExp(project.selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))); // 고유 기능 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 에타 공개 화면은 내부 기획 문구를 노출하지 않는다", () => // 에타 공개 문구 테스트
{ // 테스트 시작
    const html = fs.readFileSync("public/project_eta/ProjectEta_Main.html", "utf8"); // 에타 페이지 읽기
    assert.doesNotMatch(html, />기획 초안</); // 내부 단계 문구 제거 확인
    assert.match(html, /id="fusion-tree"/); // 합성 도감 유지 확인
}); // 테스트 끝

test("공개 프로젝트 35개는 올바른 공통·특화 페이지로 구분된다", () => // 최종 공개 범위 테스트
{ // 테스트 시작
    assert.equal(GAME_PROJECTS.length, 35); // 공개 프로젝트 수 확인
    assert.equal(GAME_PROJECTS.filter((project) => project.layout === "common").length, 29); // 공통 페이지 수 확인
    assert.deepEqual(GAME_PROJECTS.filter((project) => project.layout === "special").map((project) => project.id), SPECIAL_PROJECT_IDS); // 특화 페이지 목록 확인
    for (const project of GAME_PROJECTS) // 공개 프로젝트 반복
    { // 반복 시작
        const filePath = `public${project.detailPath}`; // 공개 파일 경로 생성
        const html = fs.readFileSync(filePath, "utf8"); // 공개 페이지 읽기
        const title = html.match(/<title>([^<]+)<\/title>/)?.[1] ?? ""; // 공개 제목 추출
        assert.equal(fs.existsSync(filePath), true); // 공개 파일 존재 확인
        assert.doesNotMatch(title, /기획서|기획 초안|메인 아카이브/); // 내부 문서형 제목 차단
        assert.match(html, /\/responsive-shell\.css/); // 공통 반응형 스타일 확인
        assert.match(html, /\/responsive-nav\.mjs/); // 공통 반응형 메뉴 확인
    } // 반복 끝
}); // 테스트 끝

test("메인 카드 35개 상세 주소와 성인 보호 경로가 공개 데이터와 일치한다", () => // 주소와 성인 보호 테스트
{ // 테스트 시작
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    const proxySource = fs.readFileSync("proxy.ts", "utf8"); // 성인 보호 경로 읽기
    for (const project of GAME_PROJECTS) // 공개 프로젝트 반복
    { // 반복 시작
        const relativePath = project.detailPath.slice(1); // 메인 기준 상세 주소
        assert.match(mainHtml, new RegExp(relativePath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))); // 메인 카드 주소 확인
        assert.equal(fs.existsSync(`public/${relativePath}`), true); // 상세 파일 존재 확인
        if (project.adultOnly) // 성인 프로젝트 확인
        { // 조건 시작
            const protectedDirectory = project.detailPath.slice(0, project.detailPath.lastIndexOf("/") + 1); // 보호 디렉터리 추출
            assert.match(proxySource, new RegExp(`${protectedDirectory.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:path\\*`)); // 성인 경로 보호 확인
        } // 조건 끝
    } // 반복 끝
}); // 테스트 끝

test("공통 소개 페이지는 이미지 설명과 제목과 키보드 링크를 제공한다", () => // 공통 접근성 테스트
{ // 테스트 시작
    for (const project of GAME_PROJECTS.filter((item) => item.layout === "common")) // 공통 프로젝트 반복
    { // 반복 시작
        const html = fs.readFileSync(`public${project.detailPath}`, "utf8"); // 공통 페이지 읽기
        assert.match(html, /<img[^>]+alt="[^"]+"/); // 이미지 대체 설명 확인
        assert.match(html, /<h1[^>]*>[^<]+<\/h1>/); // 페이지 제목 확인
        assert.match(html, /<a[^>]+href="\/main\.html#games"/); // 키보드 링크 확인
    } // 반복 끝
}); // 테스트 끝
