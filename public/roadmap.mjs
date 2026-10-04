import { FEATURED_PROJECT_IDS, GAME_PROJECTS, getFilterGenre, getGenreLabel, PRIMARY_GENRE_FILTERS } from "./game-projects.mjs"; // 공개 프로젝트 데이터

export const ROADMAP_STAGES = Object.freeze( // 개발 단계 묶음
[ // 목록 시작
    Object.freeze({ id: "featured", title: "대표 프로젝트" }), // 대표 단계
    Object.freeze({ id: "developing", title: "개발 중" }), // 개발 단계
    Object.freeze({ id: "planning", title: "기획" }), // 기획 단계
    Object.freeze({ id: "paused", title: "보류" }), // 보류 단계
]); // 목록 끝

export const ROADMAP_GENRE_FILTERS = Object.freeze(["all", ...PRIMARY_GENRE_FILTERS, "other"]); // 장르 필터 값

export function getRoadmapStage(project) // 프로젝트 개발 단계 판정
{ // 함수 시작
    if (project.developmentStatus === "paused" || project.developmentStatus === "planning") // 보류·기획 확인
    { // 조건 시작
        return project.developmentStatus; // 개발 상태 그대로 반환
    } // 조건 끝
    return FEATURED_PROJECT_IDS.includes(project.id) ? "featured" : "developing"; // 대표 또는 개발 중 반환
} // 함수 끝

export function parseRoadmapGenre(search) // 주소에서 장르 읽기
{ // 함수 시작
    const value = new URLSearchParams(search ?? "").get("genre"); // 주소 장르 값
    return ROADMAP_GENRE_FILTERS.includes(value) ? value : "all"; // 허용 값 또는 전체
} // 함수 끝

export function serializeRoadmapGenre(genre) // 장르를 주소 검색 값으로 변환
{ // 함수 시작
    return genre === "all" || !ROADMAP_GENRE_FILTERS.includes(genre) ? "" : `?genre=${genre}`; // 전체는 빈 값
} // 함수 끝

export function matchesRoadmapGenre(project, genre) // 장르 일치 판정
{ // 함수 시작
    return genre === "all" || getFilterGenre(project) === genre; // 전체 또는 대표 장르 일치
} // 함수 끝

export function buildRoadmapView(projects = GAME_PROJECTS, genre = "all") // 단계별 목록 계산
{ // 함수 시작
    const order = new Map(FEATURED_PROJECT_IDS.map((id, index) => [id, index])); // 대표 프로젝트 순서
    const stages = ROADMAP_STAGES.map((stage) => // 단계 반복
    { // 단계 시작
        const all = projects.filter((project) => getRoadmapStage(project) === stage.id); // 단계 전체 프로젝트
        const sorted = stage.id === "featured" ? [...all].sort((left, right) => order.get(left.id) - order.get(right.id)) : all; // 대표는 지정 순서
        return { ...stage, count: all.length, projects: sorted.filter((project) => matchesRoadmapGenre(project, genre)) }; // 단계 결과 반환
    }); // 단계 끝
    return { stages, total: stages.reduce((sum, stage) => sum + stage.projects.length, 0), overall: projects.length }; // 전체 결과 반환
} // 함수 끝

export function formatRoadmapResult(total, overall) // 결과 수 문구
{ // 함수 시작
    return total === overall ? total + "개 프로젝트" : total + "개 프로젝트 · 전체 " + overall + "개 중"; // 결과 수 반환
} // 함수 끝

function createElement(root, tagName, className, text) // 화면 요소 생성
{ // 함수 시작
    const element = root.createElement(tagName); // 새 요소
    element.className = className; // 디자인 클래스
    if (text !== undefined) // 문구 확인
    { // 조건 시작
        element.textContent = text; // 문구 반영
    } // 조건 끝
    return element; // 요소 반환
} // 함수 끝

function createProjectCard(root, project) // 프로젝트 카드 생성
{ // 함수 시작
    const card = createElement(root, "a", "roadmap-card"); // 카드 링크
    card.href = project.detailPath; // 소개 페이지 주소
    card.dataset.projectId = project.id; // 프로젝트 식별자
    const symbol = createElement(root, "span", "roadmap-symbol", project.symbol); // 프로젝트 기호
    symbol.setAttribute("aria-hidden", "true"); // 장식 표시
    const body = createElement(root, "span", "roadmap-card-body"); // 카드 내용
    body.append(createElement(root, "strong", "roadmap-name", project.title), createElement(root, "span", "roadmap-tagline", project.tagline)); // 이름과 한 줄 소개
    const genres = createElement(root, "span", "roadmap-genres"); // 장르 묶음
    for (const genre of project.genres) // 장르 반복
    { // 반복 시작
        genres.append(createElement(root, "span", "roadmap-genre", getGenreLabel(genre))); // 장르 이름표
    } // 반복 끝
    if (project.adultOnly) // 성인 프로젝트 확인
    { // 조건 시작
        genres.append(createElement(root, "span", "roadmap-genre roadmap-adult", "19+ 성인 확인 필요")); // 성인 확인 안내
    } // 조건 끝
    body.append(genres); // 장르 연결
    card.append(symbol, body); // 카드 조립
    return card; // 카드 반환
} // 함수 끝

export function initializeRoadmap(root = document, view = window) // 로드맵 화면 연결
{ // 함수 시작
    const host = root.querySelector("[data-roadmap-stages]"); // 단계 목록 영역
    const result = root.querySelector("[data-roadmap-result]"); // 결과 수 표시
    const buttons = Array.from(root.querySelectorAll("[data-roadmap-genre]")); // 장르 버튼
    if (!host || !result || buttons.length === 0) // 필수 요소 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝
    let genre = parseRoadmapGenre(view.location?.search); // 현재 장르

    function render() // 화면 그리기
    { // 함수 시작
        const viewModel = buildRoadmapView(GAME_PROJECTS, genre); // 단계별 목록
        for (const stage of viewModel.stages) // 단계 반복
        { // 반복 시작
            const section = host.querySelector(`[data-roadmap-stage="${stage.id}"]`); // 문서에 있는 단계 영역
            const grid = section?.querySelector("[data-roadmap-grid]"); // 카드 격자
            if (!section || !grid) // 단계 영역 확인
            { // 조건 시작
                continue; // 없는 단계 생략
            } // 조건 끝
            grid.replaceChildren(...stage.projects.map((project) => createProjectCard(root, project))); // 조건에 맞는 카드로 교체
            const stageCount = section.querySelector("[data-roadmap-stage-count]"); // 단계 프로젝트 수
            const empty = section.querySelector("[data-roadmap-empty]"); // 빈 단계 안내
            if (stageCount) // 수 표시 확인
            { // 조건 시작
                stageCount.textContent = String(stage.projects.length); // 조건에 맞는 수 반영
            } // 조건 끝
            if (empty) // 빈 안내 확인
            { // 조건 시작
                empty.hidden = stage.projects.length > 0; // 프로젝트가 없을 때만 표시
            } // 조건 끝
            const counter = root.querySelector(`[data-roadmap-count="${stage.id}"]`); // 요약 숫자
            if (counter) // 요약 요소 확인
            { // 조건 시작
                counter.textContent = String(stage.count); // 단계 전체 수 반영
            } // 조건 끝
        } // 반복 끝
        result.textContent = formatRoadmapResult(viewModel.total, viewModel.overall); // 결과 수 반영
        for (const button of buttons) // 버튼 반복
        { // 반복 시작
            button.setAttribute("aria-pressed", String(button.dataset.roadmapGenre === genre)); // 선택 상태 반영
        } // 반복 끝
    } // 함수 끝

    function onGenreClick(event) // 장르 선택 처리
    { // 함수 시작
        genre = ROADMAP_GENRE_FILTERS.includes(event.currentTarget.dataset.roadmapGenre) ? event.currentTarget.dataset.roadmapGenre : "all"; // 선택 장르 저장
        view.history?.replaceState?.(null, "", `${view.location.pathname}${serializeRoadmapGenre(genre)}${view.location.hash ?? ""}`); // 주소에 조건 저장
        render(); // 다시 그리기
    } // 함수 끝

    buttons.forEach((button) => button.addEventListener("click", onGenreClick)); // 장르 처리기 등록
    render(); // 처음 그리기
    return Object.freeze({ render, getGenre: () => genre }); // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 상태 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeRoadmap(document, window), { once: true }); // 준비 뒤 연결
    } // 조건 끝
    else // 준비 완료
    { // 대안 시작
        initializeRoadmap(document, window); // 즉시 연결
    } // 대안 끝
} // 조건 끝
