import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식
import { isVerseServiceAvailable, VERSE_SERVICES } from "../../scripts/verse-services.mjs"; // Verse 계열 서비스 목록

export const HOMEPAGE_SERVICE_ID = "homepage"; // 홈페이지 서비스 식별자
export const HOMEPAGE_SERVICE_NAME = "Palettra Games"; // 홈페이지 서비스 이름

export type ServiceState = "current" | "connected" | "available" | "preparing"; // 서비스 연결 상태(지금 서비스·연결됨·연결 가능·준비 중)

export interface ServiceSummaryItem // 서비스 요약 한 줄
{ // 형식 시작
    label: string; // 항목 이름
    value: string; // 항목 값
} // 형식 끝

export interface ConnectedService // 화면에 보여 줄 서비스
{ // 형식 시작
    id: string; // 서비스 식별자
    name: string; // 서비스 이름
    state: ServiceState; // 연결 상태
    url: string | null; // 이동 주소
    clientId: string | null; // OAuth 클라이언트 식별자
    grantedAt: string | null; // 로그인 허용 시각
    firstUsedAt: string | null; // 처음 이용 시각
    lastUsedAt: string | null; // 마지막 이용 시각
    summary: ServiceSummaryItem[]; // 서비스 요약
    revocable: boolean; // 연결 해제 가능 여부
} // 형식 끝

export interface ServiceRegistration // 통합 계정에 등록된 서비스
{ // 형식 시작
    id: string; // 서비스 식별자
    oauthClientId: string | null; // OAuth 클라이언트 식별자
} // 형식 끝

export interface ServiceLink // 서비스 이용 기록
{ // 형식 시작
    serviceId: string; // 서비스 식별자
    summary: Record<string, unknown>; // 서비스가 알려 준 요약
    firstUsedAt: string | null; // 처음 이용 시각
    lastUsedAt: string | null; // 마지막 이용 시각
} // 형식 끝

export interface ServiceGrant // 로그인 허용 기록
{ // 형식 시작
    clientId: string; // OAuth 클라이언트 식별자
    clientName: string; // OAuth 클라이언트 이름
    grantedAt: string | null; // 허용 시각
} // 형식 끝

export interface ServiceSources // 서비스 목록을 만드는 자료
{ // 형식 시작
    registrations?: readonly ServiceRegistration[]; // 등록된 서비스
    links?: readonly ServiceLink[]; // 이용 기록
    grants?: readonly ServiceGrant[]; // 로그인 허용 기록
    joinedAt?: string | null; // 홈페이지 가입 시각
    nickname?: string | null; // 홈페이지 닉네임
} // 형식 끝

export type ServiceErrorCode = "SIGN_IN_REQUIRED" | "UNKNOWN"; // 서비스 연결 오류 코드

export class ServiceError extends Error // 서비스 연결 오류
{ // 형식 시작
    readonly code: ServiceErrorCode; // 오류 코드

    constructor(code: ServiceErrorCode, message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "ServiceError"; // 오류 이름
        this.code = code; // 오류 코드 저장
    } // 생성 끝
} // 형식 끝

const SERVICE_ERROR_MESSAGES = // 오류 안내 문구
{ // 문구 시작
    SIGN_IN_REQUIRED: "로그인이 끝났습니다. 다시 로그인한 뒤 시도해 주세요.", // 세션 만료
    UNKNOWN: "서비스 연결을 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.", // 기타 오류
} as const; // 문구 끝

function readDate(value: unknown): string | null // 시각 문자열 확인
{ // 함수 시작
    return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : null; // 올바른 시각만 반환
} // 함수 끝

function readText(value: unknown, limit = 40): string | null // 요약 글자 확인
{ // 함수 시작
    const text = typeof value === "string" ? value.replace(/[\u0000-\u001f\u007f]/g, "").trim() : ""; // 제어 문자 제거
    return text ? [...text].slice(0, limit).join("") : null; // 길이 제한 뒤 반환
} // 함수 끝

export function readServiceSummary(summary: Record<string, unknown> | null | undefined): ServiceSummaryItem[] // 서비스 요약 읽기(정해 둔 항목만)
{ // 함수 시작
    const source = summary && typeof summary === "object" ? summary : {}; // 요약 원본
    const items: ServiceSummaryItem[] = []; // 요약 줄 목록
    const nickname = readText(source.nickname); // 서비스 안 닉네임
    const plan = readText(source.plan); // 이용 상품
    if (nickname) // 닉네임 확인
    { // 조건 시작
        items.push({ label: "닉네임", value: nickname }); // 닉네임 줄
    } // 조건 끝
    if (plan) // 이용 상품 확인
    { // 조건 시작
        items.push({ label: "이용 상품", value: plan }); // 이용 상품 줄
    } // 조건 끝
    if (typeof source.adult_verified === "boolean") // 성인 확인 여부 확인
    { // 조건 시작
        items.push({ label: "성인 확인", value: source.adult_verified ? "완료" : "하지 않음" }); // 성인 확인 줄
    } // 조건 끝
    return items; // 요약 줄 반환
} // 함수 끝

export function buildConnectedServices(sources: ServiceSources = {}): ConnectedService[] // 화면용 서비스 목록 만들기
{ // 함수 시작
    const registrations = sources.registrations ?? []; // 등록된 서비스
    const links = sources.links ?? []; // 이용 기록
    const grants = sources.grants ?? []; // 로그인 허용 기록
    const nickname = readText(sources.nickname, 20); // 홈페이지 닉네임
    const services: ConnectedService[] = [{ id: HOMEPAGE_SERVICE_ID, name: HOMEPAGE_SERVICE_NAME, state: "current", url: null, clientId: null, grantedAt: null, firstUsedAt: readDate(sources.joinedAt), lastUsedAt: null, summary: nickname ? [{ label: "닉네임", value: nickname }] : [], revocable: false }]; // 홈페이지부터 표시
    const known = new Set<string>(); // 목록에 넣은 클라이언트
    for (const service of VERSE_SERVICES) // Verse 계열 서비스 반복
    { // 반복 시작
        const clientId = registrations.find((registration) => registration.id === service.id)?.oauthClientId ?? null; // 서비스의 OAuth 클라이언트
        const grant = clientId ? grants.find((candidate) => candidate.clientId === clientId) : undefined; // 로그인 허용 기록
        const link = links.find((candidate) => candidate.serviceId === service.id); // 이용 기록
        const available = isVerseServiceAvailable(service); // 접속 주소 확정 여부
        const state: ServiceState = grant || link ? "connected" : clientId && available ? "available" : "preparing"; // 연결 상태 판정
        if (clientId) // 클라이언트 확인
        { // 조건 시작
            known.add(clientId); // 처리한 클라이언트 기록
        } // 조건 끝
        services.push({ id: service.id, name: service.name, state, url: available ? service.url : null, clientId, grantedAt: grant?.grantedAt ?? null, firstUsedAt: link?.firstUsedAt ?? null, lastUsedAt: link?.lastUsedAt ?? null, summary: readServiceSummary(link?.summary), revocable: Boolean(grant || link) }); // 서비스 추가
    } // 반복 끝
    for (const grant of grants) // 목록에 없는 앱의 허용 기록 반복
    { // 반복 시작
        if (!known.has(grant.clientId)) // 처리하지 않은 클라이언트 확인
        { // 조건 시작
            services.push({ id: `client:${grant.clientId}`, name: readText(grant.clientName, 60) ?? "이름 없는 앱", state: "connected", url: null, clientId: grant.clientId, grantedAt: grant.grantedAt, firstUsedAt: null, lastUsedAt: null, summary: [], revocable: true }); // 그 밖에 허용한 앱 추가
        } // 조건 끝
    } // 반복 끝
    return services; // 서비스 목록 반환
} // 함수 끝

export async function listServiceRegistrations(client: SupabaseClient): Promise<ServiceRegistration[]> // 등록된 서비스 조회
{ // 함수 시작
    const result = await client.from("account_services").select("id, oauth_client_id"); // 서비스 목록 요청
    if (result.error) // 조회 실패 확인
    { // 조건 시작
        throw new ServiceError("UNKNOWN", SERVICE_ERROR_MESSAGES.UNKNOWN); // 안내 오류 전달
    } // 조건 끝
    return ((result.data ?? []) as { id: string; oauth_client_id: string | null }[]).map((row) => ({ id: row.id, oauthClientId: row.oauth_client_id || null })); // 화면 형식 반환
} // 함수 끝

export async function listServiceLinks(client: SupabaseClient, userId: string): Promise<ServiceLink[]> // 본인 서비스 이용 기록 조회
{ // 함수 시작
    const result = await client.from("member_service_links").select("service_id, summary, first_used_at, last_used_at").eq("member_id", userId); // 본인 기록 요청
    if (result.error) // 조회 실패 확인
    { // 조건 시작
        throw new ServiceError("UNKNOWN", SERVICE_ERROR_MESSAGES.UNKNOWN); // 안내 오류 전달
    } // 조건 끝
    return ((result.data ?? []) as { service_id: string; summary: Record<string, unknown> | null; first_used_at: string | null; last_used_at: string | null }[]).map((row) => ({ serviceId: row.service_id, summary: row.summary ?? {}, firstUsedAt: readDate(row.first_used_at), lastUsedAt: readDate(row.last_used_at) })); // 화면 형식 반환
} // 함수 끝

export async function listServiceGrants(client: SupabaseClient): Promise<ServiceGrant[]> // 로그인을 허용한 앱 조회
{ // 함수 시작
    const result = await client.auth.oauth.listGrants(); // 허용 기록 요청
    if (result.error) // 조회 실패 확인
    { // 조건 시작
        throw new ServiceError("UNKNOWN", SERVICE_ERROR_MESSAGES.UNKNOWN); // 안내 오류 전달
    } // 조건 끝
    return (result.data ?? []).filter((grant) => typeof grant?.client?.id === "string" && grant.client.id !== "").map((grant) => ({ clientId: grant.client.id, clientName: grant.client.name ?? "", grantedAt: readDate(grant.granted_at) })); // 화면 형식 반환
} // 함수 끝

export async function loadConnectedServices(client: SupabaseClient, userId: string, account: { joinedAt?: string | null; nickname?: string | null } = {}): Promise<{ services: ConnectedService[]; ready: boolean }> // 연결된 서비스 불러오기
{ // 함수 시작
    const [registrations, links, grants] = await Promise.allSettled([listServiceRegistrations(client), listServiceLinks(client, userId), listServiceGrants(client)]); // 세 자료를 함께 조회
    const services = buildConnectedServices({ registrations: registrations.status === "fulfilled" ? registrations.value : [], links: links.status === "fulfilled" ? links.value : [], grants: grants.status === "fulfilled" ? grants.value : [], joinedAt: account.joinedAt, nickname: account.nickname }); // 조회된 자료로 목록 구성
    return { services, ready: registrations.status === "fulfilled" && links.status === "fulfilled" && grants.status === "fulfilled" }; // 목록과 준비 여부 반환(설정 전에는 준비 안 됨)
} // 함수 끝

export async function disconnectService(client: SupabaseClient, userId: string, service: Pick<ConnectedService, "id" | "clientId" | "revocable">): Promise<void> // 서비스 연결 해제
{ // 함수 시작
    if (!service.revocable) // 해제 가능 여부 확인
    { // 조건 시작
        throw new ServiceError("UNKNOWN", SERVICE_ERROR_MESSAGES.UNKNOWN); // 해제할 수 없는 서비스
    } // 조건 끝
    if (service.clientId) // 로그인 허용 기록 확인
    { // 조건 시작
        const revoked = await client.auth.oauth.revokeGrant({ clientId: service.clientId }); // 로그인 허용 취소
        if (revoked.error && !/not[ _]found/i.test(`${revoked.error.code ?? ""} ${revoked.error.message}`)) // 취소 실패 확인(이미 없으면 통과)
        { // 조건 시작
            throw new ServiceError(/session|jwt|not authenticated/i.test(revoked.error.message) ? "SIGN_IN_REQUIRED" : "UNKNOWN", /session|jwt|not authenticated/i.test(revoked.error.message) ? SERVICE_ERROR_MESSAGES.SIGN_IN_REQUIRED : SERVICE_ERROR_MESSAGES.UNKNOWN); // 안내 오류 전달
        } // 조건 끝
    } // 조건 끝
    if (!service.id.startsWith("client:")) // 등록된 서비스 확인
    { // 조건 시작
        const removed = await client.from("member_service_links").delete().eq("member_id", userId).eq("service_id", service.id); // 이용 기록 삭제
        if (removed.error) // 삭제 실패 확인
        { // 조건 시작
            throw new ServiceError("UNKNOWN", SERVICE_ERROR_MESSAGES.UNKNOWN); // 안내 오류 전달
        } // 조건 끝
    } // 조건 끝
} // 함수 끝
