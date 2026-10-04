import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { createTranslator, getLanguageSwitchUrl, getPageLocale, bundleForPath, LANGUAGE_STORAGE_KEY, resolveLanguage } from "../public/i18n.mjs"; // 페이지 번역 도구
import { DICTIONARY_ROOT, extractAll, findMissing, findStale } from "../scripts/i18n-extract.mjs"; // 번역 문구 추출 도구
import { BROWSER_DATA_ITEMS, describeBrowserDataValue, getClearAllIds } from "../public/browser-data.mjs"; // 브라우저 저장 항목

const HANGUL = /[가-힣]/; // 한글 판별 규칙
const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구

test("모든 정적 페이지 문구는 영어 사전에 빠짐없이 있고 사라진 문구는 남기지 않는다", () => // 사전 범위 검사
{ // 테스트 시작
    const bundles = extractAll(); // 현재 원문 추출
    const missing = findMissing(bundles); // 빠진 번역
    const stale = findStale(bundles); // 오래된 번역
    assert.deepEqual(missing.map((item) => `${item.bundle}: ${item.entry}`), [], "번역 누락: node scripts/i18n-extract.mjs 로 확인"); // 누락 없음 확인
    assert.deepEqual(stale.map((item) => `${item.bundle}: ${item.entry}`), [], "원문에서 사라진 번역 정리 필요"); // 오래된 번역 없음 확인
    assert.ok(bundles.size >= 36); // 공통과 게임 페이지 묶음 확인
}); // 테스트 끝

test("영어 사전은 한글 없이 번역되고 형식 문구는 같은 자리 표시를 쓴다", () => // 사전 품질 검사
{ // 테스트 시작
    for (const file of fs.readdirSync(DICTIONARY_ROOT)) // 사전 파일 반복
    { // 반복 시작
        const dictionary = JSON.parse(read(path.join(DICTIONARY_ROOT, file))); // 사전 읽기
        assert.deepEqual(Object.keys(dictionary), ["entries", "patterns"], file); // 사전 형식 확인
        for (const [ko, en] of Object.entries(dictionary.entries)) // 문구 반복
        { // 반복 시작
            assert.equal(typeof en, "string", `${file}: ${ko}`); // 번역 형식 확인
            assert.ok(en.trim().length > 0 || ko.trim().length > 0, `${file}: ${ko}`); // 빈 번역 확인
            assert.doesNotMatch(en.replace(/탈퇴/g, ""), HANGUL, `${file}: ${ko}`); // 한글 미포함 확인(입력해야 하는 탈퇴 확인어 제외)
        } // 반복 끝
        for (const pattern of dictionary.patterns) // 형식 반복
        { // 반복 시작
            const holders = (value) => [...value.matchAll(/\{(\d+)\}/g)].map((match) => match[1]).sort().join(","); // 자리 표시 목록
            assert.equal(holders(pattern.en), holders(pattern.ko), `${file}: ${pattern.ko}`); // 자리 표시 일치 확인
        } // 반복 끝
    } // 반복 끝
}); // 테스트 끝

test("번역기는 문구·형식·가운뎃점 조합을 번역하고 해시태그와 공백을 지킨다", () => // 번역기 동작 검사
{ // 테스트 시작
    const translator = createTranslator([{ entries: { "커뮤니티": "Community", "전체 프로젝트": "All projects", "개발 영상": "Dev videos", "#카오스폰즈": "#Chaospons" }, patterns: [{ ko: "{0} 복사 완료", en: "{0} copied" }, { ko: "{0}개의 뉴스", en: "{0} news posts" }, { ko: "{0} 썸네일", en: "{0} thumbnail" }] }]); // 시험 사전
    assert.equal(translator.translate("커뮤니티"), "Community"); // 단순 문구 확인
    assert.equal(translator.translate("  커뮤니티\n  "), " Community "); // 앞뒤 공백 유지 확인
    assert.equal(translator.translate("12개의 뉴스"), "12 news posts"); // 형식 문구 확인
    assert.equal(translator.translate("#카오스폰즈 복사 완료"), "#카오스폰즈 copied"); // 해시태그 원문 유지 확인
    assert.equal(translator.translate("전체 프로젝트 · 개발 영상"), "All projects · Dev videos"); // 가운뎃점 조합 확인
    assert.equal(translator.translate("전체 프로젝트 · 개발 영상 썸네일"), "All projects · Dev videos thumbnail"); // 형식 안 조합 확인
    assert.equal(translator.translate("전체 프로젝트 · 모르는 문구"), null); // 일부 미번역 조합 제외 확인
    assert.equal(translator.translate("없는 문구"), null); // 미번역 확인
    assert.equal(translator.translate("DEVFORGE"), null); // 한글 없는 문구 제외 확인
}); // 테스트 끝

test("언어는 주소 요청·저장 값·한국어 순서로 정하고 정적 페이지에서만 영어 표기를 쓴다", () => // 언어 결정 검사
{ // 테스트 시작
    assert.equal(LANGUAGE_STORAGE_KEY, "devforge-language"); // 저장 키 확인
    assert.equal(resolveLanguage("?lang=en", "ko"), "en"); // 주소 요청 우선 확인
    assert.equal(resolveLanguage("", "en"), "en"); // 저장 값 확인
    assert.equal(resolveLanguage("?lang=fr", "jp"), "ko"); // 미지원 언어 기본값 확인
    assert.equal(bundleForPath("/project_c/ProjectC_Cards.html"), "project_c"); // 게임 사전 확인
    assert.equal(bundleForPath("/main.html"), "site"); // 공통 사전 확인
    assert.equal(getLanguageSwitchUrl("http://localhost:3000/main.html?lang=en&q=x#games"), "http://localhost:3000/main.html?q=x#games"); // 언어 요청 제거 확인
    const view = (page, stored) => ({ document: { documentElement: { dataset: page ? { i18nPage: "static" } : {} } }, location: { search: "" }, localStorage: { getItem: () => stored } }); // 시험 창
    assert.equal(getPageLocale(view(true, "en")), "en-US"); // 영어 정적 페이지 확인
    assert.equal(getPageLocale(view(false, "en")), "ko-KR"); // Next 화면 한국어 유지 확인
    assert.equal(getPageLocale(view(true, "ko")), "ko-KR"); // 한국어 선택 확인
}); // 테스트 끝

test("정적 페이지는 언어 준비 스크립트를 머리에 두고 메뉴가 번역 제외 언어 버튼을 만든다", () => // 페이지 연결 검사
{ // 테스트 시작
    const pages = []; // 정적 페이지 목록
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => (entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.name.endsWith(".html") && pages.push(path.join(directory, entry.name)))); // 문서 수집
    walk("public"); // 공개 폴더 순회
    const navPages = pages.filter((file) => read(file).includes("/responsive-nav.mjs") && !file.endsWith("device-preview.html")); // 공통 메뉴 페이지
    assert.ok(navPages.length >= 45); // 대상 수 확인
    for (const file of navPages) // 페이지 반복
    { // 반복 시작
        const html = read(file); // 문서 읽기
        const head = html.slice(0, html.indexOf("</head>")); // 문서 머리
        assert.match(head, /<script src="\/i18n-bootstrap\.js"><\/script>/, `${file} 언어 준비 누락`); // 머리 스크립트 확인
    } // 반복 끝
    assert.match(read("scripts/generate-project-pages.mjs"), /<script src="\/i18n-bootstrap\.js"><\/script>/); // 생성 도구 반영 확인
    const bootstrap = read("public/i18n-bootstrap.js"); // 준비 스크립트
    assert.match(bootstrap, /script\.dataset\.i18nPage === "next" \? "next" : "static"/); // 정적·Next 화면 구분 확인
    assert.match(bootstrap, /path\.indexOf\("\/admin\/"\) === 0[\s\S]*?root\.dataset\.i18nPage = "none"/); // 관리자 화면 제외 확인
    assert.match(read("app/layout.tsx"), /<script src="\/i18n-bootstrap\.js" data-i18n-page="next"><\/script>/); // Next 화면 준비 확인
    assert.match(read("app/layout.tsx"), /<PageTranslator \/>/); // 연결 뒤 번역 시작 확인
    assert.match(read("app/page-translator.tsx"), /useEffect\(\(\) =>[\s\S]*?startPageTranslation\(document, window\)/); // 하이드레이션 뒤 실행 확인
    assert.match(bootstrap, /html\.i18n-pending body\{visibility:hidden\}/); // 번역 전 가림 확인
    assert.match(bootstrap, /setTimeout\(function revealPage\(\)[\s\S]*?3000\)/); // 가림 해제 대비 확인
    const nav = read("public/responsive-nav.mjs"); // 공통 메뉴
    assert.match(nav, /if \(isTranslatablePage\(root\)\)/); // Next 화면 제외 확인
    assert.match(nav, /button\.dataset\.i18nSkip = ""/); // 언어 버튼 번역 제외 확인
    assert.match(nav, /if \(getPageType\(document\) === "static"\)[\s\S]*?void startPageTranslation\(document, window\)/); // 정적 페이지만 즉시 번역 확인
    assert.match(read("public/community.html"), /<strong id="active-hashtag" data-i18n-skip>/); // 해시태그 원문 유지 확인
}); // 테스트 끝

test("화면 언어 선택은 브라우저 저장 항목으로 안내하고 전체 삭제에서 제외한다", () => // 저장 항목 검사
{ // 테스트 시작
    const item = BROWSER_DATA_ITEMS.find((candidate) => candidate.id === "language"); // 언어 항목
    assert.equal(item.key, LANGUAGE_STORAGE_KEY); // 저장 키 확인
    assert.equal(describeBrowserDataValue(item, "en").summary, "영어"); // 영어 요약 확인
    assert.equal(describeBrowserDataValue(item, "xx").state, "invalid"); // 손상 값 확인
    assert.ok(!getClearAllIds().includes("language")); // 전체 삭제 제외 확인
    assert.match(read("public/privacy.html"), /화면 모드, 화면 언어는 이용 중인 브라우저 로컬 저장소에/); // 개인정보 안내 확인
}); // 테스트 끝

test("번역기는 따옴표·태그·기호 조합을 풀어 번역하고 더 구체적인 형식을 먼저 쓴다", () => // 조합 문구 검사
{ // 테스트 시작
    const translator = createTranslator([{ entries: { "이계": "Otherworld", "비숍": "Bishop", "나이트": "Knight", "아크비숍": "Archbishop", "탭": "Tap", "리듬이 이어진다.": "The rhythm goes on." }, patterns: [{ ko: "{0} 이미지", en: "{0} image" }, { ko: "{0} 튜토리얼 이미지", en: "{0} tutorial image" }] }]); // 시험 사전
    assert.equal(translator.translate("“리듬이 이어진다.”"), "“The rhythm goes on.”"); // 따옴표 유지 확인
    assert.equal(translator.translate("#이계"), "#Otherworld"); // 태그 확인
    assert.equal(translator.translate("비숍 + 나이트 → 아크비숍"), "Bishop + Knight → Archbishop"); // 기호 조합 확인
    assert.equal(translator.translate("탭 튜토리얼 이미지"), "Tap tutorial image"); // 구체적 형식 우선 확인
}); // 테스트 끝

test("방문자가 입력한 글자는 번역하지 않고 그대로 두되 둘러싼 문구는 번역한다", () => // 입력 유지 형식 검사
{ // 테스트 시작
    const translator = createTranslator([{ entries: { "버그픽스": "Bug fix" }, patterns: [{ ko: "검색: \"{0}\"", en: "Search: \"{0}\"", keep: true }, { ko: "종류: {0}", en: "Type: {0}" }, { ko: "{0} 조건 해제", en: "Remove filter: {0}" }, { ko: "{0} ×", en: "{0} ×" }] }]); // 시험 사전
    assert.equal(translator.translate("검색: \"은하계\""), "Search: \"은하계\""); // 한글 검색어 유지 확인
    assert.equal(translator.translate("검색: \"은하계\" ×"), "Search: \"은하계\" ×"); // 칩 문구 확인
    assert.equal(translator.translate("검색: \"은하계\" 조건 해제"), "Remove filter: Search: \"은하계\""); // 접근성 이름 확인
    assert.equal(translator.translate("검색: \"galaxy\" ×"), "Search: \"galaxy\" ×"); // 영어 검색어 확인
    assert.equal(translator.translate("종류: 버그픽스 ×"), "Type: Bug fix ×"); // 번역되는 자리 값 확인
    assert.equal(translator.translate("종류: 없는말 ×"), null); // 입력 유지가 아닌 형식은 미번역 값 거부 확인
    assert.equal(JSON.parse(read("public/i18n/en/site.json")).patterns.find((pattern) => pattern.ko === "검색: \"{0}\"").keep, true); // 실제 사전 표시 확인
    const nickname = createTranslator([JSON.parse(read("public/i18n/en/site.json")), JSON.parse(read("public/i18n/en/next.json"))]); // 실제 사전 번역기
    assert.equal(nickname.translate("테스터 이름으로 댓글 작성"), "Write a comment as 테스터"); // 한글 닉네임 유지 확인
    assert.equal(nickname.translate("테스터 댓글 신고 사유"), "Reason for reporting 테스터's comment"); // 신고 사유 이름 확인
    assert.equal(nickname.translate("테스터 회원 메뉴 (로그아웃 가능)"), "테스터 member menu (log out)"); // 회원 메뉴 이름 확인
}); // 테스트 끝

test("문맥 표시가 있는 제목은 같은 낱말도 문맥별 번역을 먼저 쓴다", () => // 문맥 번역 검사
{ // 테스트 시작
    const translator = createTranslator([{ entries: { "게임": "Games", "title::게임": "Game" }, patterns: [] }]); // 시험 사전
    assert.equal(translator.translate("게임"), "Games"); // 기본 번역 확인
    assert.equal(translator.translate("게임 ", "title"), "Game "); // 문맥 번역 확인
    assert.equal(translator.translate("게임", "menu"), "Games"); // 없는 문맥 기본값 확인
    assert.match(read("public/main.html"), /<h2 class="section-title" data-i18n-context="title">게임 <span>프로젝트<\/span><\/h2>/); // 제목 문맥 표시 확인
}); // 테스트 끝

test("서버가 그린 한국어 날짜도 영어 화면에서 영어 날짜로 바꾼다", () => // 날짜 번역 검사
{ // 테스트 시작
    const translator = createTranslator([{ entries: {}, patterns: [] }]); // 빈 사전
    assert.equal(translator.translate("2025년 4월 28일"), "April 28, 2025"); // 긴 날짜 확인
    assert.equal(translator.translate("2025. 4. 28. 오후 12:20"), "Apr 28, 2025, 12:20 PM"); // 정오 확인
    assert.equal(translator.translate("2025. 4. 28. 오전 12:05"), "Apr 28, 2025, 12:05 AM"); // 자정 확인
    assert.equal(translator.translate("2025년 13월"), null); // 날짜 아님 확인
}); // 테스트 끝
