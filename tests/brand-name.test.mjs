import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { renderSiteHeader } from "../scripts/site-header.mjs"; // 공통 헤더 생성 도구

const SOURCE_ROOTS = ["public", "app", "lib", "scripts"]; // 방문자 화면에 쓰이는 폴더
const TEXT_FILE = /\.(html|css|mjs|js|ts|tsx|json|svg|txt|xml)$/i; // 검사할 글자 파일

function listTextFiles(directory) // 글자 파일 목록
{ // 함수 시작
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 항목 반복
    { // 반복 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로
        return entry.isDirectory() ? listTextFiles(entryPath) : TEXT_FILE.test(entry.name) ? [entryPath] : []; // 글자 파일 선택
    }); // 반복 끝
} // 함수 끝

test("화면 소스에 예전 회사 이름 표기가 남아 있지 않다", () => // 예전 이름 재발 방지
{ // 테스트 시작
    for (const file of SOURCE_ROOTS.flatMap((root) => listTextFiles(root))) // 소스 파일 반복
    { // 반복 시작
        const visibleName = fs.readFileSync(file, "utf8").replace(/DEVFORGE_/g, ""); // 내부 상수 이름 제외
        assert.doesNotMatch(visibleName, /DEVFORGE/, `${file} 예전 회사 이름`); // 예전 이름 미사용 확인
    } // 반복 끝
}); // 테스트 끝

test("회사 이름은 Palettra Games, 로고는 PALETTRA, 해시태그는 #PalettraGames로 표기한다", () => // 새 이름 표기 계약
{ // 테스트 시작
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서
    const layout = fs.readFileSync("app/layout.tsx", "utf8"); // Next 공통 틀
    const games = fs.readFileSync("lib/community/games.ts", "utf8"); // 커뮤니티 게임 목록
    assert.match(renderSiteHeader({ current: "games" }), /class="nav-logo">PALETTRA<\/a>/); // 공통 헤더 로고 확인
    assert.match(fs.readFileSync("app/site-header.tsx", "utf8"), /className="nav-logo">PALETTRA<\/a>/); // Next 헤더 로고 확인
    assert.match(mainHtml, /<title>Palettra Games — 인디 게임 스튜디오<\/title>/); // 메인 제목 확인
    assert.match(mainHtml, /property="og:site_name" content="Palettra Games"/); // 공유 사이트 이름 확인
    assert.match(layout, /siteName: "Palettra Games"/); // Next 공유 사이트 이름 확인
    assert.match(games, /hashtag: "#PalettraGamesProjectA"/); // 게임 해시태그 확인
    assert.match(fs.readFileSync("public/community.html", "utf8"), /<strong id="active-hashtag"[^>]*>#PalettraGames<\/strong>/); // 기본 해시태그 확인
}); // 테스트 끝

test("방문자 저장 데이터가 이어지도록 내부 저장 키 이름은 유지한다", () => // 내부 이름 유지 계약
{ // 테스트 시작
    assert.match(fs.readFileSync("public/responsive-nav.mjs", "utf8"), /COLOR_MODE_STORAGE_KEY = "devforge-color-mode"/); // 색상 모드 저장 키 유지 확인
    assert.match(fs.readFileSync("public/site-experience.mjs", "utf8"), /devforge_favorite_projects_v1/); // 관심 목록 저장 키 유지 확인
}); // 테스트 끝
