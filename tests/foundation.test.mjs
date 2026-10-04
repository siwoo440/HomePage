import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { createRateLimiter, getClientKey } from "../lib/http/rate-limit.ts"; // 요청 제한 도구
import { jsonNoStore, rateLimitedResponse, readJsonBody } from "../lib/http/json.ts"; // JSON 요청·응답 도구
import { CRAWL_BLOCKED_PATHS, PUBLIC_STATIC_PATHS } from "../lib/site-url.ts"; // 사이트 주소 도구
import { GAME_PROJECTS } from "../public/game-projects.mjs"; // 공개 게임 목록
import { applyFieldErrors, classifySubmitStatus, connectJsonForm, submitJson } from "../public/form-submit.mjs"; // 양식 전송 도구
import { applyI18nBootstrap, applyStaticPage, findStaticPageChanges, I18N_BOOTSTRAP_TAG } from "../scripts/apply-static-pages.mjs"; // 페이지 적용 도구

test("요청 제한은 기준 시간 안의 횟수만 허용하고 시간이 지나면 다시 허용한다", () => // 요청 제한 검사
{ // 테스트 시작
    let current = 1_000; // 시험 시각
    const limiter = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => current }); // 시험 제한 도구
    assert.deepEqual(limiter.check("a"), { allowed: true, remaining: 1, retryAfterSeconds: 0 }); // 첫 요청 허용
    assert.equal(limiter.check("a").allowed, true); // 둘째 요청 허용
    assert.deepEqual(limiter.check("a"), { allowed: false, remaining: 0, retryAfterSeconds: 10 }); // 셋째 요청 거부
    assert.equal(limiter.check("b").allowed, true); // 다른 요청자 분리 확인
    current += 10_000; // 기준 시간 경과
    assert.equal(limiter.check("a").allowed, true); // 시간 경과 뒤 허용
    limiter.reset(); // 기록 초기화
    assert.equal(limiter.check("a").remaining, 1); // 초기화 확인
}); // 테스트 끝

test("요청 제한은 기억 한도를 넘으면 오래된 요청자부터 지우고 요청자 주소를 안전하게 읽는다", () => // 한도·주소 검사
{ // 테스트 시작
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0, maxKeys: 2 }); // 작은 한도 도구
    limiter.check("a"); // 첫 요청자
    limiter.check("b"); // 둘째 요청자
    limiter.check("c"); // 한도 초과 요청자
    assert.equal(limiter.check("a").allowed, true); // 가장 오래된 기록 삭제 확인
    const request = (headers) => new Request("http://localhost/api", { headers }); // 시험 요청
    assert.equal(getClientKey(request({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" })), "203.0.113.5"); // 첫 전달 주소 확인
    assert.equal(getClientKey(request({ "x-real-ip": "198.51.100.7" })), "198.51.100.7"); // 직접 주소 확인
    assert.equal(getClientKey(request({})), "unknown"); // 주소 없음 확인
    assert.equal(getClientKey(request({ "x-forwarded-for": "x".repeat(200) })).length, 64); // 길이 제한 확인
}); // 테스트 끝

test("JSON 요청은 크기와 형식을 확인하고 응답은 캐시하지 않는다", async () => // JSON 도구 검사
{ // 테스트 시작
    const post = (body, headers = {}) => new Request("http://localhost/api", { method: "POST", body, headers }); // 시험 요청
    assert.deepEqual(await readJsonBody(post('{"a":1}')), { ok: true, value: { a: 1 } }); // 정상 본문 확인
    assert.equal((await readJsonBody(post("[1]"))).status, 400); // 배열 거부 확인
    assert.equal((await readJsonBody(post("{oops"))).status, 400); // 잘못된 JSON 확인
    assert.equal((await readJsonBody(post(JSON.stringify({ text: "가".repeat(50) })), 100)).status, 413); // 실제 크기 초과 확인
    assert.equal((await readJsonBody(post("{}", { "content-length": "999999" }))).status, 413); // 알려 준 크기 초과 확인
    assert.deepEqual(await readJsonBody(post(JSON.stringify({ text: "한글 문의" }))), { ok: true, value: { text: "한글 문의" } }); // UTF-8 한글 본문 확인
    const broken = new Uint8Array([...new TextEncoder().encode('{"text":"'), 0xc7, 0xd1, 0xb1, 0xdb, ...new TextEncoder().encode('"}')]); // UTF-8이 아닌 방식(CP949)으로 보낸 "한글"
    assert.deepEqual(await readJsonBody(post(broken)), { ok: false, status: 400, message: "요청 내용을 확인해 주세요." }); // 깨진 글자 요청 거부 확인
    const response = jsonNoStore({ ok: true }, 201); // 시험 응답
    assert.equal(response.status, 201); // 상태 확인
    assert.equal(response.headers.get("Cache-Control"), "no-store"); // 캐시 금지 확인
    const limited = rateLimitedResponse({ allowed: false, remaining: 0, retryAfterSeconds: 7 }); // 제한 응답
    assert.equal(limited.status, 429); // 제한 상태 확인
    assert.equal(limited.headers.get("Retry-After"), "7"); // 재시도 안내 확인
    assert.equal((await limited.json()).ok, false); // 실패 본문 확인
}); // 테스트 끝

test("양식 전송은 성공·입력 오류·요청 제한·서버 오류·연결 실패·시간 초과를 구분한다", async () => // 전송 결과 검사
{ // 테스트 시작
    const reply = (status, body) => async () => ({ status, json: async () => body }); // 시험 응답 도구
    assert.equal(classifySubmitStatus(204), "success"); // 성공 분류
    assert.equal(classifySubmitStatus(429), "rate-limit"); // 제한 분류
    assert.equal(classifySubmitStatus(422), "validation"); // 입력 오류 분류
    assert.equal(classifySubmitStatus(503), "server"); // 서버 오류 분류
    const success = await submitJson("/api/x", { a: 1 }, { fetchImpl: reply(200, { ok: true, message: "접수했습니다." }) }); // 성공 전송
    assert.deepEqual([success.ok, success.kind, success.message], [true, "success", "접수했습니다."]); // 성공 결과 확인
    const invalid = await submitJson("/api/x", {}, { fetchImpl: reply(400, { ok: false, message: "확인", errors: { email: "이메일을 입력해 주세요." } }) }); // 입력 오류 전송
    assert.deepEqual([invalid.ok, invalid.kind, invalid.fieldErrors.email], [false, "validation", "이메일을 입력해 주세요."]); // 입력 오류 확인
    assert.equal((await submitJson("/api/x", {}, { fetchImpl: reply(429, {}) })).kind, "rate-limit"); // 제한 확인
    assert.equal((await submitJson("/api/x", {}, { fetchImpl: reply(200, { ok: false }) })).kind, "server"); // 성공 상태의 실패 본문 확인
    assert.equal((await submitJson("/api/x", {}, { fetchImpl: async () => { throw new Error("offline"); } })).kind, "network"); // 연결 실패 확인
    const slow = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))); // 응답 없는 요청
    assert.equal((await submitJson("/api/x", {}, { fetchImpl: slow, timeoutMs: 20 })).kind, "timeout"); // 시간 초과 확인
    let sent = null; // 보낸 요청
    await submitJson("/api/x", { a: 1 }, { fetchImpl: async (url, options) => { sent = options; return { status: 200, json: async () => ({ ok: true }) }; } }); // 요청 형식 확인용 전송
    assert.deepEqual([sent.method, sent.headers["Content-Type"], sent.body], ["POST", "application/json", '{"a":1}']); // JSON 요청 형식 확인
}); // 테스트 끝

function createForm() // 시험 양식
{ // 함수 시작
    const makeField = () => ({ attributes: {}, focused: false, setAttribute(name, value) { this.attributes[name] = value; }, removeAttribute(name) { delete this.attributes[name]; }, focus() { this.focused = true; } }); // 입력 대체
    const fields = { email: makeField(), message: makeField() }; // 입력 목록
    const errors = { email: { textContent: "", hidden: true }, message: { textContent: "", hidden: true } }; // 오류 문구 목록
    const status = { textContent: "", hidden: true, dataset: {}, attributes: {}, setAttribute(name, value) { this.attributes[name] = value; } }; // 결과 안내 대체
    const button = { disabled: false }; // 제출 버튼 대체
    const listeners = {}; // 처리기 목록
    const form = // 양식 대체
    { // 양식 시작
        attributes: {}, // 속성 기록
        elements: { namedItem: (name) => fields[name] ?? null }, // 이름 조회
        querySelector: (selector) => selector === "[data-form-status]" ? status : selector === '[type="submit"]' ? button : errors[/data-field-error="(\w+)"/.exec(selector)?.[1]] ?? null, // 요소 조회
        setAttribute(name, value) { this.attributes[name] = value; }, // 속성 설정
        removeAttribute(name) { delete this.attributes[name]; }, // 속성 제거
        addEventListener: (type, handler) => { listeners[type] = handler; }, // 처리기 등록
        removeEventListener: (type) => { delete listeners[type]; }, // 처리기 해제
    }; // 양식 끝
    return { form, fields, errors, status, button, listeners }; // 시험 도구 반환
} // 함수 끝

test("양식 연결은 화면 검증·전송 중 표시·서버 오류 안내·성공 처리를 한곳에서 한다", async () => // 양식 연결 검사
{ // 테스트 시작
    const { form, fields, errors, status, button, listeners } = createForm(); // 시험 양식
    const first = applyFieldErrors(form, ["email", "message"], { message: "내용을 입력해 주세요." }); // 오류 표시
    assert.equal(first, fields.message); // 첫 오류 입력 확인
    assert.deepEqual([fields.message.attributes["aria-invalid"], fields.message.focused, errors.message.textContent, errors.email.hidden], ["true", true, "내용을 입력해 주세요.", true]); // 오류 상태 확인
    const calls = []; // 전송 기록
    let succeeded = null; // 성공 결과
    let nextResult = { ok: false, kind: "validation", message: "입력 내용을 확인해 주세요.", fieldErrors: { email: "이메일 형식을 확인해 주세요." } }; // 다음 전송 결과
    connectJsonForm(form, { url: "/api/x", fieldOrder: ["email", "message"], collect: () => ({ email: "a", message: "b" }), validate: (payload) => (payload.message ? {} : { message: "내용을 입력해 주세요." }), submit: async (url, payload) => { calls.push([url, payload, form.attributes["aria-busy"], button.disabled]); return nextResult; }, onSuccess: (result) => { succeeded = result; } }); // 양식 연결
    const event = { preventDefault() { this.prevented = true; } }; // 제출 이벤트 대체
    await listeners.submit(event); // 실패 제출
    assert.equal(event.prevented, true); // 기본 제출 차단 확인
    assert.deepEqual(calls[0], ["/api/x", { email: "a", message: "b" }, "true", true]); // 전송 중 표시 확인
    assert.deepEqual([form.attributes["aria-busy"], button.disabled, status.attributes.role, status.dataset.state, errors.email.textContent], [undefined, false, "alert", "error", "이메일 형식을 확인해 주세요."]); // 실패 안내 확인
    nextResult = { ok: true, kind: "success", message: "접수했습니다.", fieldErrors: {} }; // 성공 결과 준비
    await listeners.submit({ preventDefault() {} }); // 성공 제출
    assert.deepEqual([status.attributes.role, status.textContent, succeeded.ok, fields.email.attributes["aria-invalid"]], ["status", "접수했습니다.", true, undefined]); // 성공 안내 확인
}); // 테스트 끝

test("페이지 적용 도구는 공통 헤더·검색 설명·번역 준비를 한 번에 넣고 현재 페이지는 모두 적용되어 있다", () => // 페이지 적용 검사
{ // 테스트 시작
    const sample = '<!DOCTYPE html>\n<html lang="ko">\n<head>\n    <title>시험</title>\n</head>\n<body>\n    <script type="module" src="/responsive-nav.mjs"></script>\n</body>\n</html>\n'; // 시험 문서
    const applied = applyI18nBootstrap(sample); // 번역 준비 적용
    assert.ok(applied.indexOf(I18N_BOOTSTRAP_TAG) < applied.indexOf("</head>")); // 머리 안 삽입 확인
    assert.equal(applyI18nBootstrap(applied), applied); // 중복 삽입 방지 확인
    assert.equal(applyI18nBootstrap("<head></head><body></body>"), "<head></head><body></body>"); // 공통 메뉴 없는 문서 제외 확인
    const withAll = applyStaticPage(sample, "sample.html"); // 전체 적용
    assert.match(withAll, /<meta name="description" content="시험">/); // 검색 설명 확인
    assert.match(withAll, /property="og:title"/); // 공유 정보 확인
    assert.match(withAll, /i18n-bootstrap\.js/); // 번역 준비 확인
    assert.deepEqual(findStaticPageChanges("public").map((change) => change.file), [], "pnpm pages:apply 실행 필요"); // 현재 페이지 적용 상태 확인
    const scripts = JSON.parse(fs.readFileSync("package.json", "utf8")).scripts; // 실행 명령
    assert.equal(scripts["pages:apply"], "node scripts/apply-static-pages.mjs"); // 적용 명령 확인
    assert.equal(scripts["pages:check"], "node scripts/apply-static-pages.mjs --check"); // 확인 명령 확인
}); // 테스트 끝

test("공개 HTML 페이지는 사이트맵 목록이나 수집 제외 목록 가운데 하나에 들어 있다", () => // 사이트맵 누락 검사
{ // 테스트 시작
    const pages = []; // 공개 문서 목록
    const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).forEach((entry) => (entry.isDirectory() ? walk(path.join(directory, entry.name)) : entry.name.endsWith(".html") && pages.push("/" + path.relative("public", path.join(directory, entry.name)).replaceAll("\\", "/")))); // 문서 수집
    walk("public"); // 공개 폴더 순회
    const listed = new Set([...PUBLIC_STATIC_PATHS, ...GAME_PROJECTS.map((project) => project.detailPath)]); // 사이트맵 대상
    const missing = pages.filter((page) => !listed.has(page) && !CRAWL_BLOCKED_PATHS.some((blocked) => page.startsWith(blocked))); // 어디에도 없는 페이지
    assert.deepEqual(missing, [], "lib/site-url.ts의 PUBLIC_STATIC_PATHS 또는 CRAWL_BLOCKED_PATHS에 추가 필요"); // 누락 없음 확인
    for (const listedPath of PUBLIC_STATIC_PATHS) // 사이트맵 경로 반복
    { // 반복 시작
        assert.ok(pages.includes(listedPath), `${listedPath} 파일 없음`); // 실제 파일 존재 확인
    } // 반복 끝
}); // 테스트 끝

test("프로젝트 η 기본 스타일은 실제로 쓰는 기본 규칙만 남긴다", () => // 스타일 정리 검사
{ // 테스트 시작
    const css = fs.readFileSync("public/project-detail.css", "utf8"); // 기본 스타일
    assert.match(css, /box-sizing: border-box/); // 크기 계산 기본값 유지 확인
    assert.match(css, /^body /m); // 본문 기본값 유지 확인
    assert.doesNotMatch(css, /\.(page-shell|top-nav|hero-card|hero-image|hero-content|hero-meta|section-block|info-grid|info-card|visual-image|eyebrow)\b/); // 쓰지 않는 클래스 제거 확인
    assert.match(fs.readFileSync("public/project_eta/ProjectEta_Main.html", "utf8"), /href="\.\.\/project-detail\.css"/); // 기본 스타일 연결 유지 확인
}); // 테스트 끝
