import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { collectProjectMainPages } from "../scripts/archive-project-pages.mjs"; // 페이지 수집 도구

test("프로젝트 메인 원본 35개를 보존한다", () => // 원본 보관 테스트
{ // 테스트 시작
    const publicPages = collectProjectMainPages("public"); // 공개 원본 수집
    const archivedPages = collectProjectMainPages("internal/project-archives"); // 보관 원본 수집
    assert.equal(publicPages.length, 35); // 공개 페이지 수 확인
    assert.deepEqual(archivedPages.map((filePath) => path.basename(filePath)).sort(), publicPages.map((filePath) => path.basename(filePath)).sort()); // 보관 파일명 확인
}); // 테스트 끝

test("공개 문서는 내부 보관 경로를 연결하지 않는다", () => // 내부 링크 차단 테스트
{ // 테스트 시작
    const publicHtmlFiles = fs.readdirSync("public", { recursive: true }).filter((filePath) => filePath.endsWith(".html")); // 공개 HTML 목록
    for (const filePath of publicHtmlFiles) // 공개 문서 반복
    { // 반복 시작
        const html = fs.readFileSync(path.join("public", filePath), "utf8"); // 공개 문서 읽기
        assert.doesNotMatch(html, /internal\/project-archives/); // 내부 경로 미노출 확인
    } // 반복 끝
}); // 테스트 끝
