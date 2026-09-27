import { cookies } from "next/headers"; // 요청 쿠키 도구
import { NextResponse } from "next/server"; // JSON 응답 도구
import { AGE_GATE_COOKIE_NAME } from "@/lib/age-gate/config"; // 인증 쿠키 이름
import { verifyAdultGameAccess } from "@/lib/age-gate/proxy-policy"; // 게임별 접근 검증
import { resolveAgeGateSecret } from "@/lib/age-gate/verification"; // 서명 키 선택
import { createYouTubeApiResponse } from "@/lib/community/youtube"; // 유튜브 응답 생성 도구

export const dynamic = "force-dynamic"; // 게임별 최신 조회 설정

export async function GET(request: Request) // 유튜브 피드 요청
{ // 함수 시작
    const gameId = new URL(request.url).searchParams.get("game") ?? ""; // 요청 게임 식별자
    const cookieStore = await cookies(); // 요청 쿠키 읽기
    const token = cookieStore.get(AGE_GATE_COOKIE_NAME)?.value; // 인증 토큰 읽기
    const secret = resolveAgeGateSecret(process.env.NODE_ENV, process.env.AGE_GATE_SECRET); // 서명 키 선택
    const allowed = await verifyAdultGameAccess(gameId, token, Date.now(), secret); // 성인 피드 접근 검증
    if (!allowed) // 성인 인증 실패 확인
    { // 조건 시작
        return NextResponse.json({ configured: false, items: [], message: "성인 확인이 필요합니다." }, { status: 403, headers: { "Cache-Control": "private, no-store" } }); // 차단 응답 반환
    } // 조건 끝
    const apiKey = process.env.YOUTUBE_API_KEY?.trim() ?? ""; // 서버 전용 API 키 조회
    const result = await createYouTubeApiResponse(request.url, apiKey); // 공개 응답 생성
    const headers = result.status === 200 && "configured" in result.body && result.body.configured ? { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=1800" } : { "Cache-Control": "no-store" }; // 캐시 정책 구성
    return NextResponse.json(result.body, { status: result.status, headers }); // JSON 응답 반환
} // 함수 끝
