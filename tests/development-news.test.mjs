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
    assert.match(mainHtml, /<li><a href="devlog\.html">개발 뉴스<\/a><\/li>/, "개발 뉴스 메뉴 링크 누락"); // 메뉴 링크 검증
    assert.match(mainHtml, /class="section-detail-link" href="devlog\.html">상세 페이지로 이동 →<\/a>/, "개발 뉴스 상세 버튼 누락"); // 상세 버튼 검증
}); // 테스트 본문 끝

test("모바일 화면에도 개발 뉴스 바로가기가 유지된다", async () => // 모바일 메뉴 회귀 검사
{ // 테스트 본문 시작
    const mainHtml = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    assert.match(mainHtml, /<a href="devlog\.html" class="btn-nav news-shortcut">개발 뉴스<\/a>/, "모바일 개발 뉴스 바로가기 누락"); // 모바일 바로가기 검증
}); // 테스트 본문 끝

test("개발 뉴스 페이지에 메인과 동일한 상단 메뉴가 있다", async () => // 뉴스 헤더 회귀 검사
{ // 테스트 본문 시작
    const newsHtml = await readFile(newsPagePath, "utf8"); // 뉴스 문서 읽기
    assert.match(newsHtml, /<nav class="navbar" id="navbar"/, "상단 메뉴 누락"); // 상단 메뉴 영역 검증
    assert.match(newsHtml, /href="main\.html#games">게임<\/a>/, "게임 이동 링크 누락"); // 게임 링크 검증
    assert.match(newsHtml, /href="goods\.html">굿즈<\/a>/, "굿즈 전용 페이지 이동 링크 누락"); // 굿즈 링크 검증
    assert.match(newsHtml, /href="devlog\.html" aria-current="page">개발 뉴스<\/a>/, "현재 뉴스 링크 누락"); // 뉴스 링크 검증
    assert.match(newsHtml, /href="community\.html">커뮤니티<\/a>/, "커뮤니티 전용 페이지 이동 링크 누락"); // 커뮤니티 링크 검증
    assert.match(newsHtml, /id="contact-open"[^>]*>문의하기<\/button>/, "문의 버튼 누락"); // 문의 버튼 검증
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

test("원격 뉴스는 설정 완료와 비어 있지 않은 목록이 모두 필요하다", async () => // 원격 목록 판정 검사
{ // 테스트 본문 시작
    const newsModule = await import(pathToFileURL(newsScriptPath).href); // 실제 뉴스 모듈 불러오기
    assert.equal(newsModule.shouldUseRemotePosts({ configured: false, posts: [] }), false); // 미설정 목록 거부
    assert.equal(newsModule.shouldUseRemotePosts({ configured: true, posts: [] }), false); // 빈 원격 목록 거부
    assert.equal(newsModule.shouldUseRemotePosts({ configured: true, posts: [{ id: "post-1" }] }), true); // 정상 원격 목록 허용
    assert.equal(newsModule.shouldUseRemotePosts(null), false); // 잘못된 응답 거부
}); // 테스트 본문 끝
