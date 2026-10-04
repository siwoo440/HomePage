import { validateContact } from "@/lib/contact/domain"; // 문의 입력 검증
import { saveContactMessage } from "@/lib/contact/inbox"; // 문의 저장
import { jsonNoStore, rateLimitedResponse, readJsonBody } from "@/lib/http/json"; // JSON 요청·응답 도구
import { createRateLimiter, getClientKey } from "@/lib/http/rate-limit"; // 요청 횟수 제한
import { getMailConfig } from "@/lib/mail/config"; // 메일 발송 설정
import { sendMail } from "@/lib/mail/sender"; // 메일 발송
import { buildContactNotice } from "@/lib/mail/templates"; // 문의 접수 알림 양식
import { getSiteUrl } from "@/lib/site-url"; // 공개 사이트 주소
import { isSupabaseConfigured } from "@/lib/supabase/config"; // 저장소 연결 여부
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구

export const dynamic = "force-dynamic"; // 요청별 실행 설정

const CONTACT_BODY_MAX_BYTES = 12_000; // 문의 본문 한도
const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 }); // 요청자별 10분에 5회

export async function POST(request: Request): Promise<Response> // 문의 접수
{ // 함수 시작
    const limit = limiter.check(getClientKey(request)); // 요청 횟수 확인
    if (!limit.allowed) // 제한 초과 확인
    { // 조건 시작
        return rateLimitedResponse(limit); // 제한 안내 반환
    } // 조건 끝
    const body = await readJsonBody(request, CONTACT_BODY_MAX_BYTES); // 본문 읽기
    if (!body.ok) // 본문 오류 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: body.message }, body.status); // 본문 오류 반환
    } // 조건 끝
    const checked = validateContact(body.value); // 입력 검증
    if (!checked.ok) // 입력 오류 확인
    { // 조건 시작
        return jsonNoStore({ ok: false, message: "입력 내용을 확인해 주세요.", errors: checked.errors }, 400); // 입력 오류 반환
    } // 조건 끝
    if (checked.spam) // 자동 입력 의심 확인
    { // 조건 시작
        return jsonNoStore({ ok: true, message: "문의를 접수했습니다. 확인 후 입력하신 이메일로 답변드리겠습니다." }); // 저장하지 않고 같은 안내 반환
    } // 조건 끝
    if (!isSupabaseConfigured()) // 시연 모드 확인
    { // 조건 시작
        return jsonNoStore({ ok: true, demo: true, message: "시연 모드: 입력 검증을 통과했습니다. 서버가 연결되지 않아 문의는 저장되지 않습니다." }); // 시연 안내 반환
    } // 조건 끝
    try // 저장 시도
    { // 시도 시작
        await saveContactMessage(await createServerSupabaseClient(), checked.value); // 문의 저장
        const mail = getMailConfig(); // 메일 발송 설정(없으면 알림 생략)
        const notice = mail ? await sendMail(mail, buildContactNotice(checked.value, mail.notifyTo, getSiteUrl())) : null; // 운영자 접수 알림
        if (notice && !notice.ok) // 알림 실패 확인(문의는 이미 저장됨)
        { // 조건 시작
            console.error("CONTACT_NOTICE_FAILED", notice.reason, notice.status); // 문의 내용 없이 실패 종류만 기록
        } // 조건 끝
        return jsonNoStore({ ok: true, message: "문의를 접수했습니다. 확인 후 입력하신 이메일로 답변드리겠습니다." }, 201); // 접수 안내 반환
    } // 시도 끝
    catch // 저장 실패 처리
    { // 오류 처리 시작
        return jsonNoStore({ ok: false, message: "문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요." }, 503); // 저장 실패 반환
    } // 오류 처리 끝
} // 함수 끝
