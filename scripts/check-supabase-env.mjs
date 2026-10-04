import fs from "node:fs"; // 파일 읽기 도구
import path from "node:path"; // 경로 처리 도구
import { fileURLToPath } from "node:url"; // 실행 경로 변환 도구

export const SUPABASE_MIGRATIONS = ["202609100001_admin_news.sql", "202609110001_admin_products.sql", "202609120001_member_comments.sql", "202610010001_member_signup_moderation.sql", "202610010002_member_account_deletion.sql", "202610040001_contact_messages.sql"]; // 적용 순서
const SECRET_KEY_KINDS = new Set(["secret", "service-role-jwt"]); // 비밀 키 종류
const RESULT_ICONS = { ok: "✓", warn: "!", error: "✗" }; // 결과 표시 기호

export function parseEnvText(text) // 환경 파일 내용 해석
{ // 함수 시작
    const values = {}; // 해석 결과

    for (const rawLine of String(text).split(/\r?\n/)) // 줄 반복
    { // 반복 시작
        const line = rawLine.trim(); // 앞뒤 공백 정리
        const separator = line.indexOf("="); // 구분 위치

        if (!line || line.startsWith("#") || separator <= 0) // 빈 줄·주석·잘못된 줄 확인
        { // 조건 시작
            continue; // 줄 건너뛰기
        } // 조건 끝

        const key = line.slice(0, separator).trim().replace(/^export\s+/, ""); // 항목 이름
        let value = line.slice(separator + 1).trim(); // 항목 값

        if (value.length >= 2 && ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))) // 따옴표 감싸기 확인
        { // 조건 시작
            value = value.slice(1, -1); // 따옴표 제거
        } // 조건 끝

        values[key] = value; // 항목 저장
    } // 반복 끝

    return values; // 해석 결과 반환
} // 함수 끝

function decodeJwtPayload(value) // 토큰 내용 해석
{ // 함수 시작
    const parts = value.split("."); // 토큰 구간 분리

    if (parts.length !== 3) // 토큰 형식 확인
    { // 조건 시작
        return null; // 토큰 아님 반환
    } // 조건 끝

    try // 내용 해석 시도
    { // 시도 시작
        return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")); // 토큰 내용 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return null; // 토큰 아님 반환
    } // 오류 처리 끝
} // 함수 끝

export function classifySupabaseKey(value) // Supabase 키 종류 판정
{ // 함수 시작
    const key = String(value ?? "").trim(); // 키 값 정리

    if (key.startsWith("sb_publishable_")) // 새 공개 키 확인
    { // 조건 시작
        return "publishable"; // 공개 키 반환
    } // 조건 끝

    if (key.startsWith("sb_secret_")) // 새 비밀 키 확인
    { // 조건 시작
        return "secret"; // 비밀 키 반환
    } // 조건 끝

    const role = decodeJwtPayload(key)?.role; // 이전 방식 키 역할

    if (role === "anon") // 이전 공개 키 확인
    { // 조건 시작
        return "anon-jwt"; // 이전 공개 키 반환
    } // 조건 끝

    if (role === "service_role") // 이전 비밀 키 확인
    { // 조건 시작
        return "service-role-jwt"; // 이전 비밀 키 반환
    } // 조건 끝

    return "unknown"; // 알 수 없는 키 반환
} // 함수 끝

function checkProjectUrl(rawUrl, add) // 프로젝트 주소 점검
{ // 함수 시작
    const name = "NEXT_PUBLIC_SUPABASE_URL"; // 항목 이름

    if (!rawUrl) // 빈 주소 확인
    { // 조건 시작
        add("error", name, "프로젝트 주소가 비어 있습니다. Supabase의 Project Settings에서 Project URL을 복사해 넣어 주세요."); // 빈 값 오류
        return; // 점검 종료
    } // 조건 끝

    let url = null; // 주소 해석 결과

    try // 주소 해석 시도
    { // 시도 시작
        url = new URL(rawUrl); // 주소 해석
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        add("error", name, "주소 형식이 올바르지 않습니다. https://프로젝트-식별자.supabase.co 형식이어야 합니다."); // 형식 오류
        return; // 점검 종료
    } // 오류 처리 끝

    const local = ["localhost", "127.0.0.1"].includes(url.hostname); // 내 컴퓨터 주소 여부

    if (url.pathname !== "/" || url.search || url.hash) // 추가 경로 확인
    { // 조건 시작
        add("error", name, "주소 끝의 경로(/rest/v1 등)를 지우고 https://프로젝트-식별자.supabase.co 까지만 넣어 주세요."); // 경로 오류
    } // 조건 끝
    else if (url.protocol !== "https:" && !local) // 보안 연결 확인
    { // 조건 시작
        add("error", name, "주소는 https:// 로 시작해야 합니다."); // 보안 연결 오류
    } // 조건 끝
    else if (local) // 로컬 주소 확인
    { // 조건 시작
        add("warn", name, "내 컴퓨터의 로컬 Supabase 주소입니다. 실제 배포에는 Supabase 프로젝트 주소를 넣어 주세요."); // 로컬 주소 주의
    } // 조건 끝
    else if (!url.hostname.endsWith(".supabase.co")) // 기본 주소 형식 확인
    { // 조건 시작
        add("warn", name, "Supabase 기본 주소(*.supabase.co)가 아닙니다. 사용자 지정 도메인이면 그대로 두셔도 됩니다."); // 사용자 도메인 주의
    } // 조건 끝
    else // 정상 주소
    { // 대안 시작
        add("ok", name, "프로젝트 주소 형식이 올바릅니다."); // 정상 결과
    } // 대안 끝
} // 함수 끝

function checkPublishableKey(key, add) // 공개 키 점검
{ // 함수 시작
    const name = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"; // 항목 이름
    const kind = classifySupabaseKey(key); // 키 종류

    if (!key) // 빈 키 확인
    { // 조건 시작
        add("error", name, "공개 키가 비어 있습니다. Project Settings → API Keys의 Publishable key(sb_publishable_…)를 넣어 주세요."); // 빈 값 오류
    } // 조건 끝
    else if (SECRET_KEY_KINDS.has(kind)) // 비밀 키 확인
    { // 조건 시작
        add("error", name, "비밀 키(secret·service_role)가 들어 있습니다! 브라우저에 공개되는 자리이므로 공개 키(sb_publishable_…)로 바꾸고, 이미 노출된 비밀 키는 Supabase에서 새로 발급해 주세요."); // 비밀 키 오류
    } // 조건 끝
    else if (kind === "unknown") // 알 수 없는 키 확인
    { // 조건 시작
        add("warn", name, "키 형식을 확인할 수 없습니다. Publishable key(sb_publishable_…) 또는 이전 방식 anon 키인지 확인해 주세요."); // 형식 주의
    } // 조건 끝
    else // 정상 키
    { // 대안 시작
        add("ok", name, kind === "publishable" ? "공개 키(Publishable) 형식이 올바릅니다." : "이전 방식의 공개 키(anon)입니다. 사용할 수 있지만 새 Publishable 키를 권장합니다."); // 정상 결과
    } // 대안 끝
} // 함수 끝

function checkAdminEmail(email, add) // 관리자 이메일 점검
{ // 함수 시작
    const name = "ADMIN_EMAIL"; // 항목 이름

    if (!email) // 빈 이메일 확인
    { // 조건 시작
        add("error", name, "관리자 이메일이 비어 있습니다. 비어 있으면 관리자 화면에 들어갈 수 없습니다."); // 빈 값 오류
    } // 조건 끝
    else if (!/^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/.test(email)) // 이메일 형식 확인
    { // 조건 시작
        add("error", name, "관리자 이메일 형식이 올바르지 않습니다. 이메일 한 개만 넣어 주세요."); // 형식 오류
    } // 조건 끝
    else // 정상 이메일
    { // 대안 시작
        add("ok", name, "관리자 이메일 형식이 올바릅니다. Supabase에서 이 계정에 관리자 역할(role: admin)도 지정해야 합니다."); // 정상 결과
    } // 대안 끝
} // 함수 끝

export function checkSupabaseEnvironment(env) // Supabase 연결 설정 점검
{ // 함수 시작
    const results = []; // 점검 결과 목록
    const add = (level, name, message) => results.push({ level, name, message }); // 결과 추가 도구
    checkProjectUrl(String(env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim(), add); // 프로젝트 주소 점검
    checkPublishableKey(String(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "").trim(), add); // 공개 키 점검
    checkAdminEmail(String(env.ADMIN_EMAIL ?? "").trim(), add); // 관리자 이메일 점검

    for (const [name, value] of Object.entries(env)) // 다른 항목 반복
    { // 반복 시작
        if (name === "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" || !SECRET_KEY_KINDS.has(classifySupabaseKey(value))) // 비밀 키 여부 확인
        { // 조건 시작
            continue; // 다음 항목
        } // 조건 끝

        if (name.startsWith("NEXT_PUBLIC_")) // 브라우저 공개 항목 확인
        { // 조건 시작
            add("error", name, "브라우저에 공개되는 NEXT_PUBLIC_ 항목에 Supabase 비밀 키가 들어 있습니다. 즉시 지우고 Supabase에서 비밀 키를 새로 발급해 주세요."); // 공개 비밀 키 오류
        } // 조건 끝
        else // 서버 전용 항목
        { // 대안 시작
            add("warn", name, "이 홈페이지는 Supabase 비밀 키를 사용하지 않습니다. 필요하지 않다면 지워 주세요."); // 불필요 비밀 키 주의
        } // 대안 끝
    } // 반복 끝

    return { ok: !results.some((result) => result.level === "error"), results }; // 점검 결과 반환
} // 함수 끝

export function formatSupabaseReport(report) // 점검 결과 문구 생성
{ // 함수 시작
    const lines = ["Supabase 연결 설정 점검 (값은 화면에 표시하지 않습니다)", ""]; // 결과 문구 목록

    for (const result of report.results) // 결과 반복
    { // 반복 시작
        lines.push(`${RESULT_ICONS[result.level]} ${result.name}: ${result.message}`); // 결과 줄 추가
    } // 반복 끝

    lines.push(""); // 구분 줄

    if (!report.ok) // 오류 존재 확인
    { // 조건 시작
        lines.push("✗ 표시 항목을 고친 뒤 다시 실행해 주세요: pnpm supabase:check"); // 재실행 안내
        return lines.join("\n"); // 결과 문구 반환
    } // 조건 끝

    lines.push("설정 형식에 문제가 없습니다. 다음 순서로 진행해 주세요."); // 다음 단계 제목
    lines.push(`1. Supabase SQL Editor에서 아래 파일을 순서대로 실행: ${SUPABASE_MIGRATIONS.map((file) => `supabase/migrations/${file}`).join(" → ")}`); // 설계도 적용 안내
    lines.push("2. Authentication → Users에서 관리자 계정을 만들고 README의 관리자 권한 지정 SQL 실행"); // 관리자 지정 안내
    lines.push("3. 개발 서버를 다시 시작한 뒤 /admin/login, /login, 개발 뉴스 댓글 확인"); // 동작 확인 안내
    return lines.join("\n"); // 결과 문구 반환
} // 함수 끝

export function runSupabaseCheck(cwd = process.cwd(), output = console.log) // 명령 실행
{ // 함수 시작
    const envPath = path.join(cwd, ".env.local"); // 환경 파일 경로

    if (!fs.existsSync(envPath)) // 환경 파일 확인
    { // 조건 시작
        output(".env.local 파일이 없습니다. .env.example을 복사해 .env.local을 만들고 값을 채운 뒤 다시 실행해 주세요."); // 파일 없음 안내
        return 1; // 실패 코드 반환
    } // 조건 끝

    const report = checkSupabaseEnvironment(parseEnvText(fs.readFileSync(envPath, "utf8"))); // 설정 점검
    output(formatSupabaseReport(report)); // 결과 출력
    return report.ok ? 0 : 1; // 결과 코드 반환
} // 함수 끝

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) // 직접 실행 확인
{ // 조건 시작
    process.exitCode = runSupabaseCheck(); // 점검 실행
} // 조건 끝
