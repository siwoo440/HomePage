import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile, stat } from "node:fs/promises"; // 파일 검사 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const imageRoot = path.join(projectRoot, "public", "images", "goods"); // 상품 이미지 폴더
const imageNames = ["abyss-keyring.webp", "neon-pulse-hoodie.webp", "luna-jump-posters.webp", "devforge-mug.webp", "all-games-stickers.webp", "echo-void-mousepad.webp", "abyss-pin-set.webp", "neon-pulse-ost.webp"]; // 상품 이미지 이름

test("임시 상품 이미지 여덟 개가 최적화된 WebP 파일로 존재한다", async () => // 이미지 최적화 검증
{ // 테스트 시작
    let totalSize = 0; // 전체 이미지 용량

    for (const imageName of imageNames) // 이미지 이름 반복
    { // 반복 시작
        const imagePath = path.join(imageRoot, imageName); // 이미지 전체 경로
        const fileInfo = await stat(imagePath); // 이미지 파일 정보
        const content = await readFile(imagePath); // 이미지 내용 읽기
        assert.ok(fileInfo.size > 10000, `${imageName} 파일 크기 부족`); // 실제 이미지 크기 확인
        assert.ok(fileInfo.size <= 700000, `${imageName} 웹 최적화 용량 초과`); // 개별 이미지 용량 확인
        assert.equal(content.subarray(0, 4).toString("ascii"), "RIFF", `${imageName} RIFF 서명 오류`); // WebP 컨테이너 확인
        assert.equal(content.subarray(8, 12).toString("ascii"), "WEBP", `${imageName} WebP 서명 오류`); // WebP 형식 확인
        totalSize += fileInfo.size; // 전체 용량 누적
    } // 반복 끝

    assert.ok(totalSize <= 4000000, "전체 상품 이미지 용량 초과"); // 전체 이미지 용량 확인
}); // 테스트 끝

test("모든 상품 화면과 초기 데이터가 같은 이미지 이름을 사용한다", async () => // 이미지 연결 검증
{ // 테스트 시작
    const mainHtml = await readFile(path.join(projectRoot, "public", "main.html"), "utf8"); // 메인 문서 읽기
    const goodsHtml = await readFile(path.join(projectRoot, "public", "goods.html"), "utf8"); // 굿즈 문서 읽기
    const migration = await readFile(path.join(projectRoot, "supabase", "migrations", "202609110001_admin_products.sql"), "utf8"); // 상품 초기 데이터 읽기

    for (const imageName of imageNames) // 이미지 이름 반복
    { // 반복 시작
        assert.match(mainHtml, new RegExp(`images/goods/${imageName.replace(".", "\\.")}`), `메인 ${imageName} 참조 누락`); // 메인 이미지 연결 확인
        assert.match(goodsHtml, new RegExp(`images/goods/${imageName.replace(".", "\\.")}`), `굿즈 ${imageName} 참조 누락`); // 굿즈 이미지 연결 확인
        assert.match(migration, new RegExp(`/images/goods/${imageName.replace(".", "\\.")}`), `초기 데이터 ${imageName} 참조 누락`); // 초기 데이터 연결 확인
    } // 반복 끝
}); // 테스트 끝
