import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 도구
import os from "node:os"; // 임시 폴더 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { checkServices, formatServicesReport, readMeasurementId, runServicesCheck } from "../scripts/check-services.mjs"; // 외부 서비스 점검 도구

const SUPABASE = { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_value", ADMIN_EMAIL: "admin@example.com" }; // 정상 Supabase 설정
const MAIL = { RESEND_API_KEY: "re_test_value", MAIL_FROM: "Palettra Games <noreply@devforge.example>", CONTACT_NOTIFY_EMAIL: "owner@example.com" }; // 정상 메일 설정
const YOUTUBE_KEY = `AIza${"a".repeat(35)}`; // 형식이 맞는 시험 키
const statusOf = (report, id) => report.services.find((service) => service.id === id).status; // 서비스 상태 조회

test("아무 값도 없으면 모든 서비스가 연결 전이며 오류가 아니다", () => // 빈 설정 검사
{ // 테스트 시작
    const report = checkServices({}); // 빈 설정 점검
    assert.equal(report.ok, true); // 연결 전은 오류 아님
    assert.deepEqual(report.services.map((service) => [service.id, service.status]), [["supabase", "off"], ["mail", "off"], ["notify-confirm", "off"], ["youtube", "off"], ["analytics", "off"]]); // 연결 권장 순서와 상태
    assert.equal(report.next.id, "supabase"); // 가장 먼저 연결할 서비스
    assert.match(formatServicesReport(report), /연결됨 0개 · 전체 5개\n다음에 연결할 것: Supabase/); // 요약 안내
}); // 테스트 끝

test("값을 넣으면 서비스별로 연결됨과 고칠 곳을 구분한다", () => // 서비스별 점검 검사
{ // 테스트 시작
    const free = checkServices({ ...SUPABASE, ...MAIL, YOUTUBE_API_KEY: YOUTUBE_KEY }, 'export const GA_MEASUREMENT_ID = "G-ABC1234567"; // 측정 ID'); // 무료 서비스만 연결
    assert.deepEqual([free.ok, free.next.id, free.services.map((service) => service.status)], [true, "notify-confirm", ["connected", "connected", "off", "connected", "connected"]]); // 도메인이 필요한 확인 메일만 남음
    const all = checkServices({ ...SUPABASE, ...MAIL, YOUTUBE_API_KEY: YOUTUBE_KEY, SUPABASE_SECRET_KEY: "sb_secret_test_value" }, 'export const GA_MEASUREMENT_ID = "G-ABC1234567"; // 측정 ID'); // 모두 연결
    assert.deepEqual([all.ok, all.next, all.services.map((service) => service.status)], [true, null, ["connected", "connected", "connected", "connected", "connected"]]); // 모두 연결됨
    assert.match(formatServicesReport(all), /점검하는 서비스를 모두 연결했습니다\./); // 완료 안내
    assert.equal(statusOf(checkServices({ SUPABASE_SECRET_KEY: "sb_publishable_wrong" }), "notify-confirm"), "error"); // 비밀 키 자리의 공개 키 오류
    assert.match(checkServices({ ...SUPABASE, ...MAIL, MAIL_FROM: "onboarding@resend.dev", SUPABASE_SECRET_KEY: "sb_secret_test_value" }).services[2].notes[0], /아직 필요한 것: 인증한 도메인의 보내는 주소/); // 시험 주소로는 방문자에게 보낼 수 없음
    assert.match(checkServices({ SUPABASE_SECRET_KEY: "sb_secret_test_value" }).services[2].notes[0], /아직 필요한 것: Supabase 연결, 메일 발송 연결/); // 필요한 연결 안내
    assert.equal(checkServices({ ...MAIL }).next.id, "supabase"); // 확인 메일보다 다른 연결을 먼저 안내
    const partialMail = checkServices({ ...SUPABASE, RESEND_API_KEY: "re_test_value" }); // 메일 일부만 입력
    assert.deepEqual([partialMail.ok, statusOf(partialMail, "mail"), partialMail.next.id], [false, "error", "mail"]); // 고칠 곳 표시
    assert.equal(partialMail.services[1].notes.length, 2); // 빠진 두 항목 안내
    assert.equal(statusOf(checkServices({ ...MAIL, RESEND_API_KEY: "sk_wrong" }), "mail"), "error"); // 다른 서비스 키 구분
    assert.match(checkServices({ ...MAIL, MAIL_FROM: "onboarding@resend.dev" }).services[1].notes[0], /본인 이메일로만 보낼 수 있으므로/); // 도메인 없는 시험 주소 안내
    const personal = checkServices({ ...MAIL, MAIL_FROM: "owner@Gmail.com" }); // 보내는 주소에 개인 메일 입력
    assert.equal(statusOf(personal, "mail"), "error"); // 개인 메일 주소는 발송 불가로 안내
    assert.match(personal.services[1].notes[0], /onboarding@resend\.dev 를 넣고/); // 고치는 방법 안내
    assert.equal(statusOf(checkServices({ ...MAIL, MAIL_FROM: "Palettra Games <owner@naver.com>" }), "mail"), "error"); // 이름을 붙인 개인 메일도 같은 안내
    assert.equal(statusOf(checkServices({ YOUTUBE_API_KEY: "wrong" }), "youtube"), "error"); // YouTube 키 형식 오류
    assert.equal(statusOf(checkServices({}, 'export const GA_MEASUREMENT_ID = "UA-123"; // 옛 형식'), "analytics"), "error"); // 측정 ID 형식 오류
    assert.equal(statusOf(checkServices({ NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co" }), "supabase"), "error"); // Supabase 일부만 입력
    assert.equal(readMeasurementId('export const GA_MEASUREMENT_ID = ""; // 자리'), ""); // 빈 측정 ID 읽기
}); // 테스트 끝

test("서버 전용 키가 브라우저 공개 항목에 있으면 오류로 알리고 값은 출력하지 않는다", () => // 비밀 값 보호 검사
{ // 테스트 시작
    const report = checkServices({ ...MAIL, NEXT_PUBLIC_MAIL_KEY: "re_secret_value_123", NEXT_PUBLIC_YT: YOUTUBE_KEY }); // 공개 항목에 키 입력
    assert.equal(report.ok, false); // 오류 판정
    assert.deepEqual(report.exposed.map((note) => note.split(":")[0]), ["NEXT_PUBLIC_MAIL_KEY", "NEXT_PUBLIC_YT"]); // 노출 항목 이름
    const text = formatServicesReport(checkServices({ ...SUPABASE, ...MAIL, YOUTUBE_API_KEY: YOUTUBE_KEY, NEXT_PUBLIC_MAIL_KEY: "re_secret_value_123" })); // 결과 문구
    assert.equal(formatServicesReport(checkServices({ ...SUPABASE, SUPABASE_SECRET_KEY: "sb_secret_hidden_value" })).includes("sb_secret_hidden_value"), false); // 서버 전용 비밀 키 미출력 확인
    for (const secret of ["re_test_value", "re_secret_value_123", YOUTUBE_KEY, "sb_publishable_test_value", "owner@example.com", "admin@example.com"]) // 값 반복
    { // 반복 시작
        assert.equal(text.includes(secret), false, secret); // 값 미출력 확인
    } // 반복 끝
}); // 테스트 끝

test("명령은 환경 파일이 없어도 안내하고 고칠 곳이 있을 때만 실패 코드를 낸다", () => // 명령 실행 검사
{ // 테스트 시작
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "devforge-services-")); // 임시 폴더
    try // 실행 시도
    { // 시도 시작
        const lines = []; // 출력 기록
        assert.equal(runServicesCheck(directory, (line) => lines.push(line)), 0); // 파일 없음은 성공 코드
        assert.match(lines[0], /\.env\.local 파일이 아직 없습니다/); // 파일 없음 안내
        fs.writeFileSync(path.join(directory, ".env.local"), "RESEND_API_KEY=re_test_value\n"); // 일부만 입력한 파일
        assert.equal(runServicesCheck(directory, () => {}), 1); // 고칠 곳이 있으면 실패 코드
        fs.mkdirSync(path.join(directory, "public")); // 공개 폴더
        fs.writeFileSync(path.join(directory, "public", "analytics-config.mjs"), 'export const GA_MEASUREMENT_ID = "G-ABC1234567"; // 측정 ID\n'); // 분석 설정 파일
        fs.writeFileSync(path.join(directory, ".env.local"), ""); // 빈 환경 파일
        const output = []; // 출력 기록
        assert.equal(runServicesCheck(directory, (line) => output.push(line)), 0); // 성공 코드
        assert.match(output.join("\n"), /✓ Google Analytics 4 \(방문 분석\) — 연결됨/); // 분석 설정 파일 읽기 확인
    } // 시도 끝
    finally // 정리
    { // 정리 시작
        fs.rmSync(directory, { recursive: true, force: true }); // 임시 폴더 삭제
    } // 정리 끝
    assert.match(fs.readFileSync("package.json", "utf8"), /"services:check": "node scripts\/check-services\.mjs"/); // 명령 등록 확인
}); // 테스트 끝

test("실제 측정 ID는 비어 있거나 올바른 형식이고 연결했으면 개인정보처리방침에 전송 대상을 적는다", () => // 분석 연결 기록 검사
{ // 테스트 시작
    const measurementId = readMeasurementId(fs.readFileSync("public/analytics-config.mjs", "utf8")); // 실제 측정 ID
    assert.match(measurementId, /^(G-[A-Z0-9]{6,20})?$/); // 빈 값 또는 GA4 형식
    if (measurementId) // 분석 연결 확인
    { // 조건 시작
        const privacy = fs.readFileSync("public/privacy.html", "utf8"); // 개인정보처리방침 원문
        assert.match(privacy, /분석 저장에 동의한 경우에만 Google Analytics 4\(Google LLC, 미국\)로/); // 전송 대상과 국가 안내
        assert.match(privacy, /언제든 동의를 철회할 수 있습니다/); // 철회 방법 안내
    } // 조건 끝
}); // 테스트 끝
