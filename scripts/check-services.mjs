import fs from "node:fs"; // 파일 시스템 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 모듈 주소 변환 도구
import { canMailVisitors, getMailSender, isEmailAddress, parseMailFrom, RESEND_TEST_DOMAIN } from "../lib/mail/config.ts"; // 메일 설정 규칙
import { checkSupabaseEnvironment, classifySupabaseKey, parseEnvText } from "./check-supabase-env.mjs"; // Supabase 점검과 환경 파일 해석

const ICONS = { connected: "✓", off: "–", error: "✗" }; // 상태 표시 기호
const STATUS_LABELS = { connected: "연결됨", off: "아직 연결 전", error: "고칠 곳 있음" }; // 상태 이름
const SUPABASE_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "ADMIN_EMAIL"]; // Supabase 설정 항목
const PERSONAL_MAIL_DOMAINS = ["gmail.com", "googlemail.com", "naver.com", "daum.net", "hanmail.net", "kakao.com", "nate.com", "outlook.com", "hotmail.com", "live.com", "yahoo.com", "icloud.com", "proton.me", "protonmail.com"]; // 보내는 주소로 쓸 수 없는 개인 메일 도메인

function read(env, name) // 환경 값 읽기
{ // 함수 시작
    return String(env[name] ?? "").trim(); // 정리한 값 반환
} // 함수 끝

function checkSupabase(env) // Supabase 연결 점검
{ // 함수 시작
    const base = { id: "supabase", title: "Supabase (회원·댓글·뉴스·상품·문의·출시 알림 저장)", guide: "README 1~4단계" }; // 공통 정보
    if (SUPABASE_NAMES.every((name) => !read(env, name))) // 세 값이 모두 빈 경우
    { // 조건 시작
        return { ...base, status: "off", notes: ["시연 모드로 동작합니다. 가입 후 .env.local에 프로젝트 주소·공개 키·관리자 이메일을 넣어 주세요."] }; // 연결 전 결과
    } // 조건 끝
    const report = checkSupabaseEnvironment(env); // 형식 점검
    const problems = report.results.filter((result) => result.level !== "ok").map((result) => `${result.name}: ${result.message}`); // 고칠 항목
    return report.ok ? { ...base, status: "connected", notes: ["설정 형식이 올바릅니다. 데이터베이스 파일 적용과 관리자 지정은 pnpm supabase:check 안내를 따릅니다.", ...problems] } : { ...base, status: "error", notes: problems }; // 점검 결과
} // 함수 끝

function checkMail(env) // 메일 발송 점검
{ // 함수 시작
    const base = { id: "mail", title: "메일 발송 (Resend · 문의 접수 알림)", guide: "README \"메일 발송 연결\"" }; // 공통 정보
    const key = read(env, "RESEND_API_KEY"); // API 키
    const from = read(env, "MAIL_FROM"); // 보내는 주소
    const notifyTo = read(env, "CONTACT_NOTIFY_EMAIL"); // 알림 받을 주소
    if (!key && !from && !notifyTo) // 세 값이 모두 빈 경우
    { // 조건 시작
        return { ...base, status: "off", notes: ["메일을 보내지 않습니다. 문의는 관리자 문의함에서만 확인합니다."] }; // 연결 전 결과
    } // 조건 끝
    const problems = []; // 고칠 항목
    const parsedFrom = parseMailFrom(from); // 보내는 주소 해석
    if (!key) // 키 누락 확인
    { // 조건 시작
        problems.push("RESEND_API_KEY: 비어 있습니다. Resend의 API Keys에서 만든 키(re_…)를 넣어 주세요."); // 키 누락 안내
    } // 조건 끝
    else if (!key.startsWith("re_")) // 키 형식 확인
    { // 조건 시작
        problems.push("RESEND_API_KEY: Resend 키는 re_ 로 시작합니다. 다른 값을 넣지 않았는지 확인해 주세요."); // 키 형식 안내
    } // 조건 끝
    if (!parsedFrom) // 보내는 주소 확인
    { // 조건 시작
        problems.push("MAIL_FROM: 보내는 주소 형식이 올바르지 않습니다. 예: Palettra Games <noreply@내도메인> (도메인이 없으면 onboarding@resend.dev)"); // 보내는 주소 안내
    } // 조건 끝
    else if (PERSONAL_MAIL_DOMAINS.includes(parsedFrom.address.toLowerCase().split("@").pop())) // 개인 메일 주소 확인
    { // 조건 시작
        problems.push("MAIL_FROM: Gmail·네이버 같은 개인 메일 주소로는 보낼 수 없습니다(Resend가 거부). 도메인이 없으면 onboarding@resend.dev 를 넣고, 본인 메일 주소는 CONTACT_NOTIFY_EMAIL에만 넣어 주세요."); // 개인 메일 안내
    } // 조건 끝
    if (!isEmailAddress(notifyTo)) // 알림 주소 확인
    { // 조건 시작
        problems.push("CONTACT_NOTIFY_EMAIL: 문의 알림을 받을 이메일 한 개를 넣어 주세요."); // 알림 주소 안내
    } // 조건 끝
    if (problems.length > 0) // 고칠 항목 확인
    { // 조건 시작
        return { ...base, status: "error", notes: problems }; // 오류 결과
    } // 조건 끝
    const testing = parsedFrom.address.toLowerCase().endsWith(`@${RESEND_TEST_DOMAIN}`); // 도메인 없는 시험 주소 여부
    return { ...base, status: "connected", notes: [testing ? "도메인 없이 시험하는 보내는 주소입니다. Resend에 가입한 본인 이메일로만 보낼 수 있으므로 CONTACT_NOTIFY_EMAIL도 그 이메일이어야 합니다." : "문의가 저장되면 운영자 메일로 접수 알림을 보냅니다."] }; // 연결 결과
} // 함수 끝

function checkNotifyConfirmation(env) // 출시 알림 확인 메일 점검
{ // 함수 시작
    const base = { id: "notify-confirm", title: "출시 알림 확인 메일 (본인 신청 확인)", guide: "README \"출시 알림 확인 메일 연결\"" }; // 공통 정보
    const secret = read(env, "SUPABASE_SECRET_KEY"); // 서버 전용 비밀 키
    if (!secret) // 비밀 키 누락 확인
    { // 조건 시작
        return { ...base, status: "off", notes: ["신청만 받아 두고 확인 메일은 보내지 않습니다. 인증한 도메인의 보내는 주소와 SUPABASE_SECRET_KEY가 있어야 보냅니다."] }; // 연결 전 결과
    } // 조건 끝
    if (!["secret", "service-role-jwt"].includes(classifySupabaseKey(secret))) // 비밀 키 종류 확인
    { // 조건 시작
        return { ...base, status: "error", notes: ["SUPABASE_SECRET_KEY: Supabase 비밀 키(sb_secret_…)가 아닙니다. 공개 키를 넣지 않았는지 확인해 주세요."] }; // 종류 오류 결과
    } // 조건 끝
    const sender = getMailSender(env); // 메일 보내는 쪽 설정
    const waiting = []; // 아직 필요한 것
    if (!read(env, "NEXT_PUBLIC_SUPABASE_URL") || !read(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")) // Supabase 연결 확인
    { // 조건 시작
        waiting.push("Supabase 연결"); // Supabase 필요
    } // 조건 끝
    if (!sender) // 메일 연결 확인
    { // 조건 시작
        waiting.push("메일 발송 연결(RESEND_API_KEY·MAIL_FROM)"); // 메일 필요
    } // 조건 끝
    else if (!canMailVisitors(sender)) // 방문자 발송 가능 확인
    { // 조건 시작
        waiting.push("인증한 도메인의 보내는 주소(지금은 본인에게만 보낼 수 있는 시험 주소)"); // 도메인 필요
    } // 조건 끝
    return waiting.length > 0 ? { ...base, status: "off", notes: [`비밀 키는 준비되었습니다. 아직 필요한 것: ${waiting.join(", ")}`] } : { ...base, status: "connected", notes: ["신청이 저장되면 확인 메일을 보냅니다(같은 이메일로 하루 3통까지)."] }; // 점검 결과
} // 함수 끝

function checkYouTube(env) // YouTube 연결 점검
{ // 함수 시작
    const base = { id: "youtube", title: "YouTube Data API (커뮤니티 영상 목록)", guide: "README \"무료 서비스부터 연결하는 순서\" 4번" }; // 공통 정보
    const key = read(env, "YOUTUBE_API_KEY"); // API 키
    if (!key) // 키 누락 확인
    { // 조건 시작
        return { ...base, status: "off", notes: ["커뮤니티의 YouTube 영역은 준비 안내만 보여 줍니다."] }; // 연결 전 결과
    } // 조건 끝
    return /^AIza[\w-]{30,}$/.test(key) ? { ...base, status: "connected", notes: ["API 키 형식이 올바릅니다."] } : { ...base, status: "error", notes: ["YOUTUBE_API_KEY: Google API 키는 AIza 로 시작합니다. Google Cloud의 사용자 인증 정보에서 만든 API 키인지 확인해 주세요."] }; // 점검 결과
} // 함수 끝

export function readMeasurementId(source) // 분석 설정 파일에서 측정 ID 읽기
{ // 함수 시작
    return /export const GA_MEASUREMENT_ID = "([^"]*)"/.exec(String(source ?? ""))?.[1] ?? ""; // 측정 ID 반환
} // 함수 끝

function checkAnalytics(measurementId) // GA4 연결 점검
{ // 함수 시작
    const base = { id: "analytics", title: "Google Analytics 4 (방문 분석)", guide: "README \"개인정보 동의와 GA4 설정\"" }; // 공통 정보
    if (!measurementId) // 측정 ID 누락 확인
    { // 조건 시작
        return { ...base, status: "off", notes: ["분석 요청을 보내지 않습니다. public/analytics-config.mjs에 G- 측정 ID를 넣으면 동의한 방문자만 분석합니다."] }; // 연결 전 결과
    } // 조건 끝
    return /^G-[A-Z0-9]{6,}$/.test(measurementId) ? { ...base, status: "connected", notes: ["측정 ID 형식이 올바릅니다."] } : { ...base, status: "error", notes: ["GA_MEASUREMENT_ID: GA4 측정 ID는 G- 로 시작하는 대문자·숫자입니다."] }; // 점검 결과
} // 함수 끝

function findExposedSecrets(env) // 브라우저 공개 항목에 들어간 비밀 값 찾기
{ // 함수 시작
    return Object.entries(env).filter(([name, value]) => name.startsWith("NEXT_PUBLIC_") && /^(re_|AIza)/.test(String(value ?? "").trim())).map(([name]) => `${name}: 브라우저에 공개되는 NEXT_PUBLIC_ 항목에 서버 전용 키가 들어 있습니다. 즉시 지우고 해당 서비스에서 키를 새로 발급해 주세요.`); // 노출 안내 반환
} // 함수 끝

export function checkServices(env, analyticsSource = "") // 외부 서비스 연결 점검
{ // 함수 시작
    const services = [checkSupabase(env), checkMail(env), checkNotifyConfirmation(env), checkYouTube(env), checkAnalytics(readMeasurementId(analyticsSource))]; // 연결 권장 순서대로 점검
    const exposed = findExposedSecrets(env); // 공개 항목의 비밀 값
    const next = services.find((service) => service.status === "error") ?? services.find((service) => service.status === "off" && service.id !== "notify-confirm") ?? services.find((service) => service.status === "off") ?? null; // 다음에 할 일(도메인이 필요한 확인 메일은 맨 뒤)
    return { ok: exposed.length === 0 && services.every((service) => service.status !== "error"), services, exposed, next }; // 점검 결과 반환
} // 함수 끝

export function formatServicesReport(report) // 점검 결과 문구 생성
{ // 함수 시작
    const lines = ["외부 서비스 연결 점검 (값은 화면에 표시하지 않습니다)", ""]; // 결과 문구 목록
    for (const service of report.services) // 서비스 반환
    { // 반복 시작
        lines.push(`${ICONS[service.status]} ${service.title} — ${STATUS_LABELS[service.status]}`); // 서비스 상태 줄
        service.notes.forEach((note) => lines.push(`    ${note}`)); // 상세 안내 줄
        lines.push(`    안내: ${service.guide}`); // 안내 위치 줄
    } // 반복 끝
    report.exposed.forEach((note) => lines.push(`${ICONS.error} ${note}`)); // 비밀 값 노출 줄
    lines.push(""); // 구분 줄
    const connected = report.services.filter((service) => service.status === "connected").length; // 연결된 서비스 수
    lines.push(`연결됨 ${connected}개 · 전체 ${report.services.length}개`); // 요약 줄
    lines.push(!report.ok ? "✗ 표시 항목을 고친 뒤 다시 실행해 주세요: pnpm services:check" : report.next ? `다음에 연결할 것: ${report.next.title} (${report.next.guide})` : "점검하는 서비스를 모두 연결했습니다."); // 다음 안내 줄
    lines.push("간편 로그인은 Supabase의 Authentication → Providers에서 켜며, 이 명령으로는 확인할 수 없습니다."); // 간편 로그인 안내 줄
    return lines.join("\n"); // 결과 문구 반환
} // 함수 끝

export function runServicesCheck(cwd = process.cwd(), output = console.log) // 명령 실행
{ // 함수 시작
    const envPath = path.join(cwd, ".env.local"); // 환경 파일 경로
    const analyticsPath = path.join(cwd, "public", "analytics-config.mjs"); // 분석 설정 파일 경로
    const env = fs.existsSync(envPath) ? parseEnvText(fs.readFileSync(envPath, "utf8")) : {}; // 환경 값(파일이 없으면 모두 연결 전)
    const report = checkServices(env, fs.existsSync(analyticsPath) ? fs.readFileSync(analyticsPath, "utf8") : ""); // 연결 점검
    if (!fs.existsSync(envPath)) // 환경 파일 확인
    { // 조건 시작
        output(".env.local 파일이 아직 없습니다. .env.example을 복사해 .env.local을 만든 뒤 가입한 서비스의 값을 넣어 주세요.\n"); // 파일 없음 안내
    } // 조건 끝
    output(formatServicesReport(report)); // 결과 출력
    return report.ok ? 0 : 1; // 결과 코드 반환
} // 함수 끝

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) // 직접 실행 확인
{ // 조건 시작
    process.exitCode = runServicesCheck(); // 점검 실행
} // 조건 끝
