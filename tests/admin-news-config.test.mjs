import test from "node:test"; // 테스트 실행기
import assert from "node:assert/strict"; // 엄격한 검증 도구
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
