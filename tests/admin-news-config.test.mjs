import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
import fs from "node:fs"; // 파일 읽기 도구
import { getSupabasePublicConfig } from "../lib/supabase/config.ts"; // 설정 판정 함수

test("Supabase 환경 변수가 없으면 null을 반환한다", () => // 설정 누락 검사
{ // 테스트 본문 시작
    assert.equal(getSupabasePublicConfig({}), null); // 누락 결과 검증
}); // 테스트 본문 끝

test("Supabase URL과 공개 키가 있으면 설정을 반환한다", () => // 정상 설정 검사
{ // 테스트 본문 시작
    const environment = // 테스트 환경 시작
    { // 테스트 환경 객체
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", // 테스트 프로젝트 주소
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key", // 테스트 공개 키
    }; // 테스트 환경 끝
    const expected = // 기대 결과 시작
    { // 기대 결과 객체
        url: "https://example.supabase.co", // 기대 프로젝트 주소
        publishableKey: "test-key", // 기대 공개 키
    }; // 기대 결과 끝
    assert.deepEqual(getSupabasePublicConfig(environment), expected); // 정상 결과 검증
}); // 테스트 본문 끝

test("공백으로만 구성된 설정은 null을 반환한다", () => // 공백 설정 검사
{ // 테스트 본문 시작
    const environment = // 테스트 환경 시작
    { // 테스트 환경 객체
        NEXT_PUBLIC_SUPABASE_URL: "   ", // 공백 프로젝트 주소
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "   ", // 공백 공개 키
    }; // 테스트 환경 끝
    assert.equal(getSupabasePublicConfig(environment), null); // 공백 결과 검증
}); // 테스트 본문 끝

test("브라우저 번들에서도 공개 설정을 읽도록 NEXT_PUBLIC 값을 직접 참조한다", () => // 브라우저 설정 읽기 회귀 검사
{ // 테스트 시작
    const supabaseConfig = fs.readFileSync("lib/supabase/config.ts", "utf8"); // Supabase 설정 읽기
    const memberConfig = fs.readFileSync("lib/member/config.ts", "utf8"); // 회원 설정 읽기
    assert.match(supabaseConfig, /NEXT_PUBLIC_SUPABASE_URL: process\.env\.NEXT_PUBLIC_SUPABASE_URL/); // 주소 직접 참조 확인
    assert.match(supabaseConfig, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process\.env\.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/); // 공개 키 직접 참조 확인
    for (const source of [supabaseConfig, memberConfig]) // 설정 파일 반복
    { // 반복 시작
        assert.doesNotMatch(source, /=\s*process\.env\)/); // 간접 참조 기본값 제거 확인
    } // 반복 끝
}); // 테스트 끝
