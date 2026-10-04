import { isEmailAddress, type MailConfig } from "./config.ts"; // 메일 설정 형식

export const RESEND_API_URL = "https://api.resend.com/emails"; // Resend 발송 주소
export const MAIL_TIMEOUT_MS = 4000; // 발송 제한 시간
export const MAIL_SUBJECT_MAX_LENGTH = 150; // 제목 최대 글자 수

export interface MailMessage // 보낼 메일
{ // 형식 시작
    to: string; // 받는 주소
    subject: string; // 제목
    text: string; // 본문(글자만)
    replyTo?: string; // 답장 받을 주소
} // 형식 끝

export type MailFailureReason = "invalid" | "rejected" | "timeout" | "network"; // 발송 실패 종류

export type MailResult = // 발송 결과
    | { ok: true; id: string } // 발송 성공
    | { ok: false; reason: MailFailureReason; status: number }; // 발송 실패

interface SendMailOptions // 발송 선택 사항
{ // 형식 시작
    fetchImpl?: typeof fetch; // 요청 도구
    timeoutMs?: number; // 제한 시간
} // 형식 끝

export function cleanMailSubject(value: string): string // 제목 정리
{ // 함수 시작
    return [...value.replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim()].slice(0, MAIL_SUBJECT_MAX_LENGTH).join(""); // 줄바꿈 제거·길이 제한
} // 함수 끝

export async function sendMail(config: MailConfig, message: MailMessage, options: SendMailOptions = {}): Promise<MailResult> // 메일 발송
{ // 함수 시작
    const subject = cleanMailSubject(message.subject); // 정리한 제목

    if (!isEmailAddress(message.to) || !subject || !message.text.trim() || (message.replyTo !== undefined && !isEmailAddress(message.replyTo))) // 보낼 내용 확인
    { // 조건 시작
        return { ok: false, reason: "invalid", status: 0 }; // 잘못된 내용은 보내지 않음
    } // 조건 끝

    const fetchImpl = options.fetchImpl ?? fetch; // 요청 도구
    const controller = new AbortController(); // 요청 중단 도구
    const timer = setTimeout(() => controller.abort(), options.timeoutMs ?? MAIL_TIMEOUT_MS); // 제한 시간 설정

    try // 발송 시도
    { // 시도 시작
        const response = await fetchImpl(RESEND_API_URL, // 발송 요청
        { // 요청 설정 시작
            method: "POST", // 전송 방식
            headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" }, // 인증과 본문 형식
            body: JSON.stringify({ from: config.from, to: [message.to], subject, text: message.text, ...(message.replyTo ? { reply_to: message.replyTo } : {}) }), // 메일 내용
            signal: controller.signal, // 제한 시간 연결
            cache: "no-store", // 캐시 사용 안 함
        }); // 요청 설정 끝

        if (!response.ok) // 발송 거부 확인
        { // 조건 시작
            return { ok: false, reason: "rejected", status: response.status }; // 거부 결과 반환
        } // 조건 끝

        const data = await response.json().catch(() => null) as { id?: unknown } | null; // 응답 본문
        return { ok: true, id: typeof data?.id === "string" ? data.id : "" }; // 성공 결과 반환
    } // 시도 끝
    catch (error: unknown) // 발송 실패 처리
    { // 오류 처리 시작
        return { ok: false, reason: error instanceof Error && error.name === "AbortError" ? "timeout" : "network", status: 0 }; // 실패 결과 반환
    } // 오류 처리 끝
    finally // 공통 정리
    { // 정리 시작
        clearTimeout(timer); // 제한 시간 해제
    } // 정리 끝
} // 함수 끝
