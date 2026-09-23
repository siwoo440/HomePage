import assert from "node:assert/strict"; // 엄격 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMUNITY_GAMES, COMMUNITY_PLATFORMS, createDemoItems } from "../public/community-data.mjs"; // 화면 데이터 설정
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 공개 프로젝트 데이터
import { buildCommunityUrl, resolveGameSelection, selectDemoContent } from "../public/community.mjs"; // 화면 상태 도구

const rootUrl = new URL("../", import.meta.url); // 프로젝트 루트 주소

async function readProjectFile(path) // 프로젝트 파일 읽기
{ // 함수 시작
    return readFile(new URL(path, rootUrl), "utf8"); // UTF-8 내용 반환
} // 함수 끝

test("커뮤니티 페이지는 공통 헤더와 게임 선택기를 제공한다", async () => // 상단 구조 검증
{ // 테스트 시작
    const html = await readProjectFile("public/community.html"); // 커뮤니티 문서 읽기
    assert.match(html, /class="navbar"/); // 공통 헤더 확인
    assert.match(html, /href="community\.html" aria-current="page"/); // 현재 메뉴 확인
    assert.match(html, /id="game-filter"/); // 게임 선택기 확인
    assert.match(html, /id="active-hashtag"/); // 해시태그 표시 확인
    assert.match(html, /aria-live="polite"/); // 상태 안내 확인
    assert.match(html, /type="module" src="community\.mjs"/); // 화면 기능 연결 확인
}); // 테스트 끝

test("여섯 플랫폼 영역과 직접 이동 지점을 제공한다", async () => // 플랫폼 구조 검증
{ // 테스트 시작
    const html = await readProjectFile("public/community.html"); // 커뮤니티 문서 읽기
    const platforms = ["discord", "youtube", "x", "instagram", "facebook", "tiktok"]; // 플랫폼 목록

    for (const platform of platforms) // 플랫폼 순회
    { // 반복 시작
        assert.match(html, new RegExp(`id="${platform}"`)); // 영역 식별자 확인
        assert.match(html, new RegExp(`data-platform="${platform}"`)); // 플랫폼 데이터 확인
    } // 반복 끝

    assert.doesNotMatch(html, /href="#"/); // 빈 외부 링크 차단 확인
}); // 테스트 끝

test("플랫폼별 연한 배경과 모바일 한 열 구성을 제공한다", async () => // 시각 구분 검증
{ // 테스트 시작
    const css = await readProjectFile("public/community.css"); // 커뮤니티 스타일 읽기
    assert.match(css, /--discord-surface:\s*rgba\(88,\s*101,\s*242,\s*0\.09\)/); // 디스코드 배경 확인
    assert.match(css, /--youtube-surface:\s*rgba\(255,\s*0,\s*0,\s*0\.07\)/); // 유튜브 배경 확인
    assert.match(css, /--x-surface:\s*rgba\(255,\s*255,\s*255,\s*0\.04\)/); // X 배경 확인
    assert.match(css, /--instagram-surface:\s*rgba\(225,\s*48,\s*108,\s*0\.07\)/); // 인스타그램 배경 확인
    assert.match(css, /--facebook-surface:\s*rgba\(24,\s*119,\s*242,\s*0\.08\)/); // 페이스북 배경 확인
    assert.match(css, /--tiktok-surface:\s*rgba\(105,\s*201,\s*208,\s*0\.07\)/); // 틱톡 배경 확인
    assert.match(css, /@media\s*\(max-width:\s*720px\)[\s\S]*grid-template-columns:\s*1fr/); // 모바일 한 열 확인
}); // 테스트 끝

test("35개 게임과 여섯 플랫폼의 시연 데이터를 제공한다", () => // 화면 데이터 검증
{ // 테스트 시작
    assert.equal(COMMUNITY_GAMES.length, 35); // 전체 게임 수 확인
    assert.equal(COMMUNITY_PLATFORMS.length, 6); // 전체 플랫폼 수 확인
    assert.equal(createDemoItems("project-a").length, 6); // 플랫폼별 시연 항목 확인
    assert.ok(COMMUNITY_PLATFORMS.every((platform) => platform.channelUrl === null)); // 미설정 주소 확인
}); // 테스트 끝

test("메인과 커뮤니티는 같은 35개 프로젝트 이름을 사용한다", async () => // 데이터 공유 테스트
{ // 테스트 시작
    assert.deepEqual(COMMUNITY_GAMES.map((game) => game.id), GAME_PROJECTS.map((project) => project.id)); // 식별자 순서 확인
    assert.deepEqual(COMMUNITY_GAMES.map((game) => game.label), GAME_PROJECTS.map((project) => project.title)); // 제목 공유 확인
    assert.deepEqual(COMMUNITY_GAMES.map((game) => game.hashtag), GAME_PROJECTS.map((project) => project.hashtag)); // 해시태그 공유 확인
    const source = await readProjectFile("public/community-data.mjs"); // 커뮤니티 데이터 모듈 읽기
    assert.match(source, /from "\.\/game-projects\.mjs"/); // 공개 데이터 가져오기 확인
}); // 테스트 끝

test("게임 선택과 주소와 시연 콘텐츠를 안전하게 동기화한다", () => // 선택 상태 검증
{ // 테스트 시작
    assert.equal(resolveGameSelection("project-a"), "project-a"); // 등록 게임 선택 확인
    assert.equal(resolveGameSelection("../../secret"), "all"); // 잘못된 게임 차단 확인
    assert.equal(buildCommunityUrl("project-iota"), "community.html?game=project-iota"); // 게임 주소 생성 확인
    assert.equal(buildCommunityUrl("all"), "community.html"); // 전체 주소 생성 확인
    assert.ok(selectDemoContent("project-z").every((item) => item.gameId === "project-z")); // 게임별 시연 항목 확인
}); // 테스트 끝

test("브라우저 렌더링은 외부 문자열을 HTML로 삽입하지 않는다", async () => // 안전 렌더링 검증
{ // 테스트 시작
    const script = await readProjectFile("public/community.mjs"); // 화면 기능 읽기
    assert.match(script, /textContent/); // 일반 텍스트 삽입 확인
    assert.doesNotMatch(script, /innerHTML/); // HTML 직접 삽입 차단 확인
    assert.match(script, /fetch\(`\/api\/community\/youtube\?game=/); // 유튜브 API 연결 확인
}); // 테스트 끝

test("기존 주요 페이지가 커뮤니티 전용 페이지로 연결된다", async () => // 공통 메뉴 연결 검증
{ // 테스트 시작
    const main = await readProjectFile("public/main.html"); // 메인 문서 읽기
    const goods = await readProjectFile("public/goods.html"); // 굿즈 문서 읽기
    const devlog = await readProjectFile("public/devlog.html"); // 개발 뉴스 문서 읽기
    assert.match(main, /<li><a href="community\.html">커뮤니티<\/a><\/li>/); // 메인 메뉴 연결 확인
    assert.match(goods, /<li><a href="community\.html">커뮤니티<\/a><\/li>/); // 굿즈 메뉴 연결 확인
    assert.match(devlog, /<li><a href="community\.html">커뮤니티<\/a><\/li>/); // 개발 뉴스 메뉴 연결 확인
    assert.match(main, /class="section-detail-link" href="community\.html"/); // 메인 상세 버튼 확인
}); // 테스트 끝

test("메인 커뮤니티 카드가 각 플랫폼 영역으로 직접 이동한다", async () => // 플랫폼 카드 연결 검증
{ // 테스트 시작
    const main = await readProjectFile("public/main.html"); // 메인 문서 읽기
    const destinations = ["discord", "youtube", "x", "instagram", "facebook", "tiktok"]; // 플랫폼 이동 지점

    for (const destination of destinations) // 이동 지점 순회
    { // 반복 시작
        assert.match(main, new RegExp(`href="community\\.html#${destination}" class="community-card`)); // 플랫폼 직접 연결 확인
    } // 반복 끝

    assert.doesNotMatch(main, /<a href="#" class="community-card/); // 빈 커뮤니티 링크 차단 확인
}); // 테스트 끝
