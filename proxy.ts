import { NextResponse, type NextRequest } from "next/server"; // 요청 응답 도구
import { AGE_GATE_COOKIE_NAME } from "@/lib/age-gate/config"; // 인증 쿠키 이름
import { getAdultAccessDecision } from "@/lib/age-gate/proxy-policy"; // 성인 접근 결정 함수
import { resolveAgeGateSecret } from "@/lib/age-gate/verification"; // 서명 키 선택 함수
import { updateSupabaseSession } from "@/lib/supabase/proxy"; // 세션 갱신 함수

export async function proxy(request: NextRequest) // 접근 보호 프록시
{ // 함수 시작
    const secret = resolveAgeGateSecret(process.env.NODE_ENV, process.env.AGE_GATE_SECRET); // 서명 키 선택
    const token = request.cookies.get(AGE_GATE_COOKIE_NAME)?.value; // 인증 쿠키 읽기
    const decision = await getAdultAccessDecision(request.nextUrl.pathname, token, Date.now(), secret); // 성인 접근 판정
    if (decision === "denied") // 인증 실패 확인
    { // 조건 시작
        const verificationUrl = new URL("/age-verification", request.url); // 확인 화면 주소 생성
        verificationUrl.searchParams.set("returnTo", `${request.nextUrl.pathname}${request.nextUrl.search}`); // 원래 주소 저장
        return NextResponse.redirect(verificationUrl, { headers: { "Cache-Control": "private, no-store" } }); // 확인 화면 이동
    } // 조건 끝
    if (decision === "allowed") // 인증 성공 확인
    { // 조건 시작
        const response = NextResponse.next({ request }); // 보호 콘텐츠 응답 생성
        response.headers.set("Cache-Control", "private, no-store"); // 보호 콘텐츠 캐시 차단
        return response; // 보호 콘텐츠 반환
    } // 조건 끝
    return updateSupabaseSession(request); // 세션 갱신 응답
} // 함수 끝

export const config = // 프록시 설정 시작
{ // 프록시 설정 객체
    matcher: // 프록시 경로 목록 시작
    [ // 경로 배열 시작
        "/admin/:path*", // 관리자 경로 범위
        "/project_h/:path*", // 프로젝트 H 보호
        "/project_u/:path*", // 프로젝트 U 보호
        "/project_v/:path*", // 프로젝트 V 보호
        "/images/games/project-h.png", // 프로젝트 H 대표 이미지 보호
        "/images/games/project-u.png", // 프로젝트 U 대표 이미지 보호
        "/images/games/project-v.png", // 프로젝트 V 대표 이미지 보호
    ], // 경로 배열 끝
}; // 프록시 설정 끝
