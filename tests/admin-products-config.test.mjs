import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const migrationPath = path.join(projectRoot, "supabase", "migrations", "202609110001_admin_products.sql"); // 상품 마이그레이션 경로

test("상품 테이블에 판매와 재고 관리 필드가 있다", async () => // 상품 구조 검증
{ // 테스트 시작
    const sql = await readFile(migrationPath, "utf8"); // 마이그레이션 읽기
    assert.match(sql, /create table public\.products/i); // 상품 테이블 확인
    assert.match(sql, /stock_mode text not null/i); // 재고 방식 확인
    assert.match(sql, /stock_quantity integer not null/i); // 재고 수량 확인
    assert.match(sql, /sales_url text/i); // 판매 주소 확인
    assert.match(sql, /publication_status text not null/i); // 공개 상태 확인
    assert.match(sql, /display_order integer not null/i); // 노출 순서 확인
}); // 테스트 끝

test("공개 읽기와 관리자 변경 권한을 분리한다", async () => // 행 보안 검증
{ // 테스트 시작
    const sql = await readFile(migrationPath, "utf8"); // 마이그레이션 읽기
    assert.match(sql, /enable row level security/i); // 행 보안 활성화 확인
    assert.match(sql, /publication_status = 'published'/i); // 공개 상품 조건 확인
    assert.match(sql, /admins can create products/i); // 관리자 작성 정책 확인
    assert.match(sql, /admins can update products/i); // 관리자 수정 정책 확인
    assert.match(sql, /admins can delete products/i); // 관리자 삭제 정책 확인
    assert.match(sql, /select public\.is_admin\(\)/i); // 관리자 역할 확인
}); // 테스트 끝

test("상품 이미지 버킷과 관리자 저장 정책이 있다", async () => // 이미지 보안 검증
{ // 테스트 시작
    const sql = await readFile(migrationPath, "utf8"); // 마이그레이션 읽기
    assert.match(sql, /'product-images'/i); // 이미지 버킷 확인
    assert.match(sql, /5242880/i); // 이미지 크기 제한 확인
    assert.match(sql, /image\/jpeg/i); // JPEG 형식 확인
    assert.match(sql, /image\/png/i); // PNG 형식 확인
    assert.match(sql, /image\/webp/i); // WebP 형식 확인
    assert.match(sql, /admins can upload product images/i); // 관리자 업로드 정책 확인
}); // 테스트 끝

test("임시 상품 여덟 개를 초기 데이터로 제공한다", async () => // 초기 상품 검증
{ // 테스트 시작
    const sql = await readFile(migrationPath, "utf8"); // 마이그레이션 읽기
    const imagePaths = sql.match(/\/images\/goods\/[a-z0-9-]+\.webp/g) ?? []; // 정적 이미지 경로 추출
    assert.equal(new Set(imagePaths).size, 8); // 여덟 이미지 확인
}); // 테스트 끝
