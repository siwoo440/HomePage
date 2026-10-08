import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식

export const CONSENT_PATH = "/oauth/consent"; // 로그인 허용 화면 주소

const SCOPE_LABELS: Record<string, string> = // 요청 정보 설명
{ // 설명 시작
    openid: "회원 확인용 식별 번호", // 기본 식별
    email: "이메일 주소", // 이메일
    profile: "프로필 정보(이름과 사진)", // 프로필
    phone: "전화번호", // 전화번호
}; // 설명 끝

export interface ConsentScope // 요청 정보 한 줄
{ // 형식 시작
    id: string; // 요청 이름
    label: string; // 화면 설명
} // 형식 끝

export type ConsentRequest = // 로그인 허용 요청 상태
    | { status: "redirect"; url: string } // 이미 허용해 바로 이동
    | { status: "consent"; authorizationId: string; clientName: string; redirectHost: string | null; email: string | null; scopes: ConsentScope[] }; // 허용 여부 확인 필요

export type ConsentErrorCode = "INVALID_REQUEST" | "SIGN_IN_REQUIRED" | "UNAVAILABLE" | "UNKNOWN"; // 로그인 허용 오류 코드

export class ConsentError extends Error // 로그인 허용 오류
{ // 형식 시작
    readonly code: ConsentErrorCode; // 오류 코드

    constructor(code: ConsentErrorCode, message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "ConsentError"; // 오류 이름
        this.code = code; // 오류 코드 저장
    } // 생성 끝
} // 형식 끝

const CONSENT_ERROR_MESSAGES = // 오류 안내 문구
{ // 문구 시작
    INVALID_REQUEST: "요청이 올바르지 않거나 시간이 지났습니다. 이용하려던 서비스에서 다시 시도해 주세요.", // 잘못되었거나 만료된 요청
    SIGN_IN_REQUIRED: "로그인이 끝났습니다. 다시 로그인한 뒤 시도해 주세요.", // 세션 만료
    UNAVAILABLE: "다른 서비스에서 이 계정으로 로그인하는 기능이 아직 준비되지 않았습니다.", // 기능 꺼짐
    UNKNOWN: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", // 기타 오류
} as const; // 문구 끝

export function sanitizeAuthorizationId(value: string | null | undefined): string | null // 요청 번호 확인
{ // 함수 시작
    const id = value?.trim() ?? ""; // 요청 번호
    return /^[A-Za-z0-9_-]{8,200}$/.test(id) ? id : null; // 안전한 형식만 반환
} // 함수 끝

export function buildConsentReturnTo(authorizationId: string): string // 로그인 뒤 돌아올 주소
{ // 함수 시작
    return `${CONSENT_PATH}?authorization_id=${encodeURIComponent(authorizationId)}`; // 요청 번호를 유지한 주소
} // 함수 끝

export function describeScopes(scope: string | null | undefined): ConsentScope[] // 요청 정보 설명 만들기
{ // 함수 시작
    const ids = [...new Set((scope ?? "").split(/\s+/).filter(Boolean))]; // 중복 없는 요청 이름
    return ids.map((id) => ({ id, label: SCOPE_LABELS[id] ?? id })); // 설명 붙여 반환(모르는 요청은 이름 그대로)
} // 함수 끝

export function readHost(uri: string | null | undefined): string | null // 주소의 사이트 이름 읽기
{ // 함수 시작
    try // 주소 해석 시도
    { // 시도 시작
        const url = new URL(uri ?? ""); // 주소 해석
        return url.protocol === "https:" || url.protocol === "http:" ? url.host : null; // 웹 주소만 반환
    } // 시도 끝
    catch // 해석 실패 처리
    { // 오류 처리 시작
        return null; // 사이트 이름 없음
    } // 오류 처리 끝
} // 함수 끝

export function toConsentError(error: unknown): ConsentError // 서버 오류 변환
{ // 함수 시작
    if (error instanceof ConsentError) // 이미 변환된 오류 확인
    { // 조건 시작
        return error; // 그대로 반환
    } // 조건 끝
    const record = typeof error === "object" && error ? error as { code?: unknown; message?: unknown; status?: unknown } : {}; // 오류 정보
    const text = `${typeof record.code === "string" ? record.code : ""} ${typeof record.message === "string" ? record.message : ""}`; // 판정용 문구
    const code: ConsentErrorCode = /oauth.*(disabled|not enabled)|feature.*disabled/i.test(text) ? "UNAVAILABLE" : /session|jwt|not authenticated|no_authorization/i.test(text) ? "SIGN_IN_REQUIRED" : record.status === 400 || record.status === 404 || /not[ _]found|expired|invalid|validation/i.test(text) ? "INVALID_REQUEST" : "UNKNOWN"; // 오류 코드 판정
    return new ConsentError(code, CONSENT_ERROR_MESSAGES[code]); // 안내 오류 반환
} // 함수 끝

export async function loadConsentRequest(client: SupabaseClient, authorizationId: string): Promise<ConsentRequest> // 로그인 허용 요청 읽기
{ // 함수 시작
    const result = await client.auth.oauth.getAuthorizationDetails(authorizationId); // 요청 정보 조회
    if (result.error || !result.data) // 조회 실패 확인
    { // 조건 시작
        throw toConsentError(result.error ?? { message: "invalid" }); // 안내 오류 전달
    } // 조건 끝
    if (!("authorization_id" in result.data)) // 이미 허용한 요청 확인
    { // 조건 시작
        if (!readHost(result.data.redirect_url)) // 이동 주소 확인
        { // 조건 시작
            throw new ConsentError("INVALID_REQUEST", CONSENT_ERROR_MESSAGES.INVALID_REQUEST); // 잘못된 이동 주소
        } // 조건 끝
        return { status: "redirect", url: result.data.redirect_url }; // 바로 이동
    } // 조건 끝
    return { status: "consent", authorizationId: result.data.authorization_id, clientName: result.data.client?.name?.trim() || "이름 없는 앱", redirectHost: readHost(result.data.redirect_uri), email: result.data.user?.email ?? null, scopes: describeScopes(result.data.scope) }; // 허용 확인 정보 반환
} // 함수 끝

export async function decideConsent(client: SupabaseClient, authorizationId: string, approve: boolean): Promise<string> // 로그인 허용·거부 처리
{ // 함수 시작
    const result = approve ? await client.auth.oauth.approveAuthorization(authorizationId, { skipBrowserRedirect: true }) : await client.auth.oauth.denyAuthorization(authorizationId, { skipBrowserRedirect: true }); // 결정 전달
    if (result.error || !result.data || !readHost(result.data.redirect_url)) // 처리 실패 확인
    { // 조건 시작
        throw toConsentError(result.error ?? { message: "invalid" }); // 안내 오류 전달
    } // 조건 끝
    return result.data.redirect_url; // 서비스로 돌아갈 주소 반환
} // 함수 끝
