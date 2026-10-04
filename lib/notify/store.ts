import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 연결 형식
import { listNotifyProjects, type NotifyInput } from "./domain.ts"; // 출시 알림 규칙

export interface NotifyCountRow // 게임별 집계 행
{ // 형식 시작
    project_id: string; // 프로젝트 식별자
    active_count: number | string | null; // 수신 중 신청 수
    confirmed_count?: number | string | null; // 본인 확인을 마친 신청 수
    unsubscribed_count: number | string | null; // 수신 거부 수
} // 형식 끝

export interface NotifySummaryItem // 관리자 화면 집계 항목
{ // 형식 시작
    projectId: string; // 프로젝트 식별자
    symbol: string; // 화면 표시 문자
    title: string; // 공개 제목
    open: boolean; // 지금 신청을 받는 프로젝트 여부
    active: number; // 수신 중 신청 수
    confirmed: number; // 본인 확인을 마친 신청 수
    unsubscribed: number; // 수신 거부 수
} // 형식 끝

export interface NotifySummary // 관리자 화면 집계
{ // 형식 시작
    items: NotifySummaryItem[]; // 게임별 집계
    totalActive: number; // 전체 수신 중 신청 수
    totalConfirmed: number; // 전체 확인 완료 수
    totalUnsubscribed: number; // 전체 수신 거부 수
} // 형식 끝

export class NotifyStoreError extends Error // 출시 알림 저장 오류
{ // 형식 시작
    constructor(message: string) // 오류 생성
    { // 생성 시작
        super(message); // 기본 오류 생성
        this.name = "NotifyStoreError"; // 오류 이름
    } // 생성 끝
} // 형식 끝

function toCount(value: number | string | null | undefined): number // 집계 값을 숫자로 변환
{ // 함수 시작
    const count = Number(value ?? 0); // 숫자 변환
    return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0; // 0 이상의 정수 반환
} // 함수 끝

export function buildNotifySummary(rows: readonly NotifyCountRow[]): NotifySummary // 게임별 집계 정리
{ // 함수 시작
    const counts = new Map(rows.map((row) => [row.project_id, { active: toCount(row.active_count), confirmed: toCount(row.confirmed_count), unsubscribed: toCount(row.unsubscribed_count) }])); // 식별자별 집계
    const projects = listNotifyProjects(); // 신청을 받는 프로젝트
    const known = new Set(projects.map((project) => project.id)); // 신청을 받는 프로젝트 식별자
    const open = projects.map((project) => ({ projectId: project.id, symbol: project.symbol, title: project.title, open: true, active: counts.get(project.id)?.active ?? 0, confirmed: counts.get(project.id)?.confirmed ?? 0, unsubscribed: counts.get(project.id)?.unsubscribed ?? 0 })); // 신청을 받는 프로젝트 집계
    const closed = [...counts].filter(([projectId]) => !known.has(projectId)).map(([projectId, count]) => ({ projectId, symbol: "?", title: projectId, open: false, ...count })); // 지금은 받지 않는 프로젝트의 기존 신청
    const items = [...open, ...closed].sort((left, right) => right.active - left.active); // 신청 많은 순서(같으면 기존 순서)
    const total = (pick: (item: NotifySummaryItem) => number) => items.reduce((sum, item) => sum + pick(item), 0); // 합계 계산 도구
    return { items, totalActive: total((item) => item.active), totalConfirmed: total((item) => item.confirmed), totalUnsubscribed: total((item) => item.unsubscribed) }; // 집계 반환
} // 함수 끝

export async function saveNotifyRequest(client: SupabaseClient, value: NotifyInput): Promise<void> // 출시 알림 신청 저장
{ // 함수 시작
    const result = await client.rpc("subscribe_release_notification", { p_project_id: value.projectId, p_email: value.email }); // 신청 함수 호출(같은 신청은 한 번만 저장)
    if (result.error) // 저장 실패 확인
    { // 조건 시작
        throw new NotifyStoreError("출시 알림 신청을 받지 못했습니다. 잠시 후 다시 시도해 주세요."); // 저장 오류
    } // 조건 끝
} // 함수 끝

export async function issueNotifyConfirmation(secretClient: SupabaseClient, value: NotifyInput): Promise<string | null> // 확인 메일에 넣을 값 발급(서버 전용 연결)
{ // 함수 시작
    const result = await secretClient.rpc("issue_release_confirmation", { p_project_id: value.projectId, p_email: value.email }); // 발급 함수 호출(이미 확인·최근 발송·하루 한도면 null)
    if (result.error) // 발급 실패 확인
    { // 조건 시작
        throw new NotifyStoreError("확인 메일을 준비하지 못했습니다."); // 발급 오류
    } // 조건 끝
    return typeof result.data === "string" && result.data ? result.data : null; // 확인 값 또는 없음 반환
} // 함수 끝

export async function clearNotifyConfirmationMark(secretClient: SupabaseClient, value: NotifyInput): Promise<void> // 발송 실패 시 발송 표시 지우기(서버 전용 연결)
{ // 함수 시작
    await secretClient.from("release_notifications").update({ confirmation_sent_at: null }).eq("project_id", value.projectId).eq("email", value.email).is("confirmed_at", null); // 확인 전 신청의 발송 시각만 지움(다시 신청하면 재발송)
} // 함수 끝

export async function confirmNotifyRequest(client: SupabaseClient, token: string): Promise<boolean> // 본인 확인 처리
{ // 함수 시작
    const result = await client.rpc("confirm_release_notification", { p_token: token }); // 확인 함수 호출
    if (result.error) // 처리 실패 확인
    { // 조건 시작
        throw new NotifyStoreError("신청을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 처리 오류
    } // 조건 끝
    return result.data === true; // 대상 신청 존재 여부 반환
} // 함수 끝

export async function cancelNotifyRequest(client: SupabaseClient, token: string): Promise<boolean> // 수신 거부 처리
{ // 함수 시작
    const result = await client.rpc("unsubscribe_release_notification", { p_token: token }); // 수신 거부 함수 호출
    if (result.error) // 처리 실패 확인
    { // 조건 시작
        throw new NotifyStoreError("수신 거부를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 처리 오류
    } // 조건 끝
    return result.data === true; // 대상 신청 존재 여부 반환
} // 함수 끝

export async function loadNotifySummary(client: SupabaseClient): Promise<NotifySummary> // 게임별 집계 조회
{ // 함수 시작
    const result = await client.rpc("release_notification_counts"); // 집계 함수 호출(관리자만 결과가 나옴)
    if (result.error) // 조회 실패 확인
    { // 조건 시작
        throw new NotifyStoreError("출시 알림 집계를 불러오지 못했습니다."); // 조회 오류
    } // 조건 끝
    return buildNotifySummary((result.data ?? []) as NotifyCountRow[]); // 정리된 집계 반환
} // 함수 끝

export function createDemoNotifyCounts(): NotifyCountRow[] // 시연 집계 생성
{ // 함수 시작
    return [ // 시연 집계 목록
        { project_id: "project-eta", active_count: 128, confirmed_count: 97, unsubscribed_count: 4 }, // 프로젝트 에타
        { project_id: "project-c", active_count: 86, confirmed_count: 61, unsubscribed_count: 2 }, // 프로젝트 C
        { project_id: "project-a", active_count: 41, confirmed_count: 30, unsubscribed_count: 0 }, // 프로젝트 A
        { project_id: "project-d", active_count: 17, confirmed_count: 9, unsubscribed_count: 1 }, // 프로젝트 D
    ]; // 시연 집계 목록 끝
} // 함수 끝
