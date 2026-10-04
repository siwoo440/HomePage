import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식
import type { ContactCategory, ContactInput } from "./domain.ts"; // 문의 내용 형식

export const CONTACT_PAGE_SIZE = 20; // 문의함 한 페이지 항목 수
export const CONTACT_NOTE_MAX_LENGTH = 1000; // 처리 메모 최대 글자 수
export const CONTACT_FILTERS = ["pending", "answered", "all"] as const; // 문의함 목록 종류
export type ContactFilter = typeof CONTACT_FILTERS[number]; // 목록 종류 형식
export type ContactStatus = "pending" | "answered"; // 처리 상태 형식
export const CONTACT_FILTER_LABELS: Record<ContactFilter, string> = { pending: "답변 대기", answered: "답변 완료", all: "전체" }; // 목록 종류 이름
export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = { pending: "답변 대기", answered: "답변 완료" }; // 처리 상태 이름
export const CONTACT_DONE_MESSAGES: Record<ContactStatus, string> = { pending: "답변 대기로 되돌렸습니다.", answered: "답변 완료로 표시했습니다." }; // 처리 결과 안내

export interface ContactMessage // 저장된 문의
{ // 형식 시작
    id: string; // 문의 식별자
    category: ContactCategory; // 문의 분류
    email: string; // 답변 받을 이메일
    subject: string; // 문의 제목
    message: string; // 문의 내용
    status: ContactStatus; // 처리 상태
    adminNote: string; // 관리자 메모
    createdAt: string; // 접수 시각
    handledAt: string | null; // 처리 시각
} // 형식 끝

export interface ContactPage // 문의함 목록 결과
{ // 형식 시작
    items: ContactMessage[]; // 현재 페이지 문의
    total: number; // 전체 문의 수
} // 형식 끝

export interface ContactUpdate // 문의 처리 입력
{ // 형식 시작
    id: string; // 문의 식별자
    status: ContactStatus; // 바꿀 처리 상태
    note: string; // 관리자 메모
} // 형식 끝

export interface ContactActionResult // 문의 처리 결과
{ // 형식 시작
    ok: boolean; // 성공 여부
    message: string; // 결과 안내
    item?: ContactMessage; // 처리 뒤 문의
} // 형식 끝

export interface ContactInboxService // 문의함 서비스 계약
{ // 형식 시작
    list(filter: ContactFilter, page: number): Promise<ContactPage>; // 목록 조회
    update(input: ContactUpdate, adminId: string): Promise<ContactMessage>; // 처리 상태 변경
} // 형식 끝

export class ContactInboxError extends Error // 문의함 오류
{ // 형식 시작
    readonly code: "INVALID_INPUT" | "NOT_FOUND" | "UNKNOWN"; // 오류 코드

    constructor(code: "INVALID_INPUT" | "NOT_FOUND" | "UNKNOWN", message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "ContactInboxError"; // 오류 이름
        this.code = code; // 오류 코드 저장
    } // 생성 끝
} // 형식 끝

interface ContactRow // 문의 테이블 행
{ // 형식 시작
    id: string; // 문의 식별자
    category: string; // 문의 분류
    email: string; // 이메일
    subject: string; // 제목
    message: string; // 내용
    status: string; // 처리 상태
    admin_note: string | null; // 관리자 메모
    created_at: string; // 접수 시각
    handled_at: string | null; // 처리 시각
} // 형식 끝

const CONTACT_COLUMNS = "id, category, email, subject, message, status, admin_note, created_at, handled_at"; // 조회 열

function toContactMessage(row: ContactRow): ContactMessage // 행을 화면 형식으로 변환
{ // 함수 시작
    return { id: row.id, category: row.category as ContactCategory, email: row.email, subject: row.subject, message: row.message, status: row.status === "answered" ? "answered" : "pending", adminNote: row.admin_note ?? "", createdAt: row.created_at, handledAt: row.handled_at }; // 문의 반환
} // 함수 끝

export function parseContactFilter(value: unknown): ContactFilter // 목록 종류 해석
{ // 함수 시작
    return CONTACT_FILTERS.find((filter) => filter === value) ?? "pending"; // 허용 값 또는 기본값
} // 함수 끝

export function parseContactUpdate(input: { id?: unknown; status?: unknown; note?: unknown }): ContactUpdate // 처리 입력 검증
{ // 함수 시작
    const id = typeof input.id === "string" ? input.id.trim() : ""; // 문의 식별자
    const note = typeof input.note === "string" ? input.note.trim() : ""; // 관리자 메모
    if (!id || (input.status !== "pending" && input.status !== "answered")) // 필수 값 확인
    { // 조건 시작
        throw new ContactInboxError("INVALID_INPUT", "처리 내용을 확인해 주세요."); // 입력 오류
    } // 조건 끝
    if ([...note].length > CONTACT_NOTE_MAX_LENGTH) // 메모 길이 확인
    { // 조건 시작
        throw new ContactInboxError("INVALID_INPUT", "처리 메모는 1,000자 이하로 입력해 주세요."); // 길이 오류
    } // 조건 끝
    return { id, status: input.status, note }; // 검증된 입력 반환
} // 함수 끝

export function applyContactUpdate(item: ContactMessage, update: ContactUpdate, now: string): ContactMessage // 문의 처리 적용
{ // 함수 시작
    return { ...item, status: update.status, adminNote: update.note || item.adminNote, handledAt: update.status === "answered" ? now : null }; // 처리 뒤 문의 반환
} // 함수 끝

export async function saveContactMessage(client: SupabaseClient, value: ContactInput): Promise<void> // 문의 저장
{ // 함수 시작
    const result = await client.from("contact_messages").insert({ category: value.category, email: value.email, subject: value.subject, message: value.message }); // 문의 추가
    if (result.error) // 저장 실패 확인
    { // 조건 시작
        throw new ContactInboxError("UNKNOWN", "문의를 접수하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 저장 오류
    } // 조건 끝
} // 함수 끝

export function createSupabaseContactInbox({ client, now = () => new Date().toISOString() }: { client: SupabaseClient; now?: () => string }): ContactInboxService // Supabase 문의함 생성
{ // 함수 시작
    async function list(filter: ContactFilter, page: number): Promise<ContactPage> // 목록 조회
    { // 함수 시작
        const from = (Math.max(1, page) - 1) * CONTACT_PAGE_SIZE; // 시작 위치
        const query = client.from("contact_messages").select(CONTACT_COLUMNS, { count: "exact" }); // 문의 조회
        const scoped = filter === "all" ? query : query.eq("status", filter); // 상태 조건
        const result = await scoped.order("created_at", { ascending: false }).range(from, from + CONTACT_PAGE_SIZE - 1); // 최신순 현재 페이지
        if (result.error) // 조회 실패 확인
        { // 조건 시작
            throw new ContactInboxError("UNKNOWN", "문의 목록을 불러오지 못했습니다."); // 조회 오류
        } // 조건 끝
        return { items: ((result.data ?? []) as ContactRow[]).map(toContactMessage), total: result.count ?? 0 }; // 목록 반환
    } // 함수 끝

    async function update(input: ContactUpdate, adminId: string): Promise<ContactMessage> // 처리 상태 변경
    { // 함수 시작
        const answered = input.status === "answered"; // 답변 완료 여부
        const changes: Record<string, unknown> = { status: input.status, handled_at: answered ? now() : null, handled_by: answered ? adminId : null }; // 바꿀 값
        if (input.note) // 메모 입력 확인
        { // 조건 시작
            changes.admin_note = input.note; // 메모 저장
        } // 조건 끝
        const result = await client.from("contact_messages").update(changes).eq("id", input.id).select(CONTACT_COLUMNS).maybeSingle(); // 문의 수정
        if (result.error) // 수정 실패 확인
        { // 조건 시작
            throw new ContactInboxError("UNKNOWN", "처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 수정 오류
        } // 조건 끝
        if (!result.data) // 대상 없음 확인
        { // 조건 시작
            throw new ContactInboxError("NOT_FOUND", "문의를 찾을 수 없습니다."); // 대상 없음 오류
        } // 조건 끝
        return toContactMessage(result.data as ContactRow); // 처리 뒤 문의 반환
    } // 함수 끝

    return { list, update }; // 서비스 반환
} // 함수 끝

export function createLocalContactInbox(seed: ContactMessage[], now: () => string = () => new Date().toISOString()): ContactInboxService // 메모리 문의함 생성
{ // 함수 시작
    let items = seed.map((item) => ({ ...item })); // 문의 복사본

    async function list(filter: ContactFilter, page: number): Promise<ContactPage> // 목록 조회
    { // 함수 시작
        const matched = items.filter((item) => filter === "all" || item.status === filter).sort((left, right) => right.createdAt.localeCompare(left.createdAt)); // 조건·최신순
        const from = (Math.max(1, page) - 1) * CONTACT_PAGE_SIZE; // 시작 위치
        return { items: matched.slice(from, from + CONTACT_PAGE_SIZE).map((item) => ({ ...item })), total: matched.length }; // 목록 반환
    } // 함수 끝

    async function update(input: ContactUpdate): Promise<ContactMessage> // 처리 상태 변경
    { // 함수 시작
        const current = items.find((item) => item.id === input.id); // 대상 문의
        if (!current) // 대상 없음 확인
        { // 조건 시작
            throw new ContactInboxError("NOT_FOUND", "문의를 찾을 수 없습니다."); // 대상 없음 오류
        } // 조건 끝
        const next = applyContactUpdate(current, input, now()); // 처리 적용
        items = items.map((item) => (item.id === next.id ? next : item)); // 목록 갱신
        return { ...next }; // 처리 뒤 문의 반환
    } // 함수 끝

    return { list, update }; // 서비스 반환
} // 함수 끝

export function createDemoContactMessages(): ContactMessage[] // 시연 문의 생성
{ // 함수 시작
    return [ // 시연 목록
        { id: "demo-contact-1", category: "game", email: "player@example.com", subject: "프로젝트 C 출시 일정 문의", message: "카오스폰즈 체험판이 언제 공개되는지 궁금합니다. 공개되면 알림을 받을 방법이 있을까요?", status: "pending", adminNote: "", createdAt: "2026-10-03T09:10:00.000Z", handledAt: null }, // 게임 문의
        { id: "demo-contact-2", category: "account", email: "member@example.com", subject: "닉네임 변경 방법", message: "댓글에 표시되는 닉네임을 바꾸고 싶은데 어디에서 바꿀 수 있나요?", status: "answered", adminNote: "내 정보 페이지 안내 완료", createdAt: "2026-10-02T04:30:00.000Z", handledAt: "2026-10-02T06:00:00.000Z" }, // 회원 문의
        { id: "demo-contact-3", category: "goods", email: "fan@example.com", subject: "굿즈 재입고 문의", message: "아크릴 키링은 언제부터 구매할 수 있나요? 해외 배송도 가능한지 알고 싶습니다.", status: "pending", adminNote: "", createdAt: "2026-10-01T12:00:00.000Z", handledAt: null }, // 굿즈 문의
    ]; // 시연 목록 끝
} // 함수 끝
