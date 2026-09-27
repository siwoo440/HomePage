import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { shouldPlayInvitation } from "../public/project_eta/ProjectEtaInvitation.mjs"; // 초대장 재생 판단 도구
import { PIECE_TIERS, getPieceByTier } from "../public/project_eta/ProjectEta.mjs"; // 기물 등급 도구
import { FUSION_RECIPES, PIECES, findPathToGradeFive, findPieces, getFusionRelations } from "../public/project_eta/ProjectEtaFusionData.mjs"; // 합성 도감 도구

test("합성 도감은 81종 기물과 63개 공개 조합을 제공한다", () => // 전체 합성망 회귀 검사
{ // 테스트 시작
    assert.equal(PIECES.length, 81); // 전체 기물 수 검증
    assert.deepEqual(PIECES.reduce((counts, piece) => // 등급별 기물 수 집계
    { // 집계 시작
        counts[piece.grade] = (counts[piece.grade] ?? 0) + 1; // 등급 수량 누적
        return counts; // 집계 결과 반환
    }, {}), { 1: 18, 2: 19, 3: 18, 4: 18, 5: 8 }); // 등급별 수량 검증
    assert.equal(FUSION_RECIPES.filter((recipe) => !recipe.hidden).length, 63); // 공개 조합 수 검증
    assert.equal(FUSION_RECIPES.filter((recipe) => recipe.hidden).length, 3); // 명시 숨김 조합 수 검증
}); // 테스트 끝

test("프로젝트 에타 첫 방문에는 초대장 연출을 재생한다", () => // 첫 방문 재생 검사
{ // 테스트 시작
    assert.equal(shouldPlayInvitation("", null), true); // 방문 기록 없음 확인
}); // 테스트 끝

test("같은 브라우저 세션의 재방문에는 초대장 연출을 생략한다", () => // 재방문 생략 검사
{ // 테스트 시작
    assert.equal(shouldPlayInvitation("", "true"), false); // 방문 기록 있음 확인
}); // 테스트 끝

test("intro 주소 옵션은 방문 기록이 있어도 초대장 연출을 다시 재생한다", () => // 강제 재생 검사
{ // 테스트 시작
    assert.equal(shouldPlayInvitation("?intro=1", "true"), true); // 강제 재생 주소 확인
    assert.equal(shouldPlayInvitation("?intro=0", "true"), false); // 일반 주소 생략 확인
}); // 테스트 끝

test("성기사 선택은 재료와 상위 합성 결과를 함께 반환한다", () => // 연결 관계 회귀 검사
{ // 테스트 시작
    const relations = getFusionRelations("paladin", false); // 성기사 연결 조회
    assert.deepEqual(relations.createdBy.map((recipe) => recipe.id), ["archbishop-man-paladin"]); // 제작 조합 검증
    assert.deepEqual(relations.usedIn.map((recipe) => recipe.result).sort(), ["grand-cleric", "guardian-captain"]); // 상위 결과 검증
}); // 테스트 끝

test("숨김 조합은 사용자가 공개하기 전까지 연결 관계에서 제외된다", () => // 스포일러 보호 회귀 검사
{ // 테스트 시작
    assert.equal(getFusionRelations("amazon", false).createdBy.length, 1); // 공개 제작 조합 수 검증
    assert.equal(getFusionRelations("amazon", true).createdBy.length, 2); // 숨김 포함 조합 수 검증
}); // 테스트 끝

test("한국어와 영어 검색은 같은 기물을 찾는다", () => // 다국어 검색 회귀 검사
{ // 테스트 시작
    assert.equal(findPieces("성기사")[0]?.id, "paladin"); // 한국어 검색 검증
    assert.equal(findPieces("Paladin")[0]?.id, "paladin"); // 영어 검색 검증
}); // 테스트 끝

test("성기사에서 제작 가능한 5성까지 가장 짧은 경로를 반환한다", () => // 최종 합성 경로 회귀 검사
{ // 테스트 시작
    assert.deepEqual(findPathToGradeFive("paladin", false), ["paladin", "grand-cleric", "grand-paladin"]); // 5성 경로 검증
}); // 테스트 끝

test("합성 도감 화면은 검색과 등급과 트리와 상세와 스포일러 제어를 제공한다", async () => // 도감 UI 계약 검사
{ // 테스트 시작
    const html = await readFile(new URL("../public/project_eta/ProjectEta_Main.html", import.meta.url), "utf8"); // 상세 페이지 읽기
    assert.match(html, /PIECE &amp; FUSION ATLAS/); // 도감 제목 검증
    assert.match(html, /id="fusion-search"/); // 검색 입력 검증
    assert.match(html, /id="fusion-tree"/); // 합성 트리 검증
    assert.match(html, /id="fusion-detail"/); // 상세 패널 검증
    assert.match(html, /id="spoiler-dialog"/); // 스포일러 경고 검증
}); // 테스트 끝

test("프로젝트 에타는 다섯 등급의 대표 기물 정보를 제공한다", () => // 기물 정보 검증
{ // 테스트 시작
    assert.deepEqual(PIECE_TIERS.map((piece) => piece.tier), [1, 2, 3, 4, 5]); // 등급 순서 확인
    assert.equal(getPieceByTier(3)?.name, "아크비숍"); // 합성 대표 기물 확인
    assert.equal(getPieceByTier(99), null); // 잘못된 등급 차단 확인
}); // 테스트 끝

test("프로젝트 에타 페이지는 전략에서 미스터리로 이어지는 주요 구역을 제공한다", async () => // 페이지 흐름 검증
{ // 테스트 시작
    const html = await readFile(new URL("../public/project_eta/ProjectEta_Main.html", import.meta.url), "utf8"); // 상세 페이지 읽기
    const orderedSections = ["identity", "gameplay", "fusion", "pieces", "beyond-table", "host", "run", "kings", "story", "wishlist"]; // 필수 구역 순서
    let previousIndex = -1; // 이전 구역 위치

    for (const sectionId of orderedSections) // 필수 구역 반복
    { // 반복 시작
        const currentIndex = html.indexOf(`id="${sectionId}"`); // 현재 구역 위치
        assert.ok(currentIndex > previousIndex, `${sectionId} 구역 순서 누락`); // 구역 존재와 순서 확인
        previousIndex = currentIndex; // 이전 위치 갱신
    } // 반복 끝

    assert.match(html, /10×10/); // 보드 크기 표시 확인
    assert.match(html, /81 PIECES/); // 기물 규모 표시 확인
    assert.match(html, /YOUR HOST/); // 게임 마스터 티저 확인
    assert.match(html, /YOUR MOVE/); // 마지막 행동 유도 확인
}); // 테스트 끝

test("메인 프로젝트 에타 카드는 합성 전략 장르와 상세 주소를 안내한다", async () => // 메인 카드 연결 검증
{ // 테스트 시작
    const html = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 페이지 읽기
    const card = html.match(/<a class="game-card game-card-preview reveal" id="project-eta"[\s\S]*?<\/a>/)?.[0] ?? ""; // 프로젝트 카드 추출
    assert.match(card, /href="project_eta\/ProjectEta_Main\.html"/); // 상세 주소 확인
    assert.match(card, /체스 · 카드 · 합성 전략/); // 장르 안내 확인
}); // 테스트 끝
