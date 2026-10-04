import { jsonNoStore, rateLimitedResponse, readJsonBody } from "@/lib/http/json"; // JSON 요청·응답 도구
import { createRateLimiter, getClientKey } from "@/lib/http/rate-limit"; // 요청 횟수 제한
import { validateNotify } from "@/lib/notify/domain"; // 출시 알림 입력 검증
import { saveNotifyRequest } from "@/lib/notify/store"; // 출시 알림 저장
import { isSupabaseConfigured } from "@/lib/supabase/config"; // 저장소 연결 여부
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export const dynamic = "force-dynamic"; // 요청별 실행 설정

const NOTIFY_BODY_MAX_BYTES = 2_000; // 신청 본문 한도
const NOTIFY_DONE_MESSAGE = "출시 알림 신청을 받았습니다. 소식이 준비되면 입력하신 이메일로 알려 드립니다."; // 신청 완료 안내
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }); // 요청자별 10분에 5회

export async function POST(request: Request): Promise<Response> // 출시 알림 신청
{ // 함수 시작
    const limit = limiter.check(getClientKey(request)); // 요청 횟수 확인
    if (!limit.allowed) // 제한 초과 확인
    { // 조건 시작
        return rateLimitedResponse(limit); // 제한 안내 반환
    } // 조건 끝
    const body = await readJsonBody(request, NOTIFY_BODY_MAX_BYTES); // 본문 읽기
    if (!body.ok) // 본문 오류 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: body.message }, body.status); // 본문 오류 반환
    } // 조건 끝
    const checked = validateNotify(body.value); // 입력 검증
    if (!checked.ok) // 입력 오류 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: checked.message, errors: checked.errors }, 400); // 입력 오류 반환
    } // 조건 끝
    if (checked.spam) // 자동 입력 의심 확인
    { // 조건 시작
        return jsonNoStore({ ok: true, message: NOTIFY_DONE_MESSAGE }); // 저장하지 않고 같은 안내 반환
    } // 조건 끝
    if (!isSupabaseConfigured()) // 시연 모드 확인
    { // 조건 시작
        return jsonNoStore({ ok: true, demo: true, message: "시연 모드: 입력 검증을 통과했습니다. 서버가 연결되지 않아 신청은 저장되지 않습니다." }); // 시연 안내 반환
    } // 조건 끝
    try // 저장 시도
    { // 시도 시작
        await saveNotifyRequest(await createServerSupabaseClient(), checked.value); // 신청 저장(이미 신청한 주소도 같은 안내)
        return jsonNoStore({ ok: true, message: NOTIFY_DONE_MESSAGE }, 201); // 신청 완료 반환
    } // 시도 끝
    catch // 저장 실패 처리
    { // 오류 처리 시작
        return jsonNoStore({ ok: false, message: "출시 알림 신청을 받지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503); // 저장 실패 반환
    } // 오류 처리 끝
} // 함수 끝
