import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import fs from "node:fs"; // 파일 검사 도구
import path from "node:path"; // 경로 조합 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 게임 프로젝트 데이터
import { listMetaTargetPages } from "../scripts/apply-page-meta.mjs"; // 정적 페이지 목록 도구
import { FONT_PRECONNECT_TAGS, applyFontPreconnect } from "../scripts/apply-static-pages.mjs"; // 글꼴 미리 연결 도구
import { renderProjectHtml } from "../scripts/generate-project-pages.mjs"; // 게임 소개 생성 도구
import { ADULT_GAMES } from "../lib/age-gate/config.ts"; // 성인 게임 보호 설정

test("정적 페이지는 글꼴 서버에 미리 연결한 뒤 스타일을 불러온다", () => // 글꼴 미리 연결 검사
{ // 테스트 시작
    const pages = [...new Set([...listMetaTargetPages("public"), ...GAME_PROJECTS.map((project) => project.detailPath.slice(1))])]; // 직접 고친 페이지와 자동으로 만든 게임 소개
    assert.ok(pages.length >= 40, "정적 페이지 목록이 너무 적음"); // 목록 조회 확인
    for (const file of pages) // 페이지 반복
    { // 반복 시작
        const html = fs.readFileSync(path.join("public", file), "utf8"); // 페이지 원문
        const firstStyle = html.indexOf('<link rel="stylesheet"'); // 첫 스타일 위치
        for (const tag of FONT_PRECONNECT_TAGS.map((line) => line.split(" <!--")[0])) // 설명을 뺀 미리 연결 태그 반복(먼저 넣어 둔 화면은 설명이 다름)
        { // 반복 시작
            assert.equal(html.split(tag).length - 1, 1, `${file} 미리 연결 줄 개수`); // 한 번만 들어감
            assert.ok(firstStyle < 0 || html.indexOf(tag) < firstStyle, `${file} 미리 연결이 스타일보다 뒤에 있음`); // 스타일보다 먼저 연결
        } // 반복 끝
        assert.equal(applyFontPreconnect(html), html, `${file} 다시 적용하면 달라짐`); // 다시 적용해도 그대로
    } // 반복 끝
    const sample = '<head>\r\n    <meta name="viewport" content="width=device-width">\r\n    <title>시험</title>\r\n</head>'; // 줄바꿈이 다른 예시 문서
    const applied = applyFontPreconnect(sample); // 예시 적용 결과
    assert.equal(applied.includes(`content="width=device-width">\r\n    ${FONT_PRECONNECT_TAGS[0]}\r\n    ${FONT_PRECONNECT_TAGS[1]}\r\n    <title>`), true); // 들여쓰기와 줄바꿈 형식 유지
    assert.equal(applyFontPreconnect("<head><title>시험</title></head>"), "<head><title>시험</title></head>"); // 기준 줄이 없으면 그대로
    const layout = fs.readFileSync("app/layout.tsx", "utf8"); // Next 공통 틀 원문
    assert.ok(layout.indexOf('rel="preconnect" href="https://fonts.gstatic.com"') > 0 && layout.indexOf('rel="preconnect" href="https://fonts.gstatic.com"') < layout.indexOf('href="/site-header.css"'), "Next 화면의 미리 연결 누락"); // Next 화면도 스타일보다 먼저 연결
}); // 테스트 끝

test("게임 소개의 대표 이미지는 먼저 받고 굿즈 이미지는 크기를 정해 늦게 받는다", () => // 이미지 불러오기 순서 검사
{ // 테스트 시작
    const common = GAME_PROJECTS.find((project) => project.layout === "common"); // 공통 형식 게임 하나
    assert.match(renderProjectHtml(common), /<img src="[^"]+\.webp[^"]*" alt="[^"]+" width="1280" height="720" decoding="async" fetchpriority="high" data-project-hero-image>/); // 대표 이미지 우선 요청
    for (const file of ["public/main.html", "public/goods.html"]) // 굿즈가 보이는 화면 반복
    { // 반복 시작
        const images = fs.readFileSync(file, "utf8").match(/<img class="goods-image"[^>]*>/g) ?? []; // 굿즈 이미지 태그
        assert.equal(images.length, 8, `${file} 굿즈 이미지 수`); // 임시 상품 여덟 개
        for (const image of images) // 이미지 반복
        { // 반복 시작
            assert.match(image, / width="960" height="720" loading="lazy" decoding="async">$/, `${file} 굿즈 이미지 속성`); // 크기 지정과 늦게 받기
        } // 반복 끝
    } // 반복 끝
    const card = fs.readFileSync("public/goods-card.mjs", "utf8"); // 등록 상품 카드 원문
    for (const line of ["image.width = 960;", "image.height = 720;", 'image.loading = "lazy";', 'image.decoding = "async";']) // 필요한 설정 반복
    { // 반복 시작
        assert.ok(card.includes(line), `등록 상품 이미지 설정 누락: ${line}`); // 등록 상품도 같은 설정
    } // 반복 끝
}); // 테스트 끝

test("공개 이미지는 브라우저에 보관하고 성인 게임 이미지는 보관하지 않는다", async () => // 이미지 보관 규칙 검사
{ // 테스트 시작
    const { default: nextConfig, ADULT_IMAGE_CACHE_CONTROL, ADULT_IMAGE_SOURCE, IMAGE_CACHE_CONTROL } = await import("../next.config.mjs"); // Next 설정
    const rules = await nextConfig.headers(); // 응답 머리말 규칙
    assert.deepEqual(rules.map((rule) => rule.source), ["/images/:path*", ADULT_IMAGE_SOURCE]); // 성인 규칙이 뒤에 있어야 앞 규칙을 덮어씀
    assert.deepEqual(rules.map((rule) => rule.headers), [[{ key: "Cache-Control", value: IMAGE_CACHE_CONTROL }], [{ key: "Cache-Control", value: ADULT_IMAGE_CACHE_CONTROL }]]); // 규칙별 보관 값
    assert.match(IMAGE_CACHE_CONTROL, /^public, max-age=\d+, stale-while-revalidate=\d+$/); // 공개 이미지 보관 형식
    assert.doesNotMatch(IMAGE_CACHE_CONTROL, /immutable/); // 같은 주소로 그림을 바꿀 수 있어 영구 보관은 쓰지 않음
    assert.equal(ADULT_IMAGE_CACHE_CONTROL, "private, no-store"); // 성인 이미지는 저장하지 않음
    const covered = ADULT_IMAGE_SOURCE.match(/project-\(\?:([a-z|]+)\)/)[1].split("|").sort(); // 규칙이 가리키는 게임 기호
    const expected = ADULT_GAMES.map((game) => game.imagePath.match(/project-([a-z]+)\.webp$/)[1]).sort(); // 보호 대상 게임 기호
    assert.deepEqual(covered, expected); // 성인 게임 목록과 일치
    assert.ok(ADULT_IMAGE_SOURCE.includes("games|share"), "대표·공유 이미지 폴더 누락"); // 두 폴더 모두 대상
}); // 테스트 끝
