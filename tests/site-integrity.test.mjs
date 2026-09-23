import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const publicRoot = path.join(projectRoot, "public"); // 공개 파일 폴더
const projects = [ // 신규 프로젝트 목록
    { slug: "gamma", symbol: "γ", genre: "주식 · 시뮬레이션", status: "보류", age: "15세 이용가" }, // 감마 프로젝트 정보
    { slug: "delta", symbol: "δ", genre: "던전 · 로그라이크", status: "개발 중", age: "청소년 이용불가" }, // 델타 프로젝트 정보
    { slug: "epsilon", symbol: "ε", genre: "뱀서류", status: "개발 중", age: "12세 이용가" }, // 엡실론 프로젝트 정보
    { slug: "zeta", symbol: "ζ", genre: "삽질", status: "보류", age: "12세 이용가" }, // 제타 프로젝트 정보
    { slug: "eta", symbol: "η", genre: "체스 · 카드", status: "개발 중", age: "12세 이용가" }, // 에타 프로젝트 정보
    { slug: "theta", symbol: "θ", genre: "눈빛 보내기", status: "개발 중", age: "청소년 이용불가" }, // 세타 프로젝트 정보
    { slug: "iota", symbol: "ι", genre: "러시안 룰렛", status: "기획", age: "15세 이용가" }, // 이오타 프로젝트 정보
]; // 신규 프로젝트 목록 끝

test("메인 페이지에 깨진 대체 문자가 없다", async () => // 깨진 글자 회귀 검사
{ // 테스트 본문 시작
    const mainHtml = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    assert.equal(mainHtml.includes("�"), false, "메인 페이지에 깨진 문자 존재"); // 대체 문자 부재 검증
}); // 테스트 본문 끝

test("신규 프로젝트 카드가 실제 상세 페이지로 연결된다", async () => // 카드 연결 회귀 검사
{ // 테스트 본문 시작
    const mainHtml = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    for (const project of projects) // 프로젝트별 반복
    { // 반복 본문 시작
        const destination = `project_${project.slug}/Project${project.slug[0].toUpperCase()}${project.slug.slice(1)}_Main.html`; // 상세 페이지 상대 경로
        const cardPattern = new RegExp(`<a[^>]+id="project-${project.slug}"[^>]+href="${destination}"`); // 전체 카드 링크 형식
        assert.match(mainHtml, cardPattern, `프로젝트 ${project.symbol} 카드 링크 누락`); // 카드 링크 검증
    } // 반복 본문 끝
}); // 테스트 본문 끝

test("공통 공개 상세 페이지가 소개 정보와 복귀 링크를 제공한다", async () => // 공개 페이지 계약 검사
{ // 테스트 본문 시작
    for (const project of projects.filter((item) => item.slug !== "eta")) // 공통 프로젝트별 반복
    { // 반복 본문 시작
        const fileName = `Project${project.slug[0].toUpperCase()}${project.slug.slice(1)}_Main.html`; // 상세 문서 이름
        const detailPath = path.join(publicRoot, `project_${project.slug}`, fileName); // 상세 문서 경로
        const detailHtml = await readFile(detailPath, "utf8"); // 상세 문서 읽기
        assert.match(detailHtml, /href="\/main\.html#games"/, `프로젝트 ${project.symbol} 복귀 링크 누락`); // 메인 복귀 링크 검증
        assert.match(detailHtml, /href="\/project-page\.css"/, `프로젝트 ${project.symbol} 공개 스타일 누락`); // 공개 스타일 연결 검증
        assert.match(detailHtml, new RegExp(`images/games/project-${project.slug}\\.png`), `프로젝트 ${project.symbol} 대표 이미지 누락`); // 대표 이미지 검증
        assert.match(detailHtml, new RegExp(project.status), `프로젝트 ${project.symbol} 상태 누락`); // 상태 정보 검증
        assert.match(detailHtml, /data-public-project-page/, `프로젝트 ${project.symbol} 공개 루트 누락`); // 공개 루트 검증
        assert.doesNotMatch(detailHtml, /기획서|기획 초안|메인 아카이브|기획 준비 중/, `프로젝트 ${project.symbol} 내부 문구 노출`); // 내부 문구 제거 검증
    } // 반복 본문 끝
}); // 테스트 본문 끝
