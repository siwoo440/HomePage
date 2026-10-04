import { createDataStateController, requestJson, resolveCollectionState } from "./data-state.mjs"; // 공통 데이터 상태 도구

const TAG_LABELS = // 태그 표시 이름 시작
{ // 태그 표시 이름 객체
    update: "업데이트", // 업데이트 이름
    feature: "신기능", // 신기능 이름
    devlog: "데브로그", // 데브로그 이름
    fix: "버그픽스", // 버그픽스 이름
}; // 태그 표시 이름 끝

export const NEWS_TYPES = Object.freeze(["all", ...Object.keys(TAG_LABELS)]); // 뉴스 종류 값
export const MAX_NEWS_SEARCH_LENGTH = 60; // 주소 검색어 최대 길이

export function matchesNewsFilter(tags, selectedFilter) // 태그 일치 판정
{ // 판정 함수 시작
    return selectedFilter === "all" || tags.includes(selectedFilter); // 전체 또는 포함 태그 판정
} // 판정 함수 끝

export function shouldUseRemotePosts(response) // 원격 게시물 사용 판정
{ // 판정 함수 시작
    return resolveCollectionState(response, "posts") === "ready"; // 정상 원격 목록 확인
} // 판정 함수 끝

function normalizeSearchValue(value) // 검색 값 정리
{ // 함수 시작
    return String(value ?? "").trim().toLocaleLowerCase("ko-KR"); // 공백과 대소문자 정리
} // 함수 끝

export function parseNewsParams(search) // 주소 검색 조건 읽기
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
    const type = params.get("type") ?? "all"; // 종류 값
    return Object.freeze( // 정리된 조건 반환
    { // 객체 시작
        query: (params.get("q") ?? "").trim().slice(0, MAX_NEWS_SEARCH_LENGTH), // 길이 제한 검색어
        type: NEWS_TYPES.includes(type) ? type : "all", // 허용 종류만 사용
    }); // 객체 끝
} // 함수 끝

export function serializeNewsParams(state) // 검색 조건 주소 문자열 생성
{ // 함수 시작
    const params = new URLSearchParams(); // 새 매개변수
    const query = String(state?.query ?? "").trim(); // 정리된 검색어
    if (query) // 검색어 확인
    { // 조건 시작
        params.set("q", query.slice(0, MAX_NEWS_SEARCH_LENGTH)); // 검색어 저장
    } // 조건 끝
    if (state?.type !== "all" && NEWS_TYPES.includes(state?.type)) // 종류 조건 확인
    { // 조건 시작
        params.set("type", state.type); // 종류 저장
    } // 조건 끝
    const text = params.toString(); // 매개변수 문자열
    return text ? "?" + text : ""; // 주소 검색 문자열 반환
} // 함수 끝

export function getNewsSearchText(item, translator = globalThis.__devforgeI18n?.translator) // 언어별 검색 문구
{ // 함수 시작
    const labels = (item?.tags ?? []).map((tag) => TAG_LABELS[tag]).filter(Boolean); // 태그 표시 이름
    const parts = [item?.title, item?.summary, ...labels].filter((part) => typeof part === "string" && part.length > 0); // 원문 검색 조각
    if (!translator) // 영어 번역 사용 확인
    { // 조건 시작
        return parts.join(" "); // 원문만 반환
    } // 조건 끝
    return [...parts, ...parts.map((part) => translator.translate(part) ?? "")].join(" "); // 원문과 영어 함께 반환
} // 함수 끝

export function buildNewsView(items, state = {}, translator = globalThis.__devforgeI18n?.translator) // 뉴스 목록 화면 계산
{ // 함수 시작
    const safeItems = Array.isArray(items) ? items : []; // 안전 뉴스 목록
    const query = normalizeSearchValue(state.query); // 검색어 정리
    const type = NEWS_TYPES.includes(state.type) ? state.type : "all"; // 종류 기본값
    const visible = safeItems.filter((item) => // 조건 일치 뉴스 계산
    { // 필터 시작
        const matchesType = matchesNewsFilter(item.tags ?? [], type); // 종류 일치 판정
        const matchesQuery = query.length === 0 || normalizeSearchValue(getNewsSearchText(item, translator)).includes(query); // 검색어 일치 판정
        return matchesType && matchesQuery; // 전체 조건 결과 반환
    }); // 필터 끝
    return Object.freeze({ visible: Object.freeze(visible), total: visible.length, overall: safeItems.length }); // 화면 정보 반환
} // 함수 끝

export function describeNewsFilters(state) // 적용 조건 요약
{ // 함수 시작
    const filters = []; // 적용 조건 목록
    const query = String(state?.query ?? "").trim(); // 정리된 검색어
    if (query) // 검색어 확인
    { // 조건 시작
        filters.push(Object.freeze({ key: "query", label: "검색: \"" + query + "\"" })); // 검색 조건 추가
    } // 조건 끝
    if (state?.type && state.type !== "all" && TAG_LABELS[state.type]) // 종류 조건 확인
    { // 조건 시작
        filters.push(Object.freeze({ key: "type", label: "종류: " + TAG_LABELS[state.type] })); // 종류 조건 추가
    } // 조건 끝
    return Object.freeze(filters); // 적용 조건 반환
} // 함수 끝

export function formatNewsCount(total, overall) // 결과 수 문구
{ // 함수 시작
    return total === overall ? total + "개의 뉴스" : total + "개의 뉴스 · 전체 " + overall + "개 중"; // 결과 수 반환
} // 함수 끝

function readNewsTags(newsRow) // 뉴스 태그 읽기
{ // 읽기 함수 시작
    return (newsRow.dataset.tags ?? "").split(" ").filter(Boolean); // 공백 기준 태그 목록
} // 읽기 함수 끝

function readNewsItem(newsRow) // 뉴스 행 검색 정보 읽기
{ // 함수 시작
    return Object.freeze( // 검색 정보 반환
    { // 객체 시작
        row: newsRow, // 원본 뉴스 행
        tags: readNewsTags(newsRow), // 뉴스 태그
        title: newsRow.querySelector("h2")?.textContent?.trim() ?? "", // 번역 전 제목
        summary: newsRow.querySelector(".news-content p")?.textContent?.trim() ?? "", // 번역 전 요약
    }); // 객체 끝
} // 함수 끝

function formatPublishedDate(value) // 공개 날짜 표시
{ // 함수 시작
    const date = new Date(value); // 공개 날짜 객체

    if (Number.isNaN(date.getTime())) // 잘못된 날짜 확인
    { // 조건 시작
        return { year: "----", day: "--.--" }; // 빈 날짜 표시
    } // 조건 끝

    const year = String(date.getFullYear()); // 공개 연도
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 공개 월
    const day = String(date.getDate()).padStart(2, "0"); // 공개 일
    return { year, day: `${month}.${day}` }; // 날짜 표시 반환
} // 함수 끝

function createTextElement(tagName, className, text) // 글자 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 새 요소 생성
    element.className = className; // 요소 클래스 지정
    element.textContent = text; // 안전한 글자 지정
    return element; // 글자 요소 반환
} // 함수 끝

function createNewsRow(post, index) // 원격 뉴스 행 생성
{ // 함수 시작
    const row = document.createElement("a"); // 뉴스 링크 생성
    row.className = "news-row news-row-link"; // 뉴스 행 클래스
    row.href = `/news/${encodeURIComponent(post.id)}`; // 뉴스 상세 주소
    row.dataset.tags = Array.isArray(post.tags) ? post.tags.join(" ") : ""; // 필터 태그 저장
    const dateValue = formatPublishedDate(post.published_at); // 공개 날짜 표시
    const date = document.createElement("div"); // 날짜 영역 생성
    date.className = "news-date"; // 날짜 영역 클래스
    date.append(createTextElement("span", "", dateValue.year)); // 공개 연도 추가
    date.append(createTextElement("strong", "", dateValue.day)); // 공개 월일 추가
    const content = document.createElement("div"); // 뉴스 내용 생성
    content.className = "news-content"; // 뉴스 내용 클래스
    const tags = document.createElement("div"); // 태그 영역 생성
    tags.className = "news-tags"; // 태그 영역 클래스

    for (const tag of post.tags ?? []) // 게시물 태그 반복
    { // 반복 시작
        const label = TAG_LABELS[tag]; // 태그 표시 이름

        if (label) // 허용 태그 확인
        { // 조건 시작
            tags.append(createTextElement("span", `news-tag tag-${tag}`, label)); // 태그 표시 추가
        } // 조건 끝
    } // 반복 끝

    content.append(tags); // 태그 영역 추가
    content.append(createTextElement("h2", "", String(post.title ?? "제목 없는 뉴스"))); // 뉴스 제목 추가
    content.append(createTextElement("p", "", String(post.summary ?? ""))); // 뉴스 요약 추가
    row.append(date); // 날짜 영역 추가
    row.append(content); // 내용 영역 추가
    row.append(createTextElement("span", "news-index", String(index + 1).padStart(2, "0"))); // 뉴스 순번 추가
    return row; // 뉴스 행 반환
} // 함수 끝

function initializeDevelopmentNews() // 개발 뉴스 초기화
{ // 초기화 함수 시작
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]")); // 필터 버튼 목록
    const newsList = document.querySelector(".news-list"); // 뉴스 목록 영역
    const resultCount = document.querySelector("#result-count"); // 결과 개수 영역
    const emptyState = document.querySelector("#empty-state"); // 빈 결과 영역
    const searchInput = document.querySelector("[data-news-search]"); // 검색 입력칸
    const summary = document.querySelector("[data-news-summary]"); // 조건 요약 줄
    const activeFilters = document.querySelector("[data-news-active-filters]"); // 적용 조건 영역
    const resetButtons = Array.from(document.querySelectorAll("[data-news-reset]")); // 조건 초기화 버튼
    const stateController = createDataStateController(document.querySelector("#news-load-status")); // 원격 조회 상태 제어기
    const state = { ...parseNewsParams(window.location?.search ?? "") }; // 주소에서 읽은 현재 조건
    let newsItems = Array.from(document.querySelectorAll(".news-row")).map(readNewsItem); // 번역 전 뉴스 검색 정보
    let requestVersion = 0; // 최신 요청 번호

    function renderActiveFilters(filters) // 적용 조건 칩 표시
    { // 함수 시작
        if (!activeFilters) // 요약 영역 확인
        { // 조건 시작
            return; // 표시 생략
        } // 조건 끝
        const chips = filters.map((filter) => // 조건 칩 생성
        { // 생성 시작
            const chip = document.createElement("button"); // 조건 해제 버튼
            chip.type = "button"; // 일반 버튼 형식
            chip.className = "news-filter-chip"; // 조건 칩 스타일
            chip.dataset.removeFilter = filter.key; // 해제 대상 조건
            chip.textContent = filter.label + " ×"; // 조건 문구
            chip.setAttribute("aria-label", filter.label + " 조건 해제"); // 접근성 이름
            return chip; // 조건 칩 반환
        }); // 생성 끝
        activeFilters.replaceChildren(...chips); // 조건 칩 교체
        if (summary) // 요약 줄 확인
        { // 조건 시작
            summary.hidden = chips.length === 0; // 조건 없을 때 숨김
        } // 조건 끝
    } // 함수 끝

    function render() // 뉴스 목록 갱신
    { // 함수 시작
        const view = buildNewsView(newsItems, state); // 현재 목록 계산
        const visibleItems = new Set(view.visible); // 표시 뉴스 집합

        for (const item of newsItems) // 뉴스 반복
        { // 반복 시작
            item.row.hidden = !visibleItems.has(item); // 행 숨김 상태 반영
        } // 반복 끝

        for (const filterButton of filterButtons) // 필터 버튼 반복
        { // 버튼 반복 시작
            const isSelected = filterButton.dataset.filter === state.type; // 현재 버튼 선택 여부
            filterButton.classList.toggle("active", isSelected); // 활성 클래스 전환
            filterButton.setAttribute("aria-pressed", String(isSelected)); // 접근성 선택 상태
        } // 버튼 반복 끝

        if (resultCount) // 결과 개수 영역 확인
        { // 결과 개수 갱신 시작
            resultCount.textContent = formatNewsCount(view.total, view.overall); // 결과 개수 문구
        } // 결과 개수 갱신 끝

        if (emptyState) // 빈 결과 영역 확인
        { // 빈 결과 갱신 시작
            emptyState.hidden = view.total !== 0; // 결과 존재 여부 반영
        } // 빈 결과 갱신 끝

        renderActiveFilters(describeNewsFilters(state)); // 적용 조건 표시
    } // 함수 끝

    function syncUrl() // 주소 검색 조건 갱신
    { // 함수 시작
        const location = window.location; // 현재 주소
        if (!location || typeof window.history?.replaceState !== "function") // 주소 기록 지원 확인
        { // 조건 시작
            return; // 갱신 생략
        } // 조건 끝
        const nextUrl = location.pathname + serializeNewsParams(state) + (location.hash ?? ""); // 다음 주소
        if (nextUrl !== location.pathname + location.search + location.hash) // 주소 변경 확인
        { // 조건 시작
            window.history.replaceState(window.history.state ?? null, "", nextUrl); // 기록 추가 없는 주소 교체
        } // 조건 끝
    } // 함수 끝

    function update() // 조건 변경 반영
    { // 함수 시작
        render(); // 목록 갱신
        syncUrl(); // 주소 갱신
    } // 함수 끝

    function resetAll() // 전체 조건 초기화
    { // 함수 시작
        state.query = ""; // 검색어 초기화
        state.type = "all"; // 종류 초기화
        if (searchInput) // 입력칸 확인
        { // 조건 시작
            searchInput.value = ""; // 입력칸 비우기
        } // 조건 끝
        update(); // 조건 반영
        searchInput?.focus?.(); // 검색 입력 초점 이동
    } // 함수 끝

    for (const filterButton of filterButtons) // 필터 버튼 이벤트 반복
    { // 이벤트 반복 시작
        filterButton.addEventListener("click", () => // 클릭 이벤트 등록
        { // 클릭 처리 시작
            state.type = NEWS_TYPES.includes(filterButton.dataset.filter) ? filterButton.dataset.filter : "all"; // 선택 종류 저장
            update(); // 조건 반영
        }); // 클릭 처리 끝
    } // 이벤트 반복 끝

    if (searchInput) // 검색 입력칸 확인
    { // 조건 시작
        searchInput.value = state.query; // 주소 검색어 입력칸 반영
        searchInput.addEventListener("input", () => // 검색 입력 처리
        { // 처리 시작
            state.query = searchInput.value.slice(0, MAX_NEWS_SEARCH_LENGTH); // 검색어 저장
            update(); // 조건 반영
        }); // 처리 끝
    } // 조건 끝

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
        if (chip.dataset.removeFilter === "query") // 검색어 해제 확인
        { // 조건 시작
            state.query = ""; // 검색어 초기화
            if (searchInput) // 입력칸 확인
            { // 조건 시작
                searchInput.value = ""; // 입력칸 비우기
            } // 조건 끝
        } // 조건 끝
        else // 종류 해제
        { // 대안 시작
            state.type = "all"; // 종류 초기화
        } // 대안 끝
        update(); // 조건 반영
        (activeFilters.querySelector("[data-remove-filter]") ?? searchInput)?.focus?.(); // 다음 칩 또는 검색칸 초점
    }); // 처리 끝

    window.addEventListener?.("popstate", () => // 기록 이동 처리
    { // 처리 시작
        Object.assign(state, parseNewsParams(window.location?.search ?? "")); // 주소 조건 복원
        if (searchInput) // 입력칸 확인
        { // 조건 시작
            searchInput.value = state.query; // 입력칸 복원
        } // 조건 끝
        render(); // 목록 갱신
    }); // 처리 끝

    render(); // 주소 조건으로 초기 표시

    if (!newsList) // 뉴스 목록 없음 확인
    { // 조건 시작
        return; // 원격 조회 종료
    } // 조건 끝

    async function loadNews() // 공개 뉴스 조회
    { // 조회 함수 시작
        const currentVersion = ++requestVersion; // 현재 요청 번호
        stateController.show("loading", { title: "뉴스 확인 중", message: "등록된 최신 뉴스를 불러오고 있습니다." }); // 로딩 상태 표시

        try // 뉴스 조회 시도
        { // 시도 시작
            const response = await requestJson("/api/news"); // 공개 뉴스 요청

            if (currentVersion !== requestVersion) // 오래된 요청 확인
            { // 조건 시작
                return; // 오래된 결과 폐기
            } // 조건 끝

            const dataState = resolveCollectionState(response, "posts"); // 뉴스 응답 상태 판정

            if (dataState === "ready") // 실제 뉴스 확인
            { // 조건 시작
                const rows = response.posts.map((post, index) => createNewsRow(post, index)); // 원격 뉴스 행 생성
                newsItems = rows.map(readNewsItem); // 원격 뉴스 검색 정보 교체
                newsList.replaceChildren(...rows); // 기존 뉴스 목록 교체
                render(); // 현재 조건 재적용
                stateController.hide(); // 상태 안내 숨김
                return; // 성공 처리 종료
            } // 조건 끝

            if (dataState === "demo") // 시연 응답 확인
            { // 조건 시작
                stateController.show("demo", { title: "시연 뉴스 표시 중", message: "뉴스 서버 연결 전이라 준비된 시연 뉴스를 표시합니다." }); // 시연 상태 표시
                return; // 시연 처리 종료
            } // 조건 끝

            if (dataState === "empty") // 빈 뉴스 확인
            { // 조건 시작
                stateController.show("empty", { title: "등록된 뉴스가 없습니다", message: "현재는 준비된 시연 뉴스를 표시합니다.", onRetry: loadNews }); // 빈 결과 표시
                return; // 빈 결과 처리 종료
            } // 조건 끝

            throw new Error("NEWS_RESPONSE_INVALID"); // 잘못된 응답 발생
        } // 시도 끝
        catch (error) // 뉴스 조회 오류 처리
        { // 오류 처리 시작
            if (currentVersion !== requestVersion) // 오래된 오류 확인
            { // 조건 시작
                return; // 오래된 오류 폐기
            } // 조건 끝

            const message = error?.code === "DATA_TIMEOUT" ? "응답이 늦어 시연 뉴스를 유지합니다." : "뉴스 서버에 연결하지 못해 시연 뉴스를 유지합니다."; // 오류별 안내 문구
            stateController.show("error", { title: "뉴스 연결 확인 필요", message, onRetry: loadNews }); // 오류 상태 표시
        } // 오류 처리 끝
    } // 조회 함수 끝

    void loadNews(); // 첫 뉴스 조회 시작
} // 초기화 함수 끝

if (typeof document !== "undefined") // 브라우저 문서 환경 확인
{ // 브라우저 실행 시작
    initializeDevelopmentNews(); // 개발 뉴스 기능 시작
} // 브라우저 실행 끝
