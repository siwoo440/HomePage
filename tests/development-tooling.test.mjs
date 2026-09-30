import test from "node:test"; // 테스트 함수 가져오기
import assert from "node:assert/strict"; // 엄격한 검증 함수 가져오기
import { access, readFile } from "node:fs/promises"; // 파일 접근 함수 가져오기
import path from "node:path"; // 경로 함수 가져오기
import { fileURLToPath } from "node:url"; // URL 변환 함수 가져오기

const currentFile = fileURLToPath(import.meta.url); // 현재 파일 경로 계산
const currentDirectory = path.dirname(currentFile); // 현재 폴더 경로 계산
const projectRoot = path.resolve(currentDirectory, ".."); // 프로젝트 루트 계산

test("홈페이지 도구는 별도 프로젝트와 Next 생성 파일을 제외한다", async () => // 저장소 경계 검사
{ // 테스트 시작
    const gitignore = await readFile(path.join(projectRoot, ".gitignore"), "utf8"); // Git 제외 규칙 읽기
    const tsconfig = JSON.parse(await readFile(path.join(projectRoot, "tsconfig.json"), "utf8")); // 타입 설정 읽기
    assert.match(gitignore, /^ChatBot\/$/m); // ChatBot Git 제외 확인
    assert.match(gitignore, /^Text-Play\/$/m); // Text-Play Git 제외 확인
    assert.match(gitignore, /^next-env\.d\.ts$/m); // 생성 타입 Git 제외 확인
    assert.equal(tsconfig.exclude.includes("ChatBot"), true); // ChatBot 타입 제외 확인
    assert.equal(tsconfig.exclude.includes("Text-Play"), true); // Text-Play 타입 제외 확인
    assert.equal(tsconfig.include.includes("next-env.d.ts"), true); // 생성 타입 포함 확인
}); // 테스트 종료

test("pnpm 11 설치 정책은 작업 공간 설정에서 관리한다", async () => // 패키지 정책 검사
{ // 테스트 시작
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")); // 패키지 설정 읽기
    const workspace = await readFile(path.join(projectRoot, "pnpm-workspace.yaml"), "utf8"); // 작업 공간 설정 읽기
    assert.equal(packageJson.packageManager, "pnpm@11.19.0"); // pnpm 버전 확인
    assert.equal(packageJson.engines.node, ">=22.13"); // Node 하한 확인
    assert.equal("pnpm" in packageJson, false); // 무시되는 설정 제거 확인
    assert.match(workspace, /overrides:\s+[\s\S]*hono: 4\.12\.25/); // hono 고정 확인
    assert.match(workspace, /allowBuilds:\s+[\s\S]*msw: false[\s\S]*sharp: true/); // 빌드 정책 확인
    assert.match(workspace, /allowBuilds:\s+[\s\S]*unrs-resolver: false/); // ESLint 해석기 빌드 거부 확인
}); // 테스트 종료

test("공식 품질 검사 명령과 ESLint 버전이 고정되어 있다", async () => // 검사 명령 계약
{ // 테스트 시작
    const packageJson = JSON.parse(await readFile(path.join(projectRoot, "package.json"), "utf8")); // 패키지 설정 읽기
    assert.equal(packageJson.scripts.typecheck, "tsc --noEmit --incremental false"); // 타입 명령 확인
    assert.equal(packageJson.scripts.lint, "eslint app lib scripts tests proxy.ts next.config.mjs postcss.config.mjs eslint.config.mjs --max-warnings=0"); // 린트 명령 확인
    assert.equal(packageJson.scripts.check, "pnpm test && pnpm typecheck && pnpm lint && pnpm build"); // 통합 명령 확인
    assert.equal(packageJson.devDependencies.eslint, "9.39.5"); // ESLint 버전 확인
    assert.equal(packageJson.devDependencies["eslint-config-next"], "16.2.6"); // Next 규칙 버전 확인
    await access(path.join(projectRoot, "eslint.config.mjs")); // Flat Config 존재 확인
}); // 테스트 종료

test("개발 문서는 공식 통합 검사 명령을 동일하게 안내한다", async () => // 문서 계약 검사
{ // 테스트 시작
    const documentPaths = ["README.md", "docs/DEVELOPMENT-GUIDE.md", "docs/DEVELOPMENT-NOTES.md", "TRANSFER-GUIDE.md"]; // 검사 문서 목록
    for (const documentPath of documentPaths) // 문서 반복
    { // 반복 시작
        const content = await readFile(path.join(projectRoot, documentPath), "utf8"); // 문서 읽기
        assert.match(content, /pnpm check/, `${documentPath}: 통합 검사 명령 누락`); // 통합 명령 확인
    } // 반복 종료
    const environmentDocumentPaths = ["README.md", "docs/DEVELOPMENT-GUIDE.md", "TRANSFER-GUIDE.md"]; // 환경 문서 목록
    for (const documentPath of environmentDocumentPaths) // 환경 문서 반복
    { // 반복 시작
        const content = await readFile(path.join(projectRoot, documentPath), "utf8"); // 환경 문서 읽기
        assert.match(content, /Node\.js(?::)? `>=22\.13`/, `${documentPath}: Node 하한 불일치`); // Node 하한 확인
        assert.match(content, /pnpm(?::)? `11\.19\.0`/, `${documentPath}: pnpm 버전 불일치`); // pnpm 버전 확인
    } // 반복 종료
}); // 테스트 종료
