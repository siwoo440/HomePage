import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구

export function collectProjectMainPages(root) // 프로젝트 메인 수집
{ // 함수 시작
    if (!fs.existsSync(root)) // 루트 존재 확인
    { // 조건 시작
        return []; // 빈 목록 반환
    } // 조건 끝

    return fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.startsWith("project_")).flatMap((entry) => // 프로젝트 폴더 반복
    { // 변환 시작
        const directory = path.join(root, entry.name); // 프로젝트 경로 생성
        return fs.readdirSync(directory).filter((name) => /^Project.*_Main\.html$/.test(name)).map((name) => path.join(directory, name)); // 메인 파일 반환
    }).sort(); // 안정된 순서 반환
} // 함수 끝

export async function archiveProjectPages(sourceRoot, targetRoot) // 프로젝트 원본 보관
{ // 함수 시작
    const sourcePages = collectProjectMainPages(sourceRoot); // 공개 페이지 수집
    let copiedCount = 0; // 복사 수 초기화

    for (const sourcePath of sourcePages) // 공개 페이지 반복
    { // 반복 시작
        const relativePath = path.relative(sourceRoot, sourcePath); // 상대 경로 계산
        const targetPath = path.join(targetRoot, relativePath); // 보관 경로 생성
        await fs.promises.mkdir(path.dirname(targetPath), { recursive: true }); // 보관 폴더 생성

        try // 안전 복사 시도
        { // 시도 시작
            await fs.promises.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL); // 덮어쓰기 없는 복사
            copiedCount += 1; // 복사 수 증가
        } // 시도 끝
        catch (error) // 복사 오류 처리
        { // 오류 처리 시작
            if (error?.code !== "EEXIST") // 기존 파일 외 오류 확인
            { // 조건 시작
                throw error; // 예상하지 못한 오류 전달
            } // 조건 끝
        } // 오류 처리 끝
    } // 반복 끝

    return copiedCount; // 복사 수 반환
} // 함수 끝

const currentModulePath = fileURLToPath(import.meta.url); // 현재 모듈 경로
const executedPath = process.argv[1] ? path.resolve(process.argv[1]) : ""; // 실행 파일 경로

if (executedPath === currentModulePath) // 직접 실행 확인
{ // 조건 시작
    const copiedCount = await archiveProjectPages("public", "internal/project-archives"); // 원본 보관 실행
    console.log(`${copiedCount}개 프로젝트 원본 보관 완료`); // 실행 결과 출력
} // 조건 끝
