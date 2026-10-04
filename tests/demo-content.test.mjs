import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { DEMO_NEWS_POSTS } from "../lib/news/demo-posts.ts"; // 시연 뉴스 목록

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구
const count = (text, pattern) => (text.match(pattern) ?? []).length; // 일치 수 세기

function section(html, startMarker, endMarker) // 문서 구간 잘라 내기
{ // 함수 시작
    const start = html.indexOf(startMarker); // 구간 시작
    const end = html.indexOf(endMarker, start); // 구간 끝
    assert.ok(start >= 0 && end > start, `${startMarker} 구간 없음`); // 구간 존재 확인
    return html.slice(start, end); // 구간 반환
} // 함수 끝

test("시연 굿즈는 확정되지 않은 가격·할인·인기·한정 표시 없이 시연 목업으로만 보인다", () => // 굿즈 표기 검사
{ // 테스트 시작
    const main = section(read("public/main.html"), '<section class="section goods-section" id="goods">', '<section class="section" id="devlog">'); // 메인 굿즈 구역
    const goods = section(read("public/goods.html"), '<section class="goods-grid" id="goods-list"', "</main>"); // 굿즈 페이지 목록
    for (const [name, html] of [["메인", main], ["굿즈 페이지", goods]]) // 화면 반복
    { // 반복 시작
        assert.equal(count(html, /₩|\d원/g), 0, `${name} 임의 가격`); // 임의 가격 없음 확인
        assert.equal(count(html, /-\d+%|goods-discount|goods-original-price/g), 0, `${name} 가짜 할인`); // 가짜 할인 없음 확인
        assert.equal(count(html, />(?:NEW|HOT|LIMITED)</g), 0, `${name} 인기·한정 배지`); // 판매 실적을 암시하는 배지 없음 확인
        assert.equal(count(html, /한정판|품절 임박|베스트/g), 0, `${name} 판매 유도 문구`); // 판매 유도 문구 없음 확인
        assert.equal(count(html, /smartstore|href="https?:\/\//g), 0, `${name} 외부 판매 주소`); // 외부 판매 주소 없음 확인
        assert.equal(count(html, /<span class="goods-badge badge-demo">시연<\/span>/g), 8, `${name} 시연 배지`); // 상품마다 시연 배지 확인
        assert.equal(count(html, /<span class="goods-price">가격 미정<\/span>/g), 8, `${name} 가격 미정`); // 상품마다 가격 미정 확인
        assert.equal(count(html, /임시 상품 목업"/g), 8, `${name} 목업 이미지 설명`); // 이미지 설명의 목업 표기 확인
    } // 반복 끝
    assert.equal(count(main, /<a class="goods-card/g), 0); // 메인 카드는 판매 링크가 아님 확인
    assert.equal(count(main, /<div class="goods-card reveal state-preparing">/g), 8); // 판매 준비 상태 카드 확인
    assert.equal(count(main, /<div class="goods-buy-btn is-disabled">준비 중<\/div>/g), 8); // 비활성 버튼 확인
    assert.match(main, /<p class="goods-payment-notice">현재 상품은 화면 검증용 목업이며 실제 판매가 시작되기 전에는 결제되지 않습니다\.<\/p>/); // 메인 결제 전 안내 확인
    assert.match(read("public/goods.html"), /<p class="goods-payment-notice">현재 상품은 화면 검증용 목업이며/); // 굿즈 페이지 결제 전 안내 확인
    assert.doesNotMatch(read("public/goods.mjs"), /smartstore|placeholderLink/); // 임시 판매 링크 처리 제거 확인
    assert.match(read("public/goods.css"), /\.badge-demo \/\* 시연 목업 배지 \*\//); // 굿즈 페이지 배지 스타일 확인
    assert.match(read("public/main.html"), /\.badge-demo \/\* 시연 목업 배지 \*\//); // 메인 배지 스타일 확인
    assert.doesNotMatch(read("public/main.html") + read("public/playful-lab-theme.css"), /\.goods-discount/); // 쓰이지 않는 할인 스타일 제거 확인
}); // 테스트 끝

test("시연 뉴스는 카드마다 시연 표시를 달고 지어낸 수치를 쓰지 않는다", () => // 시연 뉴스 표기 검사
{ // 테스트 시작
    const main = section(read("public/main.html"), '<section class="section" id="devlog">', '<section class="section community-section" id="community">'); // 메인 뉴스 구역
    const devlog = section(read("public/devlog.html"), '<section class="news-list"', "</main>"); // 뉴스 페이지 목록
    assert.equal(count(main, /<span class="devlog-tag tag-demo">시연<\/span>/g), 4); // 메인 카드 시연 표시 확인
    assert.equal(count(devlog, /<span class="news-tag tag-demo">시연<\/span>/g), 4); // 뉴스 페이지 시연 표시 확인
    for (const [name, html] of [["메인", main], ["뉴스 페이지", devlog]]) // 화면 반복
    { // 반복 시작
        assert.equal(count(html, /임시 개발 뉴스입니다/g), 4, `${name} 임시 표기`); // 요약마다 임시 표기 확인
        assert.equal(count(html, /\d+%|\d+건|플레이어들이 보고한|플레이어 테스트에서/g), 0, `${name} 지어낸 수치`); // 지어낸 성과 수치 없음 확인
    } // 반복 끝
    assert.match(read("public/main.html"), /<strong data-hero-stat="news">4<\/strong><span>시연 뉴스<\/span>/); // 메인 통계 이름 확인
    assert.match(read("public/devlog.css"), /\.tag-demo \/\* 시연 콘텐츠 태그 \*\//); // 뉴스 페이지 태그 스타일 확인
    assert.equal(DEMO_NEWS_POSTS.length, 4); // 시연 뉴스 수 확인
    for (const post of DEMO_NEWS_POSTS) // 시연 뉴스 반복
    { // 반복 시작
        assert.match(post.content, /시연 (?:콘텐츠|개발 기록|뉴스)입니다\.$/, post.id); // 본문 끝의 시연 안내 확인
        assert.doesNotMatch(post.content, /\d+개(?!월)|\d+%|플레이어가 제보/, post.id); // 지어낸 수치·제보 표현 없음 확인
    } // 반복 끝
    assert.match(read("app/news/[id]/page.tsx"), /\{post === demoPost \? <span data-demo-tag>시연<\/span> : null\}/); // 뉴스 상세 시연 표시 확인
}); // 테스트 끝
