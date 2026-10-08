import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 공개 프로젝트 데이터

export const PAGE_DESCRIPTIONS = Object.freeze( // 정적 페이지 검색 설명
{ // 목록 시작
    "main.html": "인디 게임 스튜디오 Palettra Games의 35개 게임 프로젝트, 개발 뉴스, 굿즈와 커뮤니티를 소개합니다.", // 메인
    "goods.html": "Palettra Games 게임 세계를 담은 공식 굿즈 목록과 판매 준비 상태를 안내합니다.", // 굿즈
    "devlog.html": "Palettra Games 프로젝트의 업데이트, 신기능, 데브로그와 버그 수정 소식을 모았습니다.", // 개발 뉴스
    "roadmap.html": "Palettra Games 공개 프로젝트 35개의 개발 단계를 대표·개발 중·기획·보류로 나눠 한눈에 보여 줍니다.", // 개발 로드맵
    "atelier-verse.html": "3D 공간에서 맵을 만들고 꾸며 사람들을 초대하는 VR 샌드박스 서비스의 기획 방향과 개발 단계를 소개합니다. 지금은 기획 단계입니다.", // Atelier | Verse 소개
    "project_c/ProjectC_Cards.html": "카오스폰즈의 카드 속성, 키워드, 더미 규칙과 포지션을 소개합니다.", // 프로젝트 C 카드
    "project_d/characters.html": "바스티온에 등장하는 캐릭터와 관계를 소개합니다.", // 프로젝트 D 캐릭터
    "project_d/factions.html": "바스티온의 세력과 거점 구도를 소개합니다.", // 프로젝트 D 세력
}); // 목록 끝

function escapeAttribute(value) // 속성 값 특수 문자 처리
{ // 함수 시작
    return String(value).replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;"); // 안전 문구 반환
} // 함수 끝

function decodeAttribute(value) // 속성 값 복원
{ // 함수 시작
    return String(value).replaceAll("&quot;", '"').replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&"); // 원래 문구 반환
} // 함수 끝

export const SHARE_IMAGE_BASE_URL = ""; // 공식 도메인이 정해지면 https://도메인 을 넣고 pnpm pages:apply 실행(비어 있으면 사이트 안 경로로 적음)
export const SHARE_IMAGE_WIDTH = 1200; // 공유 미리보기 이미지 너비
export const SHARE_IMAGE_HEIGHT = 630; // 공유 미리보기 이미지 높이

export function resolveShareImage(file, baseUrl = SHARE_IMAGE_BASE_URL) // 페이지에 쓸 공유 미리보기 이미지 주소 조회
{ // 함수 시작
    const directory = `/${file.replaceAll("\\", "/").split("/")[0]}/`; // 페이지가 들어 있는 폴더
    const project = GAME_PROJECTS.find((candidate) => candidate.detailPath.startsWith(directory)); // 그 폴더의 게임 프로젝트
    if (!project || project.adultOnly) // 게임 소개가 아니거나 성인 게임인지 확인
    { // 조건 시작
        return null; // 공유 미리보기 이미지 없음
    } // 조건 끝
    return `${baseUrl.trim().replace(/\/+$/, "")}/images/share/${project.id}.jpg`; // 게임별 공유 미리보기 주소
} // 함수 끝

export function renderShareImageTags({ image, indent = "    " }) // 공유 미리보기 이미지 태그 생성
{ // 함수 시작
    return [ // 태그 줄 목록
        `${indent}<meta property="og:image" content="${escapeAttribute(image)}"> <!-- 공유 이미지 -->`, // 공유 이미지
        `${indent}<meta property="og:image:width" content="${SHARE_IMAGE_WIDTH}"> <!-- 공유 이미지 너비 -->`, // 공유 이미지 너비
        `${indent}<meta property="og:image:height" content="${SHARE_IMAGE_HEIGHT}"> <!-- 공유 이미지 높이 -->`, // 공유 이미지 높이
        `${indent}<meta name="twitter:card" content="summary_large_image"> <!-- 큰 미리보기 형식 -->`, // 큰 미리보기 형식
    ].join("\n"); // 태그 문자열 반환
} // 함수 끝

export function renderMetaTags({ title, description, image = null, indent = "    " }) // 공유 미리보기 태그 생성
{ // 함수 시작
    return [ // 태그 줄 목록
        `${indent}<meta property="og:type" content="website"> <!-- 공유 형식 -->`, // 공유 형식
        `${indent}<meta property="og:site_name" content="Palettra Games"> <!-- 사이트 이름 -->`, // 사이트 이름
        `${indent}<meta property="og:locale" content="ko_KR"> <!-- 공유 언어 -->`, // 공유 언어
        `${indent}<meta property="og:title" content="${escapeAttribute(title)}"> <!-- 공유 제목 -->`, // 공유 제목
        `${indent}<meta property="og:description" content="${escapeAttribute(description)}"> <!-- 공유 설명 -->`, // 공유 설명
        ...(image ? [renderShareImageTags({ image, indent })] : []), // 공유 이미지(있는 페이지만)
    ].join("\n"); // 태그 문자열 반환
} // 함수 끝

function applyShareImage(source, file, indent) // 문서의 공유 이미지 태그를 현재 기준으로 맞춤
{ // 함수 시작
    const image = resolveShareImage(file); // 이 페이지의 공유 이미지
    const cleaned = source.replace(/^[ \t]*<meta (?:property="og:image(?::width|:height)?"|name="twitter:card")[^\n]*\n/gm, ""); // 예전 공유 이미지 태그 제거
    if (!image) // 공유 이미지 없음 확인
    { // 조건 시작
        return cleaned; // 태그 없이 반환
    } // 조건 끝
    const anchor = cleaned.match(/^[ \t]*<meta property="og:description"[^\n]*$/m); // 공유 설명 줄
    return anchor ? cleaned.replace(anchor[0], `${anchor[0]}\n${renderShareImageTags({ image, indent })}`) : cleaned; // 공유 설명 뒤에 이미지 태그 추가
} // 함수 끝

function describeProjectFile(file) // 프로젝트 페이지 설명 조회
{ // 함수 시작
    const project = GAME_PROJECTS.find((candidate) => candidate.detailPath === "/" + file.replaceAll("\\", "/")); // 상세 주소 일치 프로젝트
    return project ? project.tagline : null; // 한 문장 소개 반환
} // 함수 끝

export function applyPageMeta(html, file) // 문서에 검색·공유 정보 적용
{ // 함수 시작
    const eol = html.includes("\r\n") ? "\r\n" : "\n"; // 기존 줄바꿈 형식
    let source = html.replace(/\r\n/g, "\n"); // 줄바꿈 정규화
    const titleMatch = source.match(/^([ \t]*)<title>([^<]+)<\/title>[^\n]*$/m); // 제목 줄
    if (!titleMatch) // 제목 누락 확인
    { // 조건 시작
        return html; // 변경 없음
    } // 조건 끝
    const indent = titleMatch[1]; // 들여쓰기
    const title = decodeAttribute(titleMatch[2].trim()); // 문서 제목
    const existing = source.match(/<meta name="description" content="([^"]*)">/); // 기존 검색 설명
    const description = existing ? decodeAttribute(existing[1]) : PAGE_DESCRIPTIONS[file.replaceAll("\\", "/")] ?? describeProjectFile(file) ?? title; // 검색 설명 결정
    let insert = ""; // 추가 태그
    if (!existing) // 검색 설명 누락 확인
    { // 조건 시작
        insert += `${indent}<meta name="description" content="${escapeAttribute(description)}"> <!-- 검색 설명 -->\n`; // 검색 설명 추가
    } // 조건 끝
    if (!source.includes('property="og:title"')) // 공유 태그 누락 확인
    { // 조건 시작
        insert += renderMetaTags({ title, description, indent }) + "\n"; // 공유 태그 추가
    } // 조건 끝
    if (insert) // 추가할 태그 확인
    { // 조건 시작
        source = source.replace(titleMatch[0], `${titleMatch[0]}\n${insert.trimEnd()}`); // 제목 뒤 태그 추가
    } // 조건 끝
    source = applyShareImage(source, file, indent); // 공유 이미지 태그 맞춤
    const result = source.replace(/\n/g, eol); // 원래 줄바꿈 복원
    return result === html ? html : result; // 바뀐 것이 없으면 원문 그대로 반환
} // 함수 끝

export function listMetaTargetPages(root = "public") // 적용 대상 페이지 목록
{ // 함수 시작
    const commonPaths = new Set(GAME_PROJECTS.filter((project) => project.layout === "common").map((project) => project.detailPath.slice(1))); // 생성 페이지 경로
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 폴더 순회
    { // 순회 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로
        return entry.isDirectory() ? walk(entryPath) : entryPath.endsWith(".html") ? [path.relative(root, entryPath).replaceAll("\\", "/")] : []; // HTML 선택
    }); // 순회 끝
    return walk(root).filter((file) => file !== "device-preview.html" && !commonPaths.has(file)); // 생성 페이지 제외 목록
} // 함수 끝

const currentModulePath = fileURLToPath(import.meta.url); // 현재 모듈 경로
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""; // 실행 파일 경로

if (executedPath === currentModulePath) // 직접 실행 확인
{ // 조건 시작
    let updated = 0; // 변경 수
    for (const file of listMetaTargetPages("public")) // 대상 반복
    { // 반복 시작
        const filePath = path.join("public", file); // 파일 경로
        const before = fs.readFileSync(filePath, "utf8"); // 기존 문서
        const after = applyPageMeta(before, file); // 적용 문서
        if (after !== before) // 변경 확인
        { // 조건 시작
            fs.writeFileSync(filePath, after, "utf8"); // 문서 저장
            updated += 1; // 변경 수 증가
        } // 조건 끝
    } // 반복 끝
    console.log(`${updated}개 페이지에 검색·공유 정보 적용`); // 결과 출력
} // 조건 끝
