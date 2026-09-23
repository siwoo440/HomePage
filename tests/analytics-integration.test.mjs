import assert from "node:assert/strict"; // 엄격 비교 도구
import { readdir, readFile } from "node:fs/promises"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구

const projectRoot = process.cwd(); // 프로젝트 루트
const publicRoot = path.join(projectRoot, "public"); // 공개 파일 루트

async function listHtmlFiles(directory) // HTML 목록 조회
{ // 함수 시작
    const entries = await readdir(directory, { withFileTypes: true }); // 폴더 항목 읽기
    const files = []; // HTML 목록

    for (const entry of entries) // 항목 반복
    { // 반복 시작
        const target = path.join(directory, entry.name); // 항목 경로 생성

        if (entry.isDirectory()) // 폴더 여부 확인
        { // 조건 시작
            files.push(...await listHtmlFiles(target)); // 하위 HTML 추가
            continue; // 다음 항목 이동
        } // 조건 끝

        if (entry.isFile() && entry.name.endsWith(".html")) // HTML 파일 확인
        { // 조건 시작
            files.push(target); // HTML 목록 추가
        } // 조건 끝
    } // 반복 끝

    return files; // HTML 목록 반환
} // 함수 끝

test("개발 도구를 제외한 공개 HTML은 동의 화면과 분석 모듈을 같은 순서로 불러온다", async () => // 일반 문서 연결 테스트
{ // 테스트 시작
    const files = (await listHtmlFiles(publicRoot)).filter((file) => path.basename(file) !== "device-preview.html"); // 개발 도구 제외 목록
    const missing = []; // 누락 문서 목록

    for (const file of files) // HTML 반복
    { // 반복 시작
        const html = await readFile(file, "utf8"); // 문서 내용 읽기
        const consentIndex = html.indexOf('src="/privacy-consent.mjs"'); // 동의 모듈 위치
        const analyticsIndex = html.indexOf('src="/site-analytics.mjs"'); // 분석 모듈 위치

        if (consentIndex < 0 || analyticsIndex <= consentIndex) // 연결 순서 확인
        { // 조건 시작
            missing.push(path.relative(projectRoot, file)); // 누락 문서 기록
        } // 조건 끝
    } // 반복 끝

    assert.deepEqual(missing, []); // 전체 연결 확인
}); // 테스트 끝

test("개발자용 기기 미리보기는 자체 방문 분석을 실행하지 않는다", async () => // 개발 도구 분석 제외 테스트
{ // 테스트 시작
    const html = await readFile(path.join(publicRoot, "device-preview.html"), "utf8"); // 미리보기 문서 읽기
    assert.doesNotMatch(html, /src="\/site-analytics\.mjs"/); // 분석 모듈 제외 확인
    assert.doesNotMatch(html, /src="\/privacy-consent\.mjs"/); // 방문자 동의창 제외 확인
}); // 테스트 끝

test("Next.js 화면은 공통 동의 모듈만 사용하고 동의 없는 분석기를 제거한다", async () => // Next 연결 테스트
{ // 테스트 시작
    const layout = await readFile(path.join(projectRoot, "app", "layout.tsx"), "utf8"); // 레이아웃 읽기
    assert.match(layout, /src="\/privacy-consent\.mjs"/); // 동의 모듈 확인
    assert.match(layout, /src="\/site-analytics\.mjs"/); // 분석 모듈 확인
    assert.doesNotMatch(layout, /@vercel\/analytics/); // 기존 분석 제거 확인
}); // 테스트 끝

test("메인 핵심 이동 링크는 허용된 분석 이벤트를 사용한다", async () => // 핵심 링크 테스트
{ // 테스트 시작
    const html = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    assert.match(html, /data-analytics-event="select_game"/); // 게임 선택 확인
    assert.match(html, /data-analytics-event="view_development_news"/); // 뉴스 이동 확인
    assert.match(html, /data-analytics-event="view_goods"/); // 굿즈 이동 확인
    assert.match(html, /data-analytics-event="view_community"/); // 커뮤니티 이동 확인
    assert.match(html, /data-analytics-event="login_start"/); // 로그인 시작 확인
}); // 테스트 끝
