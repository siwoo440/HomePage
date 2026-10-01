import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구

const SCRIPT_HANDLED_ANCHORS = new Set(["/main.html#contact"]); // 공통 메뉴 스크립트가 여는 주소

function listHtmlFiles(directory) // 공개 HTML 목록 수집
{ // 함수 시작
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 폴더 항목 반복
    { // 반복 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로
        if (entry.isDirectory()) // 하위 폴더 확인
        { // 조건 시작
            return listHtmlFiles(entryPath); // 하위 HTML 수집
        } // 조건 끝
        return entryPath.endsWith(".html") ? [entryPath] : []; // HTML 파일만 선택
    }); // 반복 끝
} // 함수 끝

function readIds(filePath) // 문서 식별자 목록 읽기
{ // 함수 시작
    return new Set([...fs.readFileSync(filePath, "utf8").matchAll(/\sid="([^"]+)"/g)].map((match) => match[1])); // 식별자 집합 반환
} // 함수 끝

test("공개 HTML의 내부 앵커 링크는 실제 섹션을 가리킨다", () => // 앵커 연결 계약
{ // 테스트 시작
    const broken = []; // 깨진 앵커 목록
    for (const filePath of listHtmlFiles("public")) // 공개 HTML 반복
    { // 반복 시작
        const html = fs.readFileSync(filePath, "utf8"); // 문서 읽기
        for (const [, file, hash] of html.matchAll(/href="([^"#:]*)#([^"]+)"/g)) // 앵커 링크 반복
        { // 반복 시작
            if (SCRIPT_HANDLED_ANCHORS.has(`${file}#${hash}`)) // 스크립트 처리 주소 확인
            { // 조건 시작
                continue; // 검사 제외
            } // 조건 끝
            const target = file === "" ? filePath : file.startsWith("/") ? path.join("public", file) : path.join(path.dirname(filePath), file); // 대상 문서 경로
            if (!fs.existsSync(target) || !readIds(target).has(hash)) // 대상 섹션 존재 확인
            { // 조건 시작
                broken.push(`${filePath}: ${file}#${hash}`); // 깨진 앵커 기록
            } // 조건 끝
        } // 반복 끝
    } // 반복 끝
    assert.deepEqual(broken, []); // 깨진 앵커 없음 확인
}); // 테스트 끝

test("메인 개발 뉴스 읽기 링크는 존재하는 시연 상세 화면으로 이동한다", () => // 메인 뉴스 링크 계약
{ // 테스트 시작
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    const demoPosts = fs.readFileSync("lib/news/demo-posts.ts", "utf8"); // 시연 뉴스 데이터 읽기
    const links = [...mainHtml.matchAll(/<a href="([^"]+)" class="devlog-read">/g)].map((match) => match[1]); // 읽기 링크 목록
    assert.equal(links.length, 4); // 읽기 링크 수 확인
    for (const link of links) // 읽기 링크 반복
    { // 반복 시작
        const id = link.match(/^\/news\/(demo-[\w-]+)$/)?.[1]; // 시연 뉴스 식별자
        assert.ok(id, `${link} 상세 주소 형식 오류`); // 상세 주소 형식 확인
        assert.match(demoPosts, new RegExp(`id: "${id}"`)); // 시연 뉴스 존재 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 L 튜토리얼 이미지는 불러오기 실패 시 대체 화면을 표시한다", () => // 이미지 대체 화면 계약
{ // 테스트 시작
    const html = fs.readFileSync("public/project_l/ProjectL_Main.html", "utf8"); // 프로젝트 L 문서
    const script = fs.readFileSync("public/project_l/ProjectL_Script.js", "utf8"); // 프로젝트 L 스크립트
    const css = fs.readFileSync("public/project_l/ProjectL_Style.css", "utf8"); // 프로젝트 L 스타일
    assert.match(html, /id="combatImageFallback"[^>]*hidden/); // 기본 숨김 대체 화면 확인
    assert.match(script, /combatImage\.addEventListener\("error"/); // 실패 이벤트 연결 확인
    assert.match(script, /combatImage\.addEventListener\("load"/); // 성공 이벤트 연결 확인
    assert.ok(script.indexOf("connectCombatImageFallback();") < script.indexOf("renderCombatSlide();")); // 첫 이미지 전 연결 확인
    assert.match(css, /\.combat-image-box img\[hidden\]/); // 숨김 이미지 스타일 확인
}); // 테스트 끝

test("관리자 뉴스 삭제는 확인 후 실행하고 실패를 별도로 안내한다", () => // 뉴스 삭제 계약
{ // 테스트 시작
    const page = fs.readFileSync("app/admin/news/page.tsx", "utf8"); // 뉴스 관리 화면
    const button = fs.readFileSync("app/admin/news/delete-news-button.tsx", "utf8"); // 삭제 확인 버튼
    const actions = fs.readFileSync("app/admin/news/actions.ts", "utf8"); // 뉴스 서버 액션
    assert.match(page, /<DeleteNewsButton \/>/); // 확인 버튼 사용 확인
    assert.match(button, /window\.confirm\(/); // 삭제 확인 창 확인
    assert.match(button, /event\.preventDefault\(\)/); // 취소 시 제출 차단 확인
    assert.match(actions, /deleteResult\.error \? "delete-error" : "deleted"/); // 실패 상태 분리 확인
    assert.match(page, /"delete-error":/); // 실패 안내 문구 확인
}); // 테스트 끝

test("없는 주소는 사이트 메뉴로 돌아갈 수 있는 404 화면을 표시한다", () => // 없는 페이지 계약
{ // 테스트 시작
    const page = fs.readFileSync("app/not-found.tsx", "utf8"); // 없는 페이지 화면
    assert.match(page, /페이지를 찾을 수 없습니다/); // 안내 제목 확인
    assert.match(page, /href="\/main\.html"/); // 메인 이동 확인
    assert.match(page, /href="\/main\.html#games"/); // 게임 목록 이동 확인
    assert.match(page, /href="\/devlog\.html"/); // 개발 뉴스 이동 확인
    assert.match(page, /index: false/); // 검색 색인 제외 확인
}); // 테스트 끝

test("메인 배경 파티클은 움직임 줄이기 설정에서 정지한다", () => // 파티클 움직임 계약
{ // 테스트 시작
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    const particleScript = mainHtml.slice(mainHtml.indexOf("파티클 배경 애니메이션"), mainHtml.indexOf("스크롤 시 네비게이션")); // 파티클 스크립트 구간
    assert.match(particleScript, /matchMedia\('\(prefers-reduced-motion: reduce\)'\)/); // 움직임 설정 조회 확인
    assert.match(particleScript, /drawParticles\(false\)/); // 정지 화면 그리기 확인
    assert.match(particleScript, /particleFrame = null/); // 애니메이션 중지 확인
}); // 테스트 끝
