import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구
import vm from "node:vm"; // 격리 실행 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const scriptPath = path.join(projectRoot, "public", "color-mode-bootstrap.js"); // 초기화 스크립트 경로

function createEnvironment(options = {}) // 브라우저 모형 생성
{ // 함수 시작
    const documentElement = { dataset: {} }; // 문서 루트 모형
    const localStorage = // 저장소 모형 시작
    { // 저장소 객체
        getItem(key) // 저장값 조회
        { // 함수 시작
            assert.equal(key, "devforge-color-mode"); // 저장 키 확인

            if (options.storageThrows) // 저장소 오류 확인
            { // 조건 시작
                throw new Error("저장소 접근 차단"); // 접근 오류 발생
            } // 조건 끝

            return options.storedMode ?? null; // 저장값 반환
        }, // 조회 함수 끝
    }; // 저장소 모형 끝
    const window = { localStorage }; // 창 모형

    if (options.hasMatchMedia !== false) // 시스템 설정 지원 확인
    { // 조건 시작
        window.matchMedia = (query) => // 미디어 설정 조회
        { // 함수 시작
            assert.equal(query, "(prefers-color-scheme: dark)"); // 조회 조건 확인
            return { matches: options.prefersDark === true }; // 선호 결과 반환
        }; // 함수 끝
    } // 조건 끝

    return { documentElement, context: { document: { documentElement }, window } }; // 실행 환경 반환
} // 함수 끝

async function runBootstrap(options = {}) // 초기화 스크립트 실행
{ // 함수 시작
    const source = await readFile(scriptPath, "utf8"); // 실제 스크립트 읽기
    const environment = createEnvironment(options); // 실행 환경 생성
    vm.runInNewContext(source, environment.context, { filename: scriptPath }); // 격리 스크립트 실행
    return environment.documentElement.dataset.colorMode; // 적용 모드 반환
} // 함수 끝

test("저장된 다크 모드는 시스템 밝은 모드보다 우선한다", async () => // 다크 저장값 우선순위 검사
{ // 테스트 시작
    assert.equal(await runBootstrap({ storedMode: "dark", prefersDark: false }), "dark"); // 다크 모드 확인
}); // 테스트 끝

test("저장된 밝은 모드는 시스템 다크 모드보다 우선한다", async () => // 밝은 저장값 우선순위 검사
{ // 테스트 시작
    assert.equal(await runBootstrap({ storedMode: "light", prefersDark: true }), "light"); // 밝은 모드 확인
}); // 테스트 끝

test("잘못된 저장값은 시스템 설정으로 대체한다", async () => // 오염값 복구 검사
{ // 테스트 시작
    assert.equal(await runBootstrap({ storedMode: "sepia", prefersDark: true }), "dark"); // 시스템 다크 확인
}); // 테스트 끝

test("저장소 접근이 차단되어도 시스템 설정을 사용한다", async () => // 저장소 예외 검사
{ // 테스트 시작
    assert.equal(await runBootstrap({ storageThrows: true, prefersDark: false }), "light"); // 시스템 밝음 확인
}); // 테스트 끝

test("시스템 설정 API가 없으면 밝은 모드를 사용한다", async () => // 기본 모드 검사
{ // 테스트 시작
    assert.equal(await runBootstrap({ hasMatchMedia: false }), "light"); // 기본 밝음 확인
}); // 테스트 끝
