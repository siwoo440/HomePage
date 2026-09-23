import { isAdultGameId, isProtectedAdultPath } from "./config.ts"; // 보호 대상 판정 함수
import { verifyAgeVerificationToken } from "./verification.ts"; // 인증 토큰 검증 함수

export type AdultAccessDecision = "not-protected" | "allowed" | "denied"; // 접근 결정 형식

export async function getAdultAccessDecision(pathname: string, token: string | undefined, nowMs: number, secret: string | null): Promise<AdultAccessDecision> // 성인 접근 결정
{ // 함수 시작
    if (!isProtectedAdultPath(pathname)) // 보호 경로 여부 확인
    { // 조건 시작
        return "not-protected"; // 검사 제외 반환
    } // 조건 끝
    if (!secret) // 서명 키 누락 확인
    { // 조건 시작
        return "denied"; // 접근 차단 반환
    } // 조건 끝
    const verified = await verifyAgeVerificationToken(token, nowMs, secret); // 인증 토큰 검증
    return verified ? "allowed" : "denied"; // 접근 결정 반환
} // 함수 끝

export async function verifyAdultGameAccess(gameId: string, token: string | undefined, nowMs: number, secret: string | null): Promise<boolean> // 게임별 성인 접근 검증
{ // 함수 시작
    if (!isAdultGameId(gameId)) // 일반 게임 확인
    { // 조건 시작
        return true; // 일반 게임 허용
    } // 조건 끝
    if (!secret) // 서명 키 누락 확인
    { // 조건 시작
        return false; // 성인 게임 차단
    } // 조건 끝
    return verifyAgeVerificationToken(token, nowMs, secret); // 성인 게임 토큰 검증
} // 함수 끝
