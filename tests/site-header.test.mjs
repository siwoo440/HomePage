import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { applySiteHeader, STATIC_HEADER_PAGES } from "../scripts/apply-site-header.mjs"; // 정적 페이지 헤더 적용 도구
import { renderSiteHeader, SITE_HEADER_END, SITE_HEADER_START, SITE_MENU_ITEMS } from "../scripts/site-header.mjs"; // 공통 헤더 생성 도구
import { RESPONSIVE_NAV_ITEMS } from "../public/responsive-nav.mjs"; // 서랍 메뉴 목록
import { openFaqFromHash, setAllFaqItems } from "../public/contact-faq.mjs"; // 질문 펼치기 도구

function listPublicHtml(directory = "public") // 공개 HTML 목록
{ // 함수 시작
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => // 항목 반복
    { // 반복 시작
        const entryPath = path.join(directory, entry.name); // 항목 경로
        return entry.isDirectory() ? listPublicHtml(entryPath) : entryPath.endsWith(".html") && !entryPath.endsWith("device-preview.html") ? [entryPath] : []; // 공개 HTML 선택
    }); // 반복 끝
} // 함수 끝

function headerBlock(html) // 공통 헤더 구간 추출
{ // 함수 시작
    return html.slice(html.indexOf(SITE_HEADER_START), html.indexOf(SITE_HEADER_END)); // 표시 사이 반환
} // 함수 끝

function normalizeHeader(block) // 페이지별 차이 제거
{ // 함수 시작
    const navOnly = block.slice(0, block.indexOf("</nav>")); // 보조 메뉴 제외
    return navOnly.replace(/\r/g, "").replace(/ aria-current="page"/g, "").replace(/^\s+/gm, ""); // 줄바꿈·현재 표시·들여쓰기 제거
} // 함수 끝

test("모든 공개 페이지는 메인과 같은 공통 헤더를 하나씩 가진다", () => // 헤더 동일성 검사
{ // 테스트 시작
    const files = listPublicHtml(); // 공개 HTML 목록
    const mainHeader = normalizeHeader(headerBlock(fs.readFileSync("public/main.html", "utf8"))); // 메인 헤더 기준
    assert.ok(files.length >= 45); // 검사 대상 수 확인
    for (const file of files) // 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(file, "utf8"); // 문서 읽기
        assert.equal((html.match(/data-site-header(?!-)/g) ?? []).length, 1, `${file} 공통 헤더 수`); // 헤더 단일 확인
        assert.equal(normalizeHeader(headerBlock(html)), mainHeader, `${file} 헤더가 메인과 다름`); // 메인과 동일 구조 확인
        assert.ok(html.indexOf('href="/site-header.css"') > 0 && html.indexOf('href="/site-header.css"') < html.indexOf('href="/responsive-shell.css"'), `${file} 헤더 스타일 순서`); // 스타일 연결 순서 확인
        assert.match(html, /src="\/responsive-nav\.mjs"/, `${file} 공통 메뉴 스크립트`); // 서랍 메뉴 스크립트 확인
    } // 반복 끝
}); // 테스트 끝

test("정적 페이지 헤더는 생성 도구 결과와 일치하고 현재 메뉴를 표시한다", () => // 생성 결과 일치 검사
{ // 테스트 시작
    for (const page of STATIC_HEADER_PAGES) // 대상 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(path.join("public", page.file), "utf8"); // 문서 읽기
        assert.equal(applySiteHeader(html, page), html, `${page.file} 헤더 재생성 필요`); // 최신 헤더 확인
        assert.equal(/<body[^>]*data-site-header-offset/.test(html), page.offset, `${page.file} 헤더 여백 표시`); // 여백 표시 확인
        if (page.current && page.current !== "contact") // 현재 메뉴 확인
        { // 조건 시작
            const item = SITE_MENU_ITEMS.find((candidate) => candidate.id === page.current); // 현재 메뉴 항목
            assert.match(headerBlock(html), new RegExp(`href="${item.href.replace(".", "\\.")}" aria-current="page"`), `${page.file} 현재 메뉴`); // 현재 메뉴 표시 확인
        } // 조건 끝
        assert.equal(page.subnav ? /data-site-subnav/.test(html) : !/data-site-subnav/.test(html), true, `${page.file} 보조 메뉴`); // 보조 메뉴 유무 확인
    } // 반복 끝
    assert.match(renderSiteHeader({ current: "contact" }), /href="\/contact\.html" class="btn-nav nav-contact-link" aria-current="page"/); // 문의 현재 표시 확인
}); // 테스트 끝

test("Next 화면 헤더와 서랍 메뉴도 같은 메뉴와 문의하기 페이지를 사용한다", () => // Next 헤더 계약
{ // 테스트 시작
    const component = fs.readFileSync("app/site-header.tsx", "utf8"); // Next 공통 헤더
    for (const item of SITE_MENU_ITEMS) // 메뉴 반복
    { // 반복 시작
        assert.match(component, new RegExp(`id: "${item.id}", label: "${item.label}", href: "${item.href.replace(".", "\\.")}"`)); // 같은 메뉴 확인
    } // 반복 끝
    assert.match(component, /data-site-header=""/); // 공통 헤더 표시 확인
    assert.match(component, /href="\/contact\.html" className="btn-nav nav-contact-link"/); // 문의하기 링크 확인
    for (const page of ["app/login/page.tsx", "app/news/[id]/page.tsx", "app/age-verification/page.tsx", "app/not-found.tsx", "app/admin/layout.tsx"]) // Next 공개·관리자 화면 반복
    { // 반복 시작
        assert.match(fs.readFileSync(page, "utf8"), /<SiteHeader( current="[a-z]+")? \/>/, `${page} 공통 헤더 누락`); // 공통 헤더 사용 확인
    } // 반복 끝
    assert.equal(RESPONSIVE_NAV_ITEMS.find((item) => item.id === "contact")?.href, "/contact.html"); // 서랍 문의 주소 확인
}); // 테스트 끝

test("문의하기 페이지는 Q를 누르면 A가 열리는 질문 목록을 제공한다", () => // 문의하기 화면 계약
{ // 테스트 시작
    const html = fs.readFileSync("public/contact.html", "utf8"); // 문의하기 문서
    const items = [...html.matchAll(/<details class="faq-item"( open)?>[\s\S]*?<\/details>/g)].map((match) => match[0]); // 질문 항목 목록
    assert.ok(items.length >= 12, "질문 수 부족"); // 질문 수 확인
    for (const item of items) // 질문 반복
    { // 반복 시작
        assert.match(item, /<summary><span class="faq-mark faq-mark-q" aria-hidden="true">Q\.<\/span><span class="faq-question">[^<]+<\/span><\/summary>/); // 질문 구조 확인
        assert.match(item, /<div class="faq-answer"><span class="faq-mark faq-mark-a" aria-hidden="true">A\.<\/span><p>/); // 답변 구조 확인
    } // 반복 끝
    for (const id of ["faq-games", "faq-account", "faq-goods", "faq-privacy", "faq-contact"]) // 분류 반복
    { // 반복 시작
        assert.match(html, new RegExp(`href="#${id}"`)); // 분류 이동 링크 확인
        assert.match(html, new RegExp(`id="${id}"`)); // 분류 영역 확인
    } // 반복 끝
    assert.match(html, /data-faq-expand="open"/); // 모두 펼치기 확인
    assert.match(html, /data-faq-expand="close"/); // 모두 접기 확인
    assert.doesNotMatch(html, /mailto:|discord\.gg/); // 미확정 연락처 미노출 확인
}); // 테스트 끝

test("질문 전체 열기와 주소 해시 열기가 동작한다", () => // 질문 펼치기 동작 검사
{ // 테스트 시작
    const items = [{ open: false }, { open: true }, { open: false }]; // 질문 대체 항목
    const root = { querySelectorAll: () => items, getElementById: (id) => (id === "faq-goods" ? { closest: () => null, querySelector: () => items[2] } : null) }; // 문서 대체
    assert.equal(setAllFaqItems(root, true), 3); // 전체 열기 수 확인
    assert.ok(items.every((item) => item.open)); // 전체 열림 확인
    setAllFaqItems(root, false); // 전체 닫기
    assert.ok(items.every((item) => !item.open)); // 전체 닫힘 확인
    assert.equal(openFaqFromHash(root, "#faq-goods"), items[2]); // 분류 첫 질문 열기 확인
    assert.equal(items[2].open, true); // 대상 질문 열림 확인
    assert.equal(openFaqFromHash(root, "#none"), null); // 없는 대상 안전 처리 확인
    assert.equal(openFaqFromHash(root, ""), null); // 빈 해시 안전 처리 확인
}); // 테스트 끝
