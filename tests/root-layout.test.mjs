import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const layoutPath = path.join(projectRoot, "app", "layout.tsx"); // 루트 화면 파일 경로

test("루트 HTML은 수화 전에 저장된 색상 모드를 복원한다", async () => // 초기 색상 모드 연결 검증
{ // 테스트 시작
    const layout = await readFile(layoutPath, "utf8"); // 루트 화면 읽기
    assert.match(layout, /<html lang="ko" data-theme="playful-lab" suppressHydrationWarning><head><script src="\/color-mode-bootstrap\.js"><\/script><script src="\/i18n-bootstrap\.js" data-i18n-page="next"><\/script><link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/><link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossOrigin="anonymous" \/><link rel="stylesheet" href="\/site-header\.css" \/><link rel="stylesheet" href="\/responsive-shell\.css" \/><link rel="stylesheet" href="\/playful-lab-theme\.css" \/><\/head>/, "초기 색상 모드 구조 누락"); // 스크립트 선행 순서 확인
    assert.equal((layout.match(/color-mode-bootstrap\.js/g) ?? []).length, 1); // 초기화 스크립트 단일 연결 확인
}); // 테스트 끝

test("루트 HTML은 본문 중복 없이 공통 테마를 한 번 연결한다", async () => // 공통 테마 범위 검증
{ // 테스트 시작
    const layout = await readFile(layoutPath, "utf8"); // 루트 화면 읽기
    assert.doesNotMatch(layout, /<body[^>]*data-theme=/, "본문에 중복 테마 범위 존재"); // 본문 중복 속성 확인
    assert.match(layout, /<\/body><\/html>/, "본문 뒤 공백 노드 존재"); // 닫는 태그 연결 확인
    assert.equal((layout.match(/playful-lab-theme\.css/g) ?? []).length, 1); // 테마 단일 연결 확인
}); // 테스트 끝
