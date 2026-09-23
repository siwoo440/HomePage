import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const actionsPath = path.join(projectRoot, "app", "admin", "products", "actions.ts"); // 상품 액션 경로

test("상품 변경 액션은 관리자 권한과 입력 검증을 사용한다", async () => // 관리자 보호 계약
{ // 테스트 시작
    const source = await readFile(actionsPath, "utf8"); // 액션 소스 읽기
    assert.match(source, /export async function createProduct/); // 등록 액션 확인
    assert.match(source, /export async function updateProduct/); // 수정 액션 확인
    assert.match(source, /export async function deleteProduct/); // 삭제 액션 확인
    assert.match(source, /requireAdmin\("\/admin\/products\/new"\)/); // 등록 관리자 확인
    assert.match(source, /validateProduct\(values\)/); // 상품 입력 검증 확인
    assert.match(source, /validateProductImage\(productImage\)/); // 상품 이미지 검증 확인
}); // 테스트 끝

test("상품 이미지 정리와 공개 API 갱신을 처리한다", async () => // 저장 실패 정리 계약
{ // 테스트 시작
    const source = await readFile(actionsPath, "utf8"); // 액션 소스 읽기
    assert.match(source, /storage\.from\("product-images"\)/); // 상품 이미지 버킷 확인
    assert.match(source, /await removeProductImage\(uploadedImagePath\)/); // 수정 실패 이미지 정리 확인
    assert.match(source, /await removeProductImage\(existingResult\.data\.image_path/); // 기존 이미지 정리 확인
    assert.match(source, /revalidatePath\("\/api\/products"\)/); // 공개 API 갱신 확인
}); // 테스트 끝
