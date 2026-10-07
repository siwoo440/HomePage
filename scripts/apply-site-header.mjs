import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { renderSiteHeader, SITE_HEADER_END, SITE_HEADER_START } from "./site-header.mjs"; // 공통 헤더 생성 도구

export const SITE_HEADER_STYLESHEET = '<link rel="stylesheet" href="/site-header.css"> <!-- 공통 상단 헤더 스타일 -->'; // 공통 헤더 스타일 연결

export const STATIC_HEADER_PAGES = Object.freeze( // 공통 헤더 적용 정적 페이지
[ // 목록 시작
    Object.freeze({ file: "main.html", current: "", offset: false }), // 메인
    Object.freeze({ file: "goods.html", current: "goods", offset: false }), // 굿즈
    Object.freeze({ file: "devlog.html", current: "news", offset: false }), // 개발 뉴스
    Object.freeze({ file: "community.html", current: "community", offset: false }), // 커뮤니티
    Object.freeze({ file: "contact.html", current: "contact", offset: true }), // 문의하기
    Object.freeze({ file: "roadmap.html", current: "", offset: false }), // 개발 로드맵
    Object.freeze({ file: "terms.html", current: "", offset: true }), // 이용약관
    Object.freeze({ file: "privacy.html", current: "", offset: true }), // 개인정보처리방침
    Object.freeze({ file: "project_b/ProjectB_Main.html", current: "games", offset: true, subnav: { title: "PROJECT B", label: "프로젝트 B 페이지 메뉴" } }), // 프로젝트 B
    Object.freeze({ file: "project_c/ProjectC_Main.html", current: "games", offset: true, subnav: { title: "CHAOSPONS", label: "카오스폰즈 페이지 메뉴" } }), // 프로젝트 C 메인
    Object.freeze({ file: "project_c/ProjectC_Cards.html", current: "games", offset: true, subnav: { title: "CHAOSPONS", label: "카오스폰즈 카드 페이지 메뉴" } }), // 프로젝트 C 카드
    Object.freeze({ file: "project_d/ProjectD_Main.html", current: "games", offset: true, subnav: { title: "BASTION", label: "바스티온 페이지 메뉴" } }), // 프로젝트 D 메인
    Object.freeze({ file: "project_d/characters.html", current: "games", offset: true, subnav: { title: "BASTION", label: "바스티온 캐릭터 페이지 메뉴" } }), // 프로젝트 D 캐릭터
    Object.freeze({ file: "project_d/factions.html", current: "games", offset: true, subnav: { title: "BASTION", label: "바스티온 세력 페이지 메뉴" } }), // 프로젝트 D 세력
    Object.freeze({ file: "project_h/ProjectH_Main.html", current: "games", offset: true, subnav: { title: "PROJECT H", label: "프로젝트 H 페이지 메뉴" } }), // 프로젝트 H
    Object.freeze({ file: "project_l/ProjectL_Main.html", current: "games", offset: true, subnav: { title: "PROJECT L", label: "프로젝트 L 페이지 메뉴" } }), // 프로젝트 L
    Object.freeze({ file: "project_eta/ProjectEta_Main.html", current: "games", offset: true, subnav: { title: "PROJECT η", label: "프로젝트 η 페이지 메뉴" } }), // 프로젝트 에타
]); // 목록 끝

function findLegacyHeader(html) // 기존 헤더 위치 찾기
{ // 함수 시작
    const rootIndex = html.indexOf("data-responsive-nav-root"); // 메뉴 기준 속성 위치
    if (rootIndex < 0) // 기준 속성 누락 확인
    { // 조건 시작
        throw new Error("공통 메뉴 기준 요소를 찾을 수 없습니다."); // 누락 오류
    } // 조건 끝
    const start = html.lastIndexOf("<", rootIndex); // 시작 태그 위치
    const tagName = html.slice(start + 1, html.indexOf(" ", start)); // 시작 태그 이름
    const closeIndex = html.indexOf(`</${tagName}>`, rootIndex); // 닫는 태그 위치
    const lineEnd = html.indexOf("\n", closeIndex); // 닫는 줄 끝
    const lineStart = html.lastIndexOf("\n", start) + 1; // 시작 줄 처음
    return { start: lineStart, end: lineEnd < 0 ? html.length : lineEnd, block: html.slice(start, closeIndex) }; // 헤더 범위 반환
} // 함수 끝

export function extractSubnavLinks(block) // 기존 페이지 내부 링크 추출
{ // 함수 시작
    return [...block.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)] // 링크 목록 조회
        .map(([, href, label]) => ({ href, label: label.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim() })) // 주소와 이름 정리
        .filter((link) => !/main\.html$/.test(link.href) && link.label !== "PALETTRA" && !link.label.startsWith("PALETTRA")); // 로고 링크 제외
} // 함수 끝

export function applySiteHeader(html, page) // 문서에 공통 헤더 적용
{ // 함수 시작
    const eol = html.includes("\r\n") ? "\r\n" : "\n"; // 기존 줄바꿈 형식
    let source = html.replace(/\r\n/g, "\n"); // 줄바꿈 정규화
    let subnavLinks = null; // 보조 메뉴 링크

    if (source.includes(SITE_HEADER_START)) // 기존 공통 헤더 확인
    { // 조건 시작
        const start = source.lastIndexOf("\n", source.indexOf(SITE_HEADER_START)) + 1; // 공통 헤더 시작 줄
        const endMarker = source.indexOf(SITE_HEADER_END); // 공통 헤더 끝 표시
        const end = source.indexOf("\n", endMarker); // 공통 헤더 끝 줄
        const existing = source.slice(start, end); // 기존 공통 헤더
        const subnavStart = existing.indexOf("data-site-subnav"); // 기존 보조 메뉴 위치
        subnavLinks = subnavStart < 0 ? null : extractSubnavLinks(existing.slice(subnavStart)); // 기존 보조 링크 유지
        const indent = existing.match(/^\s*/)[0]; // 기존 들여쓰기
        source = `${source.slice(0, start)}${renderSiteHeader({ current: page.current, indent, subnav: page.subnav && subnavLinks ? { ...page.subnav, links: subnavLinks } : null })}${source.slice(end)}`; // 공통 헤더 교체
    } // 조건 끝
    else // 기존 개별 헤더 처리
    { // 조건 시작
        const legacy = findLegacyHeader(source); // 기존 헤더 범위
        const indent = source.slice(legacy.start).match(/^\s*/)[0]; // 기존 들여쓰기
        subnavLinks = page.subnav ? extractSubnavLinks(legacy.block) : null; // 보조 링크 추출
        source = `${source.slice(0, legacy.start)}${renderSiteHeader({ current: page.current, indent, subnav: page.subnav ? { ...page.subnav, links: subnavLinks } : null })}${source.slice(legacy.end)}`; // 기존 헤더 교체
    } // 조건 끝

    if (!source.includes('href="/site-header.css"')) // 공통 스타일 연결 확인
    { // 조건 시작
        source = source.replace(/(\n\s*)(<link rel="stylesheet" href="\/responsive-shell\.css">)/, `$1${SITE_HEADER_STYLESHEET}$1$2`); // 반응형 스타일 앞 연결
    } // 조건 끝

    if (page.offset && !/<body[^>]*data-site-header-offset/.test(source)) // 헤더 높이 확보 확인
    { // 조건 시작
        source = source.replace(/<body\b/, "<body data-site-header-offset"); // 본문 여백 표시
    } // 조건 끝

    return source.replace(/\n/g, eol); // 원래 줄바꿈 복원
} // 함수 끝

export function applyAllSiteHeaders(root = "public") // 전체 정적 페이지 적용
{ // 함수 시작
    const updated = []; // 변경 파일 목록
    for (const page of STATIC_HEADER_PAGES) // 대상 페이지 반복
    { // 반복 시작
        const filePath = path.join(root, page.file); // 파일 경로
        if (!fs.existsSync(filePath)) // 파일 존재 확인
        { // 조건 시작
            continue; // 없는 파일 생략
        } // 조건 끝
        const before = fs.readFileSync(filePath, "utf8"); // 기존 문서
        const after = applySiteHeader(before, page); // 공통 헤더 적용 문서
        if (after !== before) // 변경 여부 확인
        { // 조건 시작
            fs.writeFileSync(filePath, after, "utf8"); // 변경 문서 저장
            updated.push(page.file); // 변경 파일 기록
        } // 조건 끝
    } // 반복 끝
    return updated; // 변경 파일 반환
} // 함수 끝

const currentModulePath = fileURLToPath(import.meta.url); // 현재 모듈 경로
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""; // 실행 파일 경로

if (executedPath === currentModulePath) // 직접 실행 확인
{ // 조건 시작
    const updated = applyAllSiteHeaders("public"); // 전체 적용
    console.log(`${updated.length}개 정적 페이지에 공통 헤더 적용`); // 적용 결과 출력
} // 조건 끝
