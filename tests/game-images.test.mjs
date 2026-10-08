import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import fs from "node:fs"; // 파일 검사 도구
import path from "node:path"; // 경로 조합 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 게임 프로젝트 데이터
import { GAME_IMAGE_HEIGHT, GAME_IMAGE_MAX_BYTES, GAME_IMAGE_OUTPUT_DIR, GAME_IMAGE_SOURCE_DIR, GAME_IMAGE_WIDTH, listGameImageSources, toGameImageOutputName } from "../scripts/optimize-game-images.mjs"; // 게임 이미지 변환 도구
import { ADULT_GAMES } from "../lib/age-gate/config.ts"; // 성인 게임 보호 설정

const outputDirectory = path.join(process.cwd(), GAME_IMAGE_OUTPUT_DIR); // 화면용 이미지 폴더

test("게임 대표 이미지는 프로젝트마다 용량을 줄인 WebP 한 장이다", () => // 화면용 이미지 검사
{ // 테스트 시작
    let totalBytes = 0; // 전체 용량
    for (const project of GAME_PROJECTS) // 프로젝트 반복
    { // 반복 시작
        assert.equal(project.heroImage, `/images/games/${project.id}.webp`, `${project.title} 이미지 주소`); // 데이터의 이미지 주소
        const content = fs.readFileSync(path.join(process.cwd(), "public", project.heroImage)); // 이미지 내용
        assert.equal(content.subarray(0, 4).toString("ascii"), "RIFF", `${project.title} RIFF 서명`); // WebP 컨테이너 확인
        assert.equal(content.subarray(8, 12).toString("ascii"), "WEBP", `${project.title} WebP 서명`); // WebP 형식 확인
        assert.ok(content.length > 10_000, `${project.title} 파일 크기 부족`); // 실제 이미지 여부 확인
        assert.ok(content.length <= GAME_IMAGE_MAX_BYTES, `${project.title} 용량 한도 초과`); // 한 장 용량 한도 확인
        totalBytes += content.length; // 전체 용량 누적
    } // 반복 끝
    assert.ok(totalBytes <= 8_000_000, "게임 이미지 전체 용량 초과"); // 전체 용량 한도 확인
    assert.deepEqual([GAME_IMAGE_WIDTH, GAME_IMAGE_HEIGHT], [1280, 720]); // 화면용 크기 기준
}); // 테스트 끝

test("원본 PNG는 배포되지 않는 폴더에만 두고 화면용 폴더에는 남기지 않는다", () => // 원본 보관 검사
{ // 테스트 시작
    const publicNames = fs.readdirSync(outputDirectory); // 화면용 폴더 파일
    assert.deepEqual(publicNames.filter((name) => name.endsWith(".png")), []); // 화면용 폴더에 PNG 없음
    assert.equal(GAME_IMAGE_SOURCE_DIR.startsWith("internal/"), true); // 원본 위치는 배포하지 않는 폴더
    const sources = listGameImageSources(); // 원본 목록
    assert.equal(sources.length, GAME_PROJECTS.length); // 프로젝트마다 원본 한 장
    for (const source of sources) // 원본 반복
    { // 반복 시작
        assert.ok(publicNames.includes(toGameImageOutputName(source)), `${source}의 화면용 이미지 누락`); // 변환 결과 존재 확인
    } // 반복 끝
    assert.match(fs.readFileSync("package.json", "utf8"), /"images:games": "node scripts\/optimize-game-images\.mjs"/); // 변환 명령 등록 확인
}); // 테스트 끝

test("성인 게임의 대표 이미지는 새 주소로도 연령 확인 뒤에만 제공한다", () => // 성인 이미지 보호 검사
{ // 테스트 시작
    const proxySource = fs.readFileSync("proxy.ts", "utf8"); // 프록시 설정 원문
    for (const game of ADULT_GAMES) // 성인 게임 반복
    { // 반복 시작
        assert.match(game.imagePath, /^\/images\/games\/project-[a-z]+\.webp$/); // 보호 대상 이미지 주소
        assert.ok(proxySource.includes(`"${game.imagePath}"`), `${game.id} 이미지가 프록시 보호 경로에 없음`); // 프록시 경로 등록 확인
        assert.ok(fs.existsSync(path.join(process.cwd(), "public", game.imagePath)), `${game.id} 이미지 파일 누락`); // 실제 파일과 주소 일치 확인
    } // 반복 끝
    const mainHtml = fs.readFileSync("public/main.html", "utf8"); // 메인 화면 원문
    assert.doesNotMatch(mainHtml, /images\/games\/project-[a-z]+\.png/); // 메인 화면에 예전 주소 없음
}); // 테스트 끝

test("성인 게임을 뺀 게임마다 공유 미리보기 이미지가 있고 게임 소개 화면이 그 주소를 쓴다", async () => // 공유 미리보기 검사
{ // 테스트 시작
    const { GAME_SHARE_HEIGHT, GAME_SHARE_MAX_BYTES, GAME_SHARE_OUTPUT_DIR, GAME_SHARE_WIDTH, isShareImageTarget } = await import("../scripts/optimize-game-images.mjs"); // 공유 미리보기 설정
    const { SHARE_IMAGE_BASE_URL, SHARE_IMAGE_HEIGHT, SHARE_IMAGE_WIDTH, applyPageMeta, resolveShareImage } = await import("../scripts/apply-page-meta.mjs"); // 공유 태그 도구
    assert.deepEqual([GAME_SHARE_WIDTH, GAME_SHARE_HEIGHT], [SHARE_IMAGE_WIDTH, SHARE_IMAGE_HEIGHT]); // 이미지 크기와 태그 값 일치
    assert.equal(SHARE_IMAGE_BASE_URL === "" || /^https:\/\/[^/]+$/.test(SHARE_IMAGE_BASE_URL), true); // 비어 있거나 https 도메인만 허용
    const shareNames = fs.readdirSync(path.join(process.cwd(), GAME_SHARE_OUTPUT_DIR)); // 공유 미리보기 폴더 파일
    for (const project of GAME_PROJECTS) // 프로젝트 반복
    { // 반복 시작
        const file = project.detailPath.slice(1); // 게임 소개 화면 경로
        const html = fs.readFileSync(path.join("public", file), "utf8"); // 게임 소개 원문
        if (project.adultOnly) // 성인 게임 확인
        { // 조건 시작
            assert.equal(isShareImageTarget(`${project.id}.png`), false); // 변환 대상 아님
            assert.equal(shareNames.includes(`${project.id}.jpg`), false, `${project.id} 공유 이미지가 있으면 안 됨`); // 공유 미리보기 파일 없음
            assert.equal(resolveShareImage(file), null); // 공유 이미지 주소 없음
            assert.doesNotMatch(html, /og:image|twitter:card/); // 공유 이미지 태그 없음
            continue; // 다음 프로젝트
        } // 조건 끝
        const content = fs.readFileSync(path.join(process.cwd(), GAME_SHARE_OUTPUT_DIR, `${project.id}.jpg`)); // 공유 미리보기 내용
        assert.deepEqual([content[0], content[1]], [0xff, 0xd8], `${project.id} JPG 서명`); // JPG 형식 확인
        assert.ok(content.length <= GAME_SHARE_MAX_BYTES, `${project.id} 공유 이미지 용량 초과`); // 용량 한도 확인
        assert.ok(html.includes(`<meta property="og:image" content="${resolveShareImage(file)}">`), `${project.id} 공유 이미지 태그 누락`); // 화면의 공유 이미지 주소
        assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'), `${project.id} 큰 미리보기 형식 누락`); // 큰 미리보기 형식
        assert.equal(applyPageMeta(html, file), html, `${project.id} 공유 태그를 다시 적용하면 달라짐`); // 다시 적용해도 그대로
    } // 반복 끝
    assert.equal(resolveShareImage("project_c/ProjectC_Cards.html"), "/images/share/project-c.jpg"); // 추가 화면은 같은 게임의 이미지 사용
    assert.equal(resolveShareImage("project_a/ProjectA_Main.html", "https://example.com/"), "https://example.com/images/share/project-a.jpg"); // 도메인을 넣으면 절대 주소
    assert.equal(resolveShareImage("main.html"), null); // 일반 페이지는 공유 이미지 없음
    assert.equal(shareNames.length, GAME_PROJECTS.filter((project) => !project.adultOnly).length); // 남는 파일 없음
}); // 테스트 끝
