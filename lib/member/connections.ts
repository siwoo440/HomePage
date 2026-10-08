import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식
import { SOCIAL_PROVIDERS, type SocialProviderId } from "./auth-providers.ts"; // 간편 로그인 목록

export const EMAIL_LOGIN_ID = "email"; // 이메일·비밀번호 로그인 식별자

export interface AccountIdentity // 계정에 연결된 로그인 수단 원본
{ // 형식 시작
    identity_id?: string; // 연결 식별자
    id?: string; // 로그인 서비스 쪽 식별자
    user_id?: string; // 회원 식별자
    provider: string; // 로그인 서비스 이름
    identity_data?: Record<string, unknown> | null; // 로그인 서비스가 넘겨준 정보
    created_at?: string | null; // 연결 시각
    last_sign_in_at?: string | null; // 마지막 사용 시각
} // 형식 끝

export interface AccountUser // 내 정보에 쓰는 회원 원본
{ // 형식 시작
    id: string; // 회원 식별자
    email?: string | null; // 로그인 이메일
    created_at?: string | null; // 가입 시각
    last_sign_in_at?: string | null; // 마지막 로그인 시각
    email_confirmed_at?: string | null; // 이메일 인증 시각
    identities?: AccountIdentity[] | null; // 연결된 로그인 수단
} // 형식 끝

export interface AccountSummary // 계정 기본 정보
{ // 형식 시작
    email: string | null; // 로그인 이메일
    joinedAt: string | null; // 가입 시각
    lastSignInAt: string | null; // 마지막 로그인 시각
    emailVerified: boolean; // 이메일 인증 여부
} // 형식 끝

export interface LinkedLogin // 화면에 보여 줄 로그인 수단
{ // 형식 시작
    key: string; // 목록 구분 값
    provider: string; // 로그인 서비스 이름
    label: string; // 화면 표시 이름
    account: string | null; // 로그인 서비스 쪽 계정(이메일)
    linkedAt: string | null; // 연결 시각
    lastUsedAt: string | null; // 마지막 사용 시각
    removable: boolean; // 연결 해제 가능 여부
} // 형식 끝

export type ConnectionErrorCode = "SIGN_IN_REQUIRED" | "LINKING_DISABLED" | "ALREADY_LINKED" | "LAST_LOGIN" | "NOT_FOUND" | "UNKNOWN"; // 로그인 연동 오류 코드

export class ConnectionError extends Error // 로그인 연동 오류
{ // 형식 시작
    readonly code: ConnectionErrorCode; // 오류 코드

    constructor(code: ConnectionErrorCode, message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "ConnectionError"; // 오류 이름
        this.code = code; // 오류 코드 저장
    } // 생성 끝
} // 형식 끝

const CONNECTION_ERROR_MESSAGES = // 오류 안내 문구
{ // 문구 시작
    SIGN_IN_REQUIRED: "로그인이 끝났습니다. 다시 로그인한 뒤 시도해 주세요.", // 세션 만료
    LINKING_DISABLED: "로그인 연결 기능이 아직 켜져 있지 않습니다.", // 수동 연결 꺼짐
    ALREADY_LINKED: "이 로그인은 이미 다른 계정에 연결되어 있습니다.", // 다른 계정에 연결됨
    LAST_LOGIN: "로그인 방법이 하나뿐이면 연결을 해제할 수 없습니다.", // 마지막 로그인 수단
    NOT_FOUND: "연결된 로그인을 찾을 수 없습니다.", // 대상 없음
    UNKNOWN: "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.", // 기타 오류
} as const; // 문구 끝

const ERROR_CODE_HINTS: [ConnectionErrorCode, RegExp][] = // 서버 오류 문구와 코드 대응
[ // 대응 시작
    ["LINKING_DISABLED", /manual_linking_disabled|manual linking is disabled/i], // 수동 연결 꺼짐
    ["ALREADY_LINKED", /identity_already_exists|already linked/i], // 이미 연결됨
    ["LAST_LOGIN", /single_identity_not_deletable|at least (1|one|2|two) identit/i], // 마지막 로그인 수단
    ["NOT_FOUND", /identity_not_found/i], // 대상 없음
    ["SIGN_IN_REQUIRED", /session_not_found|not authenticated|jwt expired|no_authorization/i], // 세션 만료
]; // 대응 끝

export function toConnectionError(error: unknown): ConnectionError // 서버 오류 변환
{ // 함수 시작
    if (error instanceof ConnectionError) // 이미 변환된 오류 확인
    { // 조건 시작
        return error; // 그대로 반환
    } // 조건 끝
    const record = typeof error === "object" && error ? error as { code?: unknown; message?: unknown } : {}; // 오류 정보
    const text = `${typeof record.code === "string" ? record.code : ""} ${typeof record.message === "string" ? record.message : ""}`; // 판정용 문구
    const code = ERROR_CODE_HINTS.find((hint) => hint[1].test(text))?.[0] ?? "UNKNOWN"; // 오류 코드 판정
    return new ConnectionError(code, CONNECTION_ERROR_MESSAGES[code]); // 안내 오류 반환
} // 함수 끝

function readDate(value: unknown): string | null // 시각 문자열 확인
{ // 함수 시작
    return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null; // 올바른 시각만 반환
} // 함수 끝

export function readAccountSummary(user: AccountUser): AccountSummary // 계정 기본 정보 읽기
{ // 함수 시작
    return ( // 기본 정보 반환
    { // 정보 시작
        email: user.email?.trim() || null, // 로그인 이메일
        joinedAt: readDate(user.created_at), // 가입 시각
        lastSignInAt: readDate(user.last_sign_in_at), // 마지막 로그인 시각
        emailVerified: readDate(user.email_confirmed_at) !== null, // 이메일 인증 여부
    }); // 정보 끝
} // 함수 끝

export function getLoginLabel(provider: string): string // 로그인 수단 표시 이름
{ // 함수 시작
    if (provider === EMAIL_LOGIN_ID) // 이메일 로그인 확인
    { // 조건 시작
        return "이메일·비밀번호"; // 이메일 로그인 이름
    } // 조건 끝
    return SOCIAL_PROVIDERS.find((candidate) => candidate.id === provider)?.label ?? provider; // 간편 로그인 이름(모르는 서비스는 원래 이름)
} // 함수 끝

export function readLinkedLogins(user: AccountUser): LinkedLogin[] // 연결된 로그인 수단 읽기
{ // 함수 시작
    const identities = (user.identities ?? []).filter((identity) => typeof identity?.provider === "string" && identity.provider !== ""); // 올바른 연결만
    return identities.map((identity, index) => // 화면 형식 변환
    { // 변환 시작
        const account = typeof identity.identity_data?.email === "string" && identity.identity_data.email.trim() !== "" ? identity.identity_data.email.trim() : null; // 로그인 서비스 쪽 이메일
        const removable = identity.provider !== EMAIL_LOGIN_ID && identities.length >= 2; // 간편 로그인이고 다른 로그인 방법이 남을 때만 해제
        return { key: identity.identity_id ?? `${identity.provider}:${identity.id ?? index}`, provider: identity.provider, label: getLoginLabel(identity.provider), account, linkedAt: readDate(identity.created_at), lastUsedAt: readDate(identity.last_sign_in_at), removable }; // 로그인 수단 반환
    }).sort((a, b) => Number(b.provider === EMAIL_LOGIN_ID) - Number(a.provider === EMAIL_LOGIN_ID) || (a.linkedAt ?? "").localeCompare(b.linkedAt ?? "")); // 이메일 먼저, 다음은 연결한 순서
} // 함수 끝

export function listLinkableProviders(enabled: readonly SocialProviderId[], logins: readonly LinkedLogin[]): typeof SOCIAL_PROVIDERS[number][] // 새로 연결할 수 있는 간편 로그인
{ // 함수 시작
    const linked = new Set(logins.map((login) => login.provider)); // 이미 연결된 서비스
    return SOCIAL_PROVIDERS.filter((provider) => enabled.includes(provider.id) && !linked.has(provider.id)); // 켜져 있고 아직 연결하지 않은 서비스
} // 함수 끝

export async function startLoginLink(client: SupabaseClient, provider: SocialProviderId, redirectTo: string): Promise<void> // 간편 로그인 연결 시작
{ // 함수 시작
    const result = await client.auth.linkIdentity({ provider, options: { redirectTo } }); // 로그인 서비스로 이동 요청
    if (result.error) // 요청 실패 확인
    { // 조건 시작
        throw toConnectionError(result.error); // 안내 오류 전달
    } // 조건 끝
} // 함수 끝

export async function removeLoginLink(client: SupabaseClient, key: string): Promise<AccountUser> // 간편 로그인 연결 해제
{ // 함수 시작
    const listed = await client.auth.getUserIdentities(); // 현재 연결 목록 조회
    if (listed.error) // 조회 실패 확인
    { // 조건 시작
        throw toConnectionError(listed.error); // 안내 오류 전달
    } // 조건 끝
    const identities = listed.data?.identities ?? []; // 연결 목록
    const target = identities.find((identity) => identity.identity_id === key); // 해제 대상
    if (!target) // 대상 확인
    { // 조건 시작
        throw new ConnectionError("NOT_FOUND", CONNECTION_ERROR_MESSAGES.NOT_FOUND); // 대상 없음 안내
    } // 조건 끝
    if (!readLinkedLogins({ id: target.user_id ?? "", identities }).find((login) => login.key === key)?.removable) // 해제 가능 여부 확인
    { // 조건 시작
        throw new ConnectionError("LAST_LOGIN", CONNECTION_ERROR_MESSAGES.LAST_LOGIN); // 마지막 로그인 수단 보호
    } // 조건 끝
    const removed = await client.auth.unlinkIdentity(target); // 연결 해제 요청
    if (removed.error) // 해제 실패 확인
    { // 조건 시작
        throw toConnectionError(removed.error); // 안내 오류 전달
    } // 조건 끝
    const refreshed = await client.auth.getUser(); // 바뀐 회원 정보 조회
    if (refreshed.error || !refreshed.data.user) // 조회 실패 확인
    { // 조건 시작
        throw new ConnectionError("SIGN_IN_REQUIRED", CONNECTION_ERROR_MESSAGES.SIGN_IN_REQUIRED); // 다시 로그인 안내
    } // 조건 끝
    return refreshed.data.user; // 바뀐 회원 정보 반환
} // 함수 끝
