import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { existsSync } from "node:fs"; // 파일 존재 검사
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { pathToFileURL, fileURLToPath } from "node:url"; // 파일 URL 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const publicRoot = path.join(projectRoot, "public"); // 공개 파일 폴더
const newsPagePath = path.join(publicRoot, "devlog.html"); // 개발 뉴스 문서 경로
const newsScriptPath = path.join(publicRoot, "devlog.mjs"); // 개발 뉴스 스크립트 경로

test("메인 메뉴의 개발 뉴스가 전용 페이지로 이동한다", async () => // 메뉴 연결 회귀 검사
{ // 테스트 본문 시작
    const mainHtml = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    assert.match(mainHtml, /<li><a href="\/devlog\.html">개발 뉴스<\/a><\/li>/, "개발 뉴스 메뉴 링크 누락"); // 메뉴 링크 검증
    assert.match(mainHtml, /class="section-detail-link" href="devlog\.html">상세 페이지로 이동 →<\/a>/, "개발 뉴스 상세 버튼 누락"); // 상세 버튼 검증
}); // 테스트 본문 끝

test("공통 헤더는 페이지별 바로가기 없이 문의하기와 로그인을 제공한다", async () => // 모바일 메뉴 회귀 검사
{ // 테스트 본문 시작
    const mainHtml = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    const header = mainHtml.slice(mainHtml.indexOf("<!-- site-header:start -->"), mainHtml.indexOf("<!-- site-header:end -->")); // 공통 헤더 구간
    assert.doesNotMatch(header, /news-shortcut|goods-shortcut/, "페이지별 바로가기 잔존"); // 바로가기 제거 확인
    assert.match(mainHtml, /href="\/contact\.html" class="btn-nav nav-contact-link">문의하기<\/a>[\s\S]*?data-member-action/, "공통 헤더 버튼 누락"); // 모바일 바로가기 검증
}); // 테스트 본문 끝

test("개발 뉴스 페이지에 메인과 동일한 상단 메뉴가 있다", async () => // 뉴스 헤더 회귀 검사
{ // 테스트 본문 시작
    const newsHtml = await readFile(newsPagePath, "utf8"); // 뉴스 문서 읽기
    assert.match(newsHtml, /<nav class="navbar" id="navbar"/, "상단 메뉴 누락"); // 상단 메뉴 영역 검증
    assert.match(newsHtml, /href="\/main\.html#games">게임<\/a>/, "게임 이동 링크 누락"); // 게임 링크 검증
    assert.match(newsHtml, /href="\/goods\.html">굿즈<\/a>/, "굿즈 전용 페이지 이동 링크 누락"); // 굿즈 링크 검증
    assert.match(newsHtml, /href="\/devlog\.html" aria-current="page">개발 뉴스<\/a>/, "현재 뉴스 링크 누락"); // 뉴스 링크 검증
    assert.match(newsHtml, /href="\/community\.html">커뮤니티<\/a>/, "커뮤니티 전용 페이지 이동 링크 누락"); // 커뮤니티 링크 검증
    assert.match(newsHtml, /href="\/contact\.html" class="btn-nav nav-contact-link">문의하기<\/a>/, "문의하기 페이지 링크 누락"); // 문의 버튼 검증
    assert.doesNotMatch(newsHtml, /id="contact-dialog"/, "미사용 문의 대화상자 잔존"); // 문의 대화상자 검증
}); // 테스트 본문 끝

test("개발 뉴스 페이지가 네 개의 가로 뉴스와 필터 상태를 제공한다", async () => // 뉴스 목록 계약 검사
{ // 테스트 본문 시작
    assert.equal(existsSync(newsPagePath), true, "개발 뉴스 페이지 누락"); // 뉴스 문서 존재 검증
    const newsHtml = await readFile(newsPagePath, "utf8"); // 뉴스 문서 읽기
    const newsRows = newsHtml.match(/class="news-row"/g) ?? []; // 뉴스 행 목록 추출
    assert.equal(newsRows.length, 4, "기존 임시 뉴스 네 개 유지 실패"); // 뉴스 행 개수 검증
    assert.match(newsHtml, /data-filter="all"[^>]*aria-pressed="true"/, "전체 필터 초기 상태 누락"); // 전체 필터 상태 검증
    assert.match(newsHtml, /data-filter="update"/, "업데이트 필터 누락"); // 업데이트 필터 검증
    assert.match(newsHtml, /data-filter="feature"/, "신기능 필터 누락"); // 신기능 필터 검증
    assert.match(newsHtml, /data-filter="devlog"/, "데브로그 필터 누락"); // 데브로그 필터 검증
    assert.match(newsHtml, /data-filter="fix"/, "버그픽스 필터 누락"); // 버그픽스 필터 검증
}); // 테스트 본문 끝

test("태그 필터가 다중 태그 뉴스와 전체 보기를 올바르게 판정한다", async () => // 필터 규칙 회귀 검사
{ // 테스트 본문 시작
    assert.equal(existsSync(newsScriptPath), true, "개발 뉴스 필터 스크립트 누락"); // 필터 스크립트 존재 검증
    const newsModule = await import(pathToFileURL(newsScriptPath).href); // 실제 필터 모듈 불러오기
    assert.equal(newsModule.matchesNewsFilter(["update", "feature"], "all"), true, "전체 필터 판정 실패"); // 전체 보기 판정 검증
    assert.equal(newsModule.matchesNewsFilter(["update", "feature"], "update"), true, "첫 태그 판정 실패"); // 업데이트 태그 판정 검증
    assert.equal(newsModule.matchesNewsFilter(["update", "feature"], "feature"), true, "다중 태그 판정 실패"); // 신기능 태그 판정 검증
    assert.equal(newsModule.matchesNewsFilter(["update", "feature"], "fix"), false, "불일치 태그 판정 실패"); // 불일치 태그 판정 검증
}); // 테스트 본문 끝

const SAMPLE_NEWS = Object.freeze( // 시연 뉴스 목록
[ // 목록 시작
    Object.freeze({ id: "echo", tags: ["update", "feature"], title: "에코 보이드 v0.8 — 음향 엔진 전면 재설계 완료", summary: "실시간 3D HRTF 처리 방식으로 전환했습니다." }), // 업데이트·신기능 뉴스
    Object.freeze({ id: "star", tags: ["devlog"], title: "스타 베이그런트 — 절차적 생성 은하계 알고리즘 공개", summary: "Voronoi 다이어그램의 조합 방식을 소개합니다." }), // 데브로그 뉴스
    Object.freeze({ id: "neon", tags: ["fix"], title: "네온 펄스 v2.1.3 패치", summary: "스킬 겹침 현상을 수정했습니다." }), // 버그픽스 뉴스
]); // 목록 끝

test("뉴스 검색은 제목·요약·종류 이름에서 찾고 종류 조건과 함께 적용한다", async () => // 검색 규칙 검사
{ // 테스트 본문 시작
    const { buildNewsView, getNewsSearchText } = await import(pathToFileURL(newsScriptPath).href); // 실제 뉴스 모듈 불러오기
    const ids = (state, translator = null) => buildNewsView(SAMPLE_NEWS, state, translator).visible.map((item) => item.id); // 표시 뉴스 식별자
    assert.deepEqual(ids({ query: "", type: "all" }), ["echo", "star", "neon"]); // 조건 없음 전체 표시
    assert.deepEqual(ids({ query: "은하계", type: "all" }), ["star"]); // 제목 검색
    assert.deepEqual(ids({ query: "  VORONOI ", type: "all" }), ["star"]); // 요약 검색과 대소문자·공백 정리
    assert.deepEqual(ids({ query: "버그픽스", type: "all" }), ["neon"]); // 종류 이름 검색
    assert.deepEqual(ids({ query: "v", type: "update" }), ["echo"]); // 검색어와 종류 동시 적용
    assert.deepEqual(ids({ query: "없는 낱말", type: "all" }), []); // 결과 없음
    assert.deepEqual(ids({ query: "", type: "hack" }), ["echo", "star", "neon"]); // 허용되지 않은 종류는 전체
    const view = buildNewsView(SAMPLE_NEWS, { query: "패치", type: "all" }, null); // 조건 적용 결과
    assert.deepEqual([view.total, view.overall], [1, 3]); // 결과 수와 전체 수
    assert.equal(buildNewsView(null, {}, null).overall, 0); // 잘못된 목록 안전 처리
    const translator = { translate: (text) => (text === SAMPLE_NEWS[2].title ? "Neon Pulse v2.1.3 patch" : text === "버그픽스" ? "Bug fix" : null) }; // 영어 번역 대체
    assert.deepEqual(ids({ query: "neon pulse", type: "all" }, translator), ["neon"]); // 영어 제목 검색
    assert.deepEqual(ids({ query: "bug fix", type: "all" }, translator), ["neon"]); // 영어 종류 이름 검색
    assert.deepEqual(ids({ query: "네온", type: "all" }, translator), ["neon"]); // 영어 화면에서도 원문 검색
    assert.equal(getNewsSearchText({ tags: [], title: "제목", summary: "" }, null), "제목"); // 빈 요약 제외
}); // 테스트 본문 끝

test("뉴스 조건은 주소에 저장하고 허용되지 않은 값은 버린다", async () => // 주소 저장 검사
{ // 테스트 본문 시작
    const { describeNewsFilters, formatNewsCount, MAX_NEWS_SEARCH_LENGTH, NEWS_TYPES, parseNewsParams, serializeNewsParams } = await import(pathToFileURL(newsScriptPath).href); // 실제 뉴스 모듈 불러오기
    assert.deepEqual([...NEWS_TYPES], ["all", "update", "feature", "devlog", "fix"]); // 종류 값 확인
    assert.deepEqual({ ...parseNewsParams("?q=%EC%97%90%EC%BD%94&type=fix") }, { query: "에코", type: "fix" }); // 주소 조건 읽기
    assert.deepEqual({ ...parseNewsParams("?type=hack&lang=en") }, { query: "", type: "all" }); // 없는 종류 기본값
    assert.deepEqual({ ...parseNewsParams(undefined) }, { query: "", type: "all" }); // 빈 주소 기본값
    assert.equal(parseNewsParams("?q=" + "가".repeat(100)).query.length, MAX_NEWS_SEARCH_LENGTH); // 검색어 길이 제한
    assert.equal(serializeNewsParams({ query: " 에코 ", type: "fix" }), "?q=%EC%97%90%EC%BD%94&type=fix"); // 조건 저장
    assert.equal(serializeNewsParams({ query: "", type: "all" }), ""); // 조건 없음은 빈 값
    assert.equal(serializeNewsParams({ query: "", type: "hack" }), ""); // 없는 종류 저장 안 함
    assert.deepEqual({ ...parseNewsParams(serializeNewsParams({ query: "a&b=c #d", type: "devlog" })) }, { query: "a&b=c #d", type: "devlog" }); // 특수 문자 왕복
    assert.deepEqual(describeNewsFilters({ query: " 에코 ", type: "fix" }).map((filter) => [filter.key, filter.label]), [["query", "검색: \"에코\""], ["type", "종류: 버그픽스"]]); // 조건 칩 문구
    assert.deepEqual(describeNewsFilters({ query: "", type: "all" }), []); // 조건 없음
    assert.equal(formatNewsCount(4, 4), "4개의 뉴스"); // 전체 결과 문구
    assert.equal(formatNewsCount(1, 4), "1개의 뉴스 · 전체 4개 중"); // 조건 결과 문구
}); // 테스트 본문 끝

test("개발 뉴스 문서는 검색 칸·조건 요약·초기화 버튼을 제공한다", async () => // 문서 구조 검사
{ // 테스트 본문 시작
    const newsHtml = await readFile(newsPagePath, "utf8"); // 뉴스 문서 읽기
    assert.match(newsHtml, /<input class="news-search-input" type="search" data-news-search aria-label="뉴스 검색" placeholder="[^"]+" maxlength="60" autocomplete="off">/); // 검색 입력 확인
    assert.match(newsHtml, /<div class="news-filter-summary" data-news-summary hidden>/); // 조건 없을 때 숨긴 요약 줄 확인
    assert.match(newsHtml, /data-news-active-filters role="group" aria-label="적용 중인 조건"/); // 조건 칩 영역 확인
    assert.equal((newsHtml.match(/data-news-reset/g) ?? []).length, 2); // 요약 줄과 빈 결과의 초기화 버튼 확인
    assert.match(newsHtml, /<div id="empty-state" class="empty-state" hidden><p>[^<]+<\/p><button class="news-filter-reset" type="button" data-news-reset>/); // 빈 결과 안내와 초기화 확인
    assert.match(newsHtml, /id="result-count" class="result-count" aria-live="polite"/); // 결과 수 알림 확인
    const script = await readFile(newsScriptPath, "utf8"); // 뉴스 스크립트 읽기
    assert.match(script, /const state = \{ \.\.\.parseNewsParams\(window\.location\?\.search \?\? ""\) \}/); // 주소 조건으로 시작 확인
    assert.match(script, /window\.history\.replaceState\(window\.history\.state \?\? null, "", nextUrl\)/); // 기록을 쌓지 않는 주소 갱신 확인
    assert.match(script, /newsItems = rows\.map\(readNewsItem\);[^\n]*\n\s*newsList\.replaceChildren\(\.\.\.rows\);[^\n]*\n\s*render\(\);/); // 원격 뉴스에도 현재 조건 적용 확인
    assert.match(script, /addEventListener\?\.\("popstate"/); // 기록 이동 복원 확인
    assert.doesNotMatch(script, /innerHTML/); // HTML 문자열 삽입 없음 확인
    const css = await readFile(path.join(publicRoot, "devlog.css"), "utf8"); // 뉴스 스타일 읽기
    assert.match(css, /\.news-search-field \/\* 뉴스 검색 입력 \*\/\s*\{[^}]*grid-column: 1 \/ -1;/); // 검색 한 줄 전체 확인
    assert.match(css, /\.news-filter-chip, \.news-filter-reset[^{]*\{[^}]*min-height: 44px;[^}]*overflow-wrap: anywhere;/); // 터치 높이와 긴 검색어 줄바꿈 확인
    assert.match(css, /\.empty-state\[hidden\][^{]*\{[^}]*display: none;/); // 숨긴 빈 결과 확인
}); // 테스트 본문 끝

test("원격 뉴스는 설정 완료와 비어 있지 않은 목록이 모두 필요하다", async () => // 원격 목록 판정 검사
{ // 테스트 본문 시작
    const newsModule = await import(pathToFileURL(newsScriptPath).href); // 실제 뉴스 모듈 불러오기
    assert.equal(newsModule.shouldUseRemotePosts({ configured: false, posts: [] }), false); // 미설정 목록 거부
    assert.equal(newsModule.shouldUseRemotePosts({ configured: true, posts: [] }), false); // 빈 원격 목록 거부
    assert.equal(newsModule.shouldUseRemotePosts({ configured: true, posts: [{ id: "post-1" }] }), true); // 정상 원격 목록 허용
    assert.equal(newsModule.shouldUseRemotePosts(null), false); // 잘못된 응답 거부
}); // 테스트 본문 끝
