import assert from "node:assert/strict"; // 엄격 검증 도구
import test from "node:test"; // 테스트 실행 도구
import { COMMUNITY_GAMES, resolveCommunityGame } from "../lib/community/games.ts"; // 게임 설정 도구

test("커뮤니티 게임은 고유 식별자와 해시태그를 제공한다", () => // 게임 설정 검증
{ // 테스트 시작
    assert.equal(COMMUNITY_GAMES.length, 35); // 전체 게임 수 확인
    assert.equal(new Set(COMMUNITY_GAMES.map((game) => game.id)).size, COMMUNITY_GAMES.length); // 식별자 중복 확인
    assert.ok(COMMUNITY_GAMES.every((game) => game.hashtag.startsWith("#DEVFORGE"))); // 해시태그 형식 확인
    assert.ok(COMMUNITY_GAMES.every((game) => game.searchTerms.length >= 2)); // 검색 보조어 확인
}); // 테스트 끝

test("등록된 게임만 검색 설정으로 변환한다", () => // 허용 목록 검증
{ // 테스트 시작
    assert.equal(resolveCommunityGame("project-a")?.label, "프로젝트 A — 아스트로이아"); // 첫 게임 확인
    assert.equal(resolveCommunityGame("project-iota")?.hashtag, "#DEVFORGEProjectIota"); // 추가 게임 확인
    assert.equal(resolveCommunityGame("../../secret"), null); // 위험 식별자 차단 확인
    assert.equal(resolveCommunityGame("unknown-game"), null); // 미등록 식별자 차단 확인
}); // 테스트 끝
