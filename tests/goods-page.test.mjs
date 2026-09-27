import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import { readFile } from "node:fs/promises"; // 파일 읽기 도구
import { fileURLToPath } from "node:url"; // URL 경로 변환 도구
import path from "node:path"; // 경로 조합 도구
import { applyProductLimit, getProductCardModel, getProductLoadStatus, shouldUseRemoteProducts } from "../public/goods-card.mjs"; // 상품 카드 표시 함수

const testDirectory = path.dirname(fileURLToPath(import.meta.url)); // 테스트 폴더 경로
const projectRoot = path.resolve(testDirectory, ".."); // 프로젝트 최상위 경로
const publicRoot = path.join(projectRoot, "public"); // 공개 파일 폴더
const baseProduct = { name: "테스트 상품", price: 10000, originalPrice: null, salesUrl: "https://shop.example.com/item", stockQuantity: 8, saleState: "in_stock" }; // 기본 상품

test("원격 상품은 설정 완료와 비어 있지 않은 목록이 필요하다", () => // 원격 목록 판정
{ // 테스트 시작
    assert.equal(shouldUseRemoteProducts({ configured: true, products: [baseProduct] }), true); // 정상 목록 사용 확인
    assert.equal(shouldUseRemoteProducts({ configured: true, products: [] }), false); // 빈 목록 거부 확인
    assert.equal(shouldUseRemoteProducts({ configured: false, products: [baseProduct] }), false); // 미설정 목록 거부 확인
}); // 테스트 끝

test("상품 서버 설정 여부에 따라 완료 안내를 표시한다", () => // 상품 조회 안내 검증
{ // 테스트 시작
    assert.equal(getProductLoadStatus({ configured: false, products: [] }), "서버 연결 전이라 임시 상품을 표시합니다."); // 미설정 안내 확인
    assert.equal(getProductLoadStatus({ configured: true, products: [] }), "등록된 상품이 없어 임시 상품을 표시합니다."); // 빈 목록 안내 확인
    assert.equal(getProductLoadStatus({ configured: true, products: [baseProduct] }), "등록된 최신 상품을 표시하고 있습니다."); // 원격 목록 안내 확인
}); // 테스트 끝

test("상품 상태에 따라 버튼과 재고 문구를 결정한다", () => // 상품 상태 표시 검증
{ // 테스트 시작
    assert.deepEqual(getProductCardModel(baseProduct), { stateLabel: "판매 중", buttonLabel: "구매하기", linkEnabled: true, stockLabel: "재고 8개" }); // 판매 중 표시 확인
    assert.deepEqual(getProductCardModel({ ...baseProduct, stockQuantity: 3, saleState: "low_stock" }), { stateLabel: "재고 부족", buttonLabel: "구매하기", linkEnabled: true, stockLabel: "재고 3개" }); // 재고 부족 표시 확인
    assert.deepEqual(getProductCardModel({ ...baseProduct, stockQuantity: 0, saleState: "sold_out" }), { stateLabel: "품절", buttonLabel: "품절", linkEnabled: false, stockLabel: "재고 없음" }); // 품절 표시 확인
    assert.deepEqual(getProductCardModel({ ...baseProduct, salesUrl: null, saleState: "preparing" }), { stateLabel: "판매 준비 중", buttonLabel: "준비 중", linkEnabled: false, stockLabel: "판매 준비 중" }); // 준비 표시 확인
    assert.deepEqual(getProductCardModel({ ...baseProduct, saleState: "checking" }), { stateLabel: "재고 확인 중", buttonLabel: "확인 중", linkEnabled: false, stockLabel: "재고 확인 중" }); // 확인 표시 검증
}); // 테스트 끝

test("메인 미리보기 개수 이후의 임시 상품을 숨긴다", () => // 상품 미리보기 제한 검증
{ // 테스트 시작
    const children = Array.from({ length: 6 }, () => ({ hidden: false })); // 가짜 상품 카드 목록
    applyProductLimit({ children }, 4); // 네 개 상품 제한 적용
    assert.deepEqual(children.map((child) => child.hidden), [false, false, false, false, true, true]); // 숨김 상태 확인
}); // 테스트 끝

test("굿즈 전용 페이지에 공통 헤더와 전체 상품 영역이 있다", async () => // 굿즈 페이지 계약
{ // 테스트 시작
    const html = await readFile(path.join(publicRoot, "goods.html"), "utf8"); // 굿즈 문서 읽기
    assert.match(html, /class="navbar"/); // 공통 헤더 확인
    assert.match(html, /href="main\.html#games">게임<\/a>/); // 게임 메뉴 확인
    assert.match(html, /href="goods\.html" aria-current="page">굿즈<\/a>/); // 현재 굿즈 메뉴 확인
    assert.match(html, /href="devlog\.html">개발 뉴스<\/a>/); // 뉴스 메뉴 확인
    assert.match(html, /id="goods-list"/); // 상품 목록 확인
    assert.match(html, /id="goods-load-status"/); // 불러오기 상태 확인
    assert.match(html, /id="contact-dialog"/); // 문의 대화상자 확인
    assert.match(html, /href="\/admin\/login"/); // 관리자 로그인 확인
}); // 테스트 끝

test("메인 헤더와 굿즈 상세 버튼이 전용 페이지로 이동한다", async () => // 메인 연결 계약
{ // 테스트 시작
    const html = await readFile(path.join(publicRoot, "main.html"), "utf8"); // 메인 문서 읽기
    assert.match(html, /<li><a href="goods\.html">굿즈<\/a><\/li>/); // 헤더 굿즈 연결 확인
    assert.match(html, /class="section-detail-link" href="goods\.html">상세 페이지로 이동 →<\/a>/); // 굿즈 상세 버튼 확인
    assert.doesNotMatch(html, /class="goods-footer"/); // 굿즈 중복 버튼 제거 확인
    assert.match(html, /data-product-limit="4"/); // 메인 미리보기 제한 확인
}); // 테스트 끝
