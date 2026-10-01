import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { ADMIN_DEMO_NOTICE, isAdminDemoAvailable, runNewsDemo, runProductDemo } from "../lib/admin/demo-mode.ts"; // 관리자 데모 도구

const configured = { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key" }; // 설정 완료 환경

function createForm(entries) // 폼 데이터 생성
{ // 함수 시작
    const formData = new FormData(); // 빈 폼 데이터
    for (const [name, value] of entries) // 입력 반복
    { // 반복 시작
        formData.append(name, value); // 입력 추가
    } // 반복 끝
    return formData; // 폼 데이터 반환
} // 함수 끝

test("관리자 데모는 Supabase 없는 개발 환경에서만 열린다", () => // 데모 허용 범위 검사
{ // 테스트 시작
    assert.equal(isAdminDemoAvailable({ NODE_ENV: "development" }), true); // 개발·미설정 허용 확인
    assert.equal(isAdminDemoAvailable({ NODE_ENV: "production" }), false); // 운영 빌드 차단 확인
    assert.equal(isAdminDemoAvailable({ NODE_ENV: "development", ...configured }), false); // 실제 설정 환경 차단 확인
}); // 테스트 끝

test("뉴스 데모는 저장 없이 검증 오류와 미리보기를 돌려준다", () => // 뉴스 데모 검사
{ // 테스트 시작
    const invalid = runNewsDemo(createForm([["title", ""], ["content", ""], ["status", "draft"]])); // 빈 입력 검증
    assert.equal(invalid.preview, null); // 오류 시 미리보기 없음 확인
    assert.ok(invalid.state.errors.title); // 제목 오류 확인
    assert.ok(invalid.state.errors.content); // 본문 오류 확인
    const valid = runNewsDemo(createForm([["title", "  합성 도감 업데이트 "], ["summary", "요약"], ["content", "본문"], ["tags", "devlog"], ["status", "published"]])); // 정상 입력 검증
    assert.equal(valid.state.notice, ADMIN_DEMO_NOTICE); // 저장 안 함 안내 확인
    assert.deepEqual(valid.state.errors, {}); // 오류 없음 확인
    assert.equal(valid.preview?.post.title, "합성 도감 업데이트"); // 정리된 제목 확인
    assert.equal(valid.preview?.post.status, "published"); // 공개 상태 확인
    assert.equal(valid.state.values?.title, "  합성 도감 업데이트 "); // 입력값 복원 확인
}); // 테스트 끝

test("상품 데모는 공개 화면 판매 상태까지 계산한다", () => // 상품 데모 검사
{ // 테스트 시작
    const base = [["name", "키링"], ["category", "아크릴"], ["gameName", ""], ["description", ""], ["price", "9900"], ["originalPrice", ""], ["badge", "none"], ["salesUrl", "https://shop.example.com/item"], ["stockMode", "manual"], ["stockQuantity", "3"], ["externalProvider", ""], ["externalProductId", ""], ["publicationStatus", "published"], ["displayOrder", "0"]]; // 기본 상품 입력
    const lowStock = runProductDemo(createForm(base)); // 재고 부족 상품 검증
    assert.equal(lowStock.state.notice, ADMIN_DEMO_NOTICE); // 저장 안 함 안내 확인
    assert.equal(lowStock.preview?.saleState, "low_stock"); // 재고 부족 상태 확인
    const hidden = runProductDemo(createForm(base.map(([name, value]) => [name, name === "publicationStatus" ? "hidden" : value]))); // 비공개 상품 검증
    assert.equal(hidden.preview?.saleState, "hidden"); // 비공개 상태 확인
    const invalid = runProductDemo(createForm(base.map(([name, value]) => [name, name === "price" ? "-1" : value]))); // 음수 가격 검증
    assert.equal(invalid.preview, null); // 오류 시 미리보기 없음 확인
    assert.ok(invalid.state.errors.price); // 가격 오류 확인
}); // 테스트 끝

test("데모 화면은 인증을 우회하지 않고 아무것도 저장하지 않는다", () => // 데모 화면 계약
{ // 테스트 시작
    const page = fs.readFileSync("app/admin/demo/page.tsx", "utf8"); // 데모 화면
    const demo = fs.readFileSync("app/admin/demo/admin-demo.tsx", "utf8"); // 데모 편집 영역
    const login = fs.readFileSync("app/admin/login/page.tsx", "utf8"); // 관리자 로그인 화면
    const newsEditor = fs.readFileSync("app/admin/news/news-editor.tsx", "utf8"); // 뉴스 편집기
    const productEditor = fs.readFileSync("app/admin/products/product-editor.tsx", "utf8"); // 상품 편집기
    assert.match(page, /if \(!isAdminDemoAvailable\(\)\)[\s\S]*?notFound\(\)/); // 허용 환경 외 차단 확인
    assert.match(page, /index: false/); // 검색 색인 제외 확인
    assert.match(page, /저장되지 않고 공개되지도 않습니다/); // 데모 안내 확인
    assert.doesNotMatch(demo, /localStorage|sessionStorage|fetch\(|createBrowserSupabaseClient|actions"/); // 저장·전송 코드 없음 확인
    assert.match(demo, /beforeunload/); // 이탈 경고 확인
    assert.match(login, /isAdminDemoAvailable\(\) \? <Link[^>]*href="\/admin\/demo"/); // 개발 환경 링크 확인
    for (const editor of [newsEditor, productEditor]) // 편집기 반복
    { // 반복 시작
        assert.match(editor, /state\.notice \? <p className="admin-message admin-message-success" role="status">/); // 성공 안내 표시 확인
    } // 반복 끝
    assert.equal(fs.existsSync("app/admin/demo/actions.ts"), false); // 데모 서버 저장 액션 없음 확인
}); // 테스트 끝
