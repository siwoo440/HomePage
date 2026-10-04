import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { CONTACT_CATEGORIES, CONTACT_FIELD_ORDER, getContactCategoryLabel, validateContact } from "../lib/contact/domain.ts"; // 문의 규칙
import { applyContactUpdate, CONTACT_PAGE_SIZE, ContactInboxError, createDemoContactMessages, createLocalContactInbox, createSupabaseContactInbox, parseContactFilter, parseContactUpdate, saveContactMessage } from "../lib/contact/inbox.ts"; // 문의함 도구
import { collectContactForm, CONTACT_FORM_CATEGORIES, CONTACT_FORM_FIELDS, formatContactCount, validateContactForm } from "../public/contact-form.mjs"; // 화면 문의 양식

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구
const VALID = { category: "game", email: "player@example.com", subject: "출시 일정 문의", message: "체험판이 언제 공개되는지 궁금합니다.", consent: true, website: "" }; // 정상 입력

test("문의 입력은 분류·이메일·제목·내용·동의를 검증하고 값을 정리한다", () => // 서버 검증 검사
{ // 테스트 시작
    const ok = validateContact({ ...VALID, email: "  player@example.com ", subject: "  출시   일정  문의 ", message: "첫 줄입니다.\r\n둘째 줄입니다." }); // 정상 검증
    assert.deepEqual(ok, { ok: true, spam: false, value: { category: "game", email: "player@example.com", subject: "출시 일정 문의", message: "첫 줄입니다.\n둘째 줄입니다." } }); // 정리된 값 확인
    const empty = validateContact({}); // 빈 입력 검증
    assert.deepEqual(Object.keys(empty.errors), [...CONTACT_FIELD_ORDER]); // 모든 입력 오류 확인
    assert.equal(validateContact({ ...VALID, email: "no-at-sign" }).errors.email, "이메일 형식을 확인해 주세요."); // 이메일 형식 확인
    assert.equal(validateContact({ ...VALID, subject: "가" }).errors.subject, "제목을 2자 이상 입력해 주세요."); // 짧은 제목 확인
    assert.equal(validateContact({ ...VALID, subject: "가".repeat(101) }).errors.subject, "제목은 100자 이하로 입력해 주세요."); // 긴 제목 확인
    assert.equal(validateContact({ ...VALID, message: "짧음" }).errors.message, "문의 내용을 10자 이상 입력해 주세요."); // 짧은 내용 확인
    assert.equal(validateContact({ ...VALID, message: "가".repeat(2001) }).errors.message, "문의 내용은 2,000자 이하로 입력해 주세요."); // 긴 내용 확인
    assert.equal(validateContact({ ...VALID, message: "😀".repeat(2000) }).ok, true); // 이모지 글자 수 확인
    assert.equal(validateContact({ ...VALID, consent: "true" }).errors.consent, "개인정보 수집·이용에 동의해 주세요."); // 동의 형식 확인
    assert.equal(validateContact({ ...VALID, category: "hack" }).errors.category, "문의 분류를 선택해 주세요."); // 없는 분류 확인
    assert.equal(validateContact({ ...VALID, website: "http://spam.example" }).spam, true); // 숨김 칸 입력 표시 확인
    assert.equal(getContactCategoryLabel("goods"), "굿즈"); // 분류 이름 확인
    assert.equal(getContactCategoryLabel("unknown"), "기타"); // 없는 분류 이름 확인
}); // 테스트 끝

test("화면 검증은 서버 검증과 같은 분류·순서·오류 문구를 쓴다", () => // 화면·서버 일치 검사
{ // 테스트 시작
    assert.deepEqual([...CONTACT_FORM_FIELDS], [...CONTACT_FIELD_ORDER]); // 입력 순서 일치 확인
    assert.deepEqual([...CONTACT_FORM_CATEGORIES], CONTACT_CATEGORIES.map((category) => category.value)); // 분류 일치 확인
    const cases = [{}, { ...VALID, email: "bad" }, { ...VALID, subject: "가" }, { ...VALID, subject: "가".repeat(101) }, { ...VALID, message: "짧음" }, { ...VALID, message: "가".repeat(2001) }, { ...VALID, consent: false }, { ...VALID, category: "" }, VALID]; // 비교할 입력
    for (const input of cases) // 입력 반복
    { // 반복 시작
        const payload = { category: "", email: "", subject: "", message: "", consent: false, website: "", ...input }; // 화면 입력 형식
        const server = validateContact(payload); // 서버 검증
        assert.deepEqual(validateContactForm(payload), server.ok ? {} : server.errors); // 같은 오류 확인
    } // 반복 끝
    const html = read("public/contact.html"); // 문의하기 문서
    for (const category of CONTACT_CATEGORIES) // 분류 반복
    { // 반복 시작
        assert.match(html, new RegExp(`<option value="${category.value}">${category.label}</option>`)); // 선택 항목 일치 확인
    } // 반복 끝
    for (const field of CONTACT_FIELD_ORDER) // 입력 반복
    { // 반복 시작
        assert.match(html, new RegExp(`name="${field}"`), field); // 입력 이름 확인
        assert.match(html, new RegExp(`data-field-error="${field}" role="alert" hidden`), field); // 오류 문구 자리 확인
    } // 반복 끝
    assert.match(html, /<div class="contact-trap" aria-hidden="true">[\s\S]*?name="website" type="text" tabindex="-1" autocomplete="off"/); // 숨김 칸 확인
    assert.match(html, /<form class="contact-form" id="contact-form-fields" data-contact-form novalidate>/); // 양식 연결 확인
    assert.match(html, /data-form-status tabindex="-1" hidden/); // 결과 안내 자리 확인
    assert.match(html, /src="\/contact-form\.mjs"/); // 양식 스크립트 연결 확인
    const elements = { category: { value: "game" }, email: { value: "a@b.co" }, subject: { value: "제목" }, message: { value: "내용" }, consent: { checked: true }, website: { value: "" } }; // 양식 요소 대체
    assert.deepEqual(collectContactForm({ elements: { namedItem: (name) => elements[name] } }), { category: "game", email: "a@b.co", subject: "제목", message: "내용", consent: true, website: "" }); // 값 모으기 확인
    assert.equal(formatContactCount("안녕😀"), "3 / 2,000"); // 글자 수 표시 확인
}); // 테스트 끝

test("문의 접수 API는 횟수 제한·본문 확인·검증 뒤 저장하고 시연 모드와 자동 입력은 저장하지 않는다", () => // 접수 경로 계약 검사
{ // 테스트 시작
    const route = read("app/api/contact/route.ts"); // 접수 경로
    const order = ["limiter.check(getClientKey(request))", "readJsonBody(request, CONTACT_BODY_MAX_BYTES)", "validateContact(body.value)", "if (checked.spam)", "if (!isSupabaseConfigured())", "saveContactMessage(await createServerSupabaseClient(), checked.value)"]; // 처리 순서
    const positions = order.map((step) => route.indexOf(step)); // 단계 위치
    assert.ok(positions.every((position) => position >= 0), "처리 단계 누락"); // 단계 존재 확인
    assert.deepEqual(positions, [...positions].sort((left, right) => left - right)); // 순서 확인
    assert.match(route, /createRateLimiter\(\{ limit: 5, windowMs: 10 \* 60_000 \}\)/); // 10분 5회 제한 확인
    assert.match(route, /errors: checked\.errors \}, 400\)/); // 입력 오류 응답 확인
    assert.match(route, /demo: true/); // 시연 표시 확인
    assert.match(route, /\}, 503\)/); // 저장 실패 응답 확인
}); // 테스트 끝

function createClient({ rows = [], count = 0, updated = null, error = null } = {}) // 시험 Supabase 연결
{ // 함수 시작
    const calls = []; // 호출 기록
    const from = (table) => // 테이블 요청
    { // 요청 시작
        const chain = { table, filters: [] }; // 요청 기록
        const builder = // 요청 도구
        { // 도구 시작
            insert: (values) => { calls.push(["insert", table, values]); return Promise.resolve({ error }); }, // 추가
            select: (columns, options) => { chain.columns = columns; chain.options = options; return builder; }, // 열 선택
            update: (values) => { chain.update = values; return builder; }, // 수정
            eq: (column, value) => { chain.filters.push([column, value]); return builder; }, // 조건
            order: (column, options) => { chain.order = [column, options]; return builder; }, // 정렬
            range: (start, end) => { chain.range = [start, end]; calls.push(["list", chain]); return Promise.resolve({ data: rows, count, error }); }, // 범위 조회
            maybeSingle: () => { calls.push(["update", chain]); return Promise.resolve({ data: updated, error }); }, // 단일 결과
        }; // 도구 끝
        return builder; // 도구 반환
    }; // 요청 끝
    return { client: { from }, calls }; // 시험 도구 반환
} // 함수 끝

const ROW = { id: "m1", category: "goods", email: "fan@example.com", subject: "재입고", message: "언제 다시 살 수 있나요?", status: "pending", admin_note: null, created_at: "2026-10-04T00:00:00.000Z", handled_at: null }; // 시험 문의 행

test("문의 저장은 방문자가 쓴 네 항목만 추가하고 실패하면 안내 오류를 낸다", async () => // 저장 검사
{ // 테스트 시작
    const ok = createClient(); // 성공 연결
    await saveContactMessage(ok.client, { category: "game", email: "a@b.co", subject: "제목", message: "내용입니다. 열 글자." }); // 저장
    assert.deepEqual(ok.calls[0], ["insert", "contact_messages", { category: "game", email: "a@b.co", subject: "제목", message: "내용입니다. 열 글자." }]); // 추가 항목 확인
    await assert.rejects(saveContactMessage(createClient({ error: { message: "boom" } }).client, { category: "game", email: "a@b.co", subject: "제목", message: "내용" }), ContactInboxError); // 실패 오류 확인
}); // 테스트 끝

test("Supabase 문의함은 상태별 최신순으로 읽고 처리 상태·메모·처리자를 기록한다", async () => // 문의함 조회·처리 검사
{ // 테스트 시작
    const listing = createClient({ rows: [ROW], count: 41 }); // 목록 연결
    const page = await createSupabaseContactInbox({ client: listing.client }).list("pending", 2); // 2쪽 조회
    const chain = listing.calls[0][1]; // 조회 기록
    assert.deepEqual([chain.table, chain.options, chain.filters, chain.order, chain.range], ["contact_messages", { count: "exact" }, [["status", "pending"]], ["created_at", { ascending: false }], [CONTACT_PAGE_SIZE, CONTACT_PAGE_SIZE * 2 - 1]]); // 조회 조건 확인
    assert.deepEqual([page.total, page.items[0].adminNote, page.items[0].status], [41, "", "pending"]); // 화면 형식 확인
    const all = createClient({ rows: [] }); // 전체 목록 연결
    await createSupabaseContactInbox({ client: all.client }).list("all", 1); // 전체 조회
    assert.deepEqual(all.calls[0][1].filters, []); // 전체는 상태 조건 없음 확인
    const answering = createClient({ updated: { ...ROW, status: "answered", admin_note: "메일로 답변", handled_at: "2026-10-04T01:00:00.000Z" } }); // 처리 연결
    const item = await createSupabaseContactInbox({ client: answering.client, now: () => "2026-10-04T01:00:00.000Z" }).update({ id: "m1", status: "answered", note: "메일로 답변" }, "admin-1"); // 답변 완료 처리
    assert.deepEqual(answering.calls[0][1].update, { status: "answered", handled_at: "2026-10-04T01:00:00.000Z", handled_by: "admin-1", admin_note: "메일로 답변" }); // 기록 값 확인
    assert.deepEqual([item.status, item.adminNote], ["answered", "메일로 답변"]); // 처리 결과 확인
    const reopening = createClient({ updated: ROW }); // 되돌리기 연결
    await createSupabaseContactInbox({ client: reopening.client }).update({ id: "m1", status: "pending", note: "" }, "admin-1"); // 대기로 되돌리기
    assert.deepEqual(reopening.calls[0][1].update, { status: "pending", handled_at: null, handled_by: null }); // 메모 유지·처리 기록 비움 확인
    await assert.rejects(createSupabaseContactInbox({ client: createClient({ updated: null }).client }).update({ id: "x", status: "answered", note: "" }, "admin-1"), (error) => error.code === "NOT_FOUND"); // 없는 문의 확인
}); // 테스트 끝

test("처리 입력과 목록 종류를 검증하고 데모 문의함은 메모리에서만 바꾼다", async () => // 입력·데모 검사
{ // 테스트 시작
    assert.equal(parseContactFilter("answered"), "answered"); // 허용 종류 확인
    assert.equal(parseContactFilter("hack"), "pending"); // 기본 종류 확인
    assert.deepEqual(parseContactUpdate({ id: " m1 ", status: "answered", note: " 메모 " }), { id: "m1", status: "answered", note: "메모" }); // 입력 정리 확인
    assert.throws(() => parseContactUpdate({ id: "m1", status: "deleted", note: "" }), ContactInboxError); // 없는 상태 거부 확인
    assert.throws(() => parseContactUpdate({ id: "m1", status: "answered", note: "가".repeat(1001) }), ContactInboxError); // 긴 메모 거부 확인
    const base = createDemoContactMessages()[0]; // 시연 문의
    assert.deepEqual(applyContactUpdate(base, { id: base.id, status: "answered", note: "" }, "T1").handledAt, "T1"); // 처리 시각 기록 확인
    assert.equal(applyContactUpdate({ ...base, adminNote: "이전" }, { id: base.id, status: "pending", note: "" }, "T1").adminNote, "이전"); // 빈 메모는 기존 유지 확인
    const seed = createDemoContactMessages(); // 원본 시연 목록
    const inbox = createLocalContactInbox(seed, () => "2026-10-04T02:00:00.000Z"); // 메모리 문의함
    const pending = await inbox.list("pending", 1); // 대기 목록
    assert.deepEqual(pending.items.map((item) => item.id), ["demo-contact-1", "demo-contact-3"]); // 최신순 확인
    await inbox.update({ id: "demo-contact-1", status: "answered", note: "확인" }, "demo-admin"); // 처리
    assert.equal((await inbox.list("pending", 1)).total, 1); // 대기 수 감소 확인
    assert.equal((await inbox.list("answered", 1)).total, 2); // 완료 수 증가 확인
    assert.equal(seed[0].status, "pending"); // 원본 미변경 확인
    await assert.rejects(inbox.update({ id: "none", status: "answered", note: "" }, "demo-admin"), (error) => error.code === "NOT_FOUND"); // 없는 문의 확인
}); // 테스트 끝

test("문의 테이블은 누구나 대기 문의만 추가하고 관리자만 읽고 처리한다", () => // 데이터베이스 권한 검사
{ // 테스트 시작
    const sql = read("supabase/migrations/202610040001_contact_messages.sql"); // 문의 마이그레이션
    assert.match(sql, /alter table public\.contact_messages enable row level security/); // 행 단위 보안 확인
    assert.match(sql, /revoke all on public\.contact_messages from anon, authenticated/); // 기본 권한 회수 확인
    assert.match(sql, /grant insert \(category, email, subject, message\) on public\.contact_messages to anon, authenticated/); // 방문자 추가 열 제한 확인
    assert.doesNotMatch(sql, /grant select[^;]*to anon/); // 방문자 조회 금지 확인
    assert.match(sql, /for insert to anon, authenticated with check \(status = 'pending' and admin_note is null and handled_at is null and handled_by is null\)/); // 대기 문의만 추가 확인
    assert.match(sql, /for select to authenticated using \(\(select public\.is_admin\(\)\)\)/); // 관리자 조회 확인
    assert.match(sql, /for update to authenticated using \(\(select public\.is_admin\(\)\)\) with check \(\(select public\.is_admin\(\)\)\)/); // 관리자 처리 확인
    assert.match(sql, /char_length\(message\) between 10 and 2000/); // 내용 길이 제한 일치 확인
    assert.match(sql, /char_length\(subject\) between 2 and 100/); // 제목 길이 제한 일치 확인
}); // 테스트 끝

test("관리자 문의함은 관리자 확인 뒤 목록·처리를 연결하고 데모와 개인정보 안내를 제공한다", () => // 관리 화면 계약 검사
{ // 테스트 시작
    const page = read("app/admin/contact/page.tsx"); // 문의함 화면
    const actions = read("app/admin/contact/actions.ts"); // 문의 처리
    assert.match(page, /await requireAdmin\("\/admin\/contact"\)/); // 화면 관리자 확인
    assert.match(page, /<InboxBoard key=\{`\$\{filter\}-\$\{page\}`\} initialItems=\{result\.items\} filter=\{filter\} onUpdate=\{updateContactMessage\} \/>/); // 처리 연결 확인
    assert.match(page, /params=\{\{ filter \}\}/); // 목록 종류 유지 확인
    assert.match(actions, /^"use server";/); // 서버 액션 확인
    assert.match(actions, /const admin = await requireAdmin\("\/admin\/contact"\)/); // 처리 관리자 확인
    assert.match(actions, /parseContactUpdate\(input\)/); // 처리 입력 검증 확인
    assert.match(actions, /\.update\(parsed, admin\.id\)/); // 처리자 기록 확인
    assert.match(read("app/admin/news/admin-header.tsx"), /href="\/admin\/contact">문의함</); // 관리자 메뉴 확인
    assert.match(read("app/admin/demo/page.tsx"), /form === "contact" \? <DemoContact \/>/); // 데모 화면 확인
    assert.match(read("app/admin/demo/demo-contact.tsx"), /createLocalContactInbox\(createDemoContactMessages\(\)\)/); // 메모리 처리 확인
    assert.match(read("public/privacy.html"), /문의 양식을 보내면 문의 분류, 답변 받을 이메일, 제목과 내용을 문의 답변 목적으로 처리합니다/); // 개인정보 안내 확인
}); // 테스트 끝
