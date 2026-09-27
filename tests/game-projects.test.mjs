import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 확인 도구
import test from "node:test"; // 테스트 실행 도구
import { FEATURED_PROJECT_IDS, GAME_PROJECTS, getGameProject, validateGameProjects } from "../public/game-projects.mjs"; // 프로젝트 공개 데이터

test("35개 프로젝트가 고유 식별자와 필수 공개 정보를 가진다", () => // 데이터 계약 테스트
{ // 테스트 시작
    assert.equal(GAME_PROJECTS.length, 35); // 전체 수 확인
    assert.equal(new Set(GAME_PROJECTS.map((project) => project.id)).size, 35); // 식별자 중복 확인
    assert.deepEqual(validateGameProjects(GAME_PROJECTS), []); // 유효성 오류 없음 확인
    assert.equal(GAME_PROJECTS.every((project) => fs.existsSync(`public${project.heroImage}`)), true); // 대표 이미지 존재 확인
}); // 테스트 끝

test("대표 프로젝트 순서를 유지한다", () => // 대표 순서 테스트
{ // 테스트 시작
    assert.deepEqual(FEATURED_PROJECT_IDS, ["project-eta", "project-a", "project-b", "project-c", "project-d", "project-e"]); // 승인 순서 확인
}); // 테스트 끝

test("성인 프로젝트와 알 수 없는 프로젝트를 안전하게 판정한다", () => // 안전 조회 테스트
{ // 테스트 시작
    assert.equal(getGameProject("project-h")?.adultOnly, true); // 프로젝트 H 성인 확인
    assert.equal(getGameProject("project-u")?.adultOnly, true); // 프로젝트 U 성인 확인
    assert.equal(getGameProject("project-v")?.adultOnly, true); // 프로젝트 V 성인 확인
    assert.equal(getGameProject("missing-project"), null); // 미등록 프로젝트 확인
    assert.equal(getGameProject(null), null); // 잘못된 식별자 확인
}); // 테스트 끝

test("중복 식별자와 외부 주소와 잘못된 상태를 거부한다", () => // 유효성 오류 테스트
{ // 테스트 시작
    const invalidProjects = // 잘못된 프로젝트 목록
    [ // 배열 시작
        { ...GAME_PROJECTS[0], id: "project-duplicate" }, // 첫 중복 기반 항목
        { ...GAME_PROJECTS[1], id: "project-duplicate", developmentStatus: "unknown" }, // 중복과 잘못된 상태 항목
        { ...GAME_PROJECTS[2], id: "project-external", detailPath: "https://example.com/game" }, // 외부 주소 항목
    ]; // 배열 끝
    const errors = validateGameProjects(invalidProjects); // 유효성 오류 계산
    assert.ok(errors.some((error) => error.includes("중복"))); // 중복 오류 확인
    assert.ok(errors.some((error) => error.includes("개발 상태"))); // 상태 오류 확인
    assert.ok(errors.some((error) => error.includes("상세 주소"))); // 주소 오류 확인
}); // 테스트 끝
