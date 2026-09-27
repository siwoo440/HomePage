import { FEATURED_PROJECT_IDS, GAME_PROJECTS } from "./game-projects.mjs"; // 프로젝트 공개 정보

export const FAVORITE_PROJECTS_KEY = "devforge_favorite_projects_v1"; // 즐겨찾기 저장 키
export const RECENT_PROJECTS_KEY = "devforge_recent_projects_v1"; // 최근 프로젝트 저장 키
export const MAX_RECENT_PROJECTS = 6; // 최근 프로젝트 최대 개수
const FAVORITE_FEEDBACK_DURATION = 2500; // 관심 안내 표시 시간

export function getFavoritePresentation(selected, projectTitle = "프로젝트") // 관심 표시 정보 생성
{ // 함수 시작
    const safeTitle = typeof projectTitle === "string" && projectTitle.trim() ? projectTitle.trim() : "프로젝트"; // 안전한 프로젝트 이름
    return Object.freeze( // 표시 정보 고정
    { // 표시 정보 시작
        symbol: selected ? "★" : "☆", // 선택별 별 아이콘
        label: selected ? `${safeTitle} 관심 목록에서 제거` : `${safeTitle} 관심 목록에 추가`, // 접근성 문구
        feedback: selected ? "관심 목록에 추가되었습니다." : "관심 목록에서 제거되었습니다.", // 하단 안내 문구
    }); // 표시 정보 끝
} // 함수 끝

export function sanitizeProjectIds(value, projects = GAME_PROJECTS) // 프로젝트 식별자 정리
{ // 함수 시작
    const allowedIds = new Set((Array.isArray(projects) ? projects : []).map((project) => project.id)); // 허용 식별자 목록
    const sourceIds = Array.isArray(value) ? value : []; // 안전 입력 목록
    return [...new Set(sourceIds.filter((id) => typeof id === "string" && allowedIds.has(id)))]; // 중복과 미등록 값 제거
} // 함수 끝

export function readProjectIds(storage, key, projects = GAME_PROJECTS) // 프로젝트 식별자 읽기
{ // 함수 시작
    try // 저장소 읽기 시도
    { // 시도 시작
        const value = storage?.getItem?.(key); // 저장값 조회
        return sanitizeProjectIds(value ? JSON.parse(value) : [], projects); // 안전 목록 반환
    } // 시도 끝
    catch // 읽기 실패 처리
    { // 오류 처리 시작
        return []; // 빈 목록 반환
    } // 오류 처리 끝
} // 함수 끝

function writeProjectIds(storage, key, ids) // 프로젝트 식별자 저장
{ // 함수 시작
    try // 저장 시도
    { // 시도 시작
        storage?.setItem?.(key, JSON.stringify(ids)); // 식별자 목록 저장
        return true; // 저장 성공 반환
    } // 시도 끝
    catch // 저장 실패 처리
    { // 오류 처리 시작
        return false; // 저장 실패 반환
    } // 오류 처리 끝
} // 함수 끝

export function toggleFavoriteProject(storage, id, projects = GAME_PROJECTS) // 즐겨찾기 전환
{ // 함수 시작
    const allowedIds = sanitizeProjectIds([id], projects); // 대상 식별자 확인

    if (allowedIds.length === 0) // 미등록 대상 확인
    { // 조건 시작
        return readProjectIds(storage, FAVORITE_PROJECTS_KEY, projects); // 기존 목록 반환
    } // 조건 끝

    const current = readProjectIds(storage, FAVORITE_PROJECTS_KEY, projects); // 기존 즐겨찾기 조회
    const next = current.includes(id) ? current.filter((projectId) => projectId !== id) : [...current, id]; // 다음 목록 계산
    writeProjectIds(storage, FAVORITE_PROJECTS_KEY, next); // 다음 목록 저장
    return next; // 다음 목록 반환
} // 함수 끝

export function recordRecentProject(storage, id, projects = GAME_PROJECTS) // 최근 프로젝트 기록
{ // 함수 시작
    const allowedIds = sanitizeProjectIds([id], projects); // 대상 식별자 확인

    if (allowedIds.length === 0) // 미등록 대상 확인
    { // 조건 시작
        return readProjectIds(storage, RECENT_PROJECTS_KEY, projects); // 기존 목록 반환
    } // 조건 끝

    const current = readProjectIds(storage, RECENT_PROJECTS_KEY, projects); // 기존 최근 목록 조회
    const next = [id, ...current.filter((projectId) => projectId !== id)].slice(0, MAX_RECENT_PROJECTS); // 최신 순서 계산
    writeProjectIds(storage, RECENT_PROJECTS_KEY, next); // 최근 목록 저장
    return next; // 최근 목록 반환
} // 함수 끝

export function clearProjectPreferences(storage) // 프로젝트 기록 삭제
{ // 함수 시작
    try // 삭제 시도
    { // 시도 시작
        storage?.removeItem?.(FAVORITE_PROJECTS_KEY); // 즐겨찾기 삭제
        storage?.removeItem?.(RECENT_PROJECTS_KEY); // 최근 목록 삭제
    } // 시도 끝
    catch // 삭제 실패 처리
    { // 오류 처리 시작
        return false; // 삭제 실패 반환
    } // 오류 처리 끝
    return true; // 삭제 성공 반환
} // 함수 끝

export function getProjectStatusCounts(projects) // 프로젝트 현황 계산
{ // 함수 시작
    const safeProjects = Array.isArray(projects) ? projects : []; // 안전 목록 생성
    const counts = // 현황 기본값
    { // 객체 시작
        total: safeProjects.length, // 전체 개수
        featured: safeProjects.filter((project) => FEATURED_PROJECT_IDS.includes(project.id)).length, // 대표 개수
        developing: 0, // 개발 중 개수
        planning: 0, // 기획 개수
        paused: 0, // 보류 개수
    }; // 객체 끝

    for (const project of safeProjects) // 프로젝트 반복
    { // 반복 시작
        if (project?.developmentStatus in counts) // 등록 상태 확인
        { // 조건 시작
            counts[project.developmentStatus] += 1; // 상태 개수 증가
        } // 조건 끝
    } // 반복 끝

    return Object.freeze(counts); // 고정 현황 반환
} // 함수 끝

function setText(root, selector, value) // 문구 설정
{ // 함수 시작
    const element = root.querySelector?.(selector); // 대상 요소 조회

    if (element) // 요소 존재 확인
    { // 조건 시작
        element.textContent = String(value); // 문구 반영
    } // 조건 끝
} // 함수 끝

function getSafeStorage(view) // 안전 저장소 조회
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        return view?.localStorage ?? null; // 저장소 반환
    } // 시도 끝
    catch // 접근 실패 처리
    { // 오류 처리 시작
        return null; // 저장소 없음 반환
    } // 오류 처리 끝
} // 함수 끝

function createShelfLink(root, project) // 보관함 링크 생성
{ // 함수 시작
    const link = root.createElement("a"); // 링크 요소 생성
    link.className = "shelf-project-link"; // 링크 스타일 설정
    link.href = project.detailPath; // 상세 주소 설정
    link.dataset.projectId = project.id; // 프로젝트 식별자 설정
    const title = root.createElement("strong"); // 제목 요소 생성
    title.textContent = project.title; // 프로젝트 제목 설정
    const summary = root.createElement("span"); // 설명 요소 생성
    summary.textContent = project.tagline; // 프로젝트 설명 설정
    link.append(title, summary); // 링크 내용 추가
    return link; // 링크 반환
} // 함수 끝

function renderShelfList(root, selector, emptySelector, ids) // 보관함 목록 표시
{ // 함수 시작
    const container = root.querySelector?.(selector); // 목록 요소 조회
    const emptyMessage = root.querySelector?.(emptySelector); // 빈 안내 조회

    if (!container) // 목록 없음 확인
    { // 조건 시작
        return; // 표시 중단
    } // 조건 끝

    container.replaceChildren(); // 기존 목록 제거
    const projectsById = new Map(GAME_PROJECTS.map((project) => [project.id, project])); // 프로젝트 조회표 생성

    for (const id of ids) // 식별자 반복
    { // 반복 시작
        const project = projectsById.get(id); // 프로젝트 조회

        if (project) // 프로젝트 존재 확인
        { // 조건 시작
            container.append(createShelfLink(root, project)); // 프로젝트 링크 추가
        } // 조건 끝
    } // 반복 끝

    if (emptyMessage) // 빈 안내 존재 확인
    { // 조건 시작
        emptyMessage.hidden = ids.length !== 0; // 빈 상태 반영
    } // 조건 끝
} // 함수 끝

function initializeProjectShelf(root, storage, view) // 프로젝트 보관함 초기화
{ // 함수 시작
    const favoriteButtons = []; // 즐겨찾기 버튼 목록
    const projectsById = new Map(GAME_PROJECTS.map((project) => [project.id, project])); // 프로젝트 조회표 생성
    const feedback = root.querySelector?.("[data-favorite-feedback]"); // 하단 안내 요소 조회
    const scheduleHide = typeof view?.setTimeout === "function" ? view.setTimeout.bind(view) : setTimeout; // 안내 종료 예약 도구
    const cancelHide = typeof view?.clearTimeout === "function" ? view.clearTimeout.bind(view) : clearTimeout; // 안내 종료 취소 도구
    let feedbackTimer = null; // 안내 종료 예약값

    function showFavoriteFeedback(selected) // 관심 결과 안내 표시
    { // 함수 시작
        if (!feedback) // 안내 요소 확인
        { // 조건 시작
            return; // 안내 생략
        } // 조건 끝

        const presentation = getFavoritePresentation(selected); // 선택 결과 표시 정보
        feedback.textContent = presentation.feedback; // 안내 문구 반영
        feedback.hidden = false; // 안내 표시
        feedback.classList?.add("is-visible"); // 표시 상태 적용

        if (feedbackTimer !== null) // 기존 예약 확인
        { // 조건 시작
            cancelHide(feedbackTimer); // 기존 예약 취소
        } // 조건 끝

        feedbackTimer = scheduleHide(() => // 안내 종료 예약
        { // 예약 처리 시작
            feedback.classList?.remove("is-visible"); // 표시 상태 제거
            feedback.hidden = true; // 안내 숨김
            feedbackTimer = null; // 예약값 초기화
        }, FAVORITE_FEEDBACK_DURATION); // 표시 시간 적용
    } // 함수 끝

    function render() // 보관함 갱신
    { // 함수 시작
        const favorites = readProjectIds(storage, FAVORITE_PROJECTS_KEY); // 즐겨찾기 조회
        const recent = readProjectIds(storage, RECENT_PROJECTS_KEY); // 최근 목록 조회
        renderShelfList(root, "[data-favorite-projects]", "[data-favorite-empty]", favorites); // 즐겨찾기 표시
        renderShelfList(root, "[data-recent-projects]", "[data-recent-empty]", recent); // 최근 목록 표시

        for (const button of favoriteButtons) // 즐겨찾기 버튼 반복
        { // 반복 시작
            const selected = favorites.includes(button.dataset.favoriteProject); // 선택 상태 판정
            const project = projectsById.get(button.dataset.favoriteProject); // 대상 프로젝트 조회
            const presentation = getFavoritePresentation(selected, project?.title); // 버튼 표시 정보 생성
            button.setAttribute("aria-pressed", String(selected)); // 선택 상태 반영
            button.setAttribute("aria-label", presentation.label); // 접근성 문구 반영
            button.title = presentation.label; // 마우스 도움말 반영
            button.textContent = presentation.symbol; // 별 아이콘 반영
        } // 반복 끝
    } // 함수 끝

    for (const card of root.querySelectorAll?.(".game-card[data-project-id]") ?? []) // 게임 카드 반복
    { // 반복 시작
        if (card.querySelector?.("[data-favorite-project]")) // 기존 버튼 확인
        { // 조건 시작
            continue; // 중복 생성 방지
        } // 조건 끝
        const button = root.createElement("button"); // 즐겨찾기 버튼 생성
        button.type = "button"; // 버튼 형식 설정
        button.className = "project-favorite-button"; // 버튼 스타일 설정
        button.dataset.favoriteProject = card.dataset.projectId; // 프로젝트 식별자 설정
        button.setAttribute("aria-pressed", "false"); // 초기 선택 상태
        button.addEventListener("click", (event) => // 즐겨찾기 선택 처리
        { // 처리 시작
            event.preventDefault(); // 기본 이동 차단
            event.stopPropagation(); // 카드 이동 차단
            const favorites = toggleFavoriteProject(storage, button.dataset.favoriteProject); // 즐겨찾기 전환
            const selected = favorites.includes(button.dataset.favoriteProject); // 변경 결과 확인
            render(); // 보관함 갱신
            showFavoriteFeedback(selected); // 변경 결과 안내
        }); // 처리 끝
        card.querySelector?.(".game-thumb")?.append(button); // 카드에 버튼 추가
        favoriteButtons.push(button); // 버튼 목록 추가
    } // 반복 끝

    root.addEventListener?.("click", (event) => // 카드 이동 기록 처리
    { // 처리 시작
        const card = event.target?.closest?.(".game-card[data-project-id]"); // 선택 카드 조회

        if (card && !event.target?.closest?.("[data-favorite-project]")) // 일반 카드 선택 확인
        { // 조건 시작
            recordRecentProject(storage, card.dataset.projectId); // 최근 프로젝트 기록
            render(); // 보관함 갱신
        } // 조건 끝
    }, true); // 이동 전 기록

    root.querySelector?.("[data-clear-project-preferences]")?.addEventListener("click", () => // 기록 삭제 처리
    { // 처리 시작
        clearProjectPreferences(storage); // 로컬 기록 삭제
        render(); // 보관함 갱신
    }); // 처리 끝
    render(); // 최초 보관함 표시
    return Object.freeze({ render }); // 보관함 제어기 반환
} // 함수 끝

export function initializeSiteExperience(root = document, view = window) // 사이트 경험 초기화
{ // 함수 시작
    const counts = getProjectStatusCounts(GAME_PROJECTS); // 프로젝트 현황 계산
    setText(root, "[data-current-year]", new Date().getFullYear()); // 현재 연도 표시
    setText(root, '[data-hero-stat="total"]', counts.total); // 전체 현황 표시
    setText(root, '[data-hero-stat="featured"]', counts.featured); // 대표 현황 표시
    setText(root, '[data-hero-stat="news"]', 4); // 공개 뉴스 개수 표시
    setText(root, '[data-project-status="developing"]', counts.developing); // 개발 중 현황 표시
    setText(root, '[data-project-status="planning"]', counts.planning); // 기획 현황 표시
    setText(root, '[data-project-status="paused"]', counts.paused); // 보류 현황 표시
    const storage = getSafeStorage(view); // 로컬 저장소 조회
    const shelf = storage ? initializeProjectShelf(root, storage, view) : null; // 프로젝트 보관함 초기화
    return Object.freeze({ counts, shelf, view }); // 초기화 결과 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    initializeSiteExperience(document, window); // 사이트 경험 초기화
} // 조건 끝
