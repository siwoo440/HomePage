import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구

export const GAME_IMAGE_SOURCE_DIR = "internal/game-image-originals"; // 원본 PNG 보관 위치(배포하지 않음)
export const GAME_IMAGE_OUTPUT_DIR = "public/images/games"; // 화면에 쓰는 이미지 위치
export const GAME_IMAGE_WIDTH = 1280; // 화면용 이미지 너비
export const GAME_IMAGE_HEIGHT = 720; // 화면용 이미지 높이
export const GAME_IMAGE_QUALITY = 80; // 화면용 WebP 품질
export const GAME_IMAGE_MAX_BYTES = 300_000; // 화면용 이미지 한 장의 용량 한도

export function listGameImageSources(root = process.cwd()) // 원본 이미지 목록 읽기
{ // 함수 시작
    const directory = path.join(root, GAME_IMAGE_SOURCE_DIR); // 원본 폴더
    return fs.readdirSync(directory).filter((name) => /^project-[a-z]+\.png$/.test(name)).sort(); // 프로젝트 원본만 이름순 반환
} // 함수 끝

export function toGameImageOutputName(sourceName) // 원본 이름을 화면용 이름으로 변환
{ // 함수 시작
    return sourceName.replace(/\.png$/, ".webp"); // 확장자만 교체
} // 함수 끝

export async function optimizeGameImages(root = process.cwd(), log = console.log) // 원본을 화면용 WebP로 변환
{ // 함수 시작
    const { default: sharp } = await import("sharp"); // 변환할 때만 이미지 도구 불러오기
    const results = []; // 변환 결과 목록
    fs.mkdirSync(path.join(root, GAME_IMAGE_OUTPUT_DIR), { recursive: true }); // 출력 폴더 준비
    for (const name of listGameImageSources(root)) // 원본 반복
    { // 반복 시작
        const source = path.join(root, GAME_IMAGE_SOURCE_DIR, name); // 원본 경로
        const outputName = toGameImageOutputName(name); // 화면용 파일 이름
        const target = path.join(root, GAME_IMAGE_OUTPUT_DIR, outputName); // 화면용 경로
        const info = await sharp(source).resize(GAME_IMAGE_WIDTH, GAME_IMAGE_HEIGHT, { fit: "cover" }).webp({ quality: GAME_IMAGE_QUALITY, effort: 6 }).toFile(target); // 크기를 줄여 WebP로 저장
        results.push({ name: outputName, bytes: info.size, sourceBytes: fs.statSync(source).size }); // 결과 기록
        if (info.size > GAME_IMAGE_MAX_BYTES) // 용량 한도 확인
        { // 조건 시작
            log(`주의: ${outputName} 용량이 한도를 넘었습니다(${Math.round(info.size / 1024)}KB).`); // 한도 초과 안내
        } // 조건 끝
    } // 반복 끝
    return results; // 변환 결과 반환
} // 함수 끝

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) // 직접 실행 확인
{ // 조건 시작
    const results = await optimizeGameImages(); // 전체 변환 실행
    const before = results.reduce((sum, item) => sum + item.sourceBytes, 0); // 원본 용량 합계
    const after = results.reduce((sum, item) => sum + item.bytes, 0); // 화면용 용량 합계
    console.log(`게임 이미지 ${results.length}장을 ${GAME_IMAGE_WIDTH}×${GAME_IMAGE_HEIGHT} WebP로 만들었습니다.`); // 장수 안내
    console.log(`원본 ${(before / 1024 / 1024).toFixed(1)}MB → 화면용 ${(after / 1024 / 1024).toFixed(1)}MB`); // 용량 변화 안내
} // 조건 끝
