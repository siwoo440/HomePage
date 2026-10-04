import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { PUBLIC_STATIC_PATHS } from "../lib/site-url.ts"; // 사이트맵 목록
import { FEATURED_PROJECT_IDS, GAME_PROJECTS, GENRE_LABELS, getFilterGenre, getGenreLabel, PRIMARY_GENRE_FILTERS } from "../public/game-projects.mjs"; // 공개 프로젝트 데이터
import { RESPONSIVE_NAV_ITEMS } from "../public/responsive-nav.mjs"; // 서랍 메뉴 목록
import { buildRoadmapView, formatRoadmapResult, getRoadmapStage, matchesRoadmapGenre, parseRoadmapGenre, ROADMAP_GENRE_FILTERS, ROADMAP_STAGES, serializeRoadmapGenre } from "../public/roadmap.mjs"; // 로드맵 도구
import { STATIC_HEADER_PAGES } from "../scripts/apply-site-header.mjs"; // 공통 헤더 등록 목록

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구

test("모든 프로젝트는 대표·개발 중·기획·보류 가운데 한 단계에 들어간다", () => // 단계 분류 검사
{ // 테스트 시작
    const view = buildRoadmapView(); // 전체 목록
    assert.deepEqual(view.stages.map((stage) => [stage.id, stage.count]), [["featured", 6], ["developing", 26], ["planning", 1], ["paused", 2]]); // 단계별 수 확인
    assert.equal(view.total, GAME_PROJECTS.length); // 빠진 프로젝트 없음 확인
    assert.deepEqual(view.stages[0].projects.map((project) => project.id), [...FEATURED_PROJECT_IDS]); // 대표 순서 확인
    assert.equal(getRoadmapStage({ id: "project-eta", developmentStatus: "developing" }), "featured"); // 대표 판정 확인
    assert.equal(getRoadmapStage({ id: "project-eta", developmentStatus: "paused" }), "paused"); // 보류 우선 확인
    assert.equal(getRoadmapStage({ id: "project-zz", developmentStatus: "planning" }), "planning"); // 기획 판정 확인
    assert.equal(getRoadmapStage({ id: "project-zz", developmentStatus: "developing" }), "developing"); // 개발 중 판정 확인
}); // 테스트 끝

test("장르 필터는 여섯 가지이며 모든 프로젝트가 정확히 한 필터에 걸린다", () => // 장르 필터 검사
{ // 테스트 시작
    assert.deepEqual([...ROADMAP_GENRE_FILTERS], ["all", "rpg", "strategy", "action", "puzzle", "roguelike", "other"]); // 필터 값 확인
    for (const project of GAME_PROJECTS) // 프로젝트 반복
    { // 반복 시작
        const matched = ROADMAP_GENRE_FILTERS.filter((genre) => genre !== "all" && matchesRoadmapGenre(project, genre)); // 걸리는 필터
        assert.equal(matched.length, 1, project.id); // 한 필터에만 걸림 확인
        assert.equal(matchesRoadmapGenre(project, "all"), true); // 전체 포함 확인
    } // 반복 끝
    assert.equal(getFilterGenre({ genres: ["story", "other"] }), "other"); // 필터에 없는 장르는 기타 확인
    assert.equal(getFilterGenre({ genres: ["card", "strategy"] }), "strategy"); // 첫 대표 장르 확인
    assert.equal(getFilterGenre({ genres: [] }), "other"); // 장르 없음 확인
    const strategy = buildRoadmapView(GAME_PROJECTS, "strategy"); // 전략만 보기
    assert.equal(strategy.total, GAME_PROJECTS.filter((project) => getFilterGenre(project) === "strategy").length); // 전략 수 확인
    assert.equal(strategy.stages[0].count, 6); // 요약 수는 조건과 무관 확인
    assert.ok(strategy.stages[0].projects.length < 6); // 단계 안 목록은 조건 반영 확인
    for (const genre of new Set(GAME_PROJECTS.flatMap((project) => project.genres))) // 사용 장르 반복
    { // 반복 시작
        assert.ok(genre in GENRE_LABELS, `${genre} 이름표 없음`); // 이름표 존재 확인
    } // 반복 끝
    assert.equal(getGenreLabel("tower-defense"), "타워 디펜스"); // 이름표 조회 확인
    assert.equal(getGenreLabel("unknown"), "unknown"); // 없는 장르 원래 값 확인
    assert.deepEqual([...PRIMARY_GENRE_FILTERS], ["rpg", "strategy", "action", "puzzle", "roguelike"]); // 대표 장르 확인
}); // 테스트 끝

test("장르 조건은 주소에 저장하고 허용되지 않은 값은 전체로 읽는다", () => // 주소 저장 검사
{ // 테스트 시작
    assert.equal(parseRoadmapGenre("?genre=puzzle"), "puzzle"); // 허용 값 확인
    assert.equal(parseRoadmapGenre("?genre=hack"), "all"); // 없는 값 기본값 확인
    assert.equal(parseRoadmapGenre(""), "all"); // 빈 주소 확인
    assert.equal(serializeRoadmapGenre("puzzle"), "?genre=puzzle"); // 조건 저장 확인
    assert.equal(serializeRoadmapGenre("all"), ""); // 전체는 빈 값 확인
    assert.equal(serializeRoadmapGenre("hack"), ""); // 없는 값 저장 안 함 확인
    assert.equal(formatRoadmapResult(35, 35), "35개 프로젝트"); // 전체 결과 문구 확인
    assert.equal(formatRoadmapResult(7, 35), "7개 프로젝트 · 전체 35개 중"); // 조건 결과 문구 확인
}); // 테스트 끝

test("로드맵 문서는 단계 영역을 정적으로 두고 스크립트는 카드만 채운다", () => // 문서 구조 검사
{ // 테스트 시작
    const html = read("public/roadmap.html"); // 로드맵 문서
    for (const stage of ROADMAP_STAGES) // 단계 반복
    { // 반복 시작
        assert.match(html, new RegExp(`<section class="roadmap-stage" data-roadmap-stage="${stage.id}" aria-labelledby="roadmap-stage-${stage.id}">`), stage.id); // 단계 영역 확인
        assert.match(html, new RegExp(`<h2 class="roadmap-stage-title" id="roadmap-stage-${stage.id}">${stage.title}</h2>`), stage.id); // 단계 제목 확인
        assert.match(html, new RegExp(`<a href="#roadmap-stage-${stage.id}"><strong data-roadmap-count="${stage.id}">\\d+</strong><span>${stage.title}</span></a>`), stage.id); // 요약 연결 확인
    } // 반복 끝
    assert.equal((html.match(/data-roadmap-grid/g) ?? []).length, 4); // 카드 격자 수 확인
    assert.equal((html.match(/data-roadmap-empty hidden/g) ?? []).length, 4); // 빈 안내 숨김 확인
    const buttons = [...html.matchAll(/data-roadmap-genre="([a-z]+)"/g)].map((match) => match[1]); // 장르 버튼 값
    assert.deepEqual(buttons, [...ROADMAP_GENRE_FILTERS]); // 버튼과 필터 일치 확인
    assert.match(html, /data-roadmap-result role="status" aria-live="polite"/); // 결과 수 알림 확인
    assert.match(html, /<noscript>/); // 스크립트 꺼짐 안내 확인
    assert.doesNotMatch(html, /<img/); // 이미지 없음 확인(성인 게임 대표 이미지 보호)
    assert.doesNotMatch(html, /\d{4}년|출시일|Q[1-4]/); // 확정되지 않은 일정 미표기 확인
    const script = read("public/roadmap.mjs"); // 로드맵 스크립트
    assert.match(script, /grid\.replaceChildren\(\.\.\.stage\.projects\.map\(\(project\) => createProjectCard\(root, project\)\)\)/); // 카드만 교체 확인
    assert.match(script, /card\.href = project\.detailPath/); // 소개 페이지 연결 확인
    assert.match(script, /if \(project\.adultOnly\)[\s\S]*?"19\+ 성인 확인 필요"/); // 성인 표시 확인
    assert.match(script, /history\?\.replaceState/); // 기록을 쌓지 않는 주소 갱신 확인
    assert.doesNotMatch(script, /innerHTML/); // HTML 문자열 삽입 없음 확인
}); // 테스트 끝

test("로드맵은 공통 헤더·사이트맵·서랍 메뉴·메인 현황판에 연결된다", () => // 연결 검사
{ // 테스트 시작
    assert.ok(STATIC_HEADER_PAGES.some((page) => page.file === "roadmap.html")); // 공통 헤더 등록 확인
    assert.ok(PUBLIC_STATIC_PATHS.includes("/roadmap.html")); // 사이트맵 등록 확인
    assert.deepEqual(RESPONSIVE_NAV_ITEMS.map((item) => item.id), ["home", "games", "roadmap", "goods", "news", "community", "contact"]); // 서랍 메뉴 순서 확인
    assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "roadmap").href, "/roadmap.html"); // 서랍 주소 확인
    assert.match(read("public/main.html"), /<a class="section-detail-link" href="roadmap\.html">단계별 로드맵 보기 →<\/a>/); // 메인 현황판 연결 확인
    assert.match(read("scripts/generate-project-pages.mjs"), /getGenreLabel\(genre\)/); // 장르 이름표 한 곳 사용 확인
    assert.match(read("public/game-catalog.mjs"), /project \? getFilterGenre\(project\) :/); // 메인 목록 필터 장르 규칙 확인
}); // 테스트 끝
