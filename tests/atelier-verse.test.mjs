import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { PUBLIC_STATIC_PATHS } from "../lib/site-url.ts"; // 사이트맵 목록
import { PAGE_DESCRIPTIONS } from "../scripts/apply-page-meta.mjs"; // 검색 설명 목록
import { STATIC_HEADER_PAGES } from "../scripts/apply-site-header.mjs"; // 공통 헤더 등록 목록
import { VERSE_SERVICES } from "../scripts/verse-services.mjs"; // Verse 계열 서비스 목록

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n"); // 줄바꿈을 맞춘 원본 읽기 도구
const html = read("public/atelier-verse.html"); // 서비스 소개 문서
const css = read("public/atelier-verse.css"); // 서비스 소개 스타일
const body = html.slice(html.indexOf("<body")).replace(/<!--[\s\S]*?-->/g, ""); // 주석을 뺀 본문
const atelier = VERSE_SERVICES.find((service) => service.id === "atelier-verse"); // VR 샌드박스 서비스
const HANGUL = /[가-힣]/; // 한글 판별 규칙

function readTokens(selector) // 스타일 토큰 읽기
{ // 함수 시작
    const start = css.indexOf(`${selector} /*`); // 규칙 시작 위치
    assert.notEqual(start, -1, selector); // 규칙 존재 확인
    const block = css.slice(css.indexOf("{", start), css.indexOf("\n}", start)); // 규칙 내용
    return Object.fromEntries([...block.matchAll(/(--av-[a-z-]+): (#[0-9A-Fa-f]{6});/g)].map((match) => [match[1], match[2]])); // 색상 토큰 반환
} // 함수 끝

function luminance(hex) // 상대 밝기 계산
{ // 함수 시작
    const channels = [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16) / 255); // 색상 채널
    const [red, green, blue] = channels.map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)); // 선형 값
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue; // 밝기 반환
} // 함수 끝

function contrast(first, second) // 명도 대비 계산
{ // 함수 시작
    const [light, dark] = [luminance(first), luminance(second)].sort((left, right) => right - left); // 밝은 값과 어두운 값
    return (light + 0.05) / (dark + 0.05); // 대비 반환
} // 함수 끝

test("서비스 소개 페이지는 공통 헤더·사이트맵·검색 설명에 등록되어 있다", () => // 등록 검사
{ // 테스트 시작
    assert.deepEqual(STATIC_HEADER_PAGES.find((page) => page.file === "atelier-verse.html"), { file: "atelier-verse.html", current: "", offset: false }); // 공통 헤더 등록 확인
    assert.ok(PUBLIC_STATIC_PATHS.includes("/atelier-verse.html")); // 사이트맵 등록 확인
    assert.ok(html.includes(`<meta name="description" content="${PAGE_DESCRIPTIONS["atelier-verse.html"]}">`)); // 검색 설명 일치 확인
    assert.match(html, /<body data-responsive-page="atelier-verse" data-theme="playful-lab">/); // 페이지 식별 확인
    assert.match(html, /<link rel="stylesheet" href="atelier-verse\.css">/); // 전용 스타일 연결 확인
}); // 테스트 끝

test("서비스 소개 페이지는 기획 단계임을 밝히고 이용할 수 있는 것처럼 안내하지 않는다", () => // 상태 안내 검사
{ // 테스트 시작
    assert.match(body, /<p class="av-tape" data-av-status="planning">기획 단계<\/p>/); // 상태 이름표 확인
    assert.match(body, /지금은 기획 단계이며 아직 이용할 수 없습니다\./); // 이용 불가 안내 확인
    assert.match(body, /<span class="av-button av-button-disabled" aria-disabled="true">입장하기 · 준비 중<\/span>/); // 비활성 입장 버튼 확인
    assert.match(body, /<figcaption class="av-frame-caption">서비스 화면이 아닌 콘셉트 이미지입니다\.<\/figcaption>/); // 콘셉트 이미지 표시 확인
    assert.match(body, /<p class="av-section-note">그림은 모두 콘셉트 이미지이며 실제 서비스 화면이 아닙니다\.<\/p>/); // 기능 그림 안내 확인
    const links = [...body.matchAll(/<a [^>]*href="([^"]+)"/g)].map((match) => match[1]); // 본문 링크 주소
    assert.deepEqual([...new Set(links)].filter((href) => !href.startsWith("/") && !href.startsWith("#")), []); // 외부 이동 링크 없음 확인
    assert.equal(atelier.url, "", "접속 주소가 정해지면 입장 버튼과 이 검사를 함께 바꾼다"); // 서비스 주소 미정 확인
    assert.doesNotMatch(body, /\d{4}년|출시일|Q[1-4]|₩|\d+원/); // 확정되지 않은 일정·가격 미표기 확인
}); // 테스트 끝

test("콘셉트 이미지 다섯 장은 최적화된 WebP이고 콘셉트 이미지임을 밝힌다", () => // 이미지 검사
{ // 테스트 시작
    const images = [...body.matchAll(/<img class="(av-frame-image|av-card-image)" src="([^"]+)" alt="([^"]+)" width="(\d+)" height="(\d+)"( loading="lazy")? decoding="async">/g)]; // 본문 이미지 목록
    assert.equal((body.match(/<img/g) ?? []).length, images.length); // 형식이 다른 이미지 없음 확인
    assert.deepEqual(images.map((image) => image[2]), ["hero", "create", "share", "together", "updates"].map((name) => `/images/atelier-verse/${name}.webp`)); // 이미지 주소와 순서 확인
    for (const [, kind, source, alt, width, height, lazy] of images) // 이미지 반복
    { // 반복 시작
        const content = fs.readFileSync(`public${source}`); // 이미지 내용
        assert.equal(content.subarray(0, 4).toString("ascii"), "RIFF", source); // WebP 컨테이너 확인
        assert.equal(content.subarray(8, 12).toString("ascii"), "WEBP", source); // WebP 형식 확인
        assert.ok(content.length > 10000 && content.length <= 200000, `${source} 용량`); // 웹 최적화 용량 확인
        assert.match(alt, /콘셉트 이미지$/, source); // 대체 문구의 콘셉트 이미지 표시 확인
        assert.deepEqual([width, height], kind === "av-frame-image" ? ["1280", "853"] : ["640", "640"], source); // 배치 흔들림 방지 크기 확인
        assert.equal(Boolean(lazy), kind === "av-card-image", source); // 화면 아래 이미지만 늦게 불러오기 확인
    } // 반복 끝
    assert.doesNotMatch(body, /<svg/); // 예전 설명용 그림 제거 확인
}); // 테스트 끝

test("서비스 이름은 번역하지 않는 요소에만 쓰고 서비스 목록의 이름과 같다", () => // 이름 표기 검사
{ // 테스트 시작
    assert.match(html, new RegExp(`<title>${atelier.name.replace("|", "\\|")} · Palettra Games</title>`)); // 제목의 서비스 이름 확인
    assert.ok(body.includes(`<span translate="no">${atelier.name}</span>`)); // 번역 제외 이름 표시 확인
    const texts = body.split(/<[^>]+>/).map((text) => text.trim()).filter((text) => HANGUL.test(text)); // 본문 한글 문구
    for (const service of VERSE_SERVICES) // 서비스 반복
    { // 반복 시작
        assert.deepEqual(texts.filter((text) => text.includes(service.name)), [], service.name); // 한글 문구와 이름 분리 확인
        const outside = body.replaceAll(/<span translate="no">[^<]*<\/span>/g, ""); // 번역 제외 요소를 뺀 본문
        assert.equal(outside.includes(service.name), false, service.name); // 번역 제외 요소 밖 이름 없음 확인
    } // 반복 끝
}); // 테스트 끝

test("개발 단계는 기획을 현재 단계로 표시하고 다섯 단계를 순서대로 둔다", () => // 단계 구조 검사
{ // 테스트 시작
    const stages = [...body.matchAll(/<li class="av-stage" data-av-stage="([a-z0-9]+)"/g)].map((match) => match[1]); // 단계 식별자
    assert.deepEqual(stages, ["planning", "1", "2", "3", "4", "5"]); // 단계 순서 확인
    assert.equal((body.match(/aria-current="step"/g) ?? []).length, 1); // 현재 단계 한 곳 확인
    assert.match(body, /<li class="av-stage" data-av-stage="planning" aria-current="step">/); // 기획이 현재 단계인지 확인
    assert.match(body, /<a class="av-button av-button-primary" href="#av-stages">개발 단계 보기<\/a>/); // 단계 이동 버튼 확인
    assert.match(body, /<h2 class="av-section-title" id="av-stages">개발 단계<\/h2>/); // 이동 대상 제목 확인
    assert.equal((body.match(/<article class="av-card" data-av-tone="(?:gold|blue|clay)">/g) ?? []).length, 4); // 계획 기능 카드 수 확인
    assert.equal((body.match(/<details class="av-faq">/g) ?? []).length, 4); // 질문 수 확인
}); // 테스트 끝

test("햇살 작업실 테마 색은 밝은·어두운 화면 모두 글자 대비 기준을 지킨다", () => // 테마 대비 검사
{ // 테스트 시작
    const light = readTokens('[data-responsive-page="atelier-verse"]'); // 밝은 화면 토큰
    const dark = { ...light, ...readTokens('[data-responsive-page="atelier-verse"][data-color-mode="dark"]') }; // 어두운 화면 토큰
    assert.equal(light["--av-gold"], "#F7A71D"); // 브랜드 골드 사용 확인
    assert.equal(light["--av-blue"], "#025EE7"); // 브랜드 블루 사용 확인
    for (const [name, tokens] of [["밝은 화면", light], ["어두운 화면", dark]]) // 화면별 반복
    { // 반복 시작
        for (const background of ["--av-canvas", "--av-surface", "--av-paper"]) // 바탕 반복
        { // 바탕 반복 시작
            for (const text of ["--av-ink", "--av-muted", "--av-blue", "--av-clay"]) // 글자색 반복
            { // 글자색 반복 시작
                assert.ok(contrast(tokens[text], tokens[background]) >= 4.5, `${name} ${text} / ${background}`); // 글자 대비 4.5:1 확인
            } // 글자색 반복 끝
            assert.ok(contrast(tokens["--av-line-strong"], tokens[background]) >= 3, `${name} 강한 경계선 / ${background}`); // 경계선 대비 3:1 확인
        } // 바탕 반복 끝
        assert.ok(contrast(tokens["--av-on-gold"], tokens["--av-gold"]) >= 4.5, `${name} 골드 위 글자`); // 골드 위 글자 대비 확인
        assert.ok(contrast(tokens["--av-on-blue"], tokens["--av-blue"]) >= 4.5, `${name} 블루 위 글자`); // 블루 위 글자 대비 확인
        assert.ok(contrast(tokens["--av-on-clay"], tokens["--av-clay"]) >= 4.5, `${name} 테라코타 위 글자`); // 테라코타 위 글자 대비 확인
    } // 반복 끝
    assert.match(css, /\[data-theme="playful-lab"\]\[data-responsive-page="atelier-verse"\] \/\* 페이지 바탕 \*\/\s*\{[^}]*background: var\(--av-canvas\);/); // 본문에만 테마 바탕 적용 확인
    assert.match(css, /@media \(prefers-reduced-motion: reduce\)/); // 움직임 줄이기 대응 확인
    assert.doesNotMatch(css, /--pl-/); // 홈페이지 테마 토큰과 분리 확인
}); // 테스트 끝
