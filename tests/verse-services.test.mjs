import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { applyVerseServices, isVerseServiceAvailable, renderVerseSlide, renderVerseSlides, VERSE_SERVICES, VERSE_SERVICES_END, VERSE_SERVICES_START } from "../scripts/verse-services.mjs"; // 서비스 홍보 화면 도구

const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 문서
const HANGUL = /[가-힣]/; // 한글 판별 규칙

function findService(id) // 서비스 조회
{ // 함수 시작
    return VERSE_SERVICES.find((service) => service.id === id); // 식별자 일치 서비스 반환
} // 함수 끝

function listKoreanPhrases(html) // 화면의 한글 문구 수집
{ // 함수 시작
    const markup = html.replace(/<!--[\s\S]*?-->/g, ""); // 주석 제거
    const texts = markup.split(/<[^>]+>/).map((text) => text.trim()); // 태그 사이 글자
    const attributes = [...markup.matchAll(/="([^"]*)"/g)].map((match) => match[1]); // 속성 값
    return [...texts, ...attributes].filter((phrase) => HANGUL.test(phrase)); // 한글 문구 반환
} // 함수 끝

test("메인 캐러셀의 서비스 홍보 화면은 서비스 목록 한 곳에서 만들어진다", () => // 한 곳 관리 계약
{ // 테스트 시작
    assert.equal(applyVerseServices(mainHtml, "main.html"), mainHtml, "pnpm pages:apply 실행 필요"); // 목록과 문서 일치 확인
    assert.equal(applyVerseServices(mainHtml, "goods.html"), mainHtml); // 다른 문서 미적용 확인
    assert.ok(mainHtml.indexOf(VERSE_SERVICES_START) < mainHtml.indexOf(VERSE_SERVICES_END)); // 표시 순서 확인
    const slideCount = (mainHtml.match(/ data-hero-slide[ >]/g) ?? []).length; // 캐러셀 화면 수
    assert.equal(slideCount, 1 + VERSE_SERVICES.length); // 소개 화면과 서비스 화면 수 확인
    assert.match(mainHtml, new RegExp(`data-hero-carousel-status[^>]*>1 / ${slideCount}<`)); // 첫 위치 표시 확인
    assert.deepEqual(VERSE_SERVICES.map((service) => service.id), ["mate-verse", "atelier-verse"]); // 서비스 순서 확인
    assert.match(fs.readFileSync("scripts/apply-static-pages.mjs", "utf8"), /applyVerseServices\(/); // 페이지 적용 도구 연결 확인
}); // 테스트 끝

test("Mate | Verse 화면은 이름을 표시하고 임시 로컬 주소로 이동한다", () => // 캐릭터 대화 서비스 계약
{ // 테스트 시작
    const mate = findService("mate-verse"); // 캐릭터 대화 서비스
    const slide = renderVerseSlide(mate); // 홍보 화면
    assert.equal(mate.name, "Mate | Verse"); // 서비스 이름 확인
    assert.equal(isVerseServiceAvailable(mate), true); // 이동 가능 확인
    assert.match(slide, /<a class="hero-action primary" href="http:\/\/localhost:3001\/" data-i18n-context="service-action"><span translate="no">Mate \| Verse<\/span> 시작하기<\/a>/); // 이동 버튼 확인
    assert.match(slide, /<p class="hero-promo-label">\/\/ <span class="hero-service-name" translate="no">Mate \| Verse<\/span> · CHARACTER CHAT<\/p>/); // 분류 문구 확인
    assert.doesNotMatch(mainHtml, /ChatBot/); // 예전 표기 제거 확인
}); // 테스트 끝

test("Atelier | Verse는 주소가 정해지기 전까지 준비 중으로만 안내한다", () => // 기획 단계 서비스 계약
{ // 테스트 시작
    const atelier = findService("atelier-verse"); // VR 샌드박스 서비스
    const slide = renderVerseSlide(atelier); // 홍보 화면
    assert.equal(atelier.url, ""); // 주소 미정 확인
    assert.equal(isVerseServiceAvailable(atelier), false); // 이동 불가 확인
    assert.match(slide, /<span class="hero-action is-disabled" aria-disabled="true">준비 중<\/span>/); // 비활성 준비 중 버튼 확인
    assert.doesNotMatch(slide, /<a |href=/); // 이동 링크 없음 확인
    assert.match(slide, /<strong class="hero-promo-features-caption" id="verse-features-atelier-verse">계획 중인 기능<\/strong>/); // 계획 표시 머리말 확인
    assert.match(slide, /aria-labelledby="verse-features-atelier-verse"/); // 머리말 연결 확인
    assert.match(atelier.description, /기획하고 있습니다\.$/); // 기획 단계 문장 확인
    assert.match(slide, /<span translate="no">Mate \| Verse<\/span>의 자매 서비스 · 기획 단계 · 접속 주소 확정 후 연결 예정/); // 같은 계열·상태 안내 확인
    assert.match(mainHtml, /data-verse-service="atelier-verse"/); // 메인 문서 포함 확인
}); // 테스트 끝

test("주소를 넣으면 준비 중 버튼이 이동 버튼으로 바뀐다", () => // 주소 확정 뒤 동작 계약
{ // 테스트 시작
    const opened = { ...findService("atelier-verse"), url: " https://atelier.example/ " }; // 주소를 넣은 서비스
    const slide = renderVerseSlide(opened); // 홍보 화면
    assert.match(slide, /<a class="hero-action primary" href="https:\/\/atelier\.example\/" data-i18n-context="service-action"><span translate="no">Atelier \| Verse<\/span> 시작하기<\/a>/); // 이동 버튼 확인
    assert.doesNotMatch(slide, /is-disabled|준비 중|hero-promo-features-caption/); // 준비 중 표시 제거 확인
    assert.match(slide, /<div class="hero-promo-features" aria-label="계획 중인 기능">/); // 특징 목록 이름 유지 확인
}); // 테스트 끝

test("서비스 이름을 바꿔도 한글 문구와 영어 사전은 고칠 필요가 없다", () => // 이름 변경 안전 계약
{ // 테스트 시작
    const renamed = VERSE_SERVICES.map((service) => ({ ...service, name: `${service.id} 새 이름`, url: "https://service.example/" })); // 이름을 바꾼 목록
    const original = VERSE_SERVICES.map((service) => ({ ...service, url: "https://service.example/" })); // 주소만 넣은 목록
    assert.deepEqual(listKoreanPhrases(renderVerseSlides("", renamed)).filter((phrase) => !phrase.endsWith("새 이름")), listKoreanPhrases(renderVerseSlides("", original))); // 이름 밖 한글 문구 동일 확인
    for (const phrase of listKoreanPhrases(renderVerseSlides(""))) // 현재 한글 문구 반복
    { // 반복 시작
        assert.equal(VERSE_SERVICES.some((service) => phrase.includes(service.name)), false, `${phrase} 이름 포함`); // 이름과 한글 분리 확인
    } // 반복 끝
    const dictionary = JSON.parse(fs.readFileSync("public/i18n/en/site.json", "utf8")); // 영어 사전
    assert.equal(Object.keys(dictionary.entries).some((key) => VERSE_SERVICES.some((service) => key.includes(service.name))), false); // 사전 키 이름 미포함 확인
    assert.equal(dictionary.entries["service-action::시작하기"], "— Get started"); // 이동 버튼 문맥 번역 확인
    assert.match(renderVerseSlide({ ...findService("mate-verse"), name: "A & <B>" }), /<span translate="no">A &amp; &lt;B&gt;<\/span> 시작하기/); // 이름 특수 문자 처리 확인
}); // 테스트 끝

test("준비 중 버튼과 계획 머리말은 라이트·다크 모드 토큰을 따른다", () => // 스타일 계약
{ // 테스트 시작
    const experienceCss = fs.readFileSync("public/site-experience.css", "utf8"); // 방문 경험 스타일
    const theme = fs.readFileSync("public/playful-lab-theme.css", "utf8"); // 공통 테마
    assert.match(experienceCss, /\.hero-action\.is-disabled[^{]*\{[^}]*border-style: dashed;[^}]*cursor: not-allowed;/); // 비활성 버튼 기본 모양 확인
    assert.match(experienceCss, /\.hero-promo-features-caption[^{]*\{[^}]*flex-basis: 100%;/); // 머리말 한 줄 배치 확인
    assert.match(experienceCss, /\.hero-service-name[^{]*\{[^}]*text-transform: uppercase;/); // 분류 이름 대문자 표기 확인
    assert.match(theme, /\[data-theme="playful-lab"\] \.hero-action\.is-disabled[^{]*\{[^}]*background: var\(--pl-panel\);[^}]*color: var\(--pl-muted\);/); // 테마 비활성 버튼 확인
    assert.match(theme, /\[data-theme="playful-lab"\] \.hero-promo-features-caption[^{]*\{[^}]*color: var\(--pl-muted\);/); // 테마 머리말 확인
}); // 테스트 끝
