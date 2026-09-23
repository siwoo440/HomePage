import { NextResponse } from "next/server"; // 응답 생성 도구
import { AGE_GATE_COOKIE_NAME, AGE_GATE_MAX_AGE_SECONDS } from "@/lib/age-gate/config"; // 쿠키 설정
import { processAgeVerification } from "@/lib/age-gate/request"; // 인증 요청 처리
import { resolveAgeGateSecret } from "@/lib/age-gate/verification"; // 서명 키 선택

export const dynamic = "force-dynamic"; // 요청별 실행 설정

export async function POST(request: Request) // 성인 확인 요청
{ // 함수 시작
    let body: unknown; // 요청 본문 공간
    try // 본문 해석 시도
    { // 시도 시작
        body = await request.json(); // JSON 본문 읽기
    } // 시도 끝
    catch // 본문 해석 실패
    { // 오류 처리 시작
        return NextResponse.json({ ok: false, message: "요청 내용을 확인해 주세요." }, { status: 400, headers: { "Cache-Control": "no-store" } }); // 잘못된 요청 반환
    } // 오류 처리 끝
    const secret = resolveAgeGateSecret(process.env.NODE_ENV, process.env.AGE_GATE_SECRET); // 서명 키 선택
    const result = await processAgeVerification(body, new Date(), secret); // 인증 요청 검증
    if (!result.ok) // 인증 실패 확인
    { // 조건 시작
        return NextResponse.json({ ok: false, message: result.message }, { status: result.status, headers: { "Cache-Control": "no-store" } }); // 실패 응답 반환
    } // 조건 끝
    const response = NextResponse.json({ ok: true, returnTo: result.returnTo }, { status: result.status, headers: { "Cache-Control": "no-store" } }); // 성공 응답 생성
    response.cookies.set(AGE_GATE_COOKIE_NAME, result.token, // 인증 쿠키 설정
    { // 쿠키 옵션 시작
        httpOnly: true, // 스크립트 접근 차단
        sameSite: "lax", // 외부 요청 제한
        secure: process.env.NODE_ENV === "production", // 운영 보안 전송
        path: "/", // 전체 경로 적용
        maxAge: AGE_GATE_MAX_AGE_SECONDS, // 쿠키 유지 시간
    }); // 쿠키 옵션 끝
    return response; // 성공 응답 반환
} // 함수 끝
