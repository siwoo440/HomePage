import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { applyAdultVisibility, getAgeVerificationStatus } from "../public/age-gate.mjs"; // 카드 보호 함수
import { createDemoItems, isAdultCommunityGame } from "../public/community-data.mjs"; // 커뮤니티 보호 데이터

test("메인 성인 카드의 초기 이미지 요청은 안전한 모자이크만 사용한다", async () => // 초기 노출 방지 검증
{ // 테스트 시작
    const html = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 문서 읽기
    const adultCards = [...html.matchAll(/<div class="game-card reveal adult-game-card is-age-locked"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g)].map((match) => match[0]); // 성인 카드 추출
    assert.equal(adultCards.length, 3); // 성인 카드 수 확인
    for (const card of adultCards) // 성인 카드 순회
    { // 반복 시작
        assert.match(card, /src="images\/games\/age-restricted\.svg"/); // 모자이크 요청 확인
        assert.doesNotMatch(card, /src="images\/games\/project-(h|u|v)\.png/); // 원본 요청 차단 확인
        assert.match(card, /data-adult-image="images\/games\/project-(h|u|v)\.png\?v=20260909-2"/); // 확인 뒤 주소 보관
    } // 반복 끝
}); // 테스트 끝

test("메인 성인 카드에는 중복 잠금 문구 없이 장르의 19+만 표시한다", async () => // 중복 문구 방지 검증
{ // 테스트 시작
    const html = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 문서 읽기
    const adultCards = [...html.matchAll(/<div class="game-card reveal adult-game-card is-age-locked"[\s\S]*?<div class="game-name">프로젝트 (?:H|U|V)<\/div>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/g)].map((match) => match[0]); // 성인 카드 추출
    assert.equal(adultCards.length, 3); // 성인 카드 수 확인
    for (const card of adultCards) // 성인 카드 순회
    { // 반복 시작
        assert.doesNotMatch(card, /adult-age-overlay|adult-age-mark|adult-age-copy|성인 확인 후 열람/); // 중앙 중복 안내 제거 확인
        assert.match(card, /class="game-genre"[\s\S]*?19\+/); // 하단 성인 장르 표시 확인
    } // 반복 끝
}); // 테스트 끝

test("서버 상태 확인에 실패하면 잠금 상태를 유지한다", async () => // 실패 닫힘 검증
{ // 테스트 시작
    const failedFetch = async () => ({ ok: false, json: async () => ({ verified: true }) }); // 실패 응답 생성
    assert.equal(await getAgeVerificationStatus(failedFetch), false); // 실패 상태 확인
}); // 테스트 끝

test("인증된 경우에만 성인 카드 원본 이미지를 적용한다", () => // 원본 전환 검증
{ // 테스트 시작
    const classes = new Set(["is-age-locked"]); // 카드 클래스 저장소
    const image = // 이미지 모형 시작
    { // 이미지 모형 객체
        values: { src: "images/games/age-restricted.svg", "data-adult-image": "images/games/project-h.png?v=20260909-2", "data-adult-alt": "프로젝트 H 게임 콘셉트 이미지" }, // 이미지 속성 저장소
        getAttribute(name) { return this.values[name] ?? null; }, // 속성 읽기
        setAttribute(name, value) { this.values[name] = value; }, // 속성 쓰기
    }; // 이미지 모형 끝
    const card = // 카드 모형 시작
    { // 카드 모형 객체
        classList: { add(name) { classes.add(name); }, remove(name) { classes.delete(name); } }, // 클래스 조작 도구
        querySelector(selector) { return selector === "img[data-adult-image]" ? image : null; }, // 이미지 선택 도구
    }; // 카드 모형 끝
    const root = { querySelectorAll() { return [card]; } }; // 문서 모형
    applyAdultVisibility(false, root); // 미인증 상태 적용
    assert.equal(image.values.src, "images/games/age-restricted.svg"); // 모자이크 유지 확인
    assert.equal(classes.has("is-age-locked"), true); // 잠금 표시 확인
    applyAdultVisibility(true, root); // 인증 상태 적용
    assert.equal(image.values.src, "images/games/project-h.png?v=20260909-2"); // 원본 적용 확인
    assert.equal(image.values.alt, "프로젝트 H 게임 콘셉트 이미지"); // 원본 설명 적용 확인
    assert.equal(classes.has("is-age-locked"), false); // 잠금 해제 확인
}); // 테스트 끝

test("커뮤니티 성인 게임은 인증 전 모든 시연 이미지를 모자이크한다", () => // 커뮤니티 노출 방지 검증
{ // 테스트 시작
    assert.equal(isAdultCommunityGame("project-h"), true); // 프로젝트 H 성인 판정
    assert.equal(isAdultCommunityGame("project-a"), false); // 프로젝트 A 일반 판정
    assert.ok(createDemoItems("project-h", false).every((item) => item.thumbnailUrl === "images/games/age-restricted.svg")); // 미인증 모자이크 확인
    assert.ok(createDemoItems("project-h", true).every((item) => item.thumbnailUrl === "images/games/project-h.png")); // 인증 원본 확인
    assert.ok(createDemoItems("project-a", false).every((item) => item.thumbnailUrl === "images/games/project-a.png")); // 일반 이미지 유지 확인
}); // 테스트 끝
