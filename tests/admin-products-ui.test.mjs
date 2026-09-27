import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const productRoot = path.join(projectRoot, "app", "admin", "products"); // 상품 관리자 폴더

test("상품 편집기에 필수 관리 필드와 상태 미리보기가 있다", async () => // 상품 편집기 계약
{ // 테스트 시작
    const source = await readFile(path.join(productRoot, "product-editor.tsx"), "utf8"); // 편집기 소스 읽기
    for (const field of ["name", "category", "gameName", "price", "originalPrice", "stockQuantity", "salesUrl", "publicationStatus", "displayOrder", "productImage"]) // 필수 필드 반복
    { // 반복 시작
        assert.match(source, new RegExp(`name=\\"${field}\\"`), `${field} 입력 누락`); // 필드 존재 확인
    } // 반복 끝
    assert.match(source, /상품 상태 미리보기/); // 상태 미리보기 확인
    assert.match(source, /실물 사진으로 교체/); // 임시 이미지 안내 확인
}); // 테스트 끝

test("상품 목록과 등록 수정 경로가 관리자 보호를 사용한다", async () => // 관리자 페이지 계약
{ // 테스트 시작
    const listSource = await readFile(path.join(productRoot, "page.tsx"), "utf8"); // 목록 화면 읽기
    const newSource = await readFile(path.join(productRoot, "new", "page.tsx"), "utf8"); // 등록 화면 읽기
    const editSource = await readFile(path.join(productRoot, "[id]", "edit", "page.tsx"), "utf8"); // 수정 화면 읽기
    assert.match(listSource, /requireAdmin\("\/admin\/products"\)/); // 목록 관리자 보호 확인
    assert.match(newSource, /requireAdmin\("\/admin\/products\/new"\)/); // 등록 관리자 보호 확인
    assert.match(editSource, /requireAdmin\(`\/admin\/products\/\$\{id\}\/edit`\)/); // 수정 관리자 보호 확인
    assert.match(listSource, /DeleteProductButton/); // 삭제 확인 버튼 확인
}); // 테스트 끝

test("관리자 공통 메뉴에서 상품 관리로 이동한다", async () => // 관리자 메뉴 계약
{ // 테스트 시작
    const source = await readFile(path.join(projectRoot, "app", "admin", "news", "admin-header.tsx"), "utf8"); // 관리자 메뉴 읽기
    assert.match(source, /href="\/admin\/products"/); // 상품 관리 링크 확인
    assert.match(source, /href="\/admin\/products\/new"/); // 새 상품 링크 확인
    assert.match(source, /href="\/goods\.html"/); // 공개 굿즈 링크 확인
}); // 테스트 끝
