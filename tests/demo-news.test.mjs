import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { DEMO_NEWS_POSTS, resolveDemoNewsPost } from "../lib/news/demo-posts.ts"; // 시연 뉴스 도구

test("개발 뉴스 네 개를 상세 화면용 데이터로 제공한다", () => // 시연 뉴스 테스트
{ // 테스트 시작
    assert.equal(DEMO_NEWS_POSTS.length, 4); // 뉴스 개수 확인
    assert.equal(resolveDemoNewsPost("demo-echo-void")?.tags.includes("update"), true); // 태그 확인
    assert.equal(resolveDemoNewsPost("unknown"), null); // 미등록 뉴스 확인
}); // 테스트 끝

test("개발 뉴스 목록의 임시 뉴스가 상세 주소로 연결된다", async () => // 목록 연결 테스트
{ // 테스트 시작
    const html = await readFile(new URL("../public/devlog.html", import.meta.url), "utf8"); // 뉴스 목록 읽기
    for (const post of DEMO_NEWS_POSTS) // 시연 뉴스 반복
    { // 반복 시작
        assert.match(html, new RegExp(`/news/${post.id}`)); // 상세 주소 확인
    } // 반복 끝
}); // 테스트 끝
