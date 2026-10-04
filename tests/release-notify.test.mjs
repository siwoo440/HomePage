import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { isNotifyOpen, isNotifyToken, listNotifyProjects, NOTIFY_CLOSED_MESSAGE, NOTIFY_CONFIRM_DAILY_LIMIT, NOTIFY_CONFIRM_RESEND_HOURS, NOTIFY_FIELD_ORDER, validateNotify } from "../lib/notify/domain.ts"; // 출시 알림 규칙
import { isConfirmationEnabled, sendNotifyConfirmation } from "../lib/notify/confirmation.ts"; // 확인 메일 처리
import { buildNotifySummary, cancelNotifyRequest, confirmNotifyRequest, createDemoNotifyCounts, issueNotifyConfirmation, loadNotifySummary, NotifyStoreError, saveNotifyRequest } from "../lib/notify/store.ts"; // 출시 알림 저장 도구
import { createSecretSupabaseClient, getSupabaseSecretKey } from "../lib/supabase/secret.ts"; // 서버 전용 연결
import { CRAWL_BLOCKED_PATHS } from "../lib/site-url.ts"; // 검색 제외 경로
import { GAME_PROJECTS, getGameProject, getReleaseNotifyState } from "../public/game-projects.mjs"; // 공개 프로젝트 데이터
import { collectNotifyForm, createNotifySection, NOTIFY_FORM_FIELDS, validateNotifyForm } from "../public/release-notify.mjs"; // 출시 알림 화면 도구
import { applyReleaseNotify, RELEASE_NOTIFY_PAGES, RELEASE_NOTIFY_TAG } from "../scripts/apply-static-pages.mjs"; // 페이지 적용 도구
import { SUPABASE_MIGRATIONS } from "../scripts/check-supabase-env.mjs"; // 마이그레이션 적용 순서
import { renderProjectHtml } from "../scripts/generate-project-pages.mjs"; // 페이지 생성 도구

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구
const TOKEN = "123e4567-e89b-42d3-a456-426614174000"; // 시험 수신 거부 값

function createFakeDocument() // 화면 요소 대체 도구
{ // 함수 시작
    const createElement = (tagName) => // 가짜 요소 생성
    { // 생성 시작
        const element = { tagName: tagName.toUpperCase(), className: "", children: [], dataset: {}, attributes: {}, append(...nodes) { element.children.push(...nodes); }, setAttribute(name, value) { element.attributes[name] = value; } }; // 가짜 요소
        return element; // 요소 반환
    }; // 생성 끝
    return { createElement }; // 가짜 문서 반환
} // 함수 끝

function flatten(element) // 하위 요소 펼치기
{ // 함수 시작
    return [element, ...element.children.filter((child) => typeof child === "object").flatMap(flatten)]; // 자신과 하위 요소 반환
} // 함수 끝

test("출시 알림은 성인 게임 3개와 보류 게임 2개를 빼고 30개 게임에서 받는다", () => // 대상 판정 검사
{ // 테스트 시작
    const states = Object.groupBy(GAME_PROJECTS, (project) => getReleaseNotifyState(project)); // 상태별 프로젝트
    assert.deepEqual(states.adult.map((project) => project.id), ["project-h", "project-u", "project-v"]); // 성인 게임 제외 확인
    assert.deepEqual(states.paused.map((project) => project.id).sort(), ["project-gamma", "project-zeta"]); // 보류 게임 제외 확인
    assert.equal(states.open.length, 30); // 신청 가능 게임 수 확인
    assert.equal(getReleaseNotifyState(null), "unknown"); // 없는 게임 확인
    assert.deepEqual(listNotifyProjects().map((project) => project.id), states.open.map((project) => project.id)); // 대상 목록 일치 확인
    assert.deepEqual(Object.keys(listNotifyProjects()[0]).sort(), ["id", "symbol", "title"]); // 목록 항목 형식 확인
    assert.deepEqual([isNotifyOpen("project-eta"), isNotifyOpen("project-h"), isNotifyOpen("project-zeta"), isNotifyOpen("project-none"), isNotifyOpen(undefined)], [true, false, false, false, false]); // 신청 가능 판정 확인
}); // 테스트 끝

test("신청 입력은 게임·이메일·수신 동의를 확인하고 이메일을 소문자로 통일한다", () => // 서버 검증 검사
{ // 테스트 시작
    assert.deepEqual(validateNotify({ projectId: " project-eta ", email: "  Player@Example.COM ", consent: true }), { ok: true, value: { projectId: "project-eta", email: "player@example.com" }, spam: false }); // 정상 입력 정리
    assert.equal(validateNotify({ projectId: "project-eta", email: "a@b.co", consent: true, website: "http://spam.example" }).spam, true); // 숨김 칸 입력은 자동 입력 의심
    assert.deepEqual(validateNotify({ projectId: "project-eta", email: "", consent: false }), { ok: false, message: "입력 내용을 확인해 주세요.", errors: { email: "알림 받을 이메일을 입력해 주세요.", consent: "출시 소식 메일 수신에 동의해 주세요." } }); // 빈 입력 오류
    assert.equal(validateNotify({ projectId: "project-eta", email: "not-an-email", consent: true }).errors.email, "이메일 형식을 확인해 주세요."); // 형식 오류
    assert.equal(validateNotify({ projectId: "project-eta", email: `${"a".repeat(250)}@b.co`, consent: true }).ok, false); // 긴 이메일 거부
    assert.equal(validateNotify({ projectId: "project-eta", email: "a@b.co", consent: "true" }).ok, false); // 글자 형식 동의 거부
    for (const projectId of ["project-h", "project-gamma", "project-none", "", 12]) // 신청을 받지 않는 게임 반복
    { // 반복 시작
        assert.deepEqual(validateNotify({ projectId, email: "a@b.co", consent: true }), { ok: false, message: NOTIFY_CLOSED_MESSAGE, errors: {} }, String(projectId)); // 신청 불가 확인
    } // 반복 끝
    assert.deepEqual([isNotifyToken(TOKEN), isNotifyToken(TOKEN.toUpperCase()), isNotifyToken("1234"), isNotifyToken([TOKEN]), isNotifyToken(undefined)], [true, true, false, false, false]); // 수신 거부 값 형식 확인
}); // 테스트 끝

test("화면 양식은 서버와 같은 문구로 검증하고 신청 가능한 게임에만 양식을 만든다", () => // 화면 도구 검사
{ // 테스트 시작
    assert.deepEqual([...NOTIFY_FORM_FIELDS], [...NOTIFY_FIELD_ORDER]); // 입력 순서 일치 확인
    for (const payload of [{ email: "", consent: false }, { email: "wrong", consent: true }, { email: "a@b.co", consent: false }, { email: " A@B.co ", consent: true }]) // 입력 경우 반복
    { // 반복 시작
        const server = validateNotify({ projectId: "project-eta", ...payload }); // 서버 검증 결과
        assert.deepEqual(validateNotifyForm(payload), server.ok ? {} : server.errors, JSON.stringify(payload)); // 화면·서버 문구 일치 확인
    } // 반복 끝
    const fields = { email: { value: "a@b.co" }, consent: { checked: true }, website: { value: "" } }; // 가짜 입력 값
    assert.deepEqual(collectNotifyForm({ dataset: { projectId: "project-c" }, elements: { namedItem: (name) => fields[name] ?? null } }), { projectId: "project-c", email: "a@b.co", consent: true, website: "" }); // 전송 내용 확인
    const open = createNotifySection(createFakeDocument(), getGameProject("project-eta")); // 신청 가능 게임 영역
    const parts = flatten(open); // 영역 안 요소
    const form = parts.find((part) => part.tagName === "FORM"); // 신청 양식
    assert.equal(open.dataset.releaseNotify, "open"); // 영역 상태 확인
    assert.deepEqual([form.dataset.projectId, form.noValidate], ["project-eta", true]); // 대상 게임과 같은 안내 사용 확인
    assert.deepEqual(parts.filter((part) => part.tagName === "INPUT").map((input) => [input.name, input.type]), [["email", "email"], ["website", "text"], ["consent", "checkbox"]]); // 입력 구성 확인
    assert.deepEqual(parts.filter((part) => part.dataset.fieldError).map((part) => [part.dataset.fieldError, part.attributes.role, part.hidden]), [["email", "alert", true], ["consent", "alert", true]]); // 오류 문구 위치 확인
    assert.ok(parts.some((part) => "formStatus" in part.dataset && part.hidden === true)); // 결과 안내 위치 확인
    assert.equal(parts.find((part) => part.tagName === "A").href, "/privacy.html"); // 처리방침 연결 확인
    assert.match(parts.find((part) => part.tagName === "SPAN" && part.className === "").textContent, /^\[필수\] 이 게임의 출시 소식 메일 수신과/); // 수신 동의 문구 확인
    const paused = createNotifySection(createFakeDocument(), getGameProject("project-zeta")); // 보류 게임 영역
    assert.equal(paused.dataset.releaseNotify, "paused"); // 보류 상태 확인
    assert.equal(flatten(paused).some((part) => part.tagName === "FORM"), false); // 보류 게임은 양식 없음 확인
    assert.equal(createNotifySection(createFakeDocument(), getGameProject("project-h")), null); // 성인 게임은 영역 없음 확인
    assert.equal(createNotifySection(createFakeDocument(), null), null); // 없는 게임은 영역 없음 확인
    const script = read("public/release-notify.mjs"); // 화면 스크립트
    assert.match(script, /main\.after\(section\)/); // 주요 내용 뒤 배치 확인
    assert.match(script, /url: "\/api\/notify"/); // 신청 주소 확인
    assert.doesNotMatch(script, /innerHTML/); // HTML 문자열 삽입 없음 확인
}); // 테스트 끝

test("신청 접수는 요청 제한·본문·검증·시연 모드·자동 입력·저장·확인 메일 순서로 처리한다", () => // 서버 처리 순서 검사
{ // 테스트 시작
    const route = read("app/api/notify/route.ts"); // 신청 접수 처리
    const order = ["limiter.check(getClientKey(request))", "readJsonBody(request, NOTIFY_BODY_MAX_BYTES)", "validateNotify(body.value)", "if (!isSupabaseConfigured())", "if (checked.spam)", "await saveNotifyRequest(", "await sendNotifyConfirmation(checked.value, confirmation);"].map((step) => route.indexOf(step)); // 단계별 위치
    assert.ok(order.every((position, index) => position > 0 && (index === 0 || position > order[index - 1])), JSON.stringify(order)); // 처리 순서 확인
    assert.match(route, /createRateLimiter\(\{ limit: 5, windowMs: 10 \* 60_000 \}\)/); // 요청 제한 수치 확인
    assert.match(route, /const doneMessage = isConfirmationEnabled\(confirmation\) \? NOTIFY_CONFIRM_MESSAGE : NOTIFY_DONE_MESSAGE;/); // 이미 신청했는지와 상관없는 같은 안내 확인
    assert.match(route, /if \(checked\.spam\)[^\n]*\n\s*\{[^\n]*\n\s*return jsonNoStore\(\{ ok: true, message: doneMessage \}\);/); // 자동 입력은 저장 없이 같은 안내 확인
    assert.equal(route.split("doneMessage").length - 1, 3); // 저장 결과와 상관없이 같은 안내만 사용
    const confirm = read("app/api/notify/confirm/route.ts"); // 본인 확인 처리
    const confirmSteps = ["limiter.check(getClientKey(request))", "readJsonBody(request, CONFIRM_BODY_MAX_BYTES)", "isNotifyToken(token)", "if (!isSupabaseConfigured())", "confirmNotifyRequest("].map((step) => confirm.indexOf(step)); // 단계별 위치
    assert.ok(confirmSteps.every((position, index) => position > 0 && (index === 0 || position > confirmSteps[index - 1])), JSON.stringify(confirmSteps)); // 처리 순서 확인
    assert.match(read("app/notify/confirm/page.tsx"), /robots: \{ index: false \}/); // 확인 화면 검색 제외
    assert.match(read("app/notify/confirm/page.tsx"), /<TokenActionPanel token=\{token\} endpoint="\/api\/notify\/confirm"/); // 확인 버튼 연결
    assert.match(route, /demo: true, message: "시연 모드: 입력 검증을 통과했습니다\. 서버가 연결되지 않아 신청은 저장되지 않습니다\."/); // 시연 안내 확인
    const unsubscribe = read("app/api/notify/unsubscribe/route.ts"); // 수신 거부 처리
    const steps = ["limiter.check(getClientKey(request))", "readJsonBody(request, UNSUBSCRIBE_BODY_MAX_BYTES)", "isNotifyToken(token)", "if (!isSupabaseConfigured())", "cancelNotifyRequest("].map((step) => unsubscribe.indexOf(step)); // 단계별 위치
    assert.ok(steps.every((position, index) => position > 0 && (index === 0 || position > steps[index - 1])), JSON.stringify(steps)); // 처리 순서 확인
    assert.match(unsubscribe, /404\)/); // 없는 신청 안내 확인
    const page = read("app/notify/unsubscribe/page.tsx"); // 수신 거부 화면
    assert.match(page, /robots: \{ index: false \}/); // 검색 제외 확인
    assert.match(page, /isNotifyToken\(parameters\.token\) \? parameters\.token : ""/); // 주소 값 형식 확인
    assert.match(page, /<TokenActionPanel token=\{token\} endpoint="\/api\/notify\/unsubscribe"/); // 수신 거부 버튼 연결
    const panel = read("app/notify/token-action-panel.tsx"); // 확인·수신 거부 공용 버튼 영역
    assert.match(panel, /onClick=\{\(\) => void handleAction\(\)\}/); // 버튼을 눌러야 처리(주소를 여는 것만으로 처리하지 않음)
    assert.match(panel, /fetch\(endpoint, \{ method: "POST"/); // 처리 요청 방식
    assert.doesNotMatch(panel, /useEffect/); // 화면이 열릴 때 자동 처리하지 않음 확인
    assert.ok(CRAWL_BLOCKED_PATHS.includes("/notify/")); // 검색 수집 제외 확인
}); // 테스트 끝

test("저장 도구는 함수 호출로만 신청·수신 거부하고 게임별 집계를 정리한다", async () => // 저장 도구 검사
{ // 테스트 시작
    const calls = []; // 호출 기록
    const createClient = (result) => ({ rpc: async (name, parameters) => { calls.push([name, parameters]); return result; } }); // 가짜 클라이언트
    await saveNotifyRequest(createClient({ data: null, error: null }), { projectId: "project-eta", email: "a@b.co" }); // 신청 저장
    assert.deepEqual(calls[0], ["subscribe_release_notification", { p_project_id: "project-eta", p_email: "a@b.co" }]); // 신청 함수 호출 확인
    await assert.rejects(saveNotifyRequest(createClient({ data: null, error: { message: "x" } }), { projectId: "project-eta", email: "a@b.co" }), NotifyStoreError); // 저장 실패 확인
    assert.equal(await cancelNotifyRequest(createClient({ data: true, error: null }), TOKEN), true); // 수신 거부 성공
    assert.equal(await cancelNotifyRequest(createClient({ data: false, error: null }), TOKEN), false); // 없는 신청
    assert.deepEqual(calls.at(-1), ["unsubscribe_release_notification", { p_token: TOKEN }]); // 수신 거부 함수 호출 확인
    await assert.rejects(cancelNotifyRequest(createClient({ data: null, error: { message: "x" } }), TOKEN), NotifyStoreError); // 처리 실패 확인
    const summary = buildNotifySummary([{ project_id: "project-c", active_count: "7", unsubscribed_count: 1 }, { project_id: "project-eta", active_count: 20, unsubscribed_count: null }, { project_id: "project-h", active_count: 3, unsubscribed_count: 0 }, { project_id: "project-a", active_count: -5, unsubscribed_count: "x" }]); // 집계 정리
    assert.deepEqual(summary.items.slice(0, 3).map((item) => [item.projectId, item.active, item.confirmed, item.unsubscribed, item.open]), [["project-eta", 20, 0, 0, true], ["project-c", 7, 0, 1, true], ["project-h", 3, 0, 0, false]]); // 신청 많은 순서와 받지 않는 게임 표시
    const demo = buildNotifySummary(createDemoNotifyCounts()); // 시연 집계
    assert.deepEqual([demo.totalActive, demo.totalConfirmed, demo.totalUnsubscribed], [272, 197, 7]); // 확인 완료 합계
    assert.equal(await confirmNotifyRequest(createClient({ data: true, error: null }), TOKEN), true); // 본인 확인 성공
    assert.deepEqual(calls.at(-1), ["confirm_release_notification", { p_token: TOKEN }]); // 확인 함수 호출 확인
    assert.equal(await confirmNotifyRequest(createClient({ data: false, error: null }), TOKEN), false); // 없는 신청
    await assert.rejects(confirmNotifyRequest(createClient({ data: null, error: { message: "x" } }), TOKEN), NotifyStoreError); // 확인 실패
    assert.equal(await issueNotifyConfirmation(createClient({ data: TOKEN, error: null }), { projectId: "project-eta", email: "a@b.co" }), TOKEN); // 확인 값 발급
    assert.deepEqual(calls.at(-1), ["issue_release_confirmation", { p_project_id: "project-eta", p_email: "a@b.co" }]); // 발급 함수 호출 확인
    assert.equal(await issueNotifyConfirmation(createClient({ data: null, error: null }), { projectId: "project-eta", email: "a@b.co" }), null); // 보낼 필요 없음
    await assert.rejects(issueNotifyConfirmation(createClient({ data: null, error: { message: "x" } }), { projectId: "project-eta", email: "a@b.co" }), NotifyStoreError); // 발급 실패
    assert.equal(summary.items.length, 31); // 신청 가능 30개와 기존 신청 1개
    assert.deepEqual([summary.totalActive, summary.totalUnsubscribed], [30, 1]); // 전체 합계와 잘못된 값 0 처리
    assert.equal(summary.items.find((item) => item.projectId === "project-a").active, 0); // 음수는 0 처리
    assert.equal((await loadNotifySummary(createClient({ data: createDemoNotifyCounts(), error: null }))).totalActive, 272); // 집계 조회
    assert.deepEqual(calls.at(-1), ["release_notification_counts", undefined]); // 집계 함수 호출 확인
    await assert.rejects(loadNotifySummary(createClient({ data: null, error: { message: "x" } })), NotifyStoreError); // 조회 실패 확인
    assert.equal(buildNotifySummary([]).totalActive, 0); // 빈 집계 확인
}); // 테스트 끝

test("신청 표는 함수로만 추가·수신 거부하고 관리자만 읽으며 적용 순서에 들어 있다", () => // 데이터베이스 권한 검사
{ // 테스트 시작
    const file = "202610040003_release_notifications.sql"; // 출시 알림 마이그레이션
    const sql = read(`supabase/migrations/${file}`); // 마이그레이션 내용
    assert.ok(SUPABASE_MIGRATIONS.includes(file)); // 적용 순서 포함 확인
    assert.match(read("README.md"), new RegExp(`supabase/migrations/${file.replace(".", "\\.")}`)); // README 안내 확인
    assert.match(sql, /alter table public\.release_notifications enable row level security/); // 행 단위 보안 확인
    assert.match(sql, /revoke all on public\.release_notifications from anon, authenticated/); // 기본 권한 회수 확인
    assert.doesNotMatch(sql, /grant (select|insert|update|delete)[^;]*on public\.release_notifications to anon/); // 방문자 표 직접 접근 금지 확인
    assert.match(sql, /for select to authenticated using \(\(select public\.is_admin\(\)\)\)/); // 관리자 조회 확인
    assert.match(sql, /unique \(project_id, email\)/); // 같은 신청 한 번만 저장 확인
    assert.match(sql, /token uuid not null unique default gen_random_uuid\(\)/); // 수신 거부 값 확인
    assert.match(sql, /confirmed_at timestamptz,/); // 본인 확인 시각 열 확인
    assert.equal((sql.match(/security definer[^\n]*\nset search_path = ''/g) ?? []).length, 4); // 신청·발급·확인·수신 거부 함수 고정 검색 경로 확인
    assert.match(sql, /confirmation_sent_at timestamptz,/); // 확인 메일 발송 시각 열 확인
    assert.match(sql, /grant execute on function public\.issue_release_confirmation\(text, text\) to service_role;/); // 확인 값 발급은 서버 전용 키만
    assert.doesNotMatch(sql, /grant execute on function public\.issue_release_confirmation\(text, text\) to [^;]*(anon|authenticated)/); // 방문자 발급 금지 확인
    assert.match(sql, /grant execute on function public\.confirm_release_notification\(uuid\) to anon, authenticated;/); // 확인 값을 가진 누구나 확인
    assert.ok(sql.includes(`interval '${NOTIFY_CONFIRM_RESEND_HOURS} hours') >= ${NOTIFY_CONFIRM_DAILY_LIMIT} then return null`)); // 이메일별 하루 발송 한도 일치
    assert.ok(sql.includes(`confirmation_sent_at < now() - interval '${NOTIFY_CONFIRM_RESEND_HOURS} hours'`)); // 재발송 간격 일치
    assert.match(sql, /where token = p_token and status = 'active'; -- 수신 중인 신청만 확인 표시/); // 수신 거부한 신청은 확인 불가
    assert.match(sql, /confirmation_sent_at = case when existing\.status = 'unsubscribed' then null else existing\.confirmation_sent_at end/); // 다시 신청하면 확인 메일도 다시
    assert.match(sql, /returns table \(project_id text, active_count bigint, confirmed_count bigint, unsubscribed_count bigint\)/); // 집계의 확인 완료 수 확인
    assert.match(sql, /security invoker[^\n]*\nset search_path = ''/); // 집계 함수는 호출자 권한 확인
    assert.ok(sql.includes("'^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$'")); // 화면과 같은 이메일 규칙 확인
    assert.ok(GAME_PROJECTS.every((project) => /^project-[a-z]{1,12}$/.test(project.id))); // 게임 식별자 규칙 일치 확인
    assert.match(sql, /on conflict \(project_id, email\) do update set/); // 이미 있는 신청 처리 확인
    assert.match(sql, /grant execute on function public\.subscribe_release_notification\(text, text\) to anon, authenticated;/); // 누구나 신청 확인
    assert.match(sql, /grant execute on function public\.unsubscribe_release_notification\(uuid\) to anon, authenticated;/); // 누구나 수신 거부 확인
    assert.match(sql, /grant execute on function public\.release_notification_counts\(\) to authenticated;/); // 집계는 로그인 계정만 확인
    assert.equal((sql.match(/revoke all on function public\.[a-z_]+\([a-z, ]*\) from public, anon, authenticated;/g) ?? []).length, 5); // 기본 실행 권한 회수 확인
}); // 테스트 끝

test("게임 소개 35개 첫 화면은 출시 알림 스크립트를 한 번씩 불러온다", () => // 페이지 적용 검사
{ // 테스트 시작
    assert.equal(RELEASE_NOTIFY_PAGES.length, 35); // 대상 페이지 수 확인
    for (const project of GAME_PROJECTS) // 프로젝트 반복
    { // 반복 시작
        const html = read(`public${project.detailPath}`); // 게임 소개 첫 화면
        assert.equal(html.split(RELEASE_NOTIFY_TAG).length - 1, 1, project.id); // 스크립트 한 번 포함 확인
        assert.ok(html.indexOf(RELEASE_NOTIFY_TAG) < html.indexOf("/responsive-nav.mjs"), project.id); // 공통 메뉴 앞 위치 확인
        assert.match(html, new RegExp(`data-public-project-page[^>]*data-project-id="${project.id}"`), project.id); // 게임 식별자 표시 확인
    } // 반복 끝
    for (const file of ["public/project_c/ProjectC_Cards.html", "public/project_d/characters.html", "public/main.html"]) // 대상이 아닌 페이지 반복
    { // 반복 시작
        assert.equal(read(file).includes("/release-notify.mjs"), false, file); // 스크립트 없음 확인
    } // 반복 끝
    assert.ok(renderProjectHtml(getGameProject("project-a")).includes(`    ${RELEASE_NOTIFY_TAG}\n`)); // 생성 도구 반영 확인
    const sample = "<body>\r\n    <main></main>\r\n    <script type=\"module\" src=\"/responsive-nav.mjs\"></script>\r\n</body>"; // 시험 문서
    const applied = applyReleaseNotify(sample, "project_b/ProjectB_Main.html"); // 스크립트 적용
    assert.equal(applied, sample.replace("    <script type=\"module\" src=\"/responsive-nav.mjs\">", `    ${RELEASE_NOTIFY_TAG}\r\n    <script type="module" src="/responsive-nav.mjs">`)); // 같은 들여쓰기·줄바꿈으로 삽입 확인
    assert.equal(applyReleaseNotify(applied, "project_b/ProjectB_Main.html"), applied); // 다시 적용해도 그대로 확인
    assert.equal(applyReleaseNotify(sample, "contact.html"), sample); // 대상이 아닌 페이지 제외 확인
    const css = read("public/release-notify.css"); // 출시 알림 스타일
    assert.match(css, /\.release-notify-field input\[type="email"\][^{]*\{[^}]*min-height: 48px;/); // 입력 터치 높이 확인
    assert.match(css, /\.release-notify-submit[^{]*\{[^}]*min-height: 48px;/); // 버튼 터치 높이 확인
    assert.match(css, /\.release-notify-trap, \.release-notify-hidden[^{]*\{[^}]*clip-path: inset\(50%\);/); // 숨김 칸 처리 확인
}); // 테스트 끝

test("관리자 화면은 게임별 신청 수만 보여 주고 개인정보처리방침과 번역 설정에 반영되어 있다", () => // 관리·안내 검사
{ // 테스트 시작
    const page = read("app/admin/notify/page.tsx"); // 출시 알림 관리 화면
    assert.match(page, /await requireAdmin\("\/admin\/notify"\)/); // 화면 관리자 확인
    assert.match(page, /loadNotifySummary\(await createServerSupabaseClient\(\)\)/); // 집계 조회 연결 확인
    const table = read("app/admin/notify/summary-table.tsx"); // 집계 표
    assert.doesNotMatch(table, /email/i); // 이메일 주소 미표시 확인
    assert.doesNotMatch(table.slice(table.indexOf("<table"), table.indexOf("</table>")), /> \{\/\*/); // 표 안에 공백 글자가 끼지 않는지 확인
    assert.match(table, /이 화면에는 이메일 주소를 표시하지 않습니다/); // 표시 범위 안내 확인
    assert.match(read("app/admin/news/admin-header.tsx"), /href="\/admin\/notify">출시 알림</); // 관리자 메뉴 확인
    assert.match(read("app/admin/demo/page.tsx"), /form === "notify" \? <NotifySummaryTable summary=\{buildNotifySummary\(createDemoNotifyCounts\(\)\)\} \/>/); // 데모 화면 확인
    assert.match(read("public/privacy.html"), /출시 알림을 신청하면 이메일 주소와 신청한 게임을 출시 소식 안내 목적으로 처리합니다/); // 개인정보 안내 확인
    assert.match(read("public/privacy.html"), /확인 메일로 본인 신청인지 먼저 확인합니다/); // 본인 확인 안내 확인
    const extractor = read("scripts/i18n-extract.mjs"); // 번역 추출 도구
    assert.match(extractor, /"lib\/notify\/domain\.ts", "app\/api\/notify\/route\.ts"\]/); // 정적 페이지에 보이는 서버 안내 번역 확인
    const site = JSON.parse(read("public/i18n/en/site.json")).entries; // 공통 영어 사전
    assert.equal(site["출시 알림 받기"], "Get release notices"); // 화면 번역 확인
    assert.ok(site["출시 알림 신청을 받았습니다. 소식이 준비되면 입력하신 이메일로 알려 드립니다."]); // 서버 안내 번역 확인
}); // 테스트 끝

test("확인 메일은 인증한 도메인과 서버 전용 키가 있을 때만 보내고 실패하면 발송 표시를 지운다", async () => // 확인 메일 처리 검사
{ // 테스트 시작
    const value = { projectId: "project-eta", email: "player@example.com" }; // 시험 신청
    const sender = { apiKey: "re_test_value", from: "DEVFORGE <noreply@devforge.example>" }; // 인증한 도메인 보내는 쪽
    const calls = []; // 호출 기록
    const createSecretClient = (token) => ({ rpc: async (name, parameters) => { calls.push(["rpc", name, parameters]); return { data: token, error: null }; }, from: (table) => ({ update: (changes) => ({ eq: (c1, v1) => ({ eq: (c2, v2) => ({ is: async (c3, v3) => { calls.push(["update", table, changes, [c1, v1, c2, v2, c3, v3]]); return { error: null }; } }) }) }) }) }); // 가짜 서버 전용 연결
    const mails = []; // 보낸 메일 기록
    const send = async (config, message) => { mails.push([config, message]); return { ok: true, id: "mail-1" }; }; // 가짜 발송 도구
    assert.equal(isConfirmationEnabled({ sender, secretClient: createSecretClient(TOKEN), siteUrl: "https://devforge.example" }), true); // 준비 완료
    assert.equal(isConfirmationEnabled({ sender: null, secretClient: createSecretClient(TOKEN), siteUrl: "" }), false); // 메일 미연결
    assert.equal(isConfirmationEnabled({ sender, secretClient: null, siteUrl: "" }), false); // 서버 전용 키 없음
    assert.equal(isConfirmationEnabled({ sender: { ...sender, from: "onboarding@resend.dev" }, secretClient: createSecretClient(TOKEN), siteUrl: "" }), false); // 시험 주소는 방문자 발송 불가
    assert.equal(await sendNotifyConfirmation(value, { sender, secretClient: null, siteUrl: "", send }), "disabled"); // 꺼짐
    assert.equal(calls.length + mails.length, 0); // 꺼져 있으면 아무 요청도 없음
    assert.equal(await sendNotifyConfirmation(value, { sender, secretClient: createSecretClient(TOKEN), siteUrl: "https://devforge.example", send }), "sent"); // 발송
    assert.deepEqual(calls[0], ["rpc", "issue_release_confirmation", { p_project_id: "project-eta", p_email: "player@example.com" }]); // 확인 값 발급
    assert.deepEqual([mails[0][0], mails[0][1].to], [sender, "player@example.com"]); // 신청한 주소로 발송
    assert.match(mails[0][1].subject, /프로젝트 η 출시 알림 신청을 확인해 주세요/); // 게임 이름이 들어간 제목
    assert.ok(mails[0][1].text.includes(`https://devforge.example/notify/confirm?token=${TOKEN}`)); // 확인 주소
    assert.equal(await sendNotifyConfirmation(value, { sender, secretClient: createSecretClient(null), siteUrl: "https://devforge.example", send }), "skipped"); // 이미 확인·최근 발송·하루 한도
    assert.equal(mails.length, 1); // 생략하면 보내지 않음
    const originalError = console.error; // 원래 기록 도구
    const logged = []; // 기록 내용
    console.error = (...parts) => logged.push(parts.join(" ")); // 기록 가로채기
    try // 실패 경우 실행
    { // 시도 시작
        assert.equal(await sendNotifyConfirmation(value, { sender, secretClient: createSecretClient(TOKEN), siteUrl: "https://devforge.example", send: async () => ({ ok: false, reason: "rejected", status: 422 }) }), "failed"); // 발송 실패
        assert.deepEqual(calls.at(-1), ["update", "release_notifications", { confirmation_sent_at: null }, ["project_id", "project-eta", "email", "player@example.com", "confirmed_at", null]]); // 재발송되도록 발송 표시 지움
        assert.equal(await sendNotifyConfirmation(value, { sender, secretClient: { rpc: async () => ({ data: null, error: { message: "x" } }) }, siteUrl: "", send }), "failed"); // 발급 실패
    } // 시도 끝
    finally // 기록 도구 복구
    { // 정리 시작
        console.error = originalError; // 원래 기록 도구로 되돌림
    } // 정리 끝
    assert.deepEqual(logged, ["NOTIFY_CONFIRMATION_FAILED rejected 422", "NOTIFY_CONFIRMATION_FAILED issue 0"]); // 이메일 주소 없이 실패 종류만 기록
}); // 테스트 끝

test("서버 전용 비밀 키는 정해진 항목에서만 읽고 브라우저 코드가 불러오지 않는다", () => // 비밀 키 보호 검사
{ // 테스트 시작
    assert.equal(getSupabaseSecretKey({ SUPABASE_SECRET_KEY: " sb_secret_value " }), "sb_secret_value"); // 새 비밀 키
    assert.equal(getSupabaseSecretKey({ SUPABASE_SECRET_KEY: "aaa.bbb.ccc" }), "aaa.bbb.ccc"); // 이전 방식 토큰
    assert.deepEqual([getSupabaseSecretKey({}), getSupabaseSecretKey({ SUPABASE_SECRET_KEY: "sb_publishable_value" }), getSupabaseSecretKey({ SUPABASE_SECRET_KEY: "plain" }), getSupabaseSecretKey({ NEXT_PUBLIC_SUPABASE_SECRET_KEY: "sb_secret_value" })], [null, null, null, null]); // 빈 값·공개 키·다른 항목 거부
    assert.equal(createSecretSupabaseClient({ SUPABASE_SECRET_KEY: "sb_secret_value" }), null); // 프로젝트 주소 없으면 연결 없음
    assert.equal(typeof createSecretSupabaseClient({ SUPABASE_SECRET_KEY: "sb_secret_value", NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_value" })?.rpc, "function"); // 설정이 있으면 연결 생성
    const sources = fs.readdirSync(".", { recursive: true }).map((file) => String(file).replaceAll("\\", "/")).filter((file) => /^(app|lib)\/.*\.(ts|tsx)$/.test(file)); // 앱·라이브러리 소스
    const importers = sources.filter((file) => /supabase\/secret/.test(read(file))); // 서버 전용 연결을 불러오는 파일
    assert.deepEqual(importers, ["lib/notify/confirmation.ts"]); // 확인 메일 처리에서만 사용
    const clientFiles = sources.filter((file) => /^"use client";/.test(read(file))); // 브라우저 코드
    assert.deepEqual(clientFiles.filter((file) => /notify\/confirmation|supabase\/secret|SUPABASE_SECRET_KEY/.test(read(file))), []); // 브라우저 코드에서 불러오지 않음
    assert.doesNotMatch(read("lib/supabase/secret.ts"), /NEXT_PUBLIC_SUPABASE_SECRET|console\./); // 공개 항목·기록에 쓰지 않음
    assert.match(read(".env.example"), /SUPABASE_SECRET_KEY=/); // 환경 예시 확인
}); // 테스트 끝
