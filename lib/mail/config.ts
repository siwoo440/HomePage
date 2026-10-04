export const MAIL_ENV_NAMES = ["RESEND_API_KEY", "MAIL_FROM", "CONTACT_NOTIFY_EMAIL"] as const; // 메일 설정 항목 이름
export const RESEND_TEST_DOMAIN = "resend.dev"; // 도메인 없이 시험할 때 쓰는 Resend 보내는 주소 도메인

export interface MailSender // 메일 보내는 쪽 설정
{ // 형식 시작
    apiKey: string; // Resend API 키(서버 전용)
    from: string; // 보내는 주소
} // 형식 끝

export interface MailConfig extends MailSender // 운영자 알림까지 포함한 메일 설정
{ // 형식 시작
    notifyTo: string; // 운영자 알림 받을 주소
} // 형식 끝

interface MailEnvironment // 메일 환경 값
{ // 형식 시작
    [key: string]: string | undefined; // 기타 환경 값(process.env 호환)
    RESEND_API_KEY?: string; // Resend API 키
    MAIL_FROM?: string; // 보내는 주소
    CONTACT_NOTIFY_EMAIL?: string; // 문의 알림 받을 주소
} // 형식 끝

const EMAIL_PATTERN = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]{2,}$/; // 이메일 한 개 형식

export function isEmailAddress(value: unknown): value is string // 이메일 한 개 형식 확인
{ // 함수 시작
    return typeof value === "string" && value.length <= 254 && EMAIL_PATTERN.test(value); // 형식 여부 반환
} // 함수 끝

export function parseMailFrom(value: unknown): { name: string; address: string } | null // 보내는 주소 해석
{ // 함수 시작
    const text = typeof value === "string" ? value.trim() : ""; // 정리한 값
    const named = /^([^<>\r\n]{1,60})<([^<>\s]+)>$/.exec(text); // "이름 <주소>" 형식
    const address = named ? named[2] : text; // 주소 부분
    return isEmailAddress(address) ? { name: named ? named[1].trim() : "", address } : null; // 해석 결과 반환
} // 함수 끝

export function getMailSender(environment: MailEnvironment = process.env): MailSender | null // 보내는 쪽 설정 읽기
{ // 함수 시작
    const apiKey = environment.RESEND_API_KEY?.trim() ?? ""; // API 키
    const from = environment.MAIL_FROM?.trim() ?? ""; // 보내는 주소
    return apiKey && parseMailFrom(from) ? { apiKey, from } : null; // 두 값이 올바를 때만 반환
} // 함수 끝

export function canMailVisitors(sender: MailSender): boolean // 방문자에게 보낼 수 있는 보내는 주소인지 확인
{ // 함수 시작
    const address = parseMailFrom(sender.from)?.address.toLowerCase() ?? ""; // 보내는 주소
    return address !== "" && !address.endsWith(`@${RESEND_TEST_DOMAIN}`); // 도메인 없는 시험 주소는 본인에게만 보낼 수 있음
} // 함수 끝

export function getMailConfig(environment: MailEnvironment = process.env): MailConfig | null // 운영자 알림 메일 설정 읽기
{ // 함수 시작
    const sender = getMailSender(environment); // 보내는 쪽 설정
    const notifyTo = environment.CONTACT_NOTIFY_EMAIL?.trim() ?? ""; // 알림 받을 주소

    if (!sender || !isEmailAddress(notifyTo)) // 세 값이 모두 올바른지 확인
    { // 조건 시작
        return null; // 메일 미설정(발송하지 않음)
    } // 조건 끝

    return { ...sender, notifyTo }; // 메일 설정 반환
} // 함수 끝
