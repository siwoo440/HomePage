import { FEATURED_PROJECT_IDS, getGameProject } from "./game-projects.mjs"; // 공개 프로젝트 데이터

export const FEATURED_GAME_IDS = FEATURED_PROJECT_IDS; // 기존 추천 이름 호환

function normalizeSearchValue(value) // 검색 값 정리
{ // 함수 시작
    return String(value ?? "").trim().toLocaleLowerCase("ko-KR"); // 공백과 대소문자 정리
} // 함수 끝

export function buildGameCatalogView(games, options = {}) // 게임 목록 화면 계산
{ // 함수 시작
    const safeGames = Array.isArray(games) ? games : []; // 안전 게임 목록
    const query = normalizeSearchValue(options.query); // 검색어 정리
    const genre = options.genre ?? "all"; // 장르 기본값
    const status = options.status ?? "all"; // 상태 기본값
    const requestedLimit = Number.isFinite(options.limit) ? Math.floor(options.limit) : 12; // 표시 수 정리
    const limit = Math.max(0, requestedLimit); // 음수 표시 수 차단
    const matching = safeGames.filter((game) => // 조건 일치 게임 계산
    { // 필터 시작
        const gameSearchText = normalizeSearchValue(game.searchText ?? game.name); // 게임 검색 문구 정리
        const matchesQuery = query.length === 0 || gameSearchText.includes(query); // 검색어 일치 판정
        const matchesGenre = genre === "all" || game.genre === genre; // 장르 일치 판정
        const matchesStatus = status === "all" || game.status === status; // 상태 일치 판정
        return matchesQuery && matchesGenre && matchesStatus; // 전체 조건 결과 반환
    }); // 필터 끝
    const visible = matching.slice(0, limit); // 표시 게임 제한
    return Object.freeze( // 화면 정보 반환
    { // 객체 시작
        matching: Object.freeze(matching), // 전체 검색 결과
        visible: Object.freeze(visible), // 현재 표시 결과
        total: matching.length, // 검색 결과 수
        hasMore: visible.length < matching.length, // 추가 결과 여부
    }); // 객체 끝
} // 함수 끝

export function selectFeaturedGames(games, featuredIds = FEATURED_GAME_IDS) // 추천 프로젝트 선택
{ // 함수 시작
    const safeGames = Array.isArray(games) ? games : []; // 안전 게임 목록
    const gameById = new Map(safeGames.map((game) => [game.id, game])); // 식별자별 게임 저장
    return Object.freeze(featuredIds.map((id) => gameById.get(id)).filter(Boolean).slice(0, 6)); // 승인 순서 추천 반환
} // 함수 끝

function getGameId(card, index) // 카드 식별자 조회
{ // 함수 시작
    if (card.id) // 기존 식별자 확인
    { // 조건 시작
        return card.id; // 기존 식별자 반환
    } // 조건 끝

    const addressText = card.getAttribute?.("href") ?? card.getAttribute?.("onclick") ?? ""; // 카드 이동 주소 읽기
    const projectMatch = addressText.match(/project_([a-z]+)\//i); // 프로젝트 경로 추출
    return projectMatch ? "project-" + projectMatch[1].toLocaleLowerCase("en-US") : "project-card-" + index; // 경로 식별자 반환
} // 함수 끝

function getGameStatus(card) // 카드 개발 상태 조회
{ // 함수 시작
    const statusElement = card.querySelector?.(".game-status"); // 상태 요소 조회
    const className = statusElement?.className ?? ""; // 상태 클래스 읽기

    if (className.includes("status-paused")) // 보류 상태 확인
    { // 조건 시작
        return "paused"; // 보류 반환
    } // 조건 끝

    if (className.includes("status-upcoming")) // 기획 상태 확인
    { // 조건 시작
        return "planning"; // 기획 반환
    } // 조건 끝

    return "developing"; // 개발 중 반환
} // 함수 끝

function createGameRecord(card, index) // 카드 검색 정보 생성
{ // 함수 시작
    const id = getGameId(card, index); // 카드 식별자 조회
    const project = getGameProject(id); // 공개 프로젝트 조회
    const nameElement = card.querySelector?.(".game-name"); // 프로젝트명 요소 조회
    const statusElement = card.querySelector?.(".game-platform .platform-tag"); // 공개 상태 요소 조회
    const name = project?.title ?? nameElement?.textContent?.trim() ?? "프로젝트"; // 공개 프로젝트명 결정
    const genre = project?.genres?.[0] ?? card.dataset.genre ?? "other"; // 대표 장르 결정
    const status = project?.developmentStatus ?? getGameStatus(card); // 개발 상태 결정
    const statusLabel = project?.publicationStatus === "featured" ? "대표 프로젝트" : status === "developing" ? "개발 중" : "기획 단계"; // 공개 상태 문구 결정

    if (nameElement) // 프로젝트명 요소 확인
    { // 조건 시작
        nameElement.textContent = name; // 공개 프로젝트명 반영
    } // 조건 끝
    if (statusElement) // 상태 요소 확인
    { // 조건 시작
        statusElement.textContent = statusLabel; // 공개 상태 문구 반영
    } // 조건 끝
    if (project) // 공개 프로젝트 확인
    { // 조건 시작
        card.dataset.genre = genre; // 공개 장르 반영
        card.dataset.projectId = project.id; // 공개 식별자 반영
        if (card.tagName === "A") // 링크 카드 확인
        { // 조건 시작
            card.setAttribute("href", project.detailPath); // 공개 상세 주소 반영
        } // 조건 끝
        else // 일반 카드 확인
        { // 대안 시작
            card.setAttribute?.("onclick", `window.location.href='${project.detailPath}'`); // 공개 상세 주소 반영
        } // 대안 끝
        if (project.adultOnly) // 성인 프로젝트 확인
        { // 조건 시작
            card.dataset.adultGame = project.id; // 성인 식별자 반영
        } // 조건 끝
        else // 일반 프로젝트 확인
        { // 대안 시작
            delete card.dataset.adultGame; // 불필요 성인 표시 제거
        } // 대안 끝
    } // 조건 끝
    return Object.freeze( // 게임 정보 반환
    { // 객체 시작
        id, // 카드 식별자
        name, // 프로젝트명
        genre, // 장르 정보
        status, // 개발 상태
        searchText: project ? `${project.title} ${project.tagline} ${project.genres.join(" ")}` : card.textContent ?? name, // 통합 검색 문구
        card, // 원본 카드
    }); // 객체 끝
} // 함수 끝

function setActiveFilter(buttons, selectedValue, dataName) // 필터 버튼 상태 갱신
{ // 함수 시작
    for (const button of buttons) // 버튼 반복
    { // 반복 시작
        const isActive = button.dataset[dataName] === selectedValue; // 선택 상태 판정
        button.classList.toggle("active", isActive); // 활성 디자인 반영
        button.setAttribute("aria-pressed", String(isActive)); // 접근성 선택 상태 반영
    } // 반복 끝
} // 함수 끝

export function initializeGameCatalog(root = document) // 게임 목록 화면 초기화
{ // 함수 시작
    if (root.__devforgeGameCatalog) // 기존 제어기 확인
    { // 조건 시작
        return root.__devforgeGameCatalog; // 기존 제어기 반환
    } // 조건 끝

    const cards = Array.from(root.querySelectorAll("[data-all-games] .game-card")); // 전체 게임 카드 조회
    const featuredGrid = root.querySelector("[data-featured-games]"); // 추천 게임 영역 조회
    const searchInput = root.querySelector("[data-game-search]"); // 검색 입력 조회
    const genreButtons = Array.from(root.querySelectorAll("[data-genre-filter]")); // 장르 필터 조회
    const statusButtons = Array.from(root.querySelectorAll("[data-status-filter]")); // 상태 필터 조회
    const resultCount = root.querySelector("[data-game-result-count]"); // 결과 개수 조회
    const emptyMessage = root.querySelector("[data-game-empty]"); // 빈 결과 안내 조회
    const loadMoreButton = root.querySelector("[data-game-load-more]"); // 더 보기 버튼 조회

    if (cards.length === 0 || !featuredGrid || !searchInput || genreButtons.length === 0 || statusButtons.length === 0 || !resultCount || !emptyMessage || !loadMoreButton) // 필수 요소 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝

    const games = cards.map(createGameRecord); // 카드 검색 정보 생성
    const state = // 목록 상태
    { // 객체 시작
        query: "", // 검색어 상태
        genre: "all", // 장르 상태
        status: "all", // 개발 상태
        limit: 12, // 최초 표시 수
    }; // 객체 끝

    for (const game of selectFeaturedGames(games)) // 추천 게임 반복
    { // 반복 시작
        const clone = game.card.cloneNode(true); // 추천 카드 복제
        clone.removeAttribute?.("id"); // 중복 식별자 제거
        clone.dataset.featuredGame = game.id; // 추천 식별자 저장
        clone.classList.remove("reveal"); // 지연 등장 제거
        clone.classList.add("visible", "game-card-featured"); // 추천 카드 표시
        clone.hidden = false; // 추천 카드 숨김 해제
        featuredGrid.append(clone); // 추천 영역 추가
    } // 반복 끝

    function render() // 목록 화면 갱신
    { // 함수 시작
        const view = buildGameCatalogView(games, state); // 현재 목록 계산
        const visibleIds = new Set(view.visible.map((game) => game.id)); // 표시 식별자 집합

        for (const game of games) // 게임 반복
        { // 반복 시작
            game.card.hidden = !visibleIds.has(game.id); // 카드 표시 상태 반영
        } // 반복 끝

        resultCount.textContent = view.total + "개 프로젝트"; // 결과 개수 표시
        emptyMessage.hidden = view.total !== 0; // 빈 결과 안내 표시
        loadMoreButton.hidden = !view.hasMore; // 더 보기 표시
        setActiveFilter(genreButtons, state.genre, "genreFilter"); // 장르 버튼 상태 반영
        setActiveFilter(statusButtons, state.status, "statusFilter"); // 상태 버튼 상태 반영
        return view; // 현재 화면 반환
    } // 함수 끝

    function resetLimit() // 표시 수 초기화
    { // 함수 시작
        state.limit = 12; // 첫 페이지 표시
    } // 함수 끝

    searchInput.addEventListener("input", () => // 검색 입력 처리
    { // 처리 시작
        state.query = searchInput.value; // 검색어 저장
        resetLimit(); // 표시 수 초기화
        render(); // 목록 갱신
    }); // 처리 끝

    for (const button of genreButtons) // 장르 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 장르 선택 처리
        { // 처리 시작
            state.genre = button.dataset.genreFilter; // 장르 저장
            resetLimit(); // 표시 수 초기화
            render(); // 목록 갱신
        }); // 처리 끝
    } // 반복 끝

    for (const button of statusButtons) // 상태 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 상태 선택 처리
        { // 처리 시작
            state.status = button.dataset.statusFilter; // 상태 저장
            resetLimit(); // 표시 수 초기화
            render(); // 목록 갱신
        }); // 처리 끝
    } // 반복 끝

    loadMoreButton.addEventListener("click", () => // 더 보기 처리
    { // 처리 시작
        state.limit += 12; // 표시 수 확장
        render(); // 목록 갱신
    }); // 처리 끝

    const controller = Object.freeze({ render }); // 목록 제어기 생성
    root.__devforgeGameCatalog = controller; // 제어기 저장
    render(); // 최초 화면 표시
    return controller; // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeGameCatalog(document), { once: true }); // 준비 후 초기화
    } // 조건 끝
    else // 준비 완료 확인
    { // 대안 시작
        initializeGameCatalog(document); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
