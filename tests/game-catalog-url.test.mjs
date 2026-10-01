import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { toggleFavoriteProject } from "../public/site-experience.mjs"; // 관심 프로젝트 도구
import { describeActiveFilters, formatResultCount, MAX_SEARCH_LENGTH, parseCatalogParams, serializeCatalogParams } from "../public/game-catalog.mjs"; // 게임 목록 조건 도구

const allowed = { genres: ["all", "rpg", "strategy"], statuses: ["all", "developing", "planning", "paused"] }; // 허용 조건 목록

test("주소 검색 조건은 허용 값만 읽고 잘못된 값은 기본값으로 둔다", () => // 주소 조건 해석 검사
{ // 테스트 시작
    assert.deepEqual({ ...parseCatalogParams("?q=%20카드%20&genre=rpg&status=paused", allowed) }, { query: "카드", genre: "rpg", status: "paused" }); // 정상 조건 확인
    assert.deepEqual({ ...parseCatalogParams("?genre=hacker&status=<script>", allowed) }, { query: "", genre: "all", status: "all" }); // 잘못된 조건 차단 확인
    assert.equal(parseCatalogParams("?q=" + "가".repeat(100), allowed).query.length, MAX_SEARCH_LENGTH); // 검색어 길이 제한 확인
    assert.deepEqual({ ...parseCatalogParams(undefined, allowed) }, { query: "", genre: "all", status: "all" }); // 빈 주소 기본값 확인
}); // 테스트 끝

test("검색 조건은 기본값을 뺀 짧은 주소로 저장된다", () => // 주소 조건 저장 검사
{ // 테스트 시작
    assert.equal(serializeCatalogParams({ query: "", genre: "all", status: "all" }), ""); // 기본 조건 빈 주소 확인
    assert.equal(serializeCatalogParams({ query: " 리듬 ", genre: "rpg", status: "all" }), "?q=%EB%A6%AC%EB%93%AC&genre=rpg"); // 일부 조건 저장 확인
    const restored = parseCatalogParams(serializeCatalogParams({ query: "전략 RPG", genre: "strategy", status: "developing" }), allowed); // 저장 후 복원
    assert.deepEqual({ ...restored }, { query: "전략 RPG", genre: "strategy", status: "developing" }); // 왕복 일치 확인
}); // 테스트 끝

test("적용 조건 요약과 결과 수 문구를 만든다", () => // 조건 요약 검사
{ // 테스트 시작
    const labels = { genres: { rpg: "RPG" }, statuses: { developing: "개발 중" } }; // 표시 이름
    assert.deepEqual(describeActiveFilters({ query: "", genre: "all", status: "all" }, labels), []); // 조건 없음 확인
    assert.deepEqual(describeActiveFilters({ query: "카드", genre: "rpg", status: "developing" }, labels).map((filter) => filter.label), ["검색: \"카드\"", "장르: RPG", "개발 상태: 개발 중"]); // 조건 요약 확인
    assert.equal(formatResultCount(35, 35), "35개 프로젝트"); // 전체 결과 문구 확인
    assert.equal(formatResultCount(3, 35), "3개 프로젝트 · 전체 35개 중"); // 부분 결과 문구 확인
}); // 테스트 끝

test("관심 프로젝트는 최근에 추가한 순서로 먼저 표시한다", () => // 관심 목록 정렬 검사
{ // 테스트 시작
    const values = new Map(); // 메모리 저장값
    const storage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }; // 메모리 저장소
    toggleFavoriteProject(storage, "project-a"); // 첫 관심 추가
    assert.deepEqual(toggleFavoriteProject(storage, "project-eta"), ["project-eta", "project-a"]); // 최근 추가 우선 확인
    values.set("devforge_favorite_projects_v1", "{손상"); // 손상 저장값
    assert.deepEqual(toggleFavoriteProject(storage, "project-b"), ["project-b"]); // 손상값 대체 확인
}); // 테스트 끝

test("메인 게임 목록은 조건 요약과 초기화 버튼을 제공하고 주소를 기록 없이 갱신한다", () => // 화면 연결 계약
{ // 테스트 시작
    const html = fs.readFileSync("public/main.html", "utf8"); // 메인 문서
    const script = fs.readFileSync("public/game-catalog.mjs", "utf8"); // 목록 스크립트
    assert.match(html, /data-game-active-filters/); // 조건 요약 영역 확인
    assert.equal((html.match(/data-game-reset/g) ?? []).length, 2); // 요약·빈 결과 초기화 버튼 확인
    assert.match(script, /history\.replaceState/); // 기록 추가 없는 주소 갱신 확인
    assert.doesNotMatch(script, /history\.pushState/); // 뒤로 가기 기록 누적 방지 확인
    assert.match(script, /addEventListener\?\.\("popstate"/); // 기록 이동 복원 확인
}); // 테스트 끝
