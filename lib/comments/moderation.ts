import type { SupabaseClient } from "@supabase/supabase-js"; // Supabase 클라이언트 형식
import { REPORT_REASONS, type ReportReason } from "./domain.ts"; // 신고 사유 목록
import { COMMENT_IMAGE_BUCKET, UNKNOWN_COMMENT_NICKNAME } from "./supabase-service.ts"; // 댓글 저장 설정

export const MODERATION_FILTERS = ["reported", "hidden", "recent"] as const; // 관리 목록 종류
export const MODERATION_ACTIONS = ["hide", "restore", "delete", "dismiss_report"] as const; // 관리 처리 종류
export const MODERATION_NOTE_MAX_LENGTH = 1000; // 처리 메모 최대 길이
export const MODERATION_PAGE_SIZE = 20; // 한 화면 항목 수

export type ModerationFilter = typeof MODERATION_FILTERS[number]; // 관리 목록 형식
export type ModerationAction = typeof MODERATION_ACTIONS[number]; // 관리 처리 형식
export type CommentStatus = "visible" | "hidden" | "deleted"; // 댓글 공개 상태
export type ReportStatus = "pending" | "reviewed" | "dismissed"; // 신고 처리 상태

export const MODERATION_FILTER_LABELS: Record<ModerationFilter, string> = { reported: "신고 대기", hidden: "숨긴 댓글", recent: "최근 댓글" }; // 목록 이름
export const MODERATION_ACTION_LABELS: Record<ModerationAction, string> = { hide: "댓글 숨기기", restore: "다시 공개", delete: "삭제", dismiss_report: "신고 기각" }; // 처리 이름
export const MODERATION_DONE_MESSAGES: Record<ModerationAction, string> = { hide: "댓글을 숨기고 대기 중인 신고를 처리 완료로 바꿨습니다.", restore: "댓글을 다시 공개했습니다.", delete: "댓글을 삭제하고 첨부 이미지를 지웠습니다.", dismiss_report: "대기 중인 신고를 기각했습니다." }; // 처리 완료 안내

export interface ModerationReport // 관리 화면 신고
{ // 형식 시작
    id: string; // 신고 식별자
    reason: ReportReason; // 신고 사유
    detail: string; // 신고 상세
    status: ReportStatus; // 처리 상태
    createdAt: string; // 신고 시각
} // 형식 끝

export interface ModerationItem // 관리 화면 댓글
{ // 형식 시작
    commentId: string; // 댓글 식별자
    newsId: string; // 뉴스 식별자
    newsTitle: string; // 뉴스 제목
    nickname: string; // 작성자 닉네임
    content: string; // 댓글 내용
    imagePath: string | null; // 이미지 저장 경로
    imageUrl: string | null; // 이미지 공개 주소
    status: CommentStatus; // 공개 상태
    createdAt: string; // 작성 시각
    reports: ModerationReport[]; // 신고 목록
} // 형식 끝

export interface ModerationPage // 관리 목록 결과
{ // 형식 시작
    items: ModerationItem[]; // 현재 화면 항목
    total: number; // 전체 항목 수
} // 형식 끝

export interface ModerationInput // 관리 처리 입력
{ // 형식 시작
    commentId: string; // 댓글 식별자
    action: ModerationAction; // 처리 종류
    note: string; // 처리 메모
} // 형식 끝

export interface ModerationActionResult // 관리 처리 결과
{ // 형식 시작
    ok: boolean; // 성공 여부
    message: string; // 안내 문구
    item?: ModerationItem; // 처리 뒤 항목
} // 형식 끝

export interface ModerationService // 관리 서비스 계약
{ // 형식 시작
    list(filter: ModerationFilter, page: number): Promise<ModerationPage>; // 관리 목록 조회
    apply(input: ModerationInput, adminId: string): Promise<ModerationItem>; // 관리 처리 적용
} // 형식 끝

export type ModerationErrorCode = "INVALID_INPUT" | "COMMENT_NOT_FOUND" | "INVALID_STATE" | "FORBIDDEN" | "SERVICE_UNAVAILABLE"; // 관리 오류 코드

export class ModerationError extends Error // 관리 처리 오류
{ // 클래스 시작
    readonly code: ModerationErrorCode; // 오류 코드

    constructor(code: ModerationErrorCode, message: string) // 오류 생성자
    { // 생성자 시작
        super(message); // 기본 오류 생성
        this.name = "ModerationError"; // 오류 이름 설정
        this.code = code; // 오류 코드 저장
    } // 생성자 끝
} // 클래스 끝

export interface ModerationLogEntry // 관리 처리 기록
{ // 형식 시작
    commentId: string; // 댓글 식별자
    adminId: string; // 관리자 식별자
    action: ModerationAction; // 처리 종류
    note: string; // 처리 메모
    createdAt: string; // 처리 시각
} // 형식 끝

export function parseModerationFilter(value: unknown): ModerationFilter // 관리 목록 종류 정리
{ // 함수 시작
    return MODERATION_FILTERS.includes(value as ModerationFilter) ? value as ModerationFilter : "reported"; // 허용 목록 반환
} // 함수 끝

export function parseModerationInput(value: { commentId?: unknown; action?: unknown; note?: unknown }): ModerationInput // 관리 처리 입력 검증
{ // 함수 시작
    const commentId = typeof value.commentId === "string" ? value.commentId.trim() : ""; // 댓글 식별자
    const action = value.action as ModerationAction; // 처리 종류
    const note = typeof value.note === "string" ? value.note.trim() : ""; // 처리 메모

    if (!commentId || commentId.length > 100) // 식별자 확인
    { // 조건 시작
        throw new ModerationError("INVALID_INPUT", "처리할 댓글을 다시 선택해 주세요."); // 식별자 오류
    } // 조건 끝

    if (!MODERATION_ACTIONS.includes(action)) // 처리 종류 확인
    { // 조건 시작
        throw new ModerationError("INVALID_INPUT", "처리 종류를 다시 선택해 주세요."); // 처리 종류 오류
    } // 조건 끝

    if (note.length > MODERATION_NOTE_MAX_LENGTH) // 메모 길이 확인
    { // 조건 시작
        throw new ModerationError("INVALID_INPUT", "처리 메모는 1,000자 이하로 입력해 주세요."); // 메모 길이 오류
    } // 조건 끝

    return { commentId, action, note }; // 정리된 입력 반환
} // 함수 끝

export function countPendingReports(item: ModerationItem): number // 대기 신고 수
{ // 함수 시작
    return item.reports.filter((report) => report.status === "pending").length; // 대기 신고 수 반환
} // 함수 끝

export function getReportReasonLabel(reason: string): string // 신고 사유 이름
{ // 함수 시작
    return REPORT_REASONS.find((item) => item.value === reason)?.label ?? "기타"; // 사유 이름 반환
} // 함수 끝

export function summarizePendingReasons(item: ModerationItem): string // 대기 신고 사유 요약
{ // 함수 시작
    const counts = new Map<string, number>(); // 사유별 개수

    for (const report of item.reports.filter((entry) => entry.status === "pending")) // 대기 신고 반복
    { // 반복 시작
        counts.set(report.reason, (counts.get(report.reason) ?? 0) + 1); // 사유 개수 증가
    } // 반복 끝

    return [...counts].map(([reason, count]) => `${getReportReasonLabel(reason)} ${count}`).join(", "); // 사유 요약 반환
} // 함수 끝

export function getAvailableActions(item: ModerationItem): ModerationAction[] // 가능한 처리 목록
{ // 함수 시작
    if (item.status === "deleted") // 삭제 댓글 확인
    { // 조건 시작
        return []; // 처리 없음 반환
    } // 조건 끝

    const actions: ModerationAction[] = item.status === "visible" ? ["hide", "delete"] : ["restore", "delete"]; // 상태별 기본 처리
    return countPendingReports(item) > 0 ? [...actions, "dismiss_report"] : actions; // 신고 기각 추가
} // 함수 끝

export function applyModerationToItem(item: ModerationItem, action: ModerationAction): ModerationItem // 처리 결과 계산
{ // 함수 시작
    if (!getAvailableActions(item).includes(action)) // 처리 가능 여부 확인
    { // 조건 시작
        throw new ModerationError("INVALID_STATE", "현재 상태에서는 할 수 없는 처리입니다. 목록을 새로 고쳐 주세요."); // 상태 오류
    } // 조건 끝

    const resolveReports = (status: ReportStatus) => item.reports.map((report) => report.status === "pending" ? { ...report, status } : report); // 대기 신고 일괄 변경

    if (action === "hide") // 숨김 처리
    { // 조건 시작
        return { ...item, status: "hidden", reports: resolveReports("reviewed") }; // 숨김 결과 반환
    } // 조건 끝

    if (action === "restore") // 다시 공개 처리
    { // 조건 시작
        return { ...item, status: "visible" }; // 공개 결과 반환
    } // 조건 끝

    if (action === "delete") // 삭제 처리
    { // 조건 시작
        return { ...item, status: "deleted", imagePath: null, imageUrl: null, reports: resolveReports("reviewed") }; // 삭제 결과 반환
    } // 조건 끝

    return { ...item, reports: resolveReports("dismissed") }; // 신고 기각 결과 반환
} // 함수 끝

function latestPendingAt(item: ModerationItem): string // 최근 대기 신고 시각
{ // 함수 시작
    return item.reports.filter((report) => report.status === "pending").map((report) => report.createdAt).sort().at(-1) ?? ""; // 최근 시각 반환
} // 함수 끝

export function createLocalModerationService(seed: ModerationItem[], now: () => string = () => new Date().toISOString()): ModerationService & { log(): ModerationLogEntry[] } // 로컬 관리 서비스 생성
{ // 함수 시작
    let items = seed.map((item) => ({ ...item, reports: item.reports.map((report) => ({ ...report })) })); // 내부 댓글 상태
    const entries: ModerationLogEntry[] = []; // 처리 기록

    return ( // 서비스 반환
    { // 서비스 시작
        async list(filter: ModerationFilter, page: number): Promise<ModerationPage> // 관리 목록 조회
        { // 메서드 시작
            const filtered = filter === "reported" // 목록 종류별 선택
                ? items.filter((item) => countPendingReports(item) > 0).sort((a, b) => latestPendingAt(b).localeCompare(latestPendingAt(a))) // 신고 대기 목록
                : filter === "hidden" // 숨김 목록 확인
                    ? items.filter((item) => item.status === "hidden") // 숨긴 댓글 목록
                    : items.filter((item) => item.status !== "deleted").sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // 최근 댓글 목록
            const start = (Math.max(1, page) - 1) * MODERATION_PAGE_SIZE; // 시작 위치
            return { items: filtered.slice(start, start + MODERATION_PAGE_SIZE).map((item) => ({ ...item, reports: item.reports.map((report) => ({ ...report })) })), total: filtered.length }; // 목록 사본 반환
        }, // 메서드 끝
        async apply(input: ModerationInput, adminId: string): Promise<ModerationItem> // 관리 처리 적용
        { // 메서드 시작
            const current = items.find((item) => item.commentId === input.commentId); // 대상 댓글

            if (!current) // 대상 없음 확인
            { // 조건 시작
                throw new ModerationError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 대상 없음 오류
            } // 조건 끝

            const next = applyModerationToItem(current, input.action); // 처리 결과 계산
            items = items.map((item) => item.commentId === input.commentId ? next : item); // 내부 상태 갱신
            entries.push({ commentId: input.commentId, adminId, action: input.action, note: input.note, createdAt: now() }); // 처리 기록 추가
            return { ...next, reports: next.reports.map((report) => ({ ...report })) }; // 처리 결과 반환
        }, // 메서드 끝
        log(): ModerationLogEntry[] // 처리 기록 조회
        { // 메서드 시작
            return entries.map((entry) => ({ ...entry })); // 기록 사본 반환
        }, // 메서드 끝
    }); // 서비스 끝
} // 함수 끝

interface DatabaseError // 데이터베이스 오류 형식
{ // 형식 시작
    code?: string; // 오류 코드
    message?: string; // 오류 내용
} // 형식 끝

function toModerationError(error: DatabaseError | null | undefined): ModerationError // 서버 오류 변환
{ // 함수 시작
    const code = error?.code ?? ""; // 오류 코드

    if (code === "42501" || code.startsWith("PGRST30") || (error?.message ?? "").includes("COMMENT_STATUS_ADMIN_ONLY")) // 권한 오류 확인
    { // 조건 시작
        return new ModerationError("FORBIDDEN", "관리자 권한을 확인할 수 없습니다. 다시 로그인해 주세요."); // 권한 오류 반환
    } // 조건 끝

    return new ModerationError("SERVICE_UNAVAILABLE", "댓글 관리 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 연결 오류 반환
} // 함수 끝

interface CommentRow { id: string; news_id: string; author_id: string; content: string; image_path: string | null; status: CommentStatus; created_at: string; } // 댓글 행 형식
interface ReportRow { id: string; comment_id: string; reason: ReportReason; detail: string; status: ReportStatus; created_at: string; } // 신고 행 형식

const ID_CHUNK_SIZE = 100; // 식별자 조회 묶음 크기

async function selectIn<T>(client: SupabaseClient, table: string, columns: string, column: string, ids: string[]): Promise<T[]> // 식별자 묶음 조회
{ // 함수 시작
    const rows: T[] = []; // 조회 결과

    for (let start = 0; start < ids.length; start += ID_CHUNK_SIZE) // 묶음 반복
    { // 반복 시작
        const result = await client.from(table).select(columns).in(column, ids.slice(start, start + ID_CHUNK_SIZE)); // 묶음 조회

        if (result.error) // 조회 오류 확인
        { // 조건 시작
            throw toModerationError(result.error); // 조회 오류 발생
        } // 조건 끝

        rows.push(...((result.data ?? []) as unknown as T[])); // 결과 추가
    } // 반복 끝

    return rows; // 조회 결과 반환
} // 함수 끝

async function loadItems(client: SupabaseClient, ids: string[]): Promise<ModerationItem[]> // 관리 항목 조회
{ // 함수 시작
    const uniqueIds = [...new Set(ids)]; // 중복 제거 식별자

    if (uniqueIds.length === 0) // 빈 목록 확인
    { // 조건 시작
        return []; // 빈 결과 반환
    } // 조건 끝

    const comments = await selectIn<CommentRow>(client, "news_comments", "id, news_id, author_id, content, image_path, status, created_at", "id", uniqueIds); // 댓글 조회
    const reports = await selectIn<ReportRow>(client, "comment_reports", "id, comment_id, reason, detail, status, created_at", "comment_id", uniqueIds); // 신고 조회
    const titles = new Map((await selectIn<{ id: string; title: string }>(client, "news_posts", "id, title", "id", [...new Set(comments.map((row) => row.news_id))])).map((row) => [row.id, row.title])); // 뉴스 제목
    const nicknames = new Map((await selectIn<{ id: string; nickname: string }>(client, "member_profiles", "id, nickname", "id", [...new Set(comments.map((row) => row.author_id))])).map((row) => [row.id, row.nickname])); // 작성자 닉네임
    const byId = new Map(comments.map((row) => [row.id, row])); // 댓글 식별 목록

    return uniqueIds.flatMap((id) => // 요청 순서 유지
    { // 변환 시작
        const row = byId.get(id); // 댓글 행

        if (!row) // 댓글 없음 확인
        { // 조건 시작
            return []; // 항목 제외
        } // 조건 끝

        const itemReports = reports.filter((report) => report.comment_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)).map((report) => ({ id: report.id, reason: report.reason, detail: report.detail, status: report.status, createdAt: report.created_at })); // 댓글별 신고
        return [{ commentId: row.id, newsId: row.news_id, newsTitle: titles.get(row.news_id) ?? "삭제된 뉴스", nickname: nicknames.get(row.author_id) ?? UNKNOWN_COMMENT_NICKNAME, content: row.content, imagePath: row.image_path, imageUrl: row.image_path ? client.storage.from(COMMENT_IMAGE_BUCKET).getPublicUrl(row.image_path).data.publicUrl : null, status: row.status, createdAt: row.created_at, reports: itemReports }]; // 관리 항목 반환
    }); // 변환 끝
} // 함수 끝

export function createSupabaseModerationService(options: { client: SupabaseClient; now?: () => string }): ModerationService // Supabase 관리 서비스 생성
{ // 함수 시작
    const client = options.client; // Supabase 클라이언트
    const now = options.now ?? (() => new Date().toISOString()); // 시각 생성기

    return ( // 서비스 반환
    { // 서비스 시작
        async list(filter: ModerationFilter, page: number): Promise<ModerationPage> // 관리 목록 조회
        { // 메서드 시작
            const from = (Math.max(1, page) - 1) * MODERATION_PAGE_SIZE; // 시작 위치

            if (filter === "reported") // 신고 대기 목록
            { // 조건 시작
                const pending = await client.from("comment_reports").select("comment_id, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(1000); // 대기 신고 조회

                if (pending.error) // 조회 오류 확인
                { // 조건 시작
                    throw toModerationError(pending.error); // 조회 오류 발생
                } // 조건 끝

                const ids = [...new Set(((pending.data ?? []) as unknown as { comment_id: string }[]).map((row) => row.comment_id))]; // 최근 신고 순 댓글
                return { items: await loadItems(client, ids.slice(from, from + MODERATION_PAGE_SIZE)), total: ids.length }; // 신고 목록 반환
            } // 조건 끝

            const query = client.from("news_comments").select("id", { count: "exact" }); // 댓글 식별자 조회
            const scoped = filter === "hidden" ? query.eq("status", "hidden").order("updated_at", { ascending: false }) : query.neq("status", "deleted").order("created_at", { ascending: false }); // 목록 조건
            const result = await scoped.range(from, from + MODERATION_PAGE_SIZE - 1); // 현재 화면 범위

            if (result.error) // 조회 오류 확인
            { // 조건 시작
                throw toModerationError(result.error); // 조회 오류 발생
            } // 조건 끝

            const ids = ((result.data ?? []) as unknown as { id: string }[]).map((row) => row.id); // 댓글 식별자
            return { items: await loadItems(client, ids), total: result.count ?? ids.length }; // 댓글 목록 반환
        }, // 메서드 끝
        async apply(input: ModerationInput, adminId: string): Promise<ModerationItem> // 관리 처리 적용
        { // 메서드 시작
            const [current] = await loadItems(client, [input.commentId]); // 현재 상태 조회

            if (!current) // 대상 없음 확인
            { // 조건 시작
                throw new ModerationError("COMMENT_NOT_FOUND", "댓글을 찾을 수 없습니다."); // 대상 없음 오류
            } // 조건 끝

            const next = applyModerationToItem(current, input.action); // 처리 결과 계산
            const timestamp = now(); // 처리 시각

            if (next.status !== current.status) // 공개 상태 변경 확인
            { // 조건 시작
                const update = await client.from("news_comments").update({ status: next.status, updated_at: timestamp, ...(input.action === "delete" ? { image_path: null } : {}) }).eq("id", input.commentId); // 댓글 상태 저장

                if (update.error) // 저장 오류 확인
                { // 조건 시작
                    throw toModerationError(update.error); // 저장 오류 발생
                } // 조건 끝
            } // 조건 끝

            const reportStatus = input.action === "dismiss_report" ? "dismissed" : input.action === "restore" ? null : "reviewed"; // 신고 처리 상태

            if (reportStatus && current.reports.some((report) => report.status === "pending")) // 대기 신고 처리 필요 확인
            { // 조건 시작
                const reports = await client.from("comment_reports").update({ status: reportStatus }).eq("comment_id", input.commentId).eq("status", "pending"); // 대기 신고 처리

                if (reports.error) // 처리 오류 확인
                { // 조건 시작
                    throw toModerationError(reports.error); // 처리 오류 발생
                } // 조건 끝
            } // 조건 끝

            if (input.action === "delete" && current.imagePath) // 삭제 이미지 확인
            { // 조건 시작
                await client.storage.from(COMMENT_IMAGE_BUCKET).remove([current.imagePath]); // 첨부 이미지 삭제
            } // 조건 끝

            const log = await client.from("moderation_actions").insert({ comment_id: input.commentId, admin_id: adminId, action: input.action, note: input.note }); // 처리 기록 저장

            if (log.error) // 기록 오류 확인
            { // 조건 시작
                throw toModerationError(log.error); // 기록 오류 발생
            } // 조건 끝

            const [refreshed] = await loadItems(client, [input.commentId]); // 처리 뒤 상태 조회
            return refreshed ?? next; // 최신 항목 반환
        }, // 메서드 끝
    }); // 서비스 끝
} // 함수 끝

export function createDemoModerationItems(): ModerationItem[] // 시연 관리 항목 생성
{ // 함수 시작
    const item = (commentId: string, nickname: string, content: string, status: CommentStatus, createdAt: string, reports: [ReportReason, string, ReportStatus, string][]): ModerationItem => ({ commentId, newsId: "demo-echo-void", newsTitle: "에코 보이드 v0.8 — 음향 엔진 전면 개편 완료", nickname, content, imagePath: null, imageUrl: null, status, createdAt, reports: reports.map(([reason, detail, reportStatus, reportedAt], index) => ({ id: `${commentId}-report-${index + 1}`, reason, detail, status: reportStatus, createdAt: reportedAt })) }); // 시연 항목 생성기
    return [ // 시연 목록 반환
        item("demo-mod-1", "광고봇777", "지금 가입하면 게임 아이템 무료 지급! http://ad.example/1 http://ad.example/2 http://ad.example/3", "visible", "2026-09-30T10:00:00.000Z", [["spam", "같은 광고를 여러 번 올림", "pending", "2026-09-30T10:05:00.000Z"], ["spam", "", "pending", "2026-09-30T11:00:00.000Z"]]), // 광고 댓글
        item("demo-mod-2", "새벽코더", "베타 테스트 신청했는데 연락처 010-0000-0000으로 주세요", "visible", "2026-09-29T09:00:00.000Z", [["privacy", "전화번호 노출", "pending", "2026-09-29T09:30:00.000Z"]]), // 개인정보 댓글
        item("demo-mod-3", "픽셀정비사", "운영 정책 위반으로 숨긴 시연 댓글입니다.", "hidden", "2026-09-28T08:00:00.000Z", [["harassment", "욕설 포함", "reviewed", "2026-09-28T08:20:00.000Z"]]), // 숨긴 댓글
        item("demo-mod-4", "별빛항해자", "개발 과정을 상세하게 볼 수 있어 좋네요.", "visible", "2026-09-27T12:20:00.000Z", []), // 일반 댓글
    ]; // 시연 목록 끝
} // 함수 끝
