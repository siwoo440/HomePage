import assert from "node:assert/strict"; // 엄격 비교 도구
import fs from "node:fs"; // 파일 도구
import os from "node:os"; // 임시 폴더 도구
import path from "node:path"; // 경로 처리 도구
import test from "node:test"; // 테스트 실행 도구
import { checkSupabaseEnvironment, classifySupabaseKey, formatSupabaseReport, parseEnvText, runSupabaseCheck, SUPABASE_MIGRATIONS } from "../scripts/check-supabase-env.mjs"; // 연결 설정 점검 도구

function createJwt(payload) // 테스트 토큰 생성
{ // 함수 시작
    return ["eyJhbGciOiJIUzI1NiJ9", Buffer.from(JSON.stringify(payload)).toString("base64url"), "signature"].join("."); // 세 구간 토큰 반환
} // 함수 끝

const VALID_ENV = { NEXT_PUBLIC_SUPABASE_URL: "https://abcdefgh.supabase.co", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_value", ADMIN_EMAIL: "admin@example.com" }; // 정상 설정

function levelOf(report, name) // 항목 결과 수준 조회
{ // 함수 시작
    return report.results.find((result) => result.name === name)?.level; // 결과 수준 반환
} // 함수 끝

test("환경 파일의 주석·따옴표·export·윈도우 줄바꿈을 해석한다", () => // 환경 파일 해석 테스트
{ // 테스트 시작
    const parsed = parseEnvText("# 설명\r\nNEXT_PUBLIC_SUPABASE_URL=\"https://a.supabase.co\"\r\nexport ADMIN_EMAIL='admin@example.com'\r\nBROKEN\r\n=빈이름\r\nEMPTY=\r\n"); // 해석 실행
    assert.deepEqual(parsed, { NEXT_PUBLIC_SUPABASE_URL: "https://a.supabase.co", ADMIN_EMAIL: "admin@example.com", EMPTY: "" }); // 해석 결과 확인
}); // 테스트 끝

test("Supabase 키를 공개 키와 비밀 키로 구분한다", () => // 키 종류 테스트
{ // 테스트 시작
    assert.equal(classifySupabaseKey("sb_publishable_abc"), "publishable"); // 새 공개 키 확인
    assert.equal(classifySupabaseKey("sb_secret_abc"), "secret"); // 새 비밀 키 확인
    assert.equal(classifySupabaseKey(createJwt({ role: "anon" })), "anon-jwt"); // 이전 공개 키 확인
    assert.equal(classifySupabaseKey(createJwt({ role: "service_role" })), "service-role-jwt"); // 이전 비밀 키 확인
    assert.equal(classifySupabaseKey("not-a-key"), "unknown"); // 알 수 없는 키 확인
    assert.equal(classifySupabaseKey(undefined), "unknown"); // 빈 키 확인
}); // 테스트 끝

test("정상 설정은 통과하고 빈 설정은 세 항목 모두 오류로 알린다", () => // 기본 점검 테스트
{ // 테스트 시작
    const valid = checkSupabaseEnvironment(VALID_ENV); // 정상 설정 점검
    assert.equal(valid.ok, true); // 통과 확인
    assert.deepEqual(valid.results.map((result) => result.level), ["ok", "ok", "ok"]); // 모든 항목 정상 확인
    const empty = checkSupabaseEnvironment({}); // 빈 설정 점검
    assert.equal(empty.ok, false); // 실패 확인
    assert.deepEqual(empty.results.map((result) => result.level), ["error", "error", "error"]); // 세 항목 오류 확인
    assert.equal(levelOf(checkSupabaseEnvironment({ ...VALID_ENV, ADMIN_EMAIL: "a@example.com,b@example.com" }), "ADMIN_EMAIL"), "error"); // 여러 이메일 거부 확인
}); // 테스트 끝

test("공개 키 자리나 NEXT_PUBLIC 항목의 비밀 키를 오류로 막는다", () => // 비밀 키 노출 테스트
{ // 테스트 시작
    for (const secret of ["sb_secret_leak", createJwt({ role: "service_role" })]) // 비밀 키 반복
    { // 반복 시작
        const report = checkSupabaseEnvironment({ ...VALID_ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret }); // 공개 자리 비밀 키 점검
        assert.equal(report.ok, false); // 실패 확인
        assert.equal(levelOf(report, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), "error"); // 공개 키 오류 확인
    } // 반복 끝
    const exposed = checkSupabaseEnvironment({ ...VALID_ENV, NEXT_PUBLIC_SERVICE_KEY: "sb_secret_leak" }); // 다른 공개 항목 점검
    assert.equal(levelOf(exposed, "NEXT_PUBLIC_SERVICE_KEY"), "error"); // 공개 항목 오류 확인
    const server = checkSupabaseEnvironment({ ...VALID_ENV, SUPABASE_SERVICE_ROLE_KEY: "sb_secret_unused" }); // 서버 항목 점검
    assert.equal(server.ok, true); // 서버 항목 통과 확인
    assert.equal(levelOf(server, "SUPABASE_SERVICE_ROLE_KEY"), "warn"); // 불필요 비밀 키 주의 확인
    const allowed = checkSupabaseEnvironment({ ...VALID_ENV, SUPABASE_SECRET_KEY: "sb_secret_server_only" }); // 허용한 서버 전용 항목 점검
    assert.deepEqual([allowed.ok, levelOf(allowed, "SUPABASE_SECRET_KEY")], [true, "ok"]); // 서버 전용 비밀 키 허용 확인
    assert.equal(formatSupabaseReport(allowed).includes("sb_secret_server_only"), false); // 비밀 키 값 미출력 확인
    assert.equal(levelOf(checkSupabaseEnvironment({ ...VALID_ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: createJwt({ role: "anon" }) }), "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"), "ok"); // 이전 공개 키 허용 확인
}); // 테스트 끝

test("프로젝트 주소의 경로·http·로컬·사용자 도메인을 구분한다", () => // 주소 점검 테스트
{ // 테스트 시작
    const urlLevel = (value) => levelOf(checkSupabaseEnvironment({ ...VALID_ENV, NEXT_PUBLIC_SUPABASE_URL: value }), "NEXT_PUBLIC_SUPABASE_URL"); // 주소 수준 조회
    assert.equal(urlLevel("https://abcdefgh.supabase.co/rest/v1"), "error"); // 추가 경로 거부 확인
    assert.equal(urlLevel("http://abcdefgh.supabase.co"), "error"); // 보안 연결 필요 확인
    assert.equal(urlLevel("not a url"), "error"); // 잘못된 형식 확인
    assert.equal(urlLevel("http://127.0.0.1:54321"), "warn"); // 로컬 주소 주의 확인
    assert.equal(urlLevel("https://api.devforge.example"), "warn"); // 사용자 도메인 주의 확인
    assert.equal(urlLevel("https://abcdefgh.supabase.co/"), "ok"); // 끝 슬래시 허용 확인
}); // 테스트 끝

test("점검 결과는 값을 표시하지 않고 통과 시 설계도 적용 순서를 안내한다", () => // 결과 문구 테스트
{ // 테스트 시작
    const secret = "sb_secret_should_not_print"; // 노출 금지 값
    const failed = formatSupabaseReport(checkSupabaseEnvironment({ ...VALID_ENV, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: secret })); // 실패 문구
    assert.doesNotMatch(failed, /should_not_print/); // 값 미표시 확인
    assert.match(failed, /pnpm supabase:check/); // 재실행 안내 확인
    const passed = formatSupabaseReport(checkSupabaseEnvironment(VALID_ENV)); // 통과 문구
    assert.doesNotMatch(passed, /sb_publishable_test_value|admin@example\.com/); // 값 미표시 확인
    assert.match(passed, new RegExp(SUPABASE_MIGRATIONS.map((file) => file.replace(/\./g, "\\.")).join("[\\s\\S]*"))); // 설계도 순서 확인
}); // 테스트 끝

test("명령은 .env.local이 없거나 오류가 있으면 실패 코드를 돌려준다", () => // 명령 실행 테스트
{ // 테스트 시작
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "devforge-supabase-check-")); // 임시 폴더
    const output = []; // 출력 기록

    try // 명령 검사
    { // 시도 시작
        assert.equal(runSupabaseCheck(directory, (line) => output.push(line)), 1); // 파일 없음 실패 확인
        assert.match(output[0], /\.env\.example을 복사/); // 파일 생성 안내 확인
        fs.writeFileSync(path.join(directory, ".env.local"), "NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_x\nADMIN_EMAIL=admin@example.com\n"); // 정상 파일 작성
        assert.equal(runSupabaseCheck(directory, (line) => output.push(line)), 0); // 정상 통과 확인
        fs.writeFileSync(path.join(directory, ".env.local"), "NEXT_PUBLIC_SUPABASE_URL=\n"); // 빈 설정 작성
        assert.equal(runSupabaseCheck(directory, (line) => output.push(line)), 1); // 오류 실패 확인
    } // 시도 끝
    finally // 임시 폴더 정리
    { // 정리 시작
        fs.rmSync(directory, { recursive: true, force: true }); // 임시 폴더 삭제
    } // 정리 끝
}); // 테스트 끝
