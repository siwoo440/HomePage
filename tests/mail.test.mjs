import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 읽기 도구
import test from "node:test"; // 테스트 실행 도구
import { canMailVisitors, getMailConfig, getMailSender, isEmailAddress, parseMailFrom } from "../lib/mail/config.ts"; // 메일 설정 규칙
import { cleanMailSubject, MAIL_SUBJECT_MAX_LENGTH, RESEND_API_URL, sendMail } from "../lib/mail/sender.ts"; // 메일 발송 도구
import { buildContactNotice, buildNotifyConfirmation } from "../lib/mail/templates.ts"; // 메일 양식

const read = (file) => fs.readFileSync(file, "utf8"); // 원본 읽기 도구
const CONFIG = { apiKey: "re_test_value", from: "Palettra Games <onboarding@resend.dev>", notifyTo: "owner@example.com" }; // 시험 설정
const CONTACT = { category: "game", email: "player@example.com", subject: "출시 일정 문의", message: "첫 줄\n둘째 줄" }; // 시험 문의

test("메일 설정은 세 값이 모두 올바를 때만 켜진다", () => // 설정 판정 검사
{ // 테스트 시작
    assert.deepEqual(getMailConfig({ RESEND_API_KEY: " re_abc ", MAIL_FROM: " Palettra Games <noreply@example.com> ", CONTACT_NOTIFY_EMAIL: " owner@example.com " }), { apiKey: "re_abc", from: "Palettra Games <noreply@example.com>", notifyTo: "owner@example.com" }); // 정상 설정
    assert.equal(getMailConfig({}), null); // 빈 설정은 발송 안 함
    assert.equal(getMailConfig({ RESEND_API_KEY: "re_abc", MAIL_FROM: "noreply@example.com" }), null); // 알림 주소 누락
    assert.equal(getMailConfig({ RESEND_API_KEY: "re_abc", MAIL_FROM: "잘못된 주소", CONTACT_NOTIFY_EMAIL: "owner@example.com" }), null); // 보내는 주소 오류
    assert.equal(getMailConfig({ MAIL_FROM: "noreply@example.com", CONTACT_NOTIFY_EMAIL: "owner@example.com" }), null); // 키 누락
    assert.deepEqual(getMailSender({ RESEND_API_KEY: "re_abc", MAIL_FROM: "noreply@example.com" }), { apiKey: "re_abc", from: "noreply@example.com" }); // 운영자 주소 없이도 보내는 쪽 설정은 가능
    assert.equal(getMailSender({ RESEND_API_KEY: "re_abc" }), null); // 보내는 주소 누락
    assert.deepEqual([canMailVisitors({ apiKey: "re_abc", from: "Palettra Games <noreply@devforge.example>" }), canMailVisitors({ apiKey: "re_abc", from: "Test <onboarding@Resend.dev>" })], [true, false]); // 시험 주소는 방문자에게 보낼 수 없음
    assert.deepEqual(parseMailFrom("Palettra Games <noreply@example.com>"), { name: "Palettra Games", address: "noreply@example.com" }); // 이름 있는 주소
    assert.deepEqual(parseMailFrom("noreply@example.com"), { name: "", address: "noreply@example.com" }); // 주소만
    assert.equal(parseMailFrom("이름 <a@b.co>\r\nBcc: x@y.co"), null); // 줄바꿈으로 머리말 끼워 넣기 거부
    assert.deepEqual([isEmailAddress("a@b.co"), isEmailAddress("a@b.co, c@d.co"), isEmailAddress("a@b"), isEmailAddress(null)], [true, false, false, false]); // 이메일 한 개만 허용
}); // 테스트 끝

test("메일 발송은 Resend에 글자 본문으로 보내고 실패 종류를 구분한다", async () => // 발송 검사
{ // 테스트 시작
    const calls = []; // 요청 기록
    const okFetch = async (url, init) => { calls.push([url, init]); return new Response(JSON.stringify({ id: "mail-1" }), { status: 200 }); }; // 성공 응답
    const result = await sendMail(CONFIG, { to: "owner@example.com", subject: "제목\r\nBcc: x@y.co", text: "본문", replyTo: "player@example.com" }, { fetchImpl: okFetch }); // 발송
    assert.deepEqual(result, { ok: true, id: "mail-1" }); // 성공 결과
    assert.equal(calls[0][0], RESEND_API_URL); // 발송 주소
    assert.equal(calls[0][1].headers.Authorization, "Bearer re_test_value"); // 서버 키 인증
    assert.deepEqual(JSON.parse(calls[0][1].body), { from: CONFIG.from, to: ["owner@example.com"], subject: "제목 Bcc: x@y.co", text: "본문", reply_to: "player@example.com" }); // 줄바꿈 없는 제목과 글자 본문
    assert.equal("html" in JSON.parse(calls[0][1].body), false); // HTML 본문 미사용
    assert.deepEqual(await sendMail(CONFIG, { to: "owner@example.com", subject: "제목", text: "본문" }, { fetchImpl: async () => new Response("{}", { status: 422 }) }), { ok: false, reason: "rejected", status: 422 }); // 거부 결과
    assert.deepEqual(await sendMail(CONFIG, { to: "owner@example.com", subject: "제목", text: "본문" }, { fetchImpl: async () => { throw new TypeError("fetch failed"); } }), { ok: false, reason: "network", status: 0 }); // 연결 실패 결과
    const slowFetch = (url, init) => new Promise((resolve, reject) => init.signal.addEventListener("abort", () => reject(Object.assign(new Error("aborted"), { name: "AbortError" })))); // 응답 없는 요청
    assert.deepEqual(await sendMail(CONFIG, { to: "owner@example.com", subject: "제목", text: "본문" }, { fetchImpl: slowFetch, timeoutMs: 10 }), { ok: false, reason: "timeout", status: 0 }); // 시간 초과 결과
    const before = calls.length; // 요청 수 기록
    for (const message of [{ to: "잘못된 주소", subject: "제목", text: "본문" }, { to: "owner@example.com", subject: " \n ", text: "본문" }, { to: "owner@example.com", subject: "제목", text: "  " }, { to: "owner@example.com", subject: "제목", text: "본문", replyTo: "a@b.co\nBcc: x@y.co" }]) // 잘못된 메일 반복
    { // 반복 시작
        assert.deepEqual(await sendMail(CONFIG, message, { fetchImpl: okFetch }), { ok: false, reason: "invalid", status: 0 }); // 잘못된 내용 거부
    } // 반복 끝
    assert.equal(calls.length, before); // 잘못된 메일은 요청하지 않음
    assert.equal([...cleanMailSubject("가".repeat(300))].length, MAIL_SUBJECT_MAX_LENGTH); // 제목 길이 제한
}); // 테스트 끝

test("문의 접수 알림은 운영자에게 보내고 답장은 문의한 사람에게 간다", () => // 알림 양식 검사
{ // 테스트 시작
    const notice = buildContactNotice(CONTACT, "owner@example.com", "https://devforge.example"); // 알림 메일
    assert.equal(notice.to, "owner@example.com"); // 운영자 수신
    assert.equal(notice.replyTo, "player@example.com"); // 문의자에게 답장
    assert.equal(notice.subject, "[Palettra Games 문의] 게임·출시 · 출시 일정 문의"); // 분류와 제목
    assert.match(notice.text, /분류: 게임·출시\n이메일: player@example\.com\n제목: 출시 일정 문의\n\n첫 줄\n둘째 줄\n/); // 문의 내용
    assert.match(notice.text, /문의함에서 처리하기: https:\/\/devforge\.example\/admin\/contact/); // 문의함 주소
}); // 테스트 끝

test("출시 알림 확인 메일은 확인 주소와 수신 거부 주소를 담고 신청한 사람에게만 간다", () => // 확인 메일 양식 검사
{ // 테스트 시작
    const token = "123e4567-e89b-42d3-a456-426614174000"; // 시험 확인 값
    const mail = buildNotifyConfirmation({ email: "player@example.com", projectTitle: "프로젝트 η", token }, "https://devforge.example"); // 확인 메일
    assert.deepEqual([mail.to, mail.replyTo, mail.subject], ["player@example.com", undefined, "[Palettra Games] 프로젝트 η 출시 알림 신청을 확인해 주세요"]); // 받는 사람과 제목
    assert.ok(mail.text.includes(`https://devforge.example/notify/confirm?token=${token}`)); // 확인 주소
    assert.ok(mail.text.includes(`https://devforge.example/notify/unsubscribe?token=${token}`)); // 수신 거부 주소
    assert.match(mail.text, /신청하신 적이 없다면 이 메일을 무시하셔도 됩니다/); // 잘못 온 메일 안내
    assert.equal(mail.text.includes("\n"), true); // 줄바꿈 본문 확인
}); // 테스트 끝

test("문의 접수는 저장한 뒤에만 알림을 보내고 알림 실패가 접수를 막지 않는다", () => // 접수 연결 검사
{ // 테스트 시작
    const route = read("app/api/contact/route.ts"); // 문의 접수 처리
    const order = ["if (!isSupabaseConfigured())", "await saveContactMessage(", "const mail = getMailConfig();", "sendMail(mail, buildContactNotice(checked.value, mail.notifyTo, getSiteUrl()))", "}, 201);"].map((step) => route.indexOf(step)); // 단계별 위치
    assert.ok(order.every((position, index) => position > 0 && (index === 0 || position > order[index - 1])), JSON.stringify(order)); // 저장 뒤 알림 순서
    assert.match(route, /console\.error\("CONTACT_NOTICE_FAILED", notice\.reason, notice\.status\);/); // 문의 내용 없이 실패 종류만 기록
    assert.doesNotMatch(read("lib/mail/sender.ts") + read("lib/mail/config.ts"), /NEXT_PUBLIC|console\.log/); // 키를 브라우저 공개 항목이나 기록에 쓰지 않음
    assert.match(read(".env.example"), /RESEND_API_KEY=\r?\n[^\n]*\nMAIL_FROM=\r?\n[^\n]*\nCONTACT_NOTIFY_EMAIL=/); // 환경 예시 확인
}); // 테스트 끝
