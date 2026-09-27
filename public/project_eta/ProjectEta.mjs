import { FUSION_RECIPES, PIECES, findPathToGradeFive, findPieces, getFusionRelations, getPieceById } from "./ProjectEtaFusionData.mjs"; // 합성 도감 데이터

export const PIECE_TIERS = Object.freeze( // 대표 기물 목록
[ // 목록 시작
    Object.freeze({ tier: 1, tierLabel: "TIER I", name: "폰", role: "VANGUARD", symbol: "♙", hp: 4, atk: 2, ability: "전진할수록 다음 공격이 강해지는 기본 전열 기물.", move: "● 전진 · ■ 공격 · □ 이동 가능" }), // 1성 기물
    Object.freeze({ tier: 2, tierLabel: "TIER II", name: "나이트", role: "ASSAULT", symbol: "♘", hp: 7, atk: 4, ability: "다른 기물을 뛰어넘어 예상하지 못한 각도에서 진입하는 돌격 기물.", move: "● 현재 위치 · ■ 도약 공격 · □ 착지 가능" }), // 2성 기물
    Object.freeze({ tier: 3, tierLabel: "TIER III", name: "아크비숍", role: "HYBRID", symbol: "♞", hp: 10, atk: 6, ability: "비숍의 대각선 제어와 나이트의 도약을 함께 사용하는 합성 기물.", move: "● 현재 위치 · ■ 대각 공격 · □ 도약 가능" }), // 3성 기물
    Object.freeze({ tier: 4, tierLabel: "TIER IV", name: "캐슬 가디언", role: "FORTRESS", symbol: "♖", hp: 16, atk: 7, ability: "아군의 진로를 보호하고 직선 전체를 통제하는 고등급 방어 기물.", move: "● 현재 위치 · ■ 직선 제압 · □ 방벽 범위" }), // 4성 기물
    Object.freeze({ tier: 5, tierLabel: "TIER V", name: "이터널 퀸", role: "SOVEREIGN", symbol: "♕", hp: 22, atk: 11, ability: "보드 전체의 흐름을 바꾸는 최종 등급 지배 기물.", move: "● 현재 위치 · ■ 전방위 공격 · □ 지휘 범위" }), // 5성 기물
]); // 목록 끝

export function getPieceByTier(tier) // 등급별 기물 찾기
{ // 함수 시작
    return PIECE_TIERS.find((piece) => piece.tier === Number(tier)) ?? null; // 일치 기물 반환
} // 함수 끝

function setText(root, selector, value) // 안전한 글자 갱신
{ // 함수 시작
    const element = root.querySelector(selector); // 대상 요소 찾기

    if (element) // 대상 존재 확인
    { // 조건 시작
        element.textContent = String(value); // 안전한 글자 적용
    } // 조건 끝
} // 함수 끝

export function applyPieceTier(tier, root = document) // 선택 등급 화면 적용
{ // 함수 시작
    const piece = getPieceByTier(tier); // 선택 기물 찾기

    if (!piece) // 기물 없음 확인
    { // 조건 시작
        return false; // 적용 실패 반환
    } // 조건 끝

    setText(root, "#piece-symbol", piece.symbol); // 기물 기호 갱신
    setText(root, "#piece-tier", piece.tierLabel); // 기물 등급 갱신
    setText(root, "#piece-role", piece.role); // 기물 역할 갱신
    setText(root, "#piece-name", piece.name); // 기물 이름 갱신
    setText(root, "#piece-hp", piece.hp); // 기물 체력 갱신
    setText(root, "#piece-atk", piece.atk); // 기물 공격력 갱신
    setText(root, "#piece-ability", piece.ability); // 기물 능력 갱신
    setText(root, "#piece-move", piece.move); // 이동 범위 갱신

    for (const button of root.querySelectorAll("[data-piece-tier]")) // 등급 버튼 반복
    { // 반복 시작
        const isSelected = Number(button.dataset.pieceTier) === piece.tier; // 선택 버튼 확인
        button.classList.toggle("is-active", isSelected); // 선택 스타일 전환
        button.setAttribute("aria-selected", String(isSelected)); // 접근성 선택 상태
    } // 반복 끝

    return true; // 적용 성공 반환
} // 함수 끝

function initializePieceBrowser(root = document) // 기물 탐색기 초기화
{ // 함수 시작
    for (const button of root.querySelectorAll("[data-piece-tier]")) // 등급 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 버튼 클릭 연결
        { // 클릭 처리 시작
            applyPieceTier(button.dataset.pieceTier, root); // 선택 등급 적용
        }); // 클릭 처리 끝
    } // 반복 끝
} // 함수 끝

function createTextElement(tagName, className, textValue) // 글자 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 요소 생성
    element.className = className; // 요소 클래스 지정
    element.textContent = String(textValue); // 안전한 글자 지정
    return element; // 생성 요소 반환
} // 함수 끝

function getVisibleRecipes(includeHidden) // 표시 합성식 조회
{ // 함수 시작
    return FUSION_RECIPES.filter((recipe) => includeHidden || !recipe.hidden); // 숨김 조건 적용
} // 함수 끝

function getSelectedRecipes(pieceId, includeHidden) // 선택 기물 합성식 조회
{ // 함수 시작
    const relations = getFusionRelations(pieceId, includeHidden); // 직접 연결 조회
    const finalPath = findPathToGradeFive(pieceId, includeHidden); // 최종 경로 조회
    const pathRecipes = []; // 경로 합성식 목록
    const recipes = getVisibleRecipes(includeHidden); // 표시 합성식 목록

    for (let index = 0; index < finalPath.length - 1; index += 1) // 경로 단계 반복
    { // 반복 시작
        const currentId = finalPath[index]; // 현재 경로 기물
        const nextId = finalPath[index + 1]; // 다음 경로 기물
        const matchingRecipe = recipes.find((recipe) => recipe.result === nextId && (recipe.materialA === currentId || recipe.materialB === currentId)); // 연결 합성식 찾기

        if (matchingRecipe) // 합성식 존재 확인
        { // 조건 시작
            pathRecipes.push(matchingRecipe); // 경로 합성식 추가
        } // 조건 끝
    } // 반복 끝

    return Object.freeze(Array.from(new Map([...relations.createdBy, ...relations.usedIn, ...pathRecipes].map((recipe) => [recipe.id, recipe])).values())); // 중복 없는 합성식 반환
} // 함수 끝

function getHighlightedIds(pieceId, includeHidden) // 강조 기물 조회
{ // 함수 시작
    const ids = new Set([pieceId]); // 강조 식별자 집합

    for (const recipe of getSelectedRecipes(pieceId, includeHidden)) // 선택 합성식 반복
    { // 반복 시작
        ids.add(recipe.materialA); // 첫 재료 강조
        ids.add(recipe.materialB); // 둘째 재료 강조
        ids.add(recipe.result); // 결과 강조
    } // 반복 끝

    return ids; // 강조 집합 반환
} // 함수 끝

function createPieceNode(pieceData, state, selectPiece) // 기물 노드 생성
{ // 함수 시작
    const button = document.createElement("button"); // 노드 버튼 생성
    button.className = "fusion-node"; // 노드 클래스 지정
    button.type = "button"; // 버튼 유형 지정
    button.dataset.pieceId = pieceData.id; // 기물 식별자 저장
    button.setAttribute("aria-pressed", String(state.selectedId === pieceData.id)); // 선택 상태 지정
    button.append(createTextElement("span", "fusion-node-symbol", pieceData.symbol)); // 기물 기호 추가
    const nameBox = document.createElement("span"); // 이름 묶음 생성
    nameBox.className = "fusion-node-name"; // 이름 묶음 클래스
    nameBox.append(createTextElement("strong", "", pieceData.nameKo)); // 한국어 이름 추가
    nameBox.append(createTextElement("small", "", pieceData.nameEn)); // 영어 이름 추가
    button.append(nameBox); // 이름 묶음 추가
    button.addEventListener("click", () => selectPiece(pieceData.id, true)); // 기물 선택 연결
    return button; // 기물 노드 반환
} // 함수 끝

function renderTree(root, state, selectPiece) // 합성 트리 렌더링
{ // 함수 시작
    const columns = root.querySelector("#fusion-columns"); // 등급 열 영역 찾기

    if (!columns) // 등급 열 없음 확인
    { // 조건 시작
        return; // 렌더링 중단
    } // 조건 끝

    columns.replaceChildren(); // 기존 열 제거
    const matchingIds = new Set(findPieces(state.query, state.grade).map((pieceData) => pieceData.id)); // 검색 일치 식별자
    const highlightedIds = getHighlightedIds(state.selectedId, state.includeHidden); // 강조 식별자

    for (let grade = 1; grade <= 5; grade += 1) // 등급별 반복
    { // 반복 시작
        const column = document.createElement("section"); // 등급 열 생성
        column.className = "fusion-column"; // 등급 열 클래스
        column.dataset.grade = String(grade); // 등급 값 저장
        const heading = createTextElement("h3", "fusion-column-title", `${grade}★`); // 등급 제목 생성
        heading.append(createTextElement("small", "", `${PIECES.filter((pieceData) => pieceData.grade === grade).length} PIECES`)); // 등급 수량 추가
        column.append(heading); // 등급 제목 추가
        const list = document.createElement("div"); // 노드 목록 생성
        list.className = "fusion-node-list"; // 노드 목록 클래스

        for (const pieceData of PIECES.filter((item) => item.grade === grade)) // 등급 기물 반복
        { // 기물 반복 시작
            const node = createPieceNode(pieceData, state, selectPiece); // 기물 노드 생성
            node.hidden = !matchingIds.has(pieceData.id); // 검색 불일치 숨김
            node.classList.toggle("is-selected", state.selectedId === pieceData.id); // 선택 강조 적용
            node.classList.toggle("is-related", highlightedIds.has(pieceData.id)); // 연결 강조 적용
            node.classList.toggle("is-muted", !highlightedIds.has(pieceData.id)); // 비연결 흐림 적용
            list.append(node); // 기물 노드 추가
        } // 기물 반복 끝

        column.append(list); // 노드 목록 추가
        columns.append(column); // 등급 열 추가
    } // 반복 끝
} // 함수 끝

function formatRecipe(recipeData) // 합성식 글자 생성
{ // 함수 시작
    const materialA = getPieceById(recipeData.materialA); // 첫 재료 조회
    const materialB = getPieceById(recipeData.materialB); // 둘째 재료 조회
    const result = getPieceById(recipeData.result); // 결과 조회
    const hiddenLabel = recipeData.hidden ? " · 숨김" : ""; // 숨김 표시 생성
    return `${materialA?.nameKo ?? "?"} + ${materialB?.nameKo ?? "?"} → ${result?.nameKo ?? "?"}${hiddenLabel}`; // 합성식 반환
} // 함수 끝

function renderRecipeList(container, recipes, emptyMessage) // 합성식 목록 렌더링
{ // 함수 시작
    container.replaceChildren(); // 기존 목록 제거

    if (recipes.length === 0) // 빈 목록 확인
    { // 조건 시작
        container.append(createTextElement("p", "empty-recipe", emptyMessage)); // 빈 안내 추가
        return; // 렌더링 종료
    } // 조건 끝

    for (const recipeData of recipes) // 합성식 반복
    { // 반복 시작
        const item = createTextElement("p", `recipe-row${recipeData.hidden ? " is-hidden-recipe" : ""}`, formatRecipe(recipeData)); // 합성식 행 생성
        container.append(item); // 합성식 행 추가
    } // 반복 끝
} // 함수 끝

function renderFinalPath(container, pieceId, includeHidden, selectPiece) // 최종 경로 렌더링
{ // 함수 시작
    const path = findPathToGradeFive(pieceId, includeHidden); // 최종 경로 조회
    container.replaceChildren(); // 기존 경로 제거

    if (path.length === 0) // 경로 없음 확인
    { // 조건 시작
        container.append(createTextElement("p", "empty-recipe", "현재 공개된 조합으로 도달 가능한 5성 경로가 없습니다.")); // 경로 없음 안내
        return; // 렌더링 종료
    } // 조건 끝

    for (const [index, pathId] of path.entries()) // 경로 기물 반복
    { // 반복 시작
        const pieceData = getPieceById(pathId); // 경로 기물 조회
        const button = createTextElement("button", "path-piece", pieceData?.nameKo ?? "?"); // 경로 기물 버튼 생성
        button.type = "button"; // 버튼 유형 지정
        button.addEventListener("click", () => selectPiece(pathId, true)); // 경로 기물 선택 연결
        container.append(button); // 경로 기물 추가

        if (index < path.length - 1) // 마지막 기물 이전 확인
        { // 조건 시작
            container.append(createTextElement("span", "path-arrow", "→")); // 경로 화살표 추가
        } // 조건 끝
    } // 반복 끝
} // 함수 끝

function renderDetail(root, state, selectPiece) // 선택 상세 렌더링
{ // 함수 시작
    const pieceData = getPieceById(state.selectedId) ?? PIECES[0]; // 선택 기물 조회
    const relations = getFusionRelations(pieceData.id, state.includeHidden); // 선택 관계 조회
    setText(root, "#detail-piece-symbol", pieceData.symbol); // 상세 기호 갱신
    setText(root, "#detail-piece-grade", `${pieceData.grade}★ PIECE`); // 상세 등급 갱신
    setText(root, "#detail-piece-name", pieceData.nameKo); // 상세 이름 갱신
    setText(root, "#detail-piece-en", pieceData.nameEn); // 상세 영문명 갱신
    renderRecipeList(root.querySelector("#created-by-list"), relations.createdBy, pieceData.grade === 1 ? "기본 기물은 합성 재료 없이 시작합니다." : "공개된 제작 조합이 없습니다."); // 제작 조합 렌더링
    renderRecipeList(root.querySelector("#used-in-list"), relations.usedIn, pieceData.grade === 5 ? "최종 등급 기물입니다." : "공개된 상위 조합이 없습니다."); // 상위 조합 렌더링
    renderFinalPath(root.querySelector("#final-path"), pieceData.id, state.includeHidden, selectPiece); // 최종 경로 렌더링
} // 함수 끝

function updateAtlasMeta(root, state) // 도감 상태 갱신
{ // 함수 시작
    const resultCount = findPieces(state.query, state.grade).length; // 검색 결과 수 계산
    const recipeCount = getVisibleRecipes(state.includeHidden).length; // 표시 조합 수 계산
    setText(root, "#fusion-count", `${resultCount}종 기물 · 표시 조합 ${recipeCount}개`); // 상태 문구 갱신
    const toggle = root.querySelector("#spoiler-toggle"); // 숨김 버튼 찾기
    toggle?.setAttribute("aria-pressed", String(state.includeHidden)); // 숨김 상태 갱신
    setText(root, "#spoiler-toggle span", state.includeHidden ? "ON" : "OFF"); // 숨김 상태 글자 갱신
} // 함수 끝

function createConnector(svg, sourceNode, targetNode, treeRect, hidden) // 연결선 생성
{ // 함수 시작
    const sourceRect = sourceNode.getBoundingClientRect(); // 시작 노드 위치
    const targetRect = targetNode.getBoundingClientRect(); // 끝 노드 위치
    const startX = sourceRect.right - treeRect.left; // 시작 가로 위치
    const startY = sourceRect.top + sourceRect.height / 2 - treeRect.top; // 시작 세로 위치
    const endX = targetRect.left - treeRect.left; // 끝 가로 위치
    const endY = targetRect.top + targetRect.height / 2 - treeRect.top; // 끝 세로 위치
    const curveX = Math.max(24, (endX - startX) * 0.48); // 곡선 제어 거리
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path"); // SVG 경로 생성
    path.setAttribute("d", `M ${startX} ${startY} C ${startX + curveX} ${startY}, ${endX - curveX} ${endY}, ${endX} ${endY}`); // 곡선 좌표 지정
    path.setAttribute("class", hidden ? "connector-line hidden-line" : "connector-line"); // 연결선 클래스 지정
    svg.append(path); // 연결선 추가
} // 함수 끝

function drawConnectors(root, state) // 선택 연결선 그리기
{ // 함수 시작
    const tree = root.querySelector("#fusion-tree"); // 트리 영역 찾기
    const columns = root.querySelector("#fusion-columns"); // 트리 열 찾기
    const svg = root.querySelector("#fusion-connectors"); // 연결선 영역 찾기

    if (!tree || !columns || !svg) // 필수 영역 확인
    { // 조건 시작
        return; // 그리기 중단
    } // 조건 끝

    svg.replaceChildren(); // 기존 연결선 제거
    svg.setAttribute("width", String(columns.scrollWidth)); // 연결선 너비 지정
    svg.setAttribute("height", String(columns.scrollHeight)); // 연결선 높이 지정
    svg.setAttribute("viewBox", `0 0 ${columns.scrollWidth} ${columns.scrollHeight}`); // 연결선 좌표계 지정
    const treeRect = tree.getBoundingClientRect(); // 트리 기준 위치

    for (const recipeData of getSelectedRecipes(state.selectedId, state.includeHidden)) // 선택 합성식 반복
    { // 반복 시작
        const resultNode = root.querySelector(`[data-piece-id="${recipeData.result}"]`); // 결과 노드 찾기
        const sourceIds = Array.from(new Set([recipeData.materialA, recipeData.materialB])); // 중복 없는 재료 식별자

        for (const sourceId of sourceIds) // 재료 식별자 반복
        { // 재료 반복 시작
            const sourceNode = root.querySelector(`[data-piece-id="${sourceId}"]`); // 재료 노드 찾기

            if (sourceNode && resultNode && !sourceNode.hidden && !resultNode.hidden) // 표시 노드 확인
            { // 표시 조건 시작
                createConnector(svg, sourceNode, resultNode, treeRect, recipeData.hidden); // 연결선 추가
            } // 표시 조건 끝
        } // 재료 반복 끝
    } // 합성식 반복 끝
} // 함수 끝

function updatePieceUrl(pieceId) // 선택 주소 갱신
{ // 함수 시작
    const url = new URL(window.location.href); // 현재 주소 생성
    url.searchParams.set("piece", pieceId); // 기물 검색값 지정
    window.history.replaceState({}, "", url); // 새 주소 기록
} // 함수 끝

function initializeFusionAtlas(root = document) // 합성 도감 초기화
{ // 함수 시작
    const atlas = root.querySelector("#fusion-tree"); // 합성 트리 찾기

    if (!atlas) // 합성 트리 없음 확인
    { // 조건 시작
        initializePieceBrowser(root); // 기존 탐색기 대체 실행
        return; // 초기화 종료
    } // 조건 끝

    const requestedId = new URL(window.location.href).searchParams.get("piece"); // 주소 기물 식별자
    const state = { selectedId: getPieceById(requestedId)?.id ?? "bishop", query: "", grade: 0, includeHidden: false }; // 도감 상태
    const render = () => // 전체 화면 렌더링
    { // 렌더링 시작
        renderTree(root, state, selectPiece); // 합성 트리 렌더링
        renderDetail(root, state, selectPiece); // 선택 상세 렌더링
        updateAtlasMeta(root, state); // 도감 상태 갱신
        window.requestAnimationFrame(() => drawConnectors(root, state)); // 연결선 지연 렌더링
    }; // 렌더링 끝
    const selectPiece = (pieceId, updateUrl = false) => // 기물 선택 처리
    { // 선택 처리 시작
        if (!getPieceById(pieceId)) // 유효 기물 확인
        { // 조건 시작
            return; // 잘못된 선택 차단
        } // 조건 끝

        state.selectedId = pieceId; // 선택 기물 갱신

        if (updateUrl) // 주소 갱신 확인
        { // 조건 시작
            updatePieceUrl(pieceId); // 선택 주소 갱신
        } // 조건 끝

        render(); // 화면 다시 그리기
    }; // 선택 처리 끝
    const search = root.querySelector("#fusion-search"); // 검색 입력 찾기
    search?.addEventListener("input", () => // 검색 입력 연결
    { // 검색 처리 시작
        state.query = search.value; // 검색어 갱신
        render(); // 화면 다시 그리기
    }); // 검색 처리 끝

    for (const button of root.querySelectorAll("[data-fusion-grade]")) // 등급 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 등급 선택 연결
        { // 등급 처리 시작
            state.grade = Number(button.dataset.fusionGrade); // 등급 상태 갱신

            for (const filterButton of root.querySelectorAll("[data-fusion-grade]")) // 등급 버튼 상태 반복
            { // 버튼 상태 반복 시작
                const isActive = Number(filterButton.dataset.fusionGrade) === state.grade; // 활성 버튼 확인
                filterButton.classList.toggle("is-active", isActive); // 활성 클래스 전환
                filterButton.setAttribute("aria-pressed", String(isActive)); // 접근성 상태 전환
            } // 버튼 상태 반복 끝

            render(); // 화면 다시 그리기
        }); // 등급 처리 끝
    } // 반복 끝

    const spoilerDialog = root.querySelector("#spoiler-dialog"); // 스포일러 창 찾기
    root.querySelector("#spoiler-toggle")?.addEventListener("click", () => // 숨김 버튼 연결
    { // 숨김 처리 시작
        if (state.includeHidden) // 숨김 표시 중 확인
        { // 표시 중 조건 시작
            state.includeHidden = false; // 숨김 조합 감추기
            render(); // 화면 다시 그리기
            return; // 처리 종료
        } // 표시 중 조건 끝

        spoilerDialog?.showModal(); // 스포일러 경고 열기
    }); // 숨김 처리 끝
    root.querySelector("#spoiler-reveal")?.addEventListener("click", () => // 숨김 공개 연결
    { // 숨김 공개 처리 시작
        state.includeHidden = true; // 숨김 표시 허용
        window.requestAnimationFrame(render); // 창 종료 뒤 화면 다시 그리기
    }); // 숨김 공개 처리 끝
    window.addEventListener("resize", () => drawConnectors(root, state)); // 화면 크기 연결선 갱신
    root.querySelector(".fusion-tree-shell")?.addEventListener("scroll", () => drawConnectors(root, state), { passive: true }); // 가로 이동 연결선 갱신
    render(); // 최초 화면 렌더링
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 브라우저 실행 시작
    initializeFusionAtlas(); // 합성 도감 시작
} // 브라우저 실행 끝
