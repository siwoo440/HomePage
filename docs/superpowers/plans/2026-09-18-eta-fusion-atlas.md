# Project η Fusion Atlas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 프로젝트 η 소개 페이지에서 81종 기물과 공개·명시된 숨김 합성식을 등급별로 탐색하고, 선택한 기물의 재료·상위 결과·최종 5성 경로를 확인하는 합성 도감을 구현.

**Architecture:** 기물과 합성 레시피는 `ProjectEtaFusionData.mjs`에 순수 데이터와 조회 함수로 분리. `ProjectEta.mjs`는 검색·등급 필터·기물 선택·스포일러 공개·SVG 연결선 렌더링을 담당하고, HTML/CSS는 5열 합성망과 상세 패널을 제공. 첨부 자료에서 조합식이 공개되지 않은 숨김 레시피 4개는 임의 생성하지 않고 안내 문구로 표시.

**Tech Stack:** 정적 HTML, CSS, JavaScript ES Modules, Node.js 내장 테스트 실행기

**Spec:** `C:/Users/user/.codex/attachments/f224d43e-4bff-4ab5-94ea-4ff7f9292c64/붙여넣은 텍스트.txt`

## Global Constraints

- 전체 81종 기물: 1성 18종, 2성 19종, 3성 18종, 4성 18종, 5성 8종
- 공개 레시피 63개와 조합식이 명시된 숨김 레시피 3개만 실제 연결선으로 표시
- 조합식이 명시되지 않은 숨김 레시피 4개는 추측 금지
- 숨김 레시피 기본 비공개와 스포일러 확인 절차 유지
- 모든 JavaScript 함수 중괄호 Allman 스타일 유지
- 코드 각 줄에 짧은 한글 명사형 주석 유지

---

### Task 1: Fusion data and traversal API

**Files:**
- Create: `public/project_eta/ProjectEtaFusionData.mjs`
- Modify: `tests/project-eta-page.test.mjs`

**Interfaces:**
- Produces: `PIECES`, `FUSION_RECIPES`, `getPieceById(id)`, `findPieces(query, grade)`, `getFusionRelations(pieceId, includeHidden)`, `getReachablePieceIds(pieceId, includeHidden)`
- Consumes: 첨부 명세의 81종 기물명과 66개 명시 레시피

- [x] **Step 1: Write the failing data and traversal tests**

```js
test("합성 도감은 81종 기물과 63개 공개 조합을 제공한다", () => // 전체 합성망 회귀 검사
{ // 테스트 시작
    assert.equal(PIECES.length, 81); // 전체 기물 수 검증
    assert.equal(FUSION_RECIPES.filter((recipe) => !recipe.hidden).length, 63); // 공개 조합 수 검증
}); // 테스트 끝

test("성기사 선택은 재료와 상위 합성 결과를 함께 반환한다", () => // 연결 관계 회귀 검사
{ // 테스트 시작
    const relations = getFusionRelations("paladin", false); // 성기사 연결 조회
    assert.deepEqual(relations.createdBy.map((recipe) => recipe.id), ["archbishop-man-paladin"]); // 제작 조합 검증
    assert.deepEqual(relations.usedIn.map((recipe) => recipe.result).sort(), ["grand-cleric", "guardian-captain"]); // 상위 결과 검증
}); // 테스트 끝
```

- [x] **Step 2: Run test to verify RED**

Run: `node --test tests/project-eta-page.test.mjs`
Expected: FAIL with missing `ProjectEtaFusionData.mjs` exports.

- [x] **Step 3: Implement the data and pure traversal functions**

Implement literal `PIECES` and `FUSION_RECIPES` arrays from the supplied tables. Normalize searches with lowercase Korean/English name matching, return immutable arrays, and traverse recipe inputs/results without generating undisclosed recipes.

- [x] **Step 4: Run test to verify GREEN**

Run: `node --test tests/project-eta-page.test.mjs`
Expected: PASS.

### Task 2: Interactive atlas interface

**Files:**
- Modify: `public/project_eta/ProjectEta_Main.html`
- Modify: `public/project_eta/ProjectEta_Style.css`
- Modify: `public/project_eta/ProjectEta.mjs`
- Modify: `tests/project-eta-page.test.mjs`

**Interfaces:**
- Consumes: Task 1 data and traversal exports
- Produces: 검색, 등급 필터, 5열 기물 트리, 관련 노드 강조, SVG 연결선, 상세 조합 패널, 숨김 레시피 경고 모달

- [x] **Step 1: Write the failing atlas contract test**

```js
test("합성 도감 화면은 검색·등급·트리·상세·스포일러 제어를 제공한다", async () => // 도감 UI 계약 검사
{ // 테스트 시작
    const html = await readFile(new URL("../public/project_eta/ProjectEta_Main.html", import.meta.url), "utf8"); // 상세 페이지 읽기
    assert.match(html, /PIECE &amp; FUSION ATLAS/); // 도감 제목 검증
    assert.match(html, /id="fusion-search"/); // 검색 입력 검증
    assert.match(html, /id="fusion-tree"/); // 합성 트리 검증
    assert.match(html, /id="fusion-detail"/); // 상세 패널 검증
    assert.match(html, /id="spoiler-dialog"/); // 스포일러 경고 검증
}); // 테스트 끝
```

- [x] **Step 2: Run test to verify RED**

Run: `node --test tests/project-eta-page.test.mjs`
Expected: FAIL because the atlas controls do not exist.

- [x] **Step 3: Implement semantic HTML and responsive CSS**

Replace the old five-tab browser with accessible search, grade buttons, 5-column tree, SVG connector layer, relation detail panel, and custom dialog. Keep the visual language consistent with the black, ivory, blue, red, and gold Project η page.

- [x] **Step 4: Implement browser interactions**

Render all visible nodes with `textContent`, select nodes by stable IDs, draw only selected-related recipe lines, dim unrelated nodes, support Korean/English search, update `?piece=` without page reload, and require confirmation before revealing specified hidden recipes.

- [x] **Step 5: Run focused and full verification**

Run: `node --test tests/project-eta-page.test.mjs`
Expected: PASS.

Run: `node --test tests/*.test.mjs`
Expected: PASS with zero failures.

- [x] **Step 6: Verify desktop and mobile layouts**

Open: `http://127.0.0.1:3000/project_eta/ProjectEta_Main.html?piece=paladin#pieces`
Expected: 성기사 선택, 제작 조합과 상위 결과 표시, 관련 노드와 연결선 강조, 390px 모바일 단일 열 상세 배치.
