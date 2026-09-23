import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 프로젝트 공개 데이터

function escapeHtml(value) // HTML 특수 문자 처리
{ // 함수 시작
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;"); // 안전 문구 반환
} // 함수 끝

function developmentLabel(status) // 개발 상태 문구 변환
{ // 함수 시작
    return ({ developing: "개발 중", planning: "기획", paused: "보류" })[status] ?? "상태 확인 중"; // 상태 문구 반환
} // 함수 끝

function publicationLabel(status) // 공개 상태 문구 변환
{ // 함수 시작
    return ({ featured: "대표 프로젝트", developing: "개발 중 공개", planning: "기획 단계" })[status] ?? "공개 준비 중"; // 공개 문구 반환
} // 함수 끝

function genreLabel(genre) // 장르 표시 문구 변환
{ // 함수 시작
    const labels = Object.freeze({ strategy: "전략", srpg: "SRPG", rpg: "RPG", puzzle: "퍼즐", roguelike: "로그라이크", card: "카드", "tower-defense": "타워 디펜스", ccg: "CCG", action: "액션", fps: "FPS", story: "스토리", rhythm: "리듬", exploration: "탐사", "battle-royale": "배틀로얄", survivor: "생존", "open-world": "오픈월드", "match-three": "3매치", shooting: "슈팅", racing: "레이싱", survival: "생존", "mini-game": "미니게임", sandbox: "샌드박스", management: "경영", horror: "공포", metroidvania: "메트로배니아", mobile: "모바일", simulation: "시뮬레이션", dungeon: "던전", digging: "지형 변화", chess: "체스", gaze: "관찰", risk: "위험 판단", other: "기타" }); // 장르 문구 표
    return labels[genre] ?? genre; // 장르 문구 반환
} // 함수 끝

function renderFeatures(project) // 핵심 특징 HTML 생성
{ // 함수 시작
    if (project.features.length === 0) // 특징 없음 확인
    { // 조건 시작
        return ""; // 빈 특징 반환
    } // 조건 끝

    const cards = project.features.map((feature, index) => `                    <article class="project-feature-card"><span>0${index + 1}</span><p>${escapeHtml(feature)}</p></article> <!-- 핵심 특징 카드 -->`).join("\n"); // 특징 카드 생성
    return `            <section class="project-section" id="features"> <!-- 특징 영역 -->
                <p class="project-kicker">CORE FEATURES</p> <!-- 특징 영문 제목 -->
                <h2>핵심 특징</h2> <!-- 특징 제목 -->
                <div class="project-feature-grid"> <!-- 특징 카드 목록 -->
${cards}
                </div> <!-- 특징 카드 목록 끝 -->
            </section> <!-- 특징 영역 끝 -->`; // 특징 영역 반환
} // 함수 끝

export function renderProjectHtml(project) // 프로젝트 공개 HTML 생성
{ // 함수 시작
    if (!project || project.layout !== "common") // 공통 프로젝트 확인
    { // 조건 시작
        throw new TypeError("공통 프로젝트 정보가 필요합니다."); // 잘못된 입력 거부
    } // 조건 끝

    const mode = project.publicationStatus === "planning" ? "planning" : "published"; // 공개 화면 모드
    const genres = project.genres.map((genre) => `<span>${escapeHtml(genreLabel(genre))}</span>`).join(""); // 장르 태그 생성
    const planningNotice = mode === "planning" ? `            <section class="project-planning" aria-labelledby="planning-title"> <!-- 준비 안내 영역 -->
                <p class="project-kicker">IN DEVELOPMENT</p> <!-- 준비 상태 영문 -->
                <h2 id="planning-title">새로운 정보가 준비되는 대로 공개됩니다</h2> <!-- 준비 안내 제목 -->
                <p>현재 공개 가능한 콘셉트와 개발 상태만 안내하고 있습니다.</p> <!-- 준비 안내 설명 -->
            </section> <!-- 준비 안내 영역 끝 -->` : ""; // 준비 안내 생성
    const featureSection = renderFeatures(project); // 특징 영역 생성
    const loginReturn = encodeURIComponent(project.detailPath); // 로그인 복귀 주소 생성

    return `<!DOCTYPE html> <!-- HTML5 문서 형식 -->
<html lang="ko"> <!-- 한국어 문서 -->
<head> <!-- 문서 정보 시작 -->
    <meta charset="UTF-8"> <!-- 한글 인코딩 -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0"> <!-- 반응형 화면 -->
    <meta name="description" content="${escapeHtml(project.tagline)}"> <!-- 검색 설명 -->
    <title>${escapeHtml(project.title)} | 게임 소개</title> <!-- 브라우저 제목 -->
    <link rel="stylesheet" href="/project-page.css"> <!-- 공개 소개 스타일 -->
    <link rel="stylesheet" href="/device-preview-control.css"> <!-- 기기 선택 스타일 -->
    <link rel="stylesheet" href="/responsive-shell.css"> <!-- 공통 반응형 스타일 -->
</head> <!-- 문서 정보 끝 -->
<body data-responsive-page="project"> <!-- 화면 내용 시작 -->
    <div class="project-page" data-public-project-page data-project-id="${escapeHtml(project.id)}" data-project-mode="${mode}"> <!-- 공개 프로젝트 루트 -->
        <nav class="project-nav" aria-label="주요 메뉴" data-responsive-nav-root> <!-- 공통 상단 메뉴 -->
            <a class="project-logo" href="/main.html">DEVFORGE</a> <!-- 메인 이동 -->
            <div class="project-nav-links"> <!-- 주요 메뉴 목록 -->
                <a href="/main.html#games">게임</a> <!-- 게임 목록 이동 -->
                <a href="/goods.html">굿즈</a> <!-- 굿즈 이동 -->
                <a href="/devlog.html">개발 뉴스</a> <!-- 뉴스 이동 -->
                <a href="/community.html">커뮤니티</a> <!-- 커뮤니티 이동 -->
            </div> <!-- 주요 메뉴 목록 끝 -->
            <div class="project-nav-actions"> <!-- 계정 메뉴 묶음 -->
                <a class="project-button project-button-ghost" href="/main.html#contact">문의하기</a> <!-- 문의 이동 -->
                <a class="project-button" href="/login?returnTo=${loginReturn}" data-member-action>로그인</a> <!-- 로그인 이동 -->
            </div> <!-- 계정 메뉴 묶음 끝 -->
        </nav> <!-- 공통 상단 메뉴 끝 -->
        <main> <!-- 주요 내용 시작 -->
            <section class="project-hero"> <!-- 대표 소개 영역 -->
                <div class="project-hero-media"> <!-- 대표 이미지 영역 -->
                    <img src="${escapeHtml(project.heroImage)}" alt="${escapeHtml(project.title)} 대표 콘셉트 이미지" data-project-hero-image> <!-- 대표 이미지 -->
                    <div class="project-image-fallback" data-project-image-fallback hidden aria-label="${escapeHtml(project.title)} 이미지 준비 중"><strong>${escapeHtml(project.symbol)}</strong><span>IMAGE COMING SOON</span></div> <!-- 이미지 대체 영역 -->
                </div> <!-- 대표 이미지 영역 끝 -->
                <div class="project-hero-copy"> <!-- 대표 문구 영역 -->
                    <p class="project-kicker">${escapeHtml(project.symbol)} · DEVFORGE PROJECT</p> <!-- 프로젝트 분류 -->
                    <h1 data-project-title>${escapeHtml(project.title)}</h1> <!-- 프로젝트 제목 -->
                    <p class="project-tagline">${escapeHtml(project.tagline)}</p> <!-- 한 문장 소개 -->
                    <div class="project-tags">${genres}</div> <!-- 장르 목록 -->
                    <dl class="project-meta"> <!-- 프로젝트 상태 목록 -->
                        <div><dt>개발 상태</dt><dd>${developmentLabel(project.developmentStatus)}</dd></div> <!-- 개발 상태 -->
                        <div><dt>공개 상태</dt><dd>${publicationLabel(project.publicationStatus)}</dd></div> <!-- 공개 상태 -->
                    </dl> <!-- 프로젝트 상태 목록 끝 -->
                </div> <!-- 대표 문구 영역 끝 -->
            </section> <!-- 대표 소개 영역 끝 -->
            <section class="project-section" id="overview"> <!-- 프로젝트 개요 -->
                <p class="project-kicker">OVERVIEW</p> <!-- 개요 영문 제목 -->
                <h2>게임 소개</h2> <!-- 개요 제목 -->
                <p>${escapeHtml(project.summary)}</p> <!-- 공개 요약 -->
            </section> <!-- 프로젝트 개요 끝 -->
${featureSection}
${planningNotice}
            <section class="project-links" aria-label="관련 페이지"> <!-- 관련 페이지 영역 -->
                <a class="project-link-card" href="/devlog.html"><span>개발 과정</span><strong>개발 뉴스 보기 →</strong></a> <!-- 뉴스 연결 -->
                <a class="project-link-card" href="/community.html?game=${escapeHtml(project.id)}"><span>이야기 나누기</span><strong>커뮤니티 보기 →</strong></a> <!-- 커뮤니티 연결 -->
                <a class="project-link-card" href="/main.html#games"><span>다른 프로젝트</span><strong>게임 목록으로 →</strong></a> <!-- 게임 목록 연결 -->
            </section> <!-- 관련 페이지 영역 끝 -->
        </main> <!-- 주요 내용 끝 -->
        <footer class="project-footer"><p>${escapeHtml(project.title)} · DEVFORGE Studio</p></footer> <!-- 하단 정보 -->
    </div> <!-- 공개 프로젝트 루트 끝 -->
    <script type="module" src="/project-page.mjs"></script> <!-- 공개 페이지 기능 -->
    <script type="module" src="/responsive-nav.mjs"></script> <!-- 공통 반응형 메뉴 -->
    <script type="module" src="/privacy-consent.mjs"></script> <!-- 개인정보 동의 연결 -->
    <script type="module" src="/site-analytics.mjs"></script> <!-- 동의 기반 분석 연결 -->
</body> <!-- 화면 내용 끝 -->
</html> <!-- HTML 문서 끝 -->
`; // 완성 HTML 반환
} // 함수 끝

export async function generateProjectPages(outputRoot = "public") // 공통 프로젝트 페이지 생성
{ // 함수 시작
    const commonProjects = GAME_PROJECTS.filter((project) => project.layout === "common"); // 공통 프로젝트 선택

    for (const project of commonProjects) // 공통 프로젝트 반복
    { // 반복 시작
        const outputPath = path.join(outputRoot, project.detailPath.slice(1)); // 출력 경로 생성
        await fs.promises.mkdir(path.dirname(outputPath), { recursive: true }); // 프로젝트 폴더 생성
        await fs.promises.writeFile(outputPath, renderProjectHtml(project), "utf8"); // 공개 HTML 저장
    } // 반복 끝

    return commonProjects.length; // 생성 페이지 수 반환
} // 함수 끝

const currentModulePath = fileURLToPath(import.meta.url); // 현재 모듈 경로
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""; // 실행 파일 경로

if (executedPath === currentModulePath) // 직접 실행 확인
{ // 조건 시작
    const generatedCount = await generateProjectPages("public"); // 공개 페이지 생성
    console.log(`${generatedCount}개 공통 공개 페이지 생성 완료`); // 생성 결과 출력
} // 조건 끝
