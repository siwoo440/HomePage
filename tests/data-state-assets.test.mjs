import assert from "node:assert/strict"; // 엄격 비교 도구
import { readFile, stat } from "node:fs/promises"; // 파일 검사 도구
import test from "node:test"; // 테스트 실행 도구

const assetNames = ["loading.svg", "demo.svg", "empty.svg", "error.svg"]; // 상태 자산 목록

test("네 상태 벡터가 작고 안전한 SVG로 존재한다", async () => // 상태 벡터 테스트
{ // 테스트 시작
    for (const assetName of assetNames) // 자산 반복
    { // 반복 시작
        const assetUrl = new URL(`../public/images/states/${assetName}`, import.meta.url); // 자산 주소 생성
        const [content, fileInfo] = await Promise.all([readFile(assetUrl, "utf8"), stat(assetUrl)]); // 자산 내용과 크기 읽기
        assert.match(content, /<svg\b/); // SVG 루트 확인
        assert.match(content, /viewBox="0 0 64 64"/); // 공통 좌표 확인
        assert.doesNotMatch(content, /<script|<foreignObject|(?:href|src)="https?:\/\//i); // 실행 코드와 외부 자원 차단
        assert.equal(fileInfo.size < 5 * 1024, true); // 자산 크기 제한 확인
    } // 반복 끝
}); // 테스트 끝

test("모바일 상태 패널은 아이콘과 문구와 버튼을 세로로 배치한다", async () => // 모바일 상태 배치 테스트
{ // 테스트 시작
    const css = await readFile(new URL("../public/data-state.css", import.meta.url), "utf8"); // 상태 스타일 읽기
    const mobileBlock = css.match(/@media \(max-width: 620px\)[\s\S]*?@media \(prefers-reduced-motion/); // 모바일 스타일 추출
    assert.ok(mobileBlock); // 모바일 구간 존재 확인
    assert.match(mobileBlock[0], /\.data-state-panel[\s\S]*?grid-template-columns:\s*1fr/); // 한 열 배치 확인
}); // 테스트 끝
