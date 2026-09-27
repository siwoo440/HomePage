import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const pageNames = ["main.html", "devlog.html", "goods.html", "community.html"]; // 상태 적용 페이지
const moduleNames = ["devlog.mjs", "goods.mjs", "community.mjs"]; // 상태 연결 모듈

test("네 공개 페이지가 공통 상태 스타일과 접근 가능한 상태 호스트를 제공한다", async () => // 페이지 상태 구조 테스트
{ // 테스트 시작
    for (const pageName of pageNames) // 페이지 반복
    { // 반복 시작
        const html = await readFile(new URL(`../public/${pageName}`, import.meta.url), "utf8"); // 페이지 내용 읽기
        const stateStyleIndex = html.indexOf('/data-state.css'); // 상태 스타일 위치
        const themeStyleIndex = html.indexOf('/playful-lab-theme.css'); // 공통 테마 위치
        assert.equal(stateStyleIndex > -1, true, `${pageName} 상태 스타일 누락`); // 상태 스타일 연결 확인
        assert.equal(stateStyleIndex < themeStyleIndex, true, `${pageName} 스타일 순서 오류`); // 공통 테마 마지막 순서 확인
        assert.match(html, /data-state-host/); // 상태 호스트 확인
        assert.match(html, /role="status"/); // 상태 역할 확인
        assert.match(html, /aria-live="polite"/); // 상태 변경 안내 확인
    } // 반복 끝
}); // 테스트 끝

test("뉴스·상품·커뮤니티 모듈이 공통 요청과 상태 제어기를 사용한다", async () => // 모듈 상태 연결 테스트
{ // 테스트 시작
    for (const moduleName of moduleNames) // 모듈 반복
    { // 반복 시작
        const source = await readFile(new URL(`../public/${moduleName}`, import.meta.url), "utf8"); // 모듈 내용 읽기
        assert.match(source, /createDataStateController/); // 상태 제어기 사용 확인
        assert.match(source, /requestJson/); // 공통 요청 사용 확인
        assert.match(source, /resolveCollectionState/); // 응답 상태 분류 확인
        assert.doesNotMatch(source, /\bfetch\s*\(/); // 직접 요청 제거 확인
        assert.match(source, /"loading"/); // 로딩 상태 확인
        assert.match(source, /"demo"/); // 데모 상태 확인
        assert.match(source, /"empty"/); // 빈 결과 상태 확인
        assert.match(source, /"error"/); // 오류 상태 확인
    } // 반복 끝
}); // 테스트 끝

test("상품 상태 호스트는 메인 미리보기와 전체 상품 페이지에 각각 존재한다", async () => // 상품 상태 위치 테스트
{ // 테스트 시작
    const mainHtml = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 문서 읽기
    const goodsHtml = await readFile(new URL("../public/goods.html", import.meta.url), "utf8"); // 상품 문서 읽기
    assert.match(mainHtml, /data-product-status/); // 메인 상품 상태 확인
    assert.match(goodsHtml, /data-product-status/); // 전체 상품 상태 확인
}); // 테스트 끝

test("커뮤니티는 유튜브 전용 상태 호스트와 다시 시도 가능한 상태 흐름을 제공한다", async () => // 커뮤니티 상태 테스트
{ // 테스트 시작
    const html = await readFile(new URL("../public/community.html", import.meta.url), "utf8"); // 커뮤니티 문서 읽기
    const source = await readFile(new URL("../public/community.mjs", import.meta.url), "utf8"); // 커뮤니티 모듈 읽기
    assert.match(html, /id="youtube-feed-state"/); // 유튜브 상태 호스트 확인
    assert.match(source, /youtubeRequestVersion/); // 이전 요청 차단 번호 확인
    assert.match(source, /loadYouTubeFeed\(gameId, verified, expectedSelectionVersion/); // 선택 번호 전달 확인
    assert.match(source, /isStaleYouTubeRequest\(expectedSelectionVersion, selectionVersion/); // 이전 선택 차단 확인
    assert.match(source, /\(\) => loadYouTubeFeed\(gameId, verified, expectedSelectionVersion\)/); // 안전한 재시도 함수 확인
}); // 테스트 끝
