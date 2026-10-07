import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { applyPageMeta, listMetaTargetPages } from "./apply-page-meta.mjs"; // 검색·공유 정보 적용 도구
import { applySiteHeader, STATIC_HEADER_PAGES } from "./apply-site-header.mjs"; // 공통 헤더 적용 도구
import { applyVerseServices } from "./verse-services.mjs"; // 서비스 홍보 화면 적용 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 공개 프로젝트 데이터

export const I18N_BOOTSTRAP_TAG = '<script src="/i18n-bootstrap.js"></script> <!-- 언어 선택 준비 -->'; // 번역 준비 스크립트 줄

export function applyI18nBootstrap(html) // 번역 준비 스크립트 적용
{ // 함수 시작
    if (html.includes("/i18n-bootstrap.js") || !html.includes("/responsive-nav.mjs")) // 이미 적용·공통 메뉴 없음 확인
    { // 조건 시작
        return html; // 변경 없음
    } // 조건 끝
    const headEnd = html.indexOf("</head>"); // 문서 머리 끝
    if (headEnd < 0) // 머리 누락 확인
    { // 조건 시작
        return html; // 변경 없음
    } // 조건 끝
    const eol = html.includes("\r\n") ? "\r\n" : "\n"; // 기존 줄바꿈 형식
    const lineStart = html.lastIndexOf("\n", headEnd) + 1; // 머리 끝 줄 시작
    return `${html.slice(0, lineStart)}    ${I18N_BOOTSTRAP_TAG}${eol}${html.slice(lineStart)}`; // 머리 끝 앞에 삽입
} // 함수 끝

export const RELEASE_NOTIFY_TAG = '<script type="module" src="/release-notify.mjs"></script> <!-- 출시 알림 신청 -->'; // 출시 알림 스크립트 줄
export const RELEASE_NOTIFY_PAGES = Object.freeze(GAME_PROJECTS.map((project) => project.detailPath.slice(1))); // 게임 소개 첫 화면 목록

export function applyReleaseNotify(html, file) // 게임 소개 첫 화면에 출시 알림 스크립트 적용
{ // 함수 시작
    const anchor = html.indexOf('<script type="module" src="/responsive-nav.mjs">'); // 공통 메뉴 스크립트 위치
    if (!RELEASE_NOTIFY_PAGES.includes(file) || html.includes("/release-notify.mjs") || anchor < 0) // 대상·이미 적용·기준 줄 확인
    { // 조건 시작
        return html; // 변경 없음
    } // 조건 끝
    const eol = html.includes("\r\n") ? "\r\n" : "\n"; // 기존 줄바꿈 형식
    const lineStart = html.lastIndexOf("\n", anchor) + 1; // 기준 줄 시작
    return `${html.slice(0, lineStart)}${html.slice(lineStart, anchor)}${RELEASE_NOTIFY_TAG}${eol}${html.slice(lineStart)}`; // 공통 메뉴 스크립트 앞에 같은 들여쓰기로 삽입
} // 함수 끝

export function applyStaticPage(html, file) // 페이지 하나에 공통 요소 적용
{ // 함수 시작
    const headerPage = STATIC_HEADER_PAGES.find((page) => page.file === file); // 공통 헤더 등록 정보
    const withHeader = headerPage ? applySiteHeader(html, headerPage) : html; // 공통 헤더 적용
    return applyVerseServices(applyReleaseNotify(applyI18nBootstrap(applyPageMeta(withHeader, file)), file), file); // 검색 설명·번역 준비·출시 알림·서비스 홍보 화면 적용
} // 함수 끝

export function findStaticPageChanges(root = "public") // 적용이 필요한 페이지 찾기
{ // 함수 시작
    const changes = []; // 변경 목록
    for (const file of listMetaTargetPages(root)) // 대상 페이지 반복
    { // 반복 시작
        const filePath = path.join(root, file); // 파일 경로
        const before = fs.readFileSync(filePath, "utf8"); // 기존 문서
        const after = applyStaticPage(before, file); // 적용 문서
        if (after !== before) // 변경 확인
        { // 조건 시작
            changes.push({ file, filePath, after }); // 변경 기록
        } // 조건 끝
    } // 반복 끝
    return changes; // 변경 목록 반환
} // 함수 끝

const currentModulePath = fileURLToPath(import.meta.url); // 현재 모듈 경로
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""; // 실행 파일 경로

if (executedPath === currentModulePath) // 직접 실행 확인
{ // 조건 시작
    const checkOnly = process.argv.includes("--check"); // 확인 전용 여부
    const changes = findStaticPageChanges("public"); // 필요한 변경
    if (checkOnly) // 확인 전용 처리
    { // 조건 시작
        changes.forEach((change) => console.log(`적용 필요: public/${change.file}`)); // 대상 출력
        console.log(changes.length === 0 ? "모든 정적 페이지에 공통 헤더·검색 설명·번역 준비가 적용되어 있습니다." : `${changes.length}개 페이지에 적용이 필요합니다. pnpm pages:apply 를 실행하세요.`); // 결과 출력
        process.exitCode = changes.length === 0 ? 0 : 1; // 종료 코드
    } // 조건 끝
    else // 적용 처리
    { // 대안 시작
        changes.forEach((change) => fs.writeFileSync(change.filePath, change.after, "utf8")); // 문서 저장
        console.log(`${changes.length}개 정적 페이지에 공통 헤더·검색 설명·번역 준비 적용`); // 결과 출력
    } // 대안 끝
} // 조건 끝
