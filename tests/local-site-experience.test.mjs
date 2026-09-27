import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { copyCommunityHashtag } from "../public/community.mjs"; // 커뮤니티 복사 도구
import { initializeHeroCarousel } from "../public/hero-carousel.mjs"; // 히어로 전환 도구
import { initializeSupportWidget, isValidSupportPluginKey } from "../public/support-widget.mjs"; // 상담 도구
import { clearProjectPreferences, FAVORITE_PROJECTS_KEY, getProjectStatusCounts, readProjectIds, recordRecentProject, RECENT_PROJECTS_KEY, sanitizeProjectIds, toggleFavoriteProject } from "../public/site-experience.mjs"; // 사이트 경험 도구
import * as siteExperience from "../public/site-experience.mjs"; // 사이트 경험 전체 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 프로젝트 공개 정보

const mainHtml = await readFile(new URL("../public/main.html", import.meta.url), "utf8"); // 메인 문서 읽기
const goodsHtml = await readFile(new URL("../public/goods.html", import.meta.url), "utf8"); // 상품 문서 읽기
const communityHtml = await readFile(new URL("../public/community.html", import.meta.url), "utf8"); // 커뮤니티 문서 읽기
const termsHtml = await readFile(new URL("../public/terms.html", import.meta.url), "utf8").catch(() => ""); // 이용약관 문서 읽기
const privacyHtml = await readFile(new URL("../public/privacy.html", import.meta.url), "utf8").catch(() => ""); // 개인정보 문서 읽기
const siteExperienceCss = await readFile(new URL("../public/site-experience.css", import.meta.url), "utf8"); // 사이트 경험 스타일 읽기

test("공개 메인에서 개발 제어기와 테스트 상담 정보를 제거한다", () => // 운영 흔적 테스트
{ // 테스트 시작
    assert.doesNotMatch(mainHtml, /data-site-device-picker|TestService1234|519f1b4c/); // 테스트 정보 제외 확인
    assert.doesNotMatch(mainHtml, /<a[^>]+href="#"[^>]*>(Steam 페이지|itch\.io|[^<]*Discord)/); // 빈 외부 링크 제외 확인
}); // 테스트 끝

test("유효한 상담 키만 외부 스크립트 생성을 허용한다", () => // 상담 키 테스트
{ // 테스트 시작
    assert.equal(isValidSupportPluginKey("519f1b4c-9741-4bd8-bfb2-f12056cb03e9"), true); // UUID 허용 확인
    assert.equal(isValidSupportPluginKey("TestService1234"), false); // 테스트 이름 거부 확인
    assert.equal(isValidSupportPluginKey(""), false); // 빈 키 거부 확인
}); // 테스트 끝

test("상담 키가 없으면 외부 스크립트를 만들지 않는다", () => // 상담 비활성 테스트
{ // 테스트 시작
    let created = 0; // 생성 횟수
    const root = // 문서 대역
    { // 객체 시작
        querySelector: () => null, // 설정 없음 반환
        createElement: () => // 요소 생성 대역
        { // 함수 시작
            created += 1; // 생성 횟수 증가
            return {}; // 빈 요소 반환
        }, // 함수 끝
        head: { append: () => undefined }, // 머리 영역 대역
    }; // 객체 끝
    assert.equal(initializeSupportWidget(root, {}), null); // 비활성 결과 확인
    assert.equal(created, 0); // 스크립트 미생성 확인
}); // 테스트 끝

test("프로젝트 현황을 공개 데이터에서 계산한다", () => // 현황 집계 테스트
{ // 테스트 시작
    const counts = getProjectStatusCounts(GAME_PROJECTS); // 현황 계산
    assert.deepEqual(counts, { total: 35, featured: 6, developing: 32, planning: 1, paused: 2 }); // 전체 현황 확인
}); // 테스트 끝

test("히어로가 게임과 개발 뉴스 이동 경로를 제공한다", () => // 히어로 이동 테스트
{ // 테스트 시작
    assert.match(mainHtml, /class="hero-actions"/); // 행동 영역 확인
    assert.match(mainHtml, /href="#games"[^>]*>게임 둘러보기/); // 게임 이동 확인
    assert.match(mainHtml, /href="\/devlog\.html"[^>]*>최신 개발 소식/); // 뉴스 이동 확인
    assert.match(mainHtml, /data-hero-stat="total"/); // 전체 현황 확인
}); // 테스트 끝

test("메인 페이지가 스튜디오 소개와 FAQ를 제공한다", () => // 콘텐츠 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /id="studio"/); // 스튜디오 구역 확인
    assert.match(mainHtml, /id="faq"/); // 질문 구역 확인
    assert.match(mainHtml, /출시 일정은 확정되지 않았습니다/); // 일정 안내 확인
    assert.match(mainHtml, /실제 판매가 시작되기 전까지 결제 기능을 제공하지 않습니다/); // 판매 안내 확인
}); // 테스트 끝

test("메인 페이지가 세 개발 상태를 공개 데이터와 연결한다", () => // 상태판 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /data-project-status="developing"/); // 개발 중 표시 확인
    assert.match(mainHtml, /data-project-status="planning"/); // 기획 표시 확인
    assert.match(mainHtml, /data-project-status="paused"/); // 보류 표시 확인
    assert.match(mainHtml, /확정된 출시 일정은 없습니다/); // 일정 안내 확인
}); // 테스트 끝

test("손상값과 미등록 프로젝트를 안전한 목록에서 제거한다", () => // 저장값 안전 테스트
{ // 테스트 시작
    assert.deepEqual(sanitizeProjectIds(["project-a", "missing", "project-a"], GAME_PROJECTS), ["project-a"]); // 안전 목록 확인
    assert.deepEqual(readProjectIds({ getItem: () => "{" }, FAVORITE_PROJECTS_KEY, GAME_PROJECTS), []); // 손상 JSON 확인
}); // 테스트 끝

test("즐겨찾기는 선택을 전환하고 최근 목록은 여섯 개로 제한한다", () => // 보관함 동작 테스트
{ // 테스트 시작
    const values = new Map(); // 저장 값 목록
    const storage = // 저장소 대역
    { // 객체 시작
        getItem: (key) => values.get(key) ?? null, // 저장값 조회
        setItem: (key, value) => values.set(key, value), // 저장값 기록
        removeItem: (key) => values.delete(key), // 저장값 삭제
    }; // 객체 끝
    assert.deepEqual(toggleFavoriteProject(storage, "project-a", GAME_PROJECTS), ["project-a"]); // 즐겨찾기 추가 확인
    assert.deepEqual(toggleFavoriteProject(storage, "project-a", GAME_PROJECTS), []); // 즐겨찾기 제거 확인

    for (const project of GAME_PROJECTS.slice(0, 8)) // 최근 프로젝트 반복
    { // 반복 시작
        recordRecentProject(storage, project.id, GAME_PROJECTS); // 최근 프로젝트 기록
    } // 반복 끝

    const recent = readProjectIds(storage, RECENT_PROJECTS_KEY, GAME_PROJECTS); // 최근 목록 조회
    assert.equal(recent.length, 6); // 최대 개수 확인
    assert.equal(recent[0], GAME_PROJECTS[7].id); // 최신 항목 우선 확인
    clearProjectPreferences(storage); // 로컬 기록 삭제
    assert.deepEqual(readProjectIds(storage, RECENT_PROJECTS_KEY, GAME_PROJECTS), []); // 최근 목록 삭제 확인
}); // 테스트 끝

test("관심 버튼은 별만 표시하고 선택 결과를 접근성 문구와 하단 안내로 제공한다", () => // 관심 표시 동작 테스트
{ // 테스트 시작
    assert.equal(typeof siteExperience.getFavoritePresentation, "function"); // 표시 도구 존재 확인
    assert.deepEqual(siteExperience.getFavoritePresentation(false, "프로젝트 A"), { symbol: "☆", label: "프로젝트 A 관심 목록에 추가", feedback: "관심 목록에서 제거되었습니다." }); // 미선택 상태 확인
    assert.deepEqual(siteExperience.getFavoritePresentation(true, "프로젝트 A"), { symbol: "★", label: "프로젝트 A 관심 목록에서 제거", feedback: "관심 목록에 추가되었습니다." }); // 선택 상태 확인
}); // 테스트 끝

test("메인 페이지가 로컬 프로젝트 보관함과 삭제 기능을 제공한다", () => // 보관함 구조 테스트
{ // 테스트 시작
    assert.match(mainHtml, /data-project-shelf/); // 보관함 확인
    assert.match(mainHtml, /data-favorite-projects/); // 즐겨찾기 목록 확인
    assert.match(mainHtml, /data-recent-projects/); // 최근 목록 확인
    assert.match(mainHtml, /data-clear-project-preferences/); // 삭제 버튼 확인
}); // 테스트 끝

test("상품 페이지가 결제 전 판매 준비 상태를 명확하게 안내한다", () => // 상품 안전 안내 테스트
{ // 테스트 시작
    assert.match(goodsHtml, /실제 판매가 시작되기 전에는 결제되지 않습니다/); // 결제 전 안내 확인
}); // 테스트 끝

test("커뮤니티 페이지가 현재 해시태그 복사 기능을 제공한다", () => // 해시태그 화면 테스트
{ // 테스트 시작
    assert.match(communityHtml, /data-copy-community-hashtag/); // 복사 버튼 확인
    assert.match(communityHtml, /해시태그 복사/); // 복사 문구 확인
    assert.match(communityHtml, /data-copy-community-status/); // 복사 상태 확인
}); // 테스트 끝

test("커뮤니티 해시태그를 클립보드에 안전하게 복사한다", async () => // 해시태그 복사 동작 테스트
{ // 테스트 시작
    let copied = ""; // 복사 결과
    const clipboard = { writeText: async (value) => { copied = value; } }; // 클립보드 대역
    assert.equal(await copyCommunityHashtag("#DEVFORGE", clipboard), true); // 복사 성공 확인
    assert.equal(copied, "#DEVFORGE"); // 복사 내용 확인
    assert.equal(await copyCommunityHashtag("", clipboard), false); // 빈 값 거부 확인
    assert.equal(await copyCommunityHashtag("#DEVFORGE", null), false); // 클립보드 없음 처리 확인
}); // 테스트 끝

test("메인 하단이 독립 약관과 개인정보 초안 페이지로 이동한다", () => // 법적 문서 링크 테스트
{ // 테스트 시작
    assert.match(mainHtml, /href="\/terms\.html"[^>]*>이용약관/); // 이용약관 링크 확인
    assert.match(mainHtml, /href="\/privacy\.html"[^>]*>개인정보처리방침/); // 개인정보 링크 확인
}); // 테스트 끝

test("법적 문서는 운영 전 초안과 현재 로컬 처리 범위를 밝힌다", () => // 법적 문서 내용 테스트
{ // 테스트 시작
    assert.match(termsHtml, /운영 전 검토용 초안/); // 약관 초안 표시 확인
    assert.match(privacyHtml, /운영 전 검토용 초안/); // 개인정보 초안 표시 확인
    assert.match(privacyHtml, /브라우저 로컬 저장소/); // 로컬 저장 범위 확인
    assert.match(privacyHtml, /회원가입 정보를 서버에 저장하지 않습니다/); // 회원 정보 비저장 확인
}); // 테스트 끝

test("히어로 전환기는 선택한 방향으로 화면을 이동한다", () => // 히어로 방향 전환 테스트
{ // 테스트 시작
    const slides = Array.from({ length: 2 }, () => // 슬라이드 대역 생성
    { // 생성 시작
        const attributes = new Map(); // 속성 저장소
        const classes = new Set(); // 클래스 저장소
        return { // 슬라이드 대역 반환
            inert: false, // 조작 차단 상태
            classList: { // 클래스 목록 대역
                add: (...names) => names.forEach((name) => classes.add(name)), // 클래스 추가
                remove: (...names) => names.forEach((name) => classes.delete(name)), // 클래스 제거
                toggle: (name, active) => active ? classes.add(name) : classes.delete(name), // 클래스 전환
                contains: (name) => classes.has(name), // 클래스 포함 확인
            }, // 클래스 목록 끝
            setAttribute: (name, value) => attributes.set(name, value), // 속성 저장
            getAttribute: (name) => attributes.get(name), // 속성 조회
        }; // 객체 끝
    }); // 생성 끝
    const listeners = new Map(); // 이벤트 처리기 저장소
    const previousButton = { addEventListener: (name, handler) => listeners.set(`previous:${name}`, handler) }; // 이전 버튼 대역
    const nextButton = { addEventListener: (name, handler) => listeners.set(`next:${name}`, handler) }; // 다음 버튼 대역
    const status = { textContent: "" }; // 상태 문구 대역
    const carousel = { addEventListener: (name, handler) => listeners.set(`carousel:${name}`, handler) }; // 전환 영역 대역
    const track = { offsetWidth: 900, style: { transform: "" } }; // 이동 트랙 대역
    const progress = { offsetWidth: 240, style: { animationDuration: "", animationPlayState: "" }, classList: { add: () => undefined, remove: () => undefined } }; // 진행 게이지 대역
    const timers = new Map(); // 예약 작업 저장소
    let timerId = 0; // 예약 작업 번호
    const setTimeoutFn = (callback, delay) => // 예약 작업 등록
    { // 함수 시작
        timerId += 1; // 작업 번호 증가
        timers.set(timerId, { callback, delay }); // 작업 저장
        return timerId; // 작업 번호 반환
    }; // 함수 끝
    const clearTimeoutFn = (id) => timers.delete(id); // 예약 작업 제거
    const root = // 문서 대역
    { // 객체 시작
        querySelectorAll: () => slides, // 슬라이드 목록 반환
        querySelector: (selector) => new Map( // 요소 조회표
        [ // 조회 항목 시작
            ["[data-hero-carousel]", carousel], // 전환 영역 연결
            ["[data-hero-carousel-track]", track], // 이동 트랙 연결
            ["[data-hero-carousel-previous]", previousButton], // 이전 버튼 연결
            ["[data-hero-carousel-next]", nextButton], // 다음 버튼 연결
            ["[data-hero-carousel-status]", status], // 상태 문구 연결
            ["[data-hero-carousel-progress]", progress], // 진행 게이지 연결
        ]).get(selector) ?? null, // 조회 결과 반환
    }; // 객체 끝
    const controller = initializeHeroCarousel(root, { setTimeoutFn, clearTimeoutFn }); // 히어로 전환 초기화
    assert.equal(controller.index, 0); // 첫 화면 확인
    assert.equal(slides[0].inert, false); // 첫 화면 조작 확인
    assert.equal(slides[1].inert, true); // 둘째 화면 조작 차단 확인
    controller.next(); // 다음 화면 이동
    assert.equal(controller.index, 1); // 둘째 화면 확인
    assert.equal(slides[0].classList.contains("is-exiting-left"), true); // 왼쪽 퇴장 확인
    assert.equal(slides[1].classList.contains("is-active"), true); // 오른쪽 진입 확인
    assert.equal(status.textContent, "2 / 2"); // 상태 문구 확인
    const nextCleanup = [...timers.values()].find((timer) => timer.delay === 550); // 다음 전환 정리 조회
    nextCleanup.callback(); // 다음 전환 정리 실행
    controller.previous(); // 이전 화면 이동
    assert.equal(controller.index, 0); // 첫 화면 복귀 확인
    assert.equal(slides[1].classList.contains("is-exiting-right"), true); // 오른쪽 퇴장 확인
    assert.equal(slides[0].classList.contains("is-active"), true); // 왼쪽 진입 확인
}); // 테스트 끝

test("히어로 전환기는 7초 뒤 자동으로 다음 화면을 표시한다", () => // 자동 전환 테스트
{ // 테스트 시작
    const listeners = new Map(); // 이벤트 처리기 저장소
    const timers = new Map(); // 예약 작업 저장소
    let timerId = 0; // 예약 작업 번호
    const createElement = () => ({ inert: false, offsetWidth: 100, style: { animationDuration: "", animationPlayState: "" }, classList: { add: () => undefined, remove: () => undefined, toggle: () => undefined }, addEventListener: (name, handler) => listeners.set(`${timerId}:${name}`, handler), setAttribute: () => undefined, textContent: "" }); // 요소 대역 생성
    const slides = [createElement(), createElement()]; // 슬라이드 대역 생성
    const elements = new Map([ // 요소 조회표 시작
        ["[data-hero-carousel]", createElement()], // 전환 영역 연결
        ["[data-hero-carousel-track]", createElement()], // 이동 트랙 연결
        ["[data-hero-carousel-previous]", createElement()], // 이전 버튼 연결
        ["[data-hero-carousel-next]", createElement()], // 다음 버튼 연결
        ["[data-hero-carousel-status]", createElement()], // 상태 문구 연결
        ["[data-hero-carousel-progress]", createElement()], // 진행 게이지 연결
    ]); // 요소 조회표 끝
    const root = { querySelectorAll: () => slides, querySelector: (selector) => elements.get(selector) ?? null }; // 문서 대역
    const setTimeoutFn = (callback, delay) => // 예약 작업 등록
    { // 함수 시작
        timerId += 1; // 작업 번호 증가
        timers.set(timerId, { callback, delay }); // 작업 저장
        return timerId; // 작업 번호 반환
    }; // 함수 끝
    const controller = initializeHeroCarousel(root, { setTimeoutFn, clearTimeoutFn: (id) => timers.delete(id) }); // 히어로 전환 초기화
    const automaticTimer = [...timers.values()].find((timer) => timer.delay === 7000); // 자동 전환 작업 조회
    assert.ok(automaticTimer); // 7초 작업 확인
    automaticTimer.callback(); // 자동 전환 실행
    assert.equal(controller.index, 1); // 다음 화면 확인
}); // 테스트 끝

test("히어로 진행 게이지는 수동 이동 때 7초부터 다시 시작한다", () => // 진행 게이지 초기화 테스트
{ // 테스트 시작
    const timers = new Map(); // 예약 작업 저장소
    let timerId = 0; // 예약 작업 번호
    let progressStarts = 0; // 게이지 시작 횟수
    const createElement = () => ({ inert: false, offsetWidth: 100, style: { animationDuration: "", animationPlayState: "" }, classList: { add: () => undefined, remove: () => undefined, toggle: () => undefined }, addEventListener: () => undefined, setAttribute: () => undefined, textContent: "" }); // 요소 대역 생성
    const slides = [createElement(), createElement()]; // 슬라이드 대역 생성
    const progress = createElement(); // 진행 게이지 대역
    progress.classList.add = (name) => // 게이지 클래스 추가
    { // 함수 시작
        if (name === "is-running") // 실행 클래스 확인
        { // 조건 시작
            progressStarts += 1; // 시작 횟수 증가
        } // 조건 끝
    }; // 함수 끝
    const elements = new Map([ // 요소 조회표 시작
        ["[data-hero-carousel]", createElement()], // 전환 영역 연결
        ["[data-hero-carousel-track]", createElement()], // 이동 트랙 연결
        ["[data-hero-carousel-previous]", createElement()], // 이전 버튼 연결
        ["[data-hero-carousel-next]", createElement()], // 다음 버튼 연결
        ["[data-hero-carousel-status]", createElement()], // 상태 문구 연결
        ["[data-hero-carousel-progress]", progress], // 진행 게이지 연결
    ]); // 요소 조회표 끝
    const root = { querySelectorAll: () => slides, querySelector: (selector) => elements.get(selector) ?? null }; // 문서 대역
    const setTimeoutFn = (callback, delay) => // 예약 작업 등록
    { // 함수 시작
        timerId += 1; // 작업 번호 증가
        timers.set(timerId, { callback, delay }); // 작업 저장
        return timerId; // 작업 번호 반환
    }; // 함수 끝
    const controller = initializeHeroCarousel(root, { setTimeoutFn, clearTimeoutFn: (id) => timers.delete(id) }); // 히어로 전환 초기화
    assert.equal(progress.style.animationDuration, "7000ms"); // 초기 게이지 시간 확인
    assert.equal(progress.style.animationPlayState, "running"); // 게이지 재생 확인
    assert.equal(progressStarts, 1); // 초기 게이지 시작 확인
    controller.next(); // 수동 다음 화면 이동
    assert.equal(progressStarts, 2); // 수동 이동 뒤 게이지 재시작 확인
    assert.equal([...timers.values()].some((timer) => timer.delay === 7000), true); // 7초 재예약 확인
}); // 테스트 끝

test("히어로가 ChatBot 홍보 화면과 임시 로컬 주소를 제공한다", () => // 챗봇 홍보 화면 테스트
{ // 테스트 시작
    assert.match(mainHtml, /data-hero-carousel/); // 전환 영역 확인
    assert.match(mainHtml, /data-hero-carousel-track/); // 이동 트랙 확인
    assert.match(mainHtml, /data-hero-carousel-previous/); // 이전 버튼 확인
    assert.match(mainHtml, /data-hero-carousel-next/); // 다음 버튼 확인
    assert.match(mainHtml, /data-hero-carousel-progress/); // 자동 전환 게이지 확인
    assert.doesNotMatch(mainHtml, /data-hero-carousel-toggle/); // 자동 전환 버튼 제외 확인
    assert.doesNotMatch(mainHtml, />자동 전환 7초</); // 자동 전환 문구 제외 확인
    assert.match(siteExperienceCss, /\.hero-carousel-timer[^}]+bottom:\s*3\.5rem/s); // 게이지 상단 배치 확인
    assert.match(siteExperienceCss, /\.hero-carousel-control[^}]+bottom:\s*0/s); // 넘김 버튼 하단 배치 확인
    assert.match(mainHtml, /href="http:\/\/localhost:3001\/"[^>]*>ChatBot 시작하기/); // 챗봇 이동 확인
}); // 테스트 끝
