import { getGameProject } from "./game-projects.mjs"; // 프로젝트 공개 데이터 조회

export function resolveProjectView(project) // 프로젝트 화면 계산
{ // 함수 시작
    if (!project) // 프로젝트 누락 확인
    { // 조건 시작
        return Object.freeze({ mode: "missing", title: "프로젝트를 찾을 수 없습니다", features: Object.freeze([]), heroImage: "", returnPath: "/main.html#games" }); // 누락 화면 반환
    } // 조건 끝

    const mode = project.publicationStatus === "planning" ? "planning" : "published"; // 공개 모드 판정
    return Object.freeze({ mode, title: project.title, features: project.features, heroImage: project.heroImage, returnPath: "/main.html#games" }); // 프로젝트 화면 반환
} // 함수 끝

export function initializeProjectPage(root = document) // 프로젝트 소개 화면 초기화
{ // 함수 시작
    const page = root.querySelector("[data-public-project-page]"); // 공개 페이지 루트 조회

    if (!page) // 공개 페이지 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝

    const project = getGameProject(page.dataset.projectId); // 프로젝트 공개 정보 조회
    const view = resolveProjectView(project); // 화면 정보 계산
    const image = page.querySelector("[data-project-hero-image]"); // 대표 이미지 조회
    const fallback = page.querySelector("[data-project-image-fallback]"); // 이미지 대체 영역 조회
    page.dataset.projectMode = view.mode; // 화면 모드 반영

    if (image && fallback) // 이미지 영역 확인
    { // 조건 시작
        image.addEventListener("error", () => // 이미지 오류 처리
        { // 처리 시작
            image.hidden = true; // 손상 이미지 숨김
            fallback.hidden = false; // 대체 영역 표시
        }, { once: true }); // 한 번만 처리
    } // 조건 끝

    return Object.freeze({ project, view }); // 초기화 결과 반환
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeProjectPage(document), { once: true }); // 준비 후 초기화
    } // 조건 끝
    else // 문서 준비 완료
    { // 대안 시작
        initializeProjectPage(document); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
