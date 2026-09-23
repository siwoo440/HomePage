import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { FEATURED_PROJECT_IDS } from "../public/game-projects.mjs"; // 공개 추천 순서

const catalogModulePromise = import("../public/game-catalog.mjs").catch(() => ({})); // 미구현 모듈 안전 처리

const SAMPLE_GAMES = Object.freeze( // 시연 게임 목록
[ // 목록 시작
    Object.freeze({ id: "project-eta", name: "프로젝트 η", genre: "strategy", status: "developing", searchText: "프로젝트 에타 체스 카드 합성 전략" }), // 에타 게임
    Object.freeze({ id: "project-a", name: "프로젝트 A", genre: "strategy", status: "developing", searchText: "프로젝트 a 아스트로이아 srpg" }), // 에이 게임
    Object.freeze({ id: "project-b", name: "프로젝트 B", genre: "rpg", status: "developing", searchText: "프로젝트 b rpg 자동전투 auto battle" }), // 비 게임
    Object.freeze({ id: "project-zeta", name: "프로젝트 ζ", genre: "other", status: "paused", searchText: "프로젝트 제타 삽질" }), // 제타 게임
    Object.freeze({ id: "project-iota", name: "프로젝트 ι", genre: "other", status: "planning", searchText: "프로젝트 요타 러시안 룰렛" }), // 요타 게임
]); // 목록 끝

test("검색어와 장르와 개발 상태를 동시에 만족하는 게임만 반환한다", async () => // 결합 필터 테스트
{ // 테스트 시작
    const { buildGameCatalogView } = await catalogModulePromise; // 목록 계산 도구 조회
    assert.equal(typeof buildGameCatalogView, "function", "게임 목록 모듈이 필요합니다."); // 구현 여부 확인
    const result = buildGameCatalogView(SAMPLE_GAMES, { query: "체스", genre: "strategy", status: "developing", limit: 12 }); // 결합 조건 적용
    assert.deepEqual(result.visible.map((game) => game.id), ["project-eta"]); // 에타만 표시 확인
    assert.equal(result.total, 1); // 검색 결과 개수 확인
    assert.equal(result.hasMore, false); // 추가 결과 없음 확인
}); // 테스트 끝

test("검색은 영문 대소문자와 앞뒤 공백을 구분하지 않는다", async () => // 검색 정규화 테스트
{ // 테스트 시작
    const { buildGameCatalogView } = await catalogModulePromise; // 목록 계산 도구 조회
    assert.equal(typeof buildGameCatalogView, "function", "게임 목록 모듈이 필요합니다."); // 구현 여부 확인
    const result = buildGameCatalogView(SAMPLE_GAMES, { query: "  AUTO  ", genre: "all", status: "all", limit: 12 }); // 공백 영문 검색
    assert.deepEqual(result.visible.map((game) => game.id), ["project-b"]); // 비 게임 표시 확인
}); // 테스트 끝

test("더 보기 제한만큼 노출하고 남은 결과 여부를 계산한다", async () => // 더 보기 테스트
{ // 테스트 시작
    const { buildGameCatalogView } = await catalogModulePromise; // 목록 계산 도구 조회
    assert.equal(typeof buildGameCatalogView, "function", "게임 목록 모듈이 필요합니다."); // 구현 여부 확인
    const firstPage = buildGameCatalogView(SAMPLE_GAMES, { query: "", genre: "all", status: "all", limit: 3 }); // 첫 목록 계산
    const secondPage = buildGameCatalogView(SAMPLE_GAMES, { query: "", genre: "all", status: "all", limit: 6 }); // 확장 목록 계산
    assert.deepEqual(firstPage.visible.map((game) => game.id), ["project-eta", "project-a", "project-b"]); // 첫 세 게임 확인
    assert.equal(firstPage.total, 5); // 전체 결과 확인
    assert.equal(firstPage.hasMore, true); // 추가 결과 확인
    assert.equal(secondPage.visible.length, 5); // 전체 게임 표시 확인
    assert.equal(secondPage.hasMore, false); // 추가 결과 없음 확인
}); // 테스트 끝

test("추천 프로젝트를 승인된 순서대로 최대 여섯 개 반환한다", async () => // 추천 순서 테스트
{ // 테스트 시작
    const { selectFeaturedGames } = await catalogModulePromise; // 추천 계산 도구 조회
    assert.equal(typeof selectFeaturedGames, "function", "추천 목록 모듈이 필요합니다."); // 구현 여부 확인
    const expandedGames = // 확장 게임 목록
    [ // 목록 시작
        ...SAMPLE_GAMES, // 시연 게임 포함
        { id: "project-c", name: "프로젝트 C" }, // 씨 게임
        { id: "project-d", name: "프로젝트 D" }, // 디 게임
        { id: "project-e", name: "프로젝트 E" }, // 이 게임
    ]; // 목록 끝
    assert.deepEqual(selectFeaturedGames(expandedGames).map((game) => game.id), ["project-eta", "project-a", "project-b", "project-c", "project-d", "project-e"]); // 승인 순서 확인
}); // 테스트 끝

test("게임 목록은 공개 프로젝트의 추천 순서를 공유한다", async () => // 공개 데이터 연결 테스트
{ // 테스트 시작
    const { FEATURED_GAME_IDS } = await catalogModulePromise; // 목록 추천 순서 조회
    assert.deepEqual(FEATURED_GAME_IDS, FEATURED_PROJECT_IDS); // 공개 추천 순서 공유 확인
    const source = fs.readFileSync("public/game-catalog.mjs", "utf8"); // 목록 모듈 읽기
    assert.match(source, /from "\.\/game-projects\.mjs"/); // 공개 데이터 가져오기 확인
}); // 테스트 끝

test("메인 게임 영역은 추천과 검색과 상태 필터와 더 보기를 제공한다", () => // 게임 목록 화면 테스트
{ // 테스트 시작
    const html = fs.readFileSync("public/main.html", "utf8"); // 메인 문서 읽기
    assert.match(html, /data-featured-games/); // 추천 프로젝트 영역 확인
    assert.match(html, /data-game-search/); // 프로젝트 검색 확인
    assert.match(html, /data-genre-filter="all"/); // 장르 필터 확인
    assert.match(html, /data-status-filter="developing"/); // 개발 중 필터 확인
    assert.match(html, /data-status-filter="planning"/); // 기획 필터 확인
    assert.match(html, /data-status-filter="paused"/); // 보류 필터 확인
    assert.match(html, /data-game-result-count/); // 결과 개수 확인
    assert.match(html, /data-game-load-more/); // 더 보기 확인
    assert.match(html, /src="\/game-catalog\.mjs"/); // 목록 모듈 연결 확인
}); // 테스트 끝
