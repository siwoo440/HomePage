import { cookies } from "next/headers"; // 요청 쿠키 도구
import { NextResponse } from "next/server"; // 응답 생성 도구
import { AGE_GATE_COOKIE_NAME } from "@/lib/age-gate/config"; // 쿠키 이름
import { resolveAgeGateSecret, verifyAgeVerificationToken } from "@/lib/age-gate/verification"; // 인증 토큰 검증

export const dynamic = "force-dynamic"; // 요청별 실행 설정

export async function GET() // 인증 상태 요청
{ // 함수 시작
    const secret = resolveAgeGateSecret(process.env.NODE_ENV, process.env.AGE_GATE_SECRET); // 서명 키 선택
    if (!secret) // 서명 키 누락 확인
    { // 조건 시작
        return NextResponse.json({ verified: false }, { status: 503, headers: { "Cache-Control": "no-store" } }); // 닫힌 상태 반환
    } // 조건 끝
    const cookieStore = await cookies(); // 쿠키 저장소 읽기
    const token = cookieStore.get(AGE_GATE_COOKIE_NAME)?.value; // 인증 토큰 읽기
    const verified = await verifyAgeVerificationToken(token, Date.now(), secret); // 인증 상태 판정
    return NextResponse.json({ verified }, { headers: { "Cache-Control": "no-store" } }); // 인증 상태 반환
} // 함수 끝
