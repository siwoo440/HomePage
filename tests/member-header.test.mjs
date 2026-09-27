import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구

const pages = ["main.html", "devlog.html", "goods.html", "community.html"]; // 주요 페이지 목록

test("모든 주요 헤더에서 문의하기 왼쪽과 로그인 오른쪽 순서를 지킨다", async () => // 헤더 순서 테스트
{ // 테스트 시작
    for (const page of pages) // 페이지 반복
    { // 반복 시작
        const html = await readFile(new URL(`../public/${page}`, import.meta.url), "utf8"); // 페이지 읽기
        const actions = html.match(/<div class="nav-actions">[\s\S]*?<\/div>/)?.[0] ?? ""; // 작업 영역 추출
        assert.match(actions, /문의하기[\s\S]*?data-member-action/); // 문의와 로그인 순서 확인
        assert.match(html, /member-session\.mjs/); // 회원 동작 연결 확인
    } // 반복 끝
}); // 테스트 끝

test("회원 로그인 화면은 시연 모드와 실제 로그인 방식을 구분한다", async () => // 로그인 화면 테스트
{ // 테스트 시작
    const page = await readFile(new URL("../app/login/page.tsx", import.meta.url), "utf8"); // 로그인 화면 읽기
    const form = await readFile(new URL("../app/login/member-login-form.tsx", import.meta.url), "utf8"); // 로그인 폼 읽기
    assert.match(page, /getMemberMode/); // 모드 판정 확인
    assert.match(form, /시연 계정으로 화면 확인/); // 시연 로그인 확인
    assert.match(form, /signInWithPassword/); // 이메일 로그인 확인
    assert.match(form, /signInWithOAuth/); // 구글 로그인 확인
}); // 테스트 끝
