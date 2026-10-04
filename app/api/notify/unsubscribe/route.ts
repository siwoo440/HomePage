import { jsonNoStore, rateLimitedResponse, readJsonBody } from "@/lib/http/json"; // JSON 요청·응답 도구
import { createRateLimiter, getClientKey } from "@/lib/http/rate-limit"; // 요청 횟수 제한
import { isNotifyToken } from "@/lib/notify/domain"; // 수신 거부 값 형식 확인
import { cancelNotifyRequest } from "@/lib/notify/store"; // 수신 거부 처리
import { isSupabaseConfigured } from "@/lib/supabase/config"; // 저장소 연결 여부
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export const dynamic = "force-dynamic"; // 요청별 실행 설정

const UNSUBSCRIBE_BODY_MAX_BYTES = 500; // 수신 거부 본문 한도
const limiter = createRateLimiter({ limit: 10, windowMs: 10 * 60_000 }); // 요청자별 10분에 10회

export async function POST(request: Request): Promise<Response> // 출시 알림 수신 거부
{ // 함수 시작
    const limit = limiter.check(getClientKey(request)); // 요청 횟수 확인
    if (!limit.allowed) // 제한 초과 확인
    { // 조건 시작
        return rateLimitedResponse(limit); // 제한 안내 반환
    } // 조건 끝
    const body = await readJsonBody(request, UNSUBSCRIBE_BODY_MAX_BYTES); // 본문 읽기
    if (!body.ok) // 본문 오류 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: body.message }, body.status); // 본문 오류 반환
    } // 조건 끝
    const token = body.value.token; // 수신 거부 값
    if (!isNotifyToken(token)) // 값 형식 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: "수신 거부 주소가 올바르지 않습니다. 메일에 있는 주소를 다시 열어 주세요." }, 400); // 형식 오류 반환
    } // 조건 끝
    if (!isSupabaseConfigured()) // 시연 모드 확인
    { // 조건 시작
        return jsonNoStore({ ok: true, demo: true, message: "시연 모드: 서버가 연결되지 않아 실제 신청 내역은 바뀌지 않습니다." }); // 시연 안내 반환
    } // 조건 끝
    try // 처리 시도
    { // 시도 시작
        const found = await cancelNotifyRequest(await createServerSupabaseClient(), token); // 수신 거부 처리
        return found ? jsonNoStore({ ok: true, message: "수신 거부를 처리했습니다. 이 게임의 출시 소식 메일을 더 보내지 않습니다." }) : jsonNoStore({ ok: false, message: "신청 내역을 찾을 수 없습니다. 메일에 있는 주소를 다시 열어 주세요." }, 404); // 처리 결과 반환
    } // 시도 끝
    catch // 처리 실패
    { // 오류 처리 시작
        return jsonNoStore({ ok: false, message: "수신 거부를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503); // 처리 실패 반환
    } // 오류 처리 끝
} // 함수 끝
