import { FEATURED_PROJECT_IDS, getFilterGenre, getGameProject } from "./game-projects.mjs"; // 공개 프로젝트 데이터

export const FEATURED_GAME_IDS = FEATURED_PROJECT_IDS; // 기존 추천 이름 호환

function normalizeSearchValue(value) // 검색 값 정리
{ // 함수 시작
    return String(value ?? "").trim().toLocaleLowerCase("ko-KR"); // 공백과 대소문자 정리
} // 함수 끝

export function getGameSearchText(game, translator = globalThis.__devforgeI18n?.translator) // 언어별 검색 문구
{ // 함수 시작
    const base = game?.searchText ?? game?.name ?? ""; // 원문 검색 문구
    if (!translator || !Array.isArray(game?.searchParts)) // 영어 번역 사용 확인
    { // 조건 시작
        return base; // 원문만 반환
    } // 조건 끝
    return [base, ...game.searchParts.map((part) => translator.translate(part) ?? "")].join(" "); // 원문과 영어 함께 반환
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
        const gameSearchText = normalizeSearchValue(getGameSearchText(game, options.translator)); // 게임 검색 문구 정리
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

export const CATALOG_PAGE_SIZE = 12; // 한 번에 표시할 프로젝트 수
export const MAX_SEARCH_LENGTH = 60; // 주소 검색어 최대 길이

export function parseCatalogParams(search, allowed = {}) // 주소 검색 조건 읽기
{ // 함수 시작
    let params = null; // 주소 매개변수
    try // 매개변수 해석 시도
    { // 시도 시작
        params = new URLSearchParams(typeof search === "string" ? search : ""); // 검색 문자열 해석
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        params = new URLSearchParams(); // 빈 매개변수
    } // 오류 처리 끝
    const genres = allowed.genres ?? []; // 허용 장르 목록
    const statuses = allowed.statuses ?? []; // 허용 상태 목록
    const genre = params.get("genre") ?? "all"; // 장르 값
    const status = params.get("status") ?? "all"; // 상태 값
    return Object.freeze( // 정리된 조건 반환
    { // 객체 시작
        query: (params.get("q") ?? "").trim().slice(0, MAX_SEARCH_LENGTH), // 길이 제한 검색어
        genre: genres.includes(genre) ? genre : "all", // 허용 장르만 사용
        status: statuses.includes(status) ? status : "all", // 허용 상태만 사용
    }); // 객체 끝
} // 함수 끝

export function serializeCatalogParams(state) // 검색 조건 주소 문자열 생성
{ // 함수 시작
    const params = new URLSearchParams(); // 새 매개변수
    const query = String(state?.query ?? "").trim(); // 정리된 검색어
    if (query) // 검색어 확인
    { // 조건 시작
        params.set("q", query.slice(0, MAX_SEARCH_LENGTH)); // 검색어 저장
    } // 조건 끝
    if (state?.genre && state.genre !== "all") // 장르 조건 확인
    { // 조건 시작
        params.set("genre", state.genre); // 장르 저장
    } // 조건 끝
    if (state?.status && state.status !== "all") // 상태 조건 확인
    { // 조건 시작
        params.set("status", state.status); // 상태 저장
    } // 조건 끝
    const text = params.toString(); // 매개변수 문자열
    return text ? "?" + text : ""; // 주소 검색 문자열 반환
} // 함수 끝

export function describeActiveFilters(state, labels = {}) // 적용 조건 요약
{ // 함수 시작
    const filters = []; // 적용 조건 목록
    const query = String(state?.query ?? "").trim(); // 정리된 검색어
    if (query) // 검색어 확인
    { // 조건 시작
        filters.push(Object.freeze({ key: "query", label: "검색: \"" + query + "\"" })); // 검색 조건 추가
    } // 조건 끝
    if (state?.genre && state.genre !== "all") // 장르 조건 확인
    { // 조건 시작
        filters.push(Object.freeze({ key: "genre", label: "장르: " + (labels.genres?.[state.genre] ?? state.genre) })); // 장르 조건 추가
    } // 조건 끝
    if (state?.status && state.status !== "all") // 상태 조건 확인
    { // 조건 시작
        filters.push(Object.freeze({ key: "status", label: "개발 상태: " + (labels.statuses?.[state.status] ?? state.status) })); // 상태 조건 추가
    } // 조건 끝
    return Object.freeze(filters); // 적용 조건 반환
} // 함수 끝

export function formatResultCount(total, overall) // 결과 수 문구
{ // 함수 시작
    return total === overall ? total + "개 프로젝트" : total + "개 프로젝트 · 전체 " + overall + "개 중"; // 결과 수 반환
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
    const genre = project ? getFilterGenre(project) : card.dataset.genre ?? "other"; // 필터용 대표 장르 결정(필터에 없는 장르는 기타)
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
        searchParts: project ? [project.title, project.tagline] : [], // 영어 화면 검색용 원문 조각
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

export function initializeGameCatalog(root = document, view = globalThis) // 게임 목록 화면 초기화
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
    const activeFilters = root.querySelector("[data-game-active-filters]"); // 적용 조건 영역 조회
    const resetButtons = Array.from(root.querySelectorAll("[data-game-reset]")); // 조건 초기화 버튼 조회

    if (cards.length === 0 || !featuredGrid || !searchInput || genreButtons.length === 0 || statusButtons.length === 0 || !resultCount || !emptyMessage || !loadMoreButton) // 필수 요소 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝

    const games = cards.map(createGameRecord); // 카드 검색 정보 생성
    const allowed = { genres: genreButtons.map((button) => button.dataset.genreFilter), statuses: statusButtons.map((button) => button.dataset.statusFilter) }; // 허용 조건 목록
    const labels = { genres: Object.fromEntries(genreButtons.map((button) => [button.dataset.genreFilter, button.textContent.trim()])), statuses: Object.fromEntries(statusButtons.map((button) => [button.dataset.statusFilter, button.textContent.trim()])) }; // 조건 표시 이름
    const state = // 목록 상태
    { // 객체 시작
        ...parseCatalogParams(view.location?.search ?? "", allowed), // 주소 검색 조건
        limit: CATALOG_PAGE_SIZE, // 최초 표시 수
    }; // 객체 끝
    searchInput.value = state.query; // 주소 검색어 입력칸 반영

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
        const catalogView = buildGameCatalogView(games, state); // 현재 목록 계산
        const visibleIds = new Set(catalogView.visible.map((game) => game.id)); // 표시 식별자 집합

        for (const game of games) // 게임 반복
        { // 반복 시작
            game.card.hidden = !visibleIds.has(game.id); // 카드 표시 상태 반영
        } // 반복 끝

        const filters = describeActiveFilters(state, labels); // 적용 조건 요약
        resultCount.textContent = formatResultCount(catalogView.total, games.length); // 결과 개수 표시
        emptyMessage.hidden = catalogView.total !== 0; // 빈 결과 안내 표시
        loadMoreButton.hidden = !catalogView.hasMore; // 더 보기 표시
        setActiveFilter(genreButtons, state.genre, "genreFilter"); // 장르 버튼 상태 반영
        setActiveFilter(statusButtons, state.status, "statusFilter"); // 상태 버튼 상태 반영
        renderActiveFilters(filters); // 적용 조건 표시
        for (const button of resetButtons) // 초기화 버튼 반복
        { // 반복 시작
            if (!button.closest?.("[data-game-empty]")) // 요약 줄 버튼 확인
            { // 조건 시작
                button.hidden = filters.length === 0; // 조건 없을 때 숨김
            } // 조건 끝
        } // 반복 끝
        return catalogView; // 현재 화면 반환
    } // 함수 끝

    function renderActiveFilters(filters) // 적용 조건 칩 표시
    { // 함수 시작
        if (!activeFilters) // 요약 영역 확인
        { // 조건 시작
            return; // 표시 생략
        } // 조건 끝
        const chips = filters.map((filter) => // 조건 칩 생성
        { // 생성 시작
            const chip = root.createElement("button"); // 조건 해제 버튼
            chip.type = "button"; // 일반 버튼 형식
            chip.className = "game-filter-chip"; // 조건 칩 스타일
            chip.dataset.removeFilter = filter.key; // 해제 대상 조건
            chip.textContent = filter.label + " ×"; // 조건 문구
            chip.setAttribute("aria-label", filter.label + " 조건 해제"); // 접근성 이름
            return chip; // 조건 칩 반환
        }); // 생성 끝
        activeFilters.replaceChildren(...chips); // 조건 칩 교체
        activeFilters.hidden = chips.length === 0; // 빈 요약 숨김
    } // 함수 끝

    function resetLimit() // 표시 수 초기화
    { // 함수 시작
        state.limit = CATALOG_PAGE_SIZE; // 첫 페이지 표시
    } // 함수 끝

    function syncUrl() // 주소 검색 조건 갱신
    { // 함수 시작
        const location = view.location; // 현재 주소
        if (!location || typeof view.history?.replaceState !== "function") // 주소 기록 지원 확인
        { // 조건 시작
            return; // 갱신 생략
        } // 조건 끝
        const nextUrl = location.pathname + serializeCatalogParams(state) + (location.hash || "#games"); // 다음 주소
        if (nextUrl !== location.pathname + location.search + location.hash) // 주소 변경 확인
        { // 조건 시작
            view.history.replaceState(view.history.state ?? null, "", nextUrl); // 기록 추가 없는 주소 교체
        } // 조건 끝
    } // 함수 끝

    function update() // 조건 변경 반영
    { // 함수 시작
        resetLimit(); // 표시 수 초기화
        render(); // 목록 갱신
        syncUrl(); // 주소 갱신
    } // 함수 끝

    searchInput.addEventListener("input", () => // 검색 입력 처리
    { // 처리 시작
        state.query = searchInput.value.slice(0, MAX_SEARCH_LENGTH); // 검색어 저장
        update(); // 조건 반영
    }); // 처리 끝

    for (const button of genreButtons) // 장르 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 장르 선택 처리
        { // 처리 시작
            state.genre = button.dataset.genreFilter; // 장르 저장
            update(); // 조건 반영
        }); // 처리 끝
    } // 반복 끝

    for (const button of statusButtons) // 상태 버튼 반복
    { // 반복 시작
        button.addEventListener("click", () => // 상태 선택 처리
        { // 처리 시작
            state.status = button.dataset.statusFilter; // 상태 저장
            update(); // 조건 반영
        }); // 처리 끝
    } // 반복 끝

    loadMoreButton.addEventListener("click", () => // 더 보기 처리
    { // 처리 시작
        state.limit += CATALOG_PAGE_SIZE; // 표시 수 확장
        render(); // 목록 갱신
    }); // 처리 끝

    function resetAll() // 전체 조건 초기화
    { // 함수 시작
        state.query = ""; // 검색어 초기화
        state.genre = "all"; // 장르 초기화
        state.status = "all"; // 상태 초기화
        searchInput.value = ""; // 입력칸 비우기
        update(); // 조건 반영
        searchInput.focus?.(); // 검색 입력 초점 이동
    } // 함수 끝

    for (const button of resetButtons) // 초기화 버튼 반복
    { // 반복 시작
        button.addEventListener("click", resetAll); // 전체 초기화 연결
    } // 반복 끝

    activeFilters?.addEventListener("click", (event) => // 조건 칩 해제 처리
    { // 처리 시작
        const chip = event.target?.closest?.("[data-remove-filter]"); // 해제 칩 조회
        if (!chip) // 칩 확인
        { // 조건 시작
            return; // 관련 없는 클릭 종료
        } // 조건 끝
        const key = chip.dataset.removeFilter; // 해제 대상 조건
        state[key] = key === "query" ? "" : "all"; // 대상 조건 초기화
        if (key === "query") // 검색어 해제 확인
        { // 조건 시작
            searchInput.value = ""; // 입력칸 비우기
        } // 조건 끝
        update(); // 조건 반영
        (activeFilters.querySelector("[data-remove-filter]") ?? searchInput).focus?.(); // 다음 칩 또는 검색칸 초점
    }); // 처리 끝

    view.addEventListener?.("popstate", () => // 기록 이동 처리
    { // 처리 시작
        Object.assign(state, parseCatalogParams(view.location?.search ?? "", allowed)); // 주소 조건 복원
        searchInput.value = state.query; // 입력칸 복원
        resetLimit(); // 표시 수 초기화
        render(); // 목록 갱신
    }); // 처리 끝

    const controller = Object.freeze({ render, resetAll }); // 목록 제어기 생성
    root.__devforgeGameCatalog = controller; // 제어기 저장
    render(); // 최초 화면 표시
    return controller; // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeGameCatalog(document, window), { once: true }); // 준비 후 초기화
    } // 조건 끝
    else // 준비 완료 확인
    { // 대안 시작
        initializeGameCatalog(document, window); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
