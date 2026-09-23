import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const layoutPath = path.join(projectRoot, "app", "layout.tsx"); // 루트 화면 파일 경로

test("루트 HTML은 공백 글자 없이 공통 테마를 한 번 연결한다", async () => // 수화 오류와 테마 연결 검증
{ // 테스트 시작
    const layout = await readFile(layoutPath, "utf8"); // 루트 화면 읽기
    assert.match(layout, /<html lang="ko"><head><link rel="stylesheet" href="\/playful-lab-theme\.css" \/><\/head><body[^>]*data-theme="playful-lab"/, "루트 테마 구조 누락"); // 여는 태그와 테마 확인
    assert.match(layout, /<\/body><\/html>/, "본문 뒤 공백 노드 존재"); // 닫는 태그 연결 확인
    assert.equal((layout.match(/playful-lab-theme\.css/g) ?? []).length, 1); // 테마 단일 연결 확인
}); // 테스트 끝
