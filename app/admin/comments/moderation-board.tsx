"use client"; // 브라우저 상호작용 모듈

import { useState } from "react"; // 화면 상태 도구
import { describeCommentFlags } from "@/lib/comments/guard"; // 자동 감지 규칙
import { countPendingReports, getAvailableActions, getReportReasonLabel, MODERATION_ACTION_LABELS, MODERATION_NOTE_MAX_LENGTH, summarizePendingReasons, type ModerationAction, type ModerationActionResult, type ModerationFilter, type ModerationItem } from "@/lib/comments/moderation"; // 댓글 관리 도구

interface ModerationBoardProps // 관리 목록 속성
{ // 형식 시작
    initialItems: ModerationItem[]; // 처음 항목 목록
    filter: ModerationFilter; // 현재 목록 종류
    onApply: (input: { commentId: string; action: string; note: string }) => Promise<ModerationActionResult>; // 처리 실행 함수
} // 형식 끝

const STATUS_LABELS: Record<ModerationItem["status"], string> = { visible: "공개 중", hidden: "숨김", deleted: "삭제됨" }; // 공개 상태 이름
const REPORT_STATUS_LABELS: Record<string, string> = { pending: "대기", reviewed: "처리 완료", dismissed: "기각" }; // 신고 상태 이름
const EMPTY_MESSAGES: Record<ModerationFilter, string> = { reported: "처리할 신고가 없습니다.", hidden: "숨긴 댓글이 없습니다.", recent: "아직 댓글이 없습니다." }; // 빈 목록 안내
const formatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }); // 날짜 표시 형식

export default function ModerationBoard({ initialItems, filter, onApply }: ModerationBoardProps) // 댓글 관리 목록
{ // 함수 시작
    const [items, setItems] = useState(initialItems); // 항목 상태
    const [notes, setNotes] = useState<Record<string, string>>({}); // 댓글별 처리 메모
    const [busyId, setBusyId] = useState<string | null>(null); // 처리 중 댓글
    const [message, setMessage] = useState(""); // 처리 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할

    async function handleAction(item: ModerationItem, action: ModerationAction) // 관리 처리 실행
    { // 함수 시작
        if (action === "delete" && !window.confirm("이 댓글을 삭제할까요? 공개 화면에서 사라지고 첨부 이미지도 지워지며 다시 공개할 수 없습니다.")) // 삭제 확인
        { // 조건 시작
            return; // 삭제 취소
        } // 조건 끝

        setBusyId(item.commentId); // 처리 시작
        setMessage(""); // 이전 안내 제거

        try // 처리 시도
        { // 시도 시작
            const result = await onApply({ commentId: item.commentId, action, note: notes[item.commentId] ?? "" }); // 처리 요청
            setMessageRole(result.ok ? "status" : "alert"); // 안내 역할
            setMessage(result.message); // 결과 안내

            if (result.ok && result.item) // 성공 항목 확인
            { // 조건 시작
                const updated = result.item; // 처리 뒤 항목
                setItems((current) => current.map((entry) => entry.commentId === updated.commentId ? updated : entry)); // 항목 갱신
                setNotes((current) => ({ ...current, [item.commentId]: "" })); // 메모 비우기
            } // 조건 끝
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 실패 안내
        } // 오류 처리 끝
        finally // 처리 종료
        { // 정리 시작
            setBusyId(null); // 처리 상태 해제
        } // 정리 끝
    } // 함수 끝

    return ( // 관리 목록 반환
        <section className="moderation-board" aria-label="댓글 관리 목록"> {/* 관리 목록 영역 */}
            {message ? <p className={`admin-message ${messageRole === "alert" ? "admin-message-error" : "admin-message-success"}`} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
            {items.length === 0 ? <p className="admin-empty-state">{EMPTY_MESSAGES[filter]}</p> : null} {/* 빈 목록 안내 */}
            <div className="moderation-list"> {/* 항목 목록 */}
                {items.map((item) => // 항목 반복
                { // 항목 시작
                    const pending = countPendingReports(item); // 대기 신고 수
                    const actions = getAvailableActions(item); // 가능한 처리
                    const busy = busyId === item.commentId; // 처리 중 여부
                    const flags = item.status === "deleted" ? [] : describeCommentFlags(item.content); // 현재 규칙에 걸리는 사유
                    return ( // 항목 카드 반환
                        <article className="moderation-card" data-status={item.status} key={item.commentId} aria-busy={busy}> {/* 항목 카드 */}
                            <header className="moderation-card-header"> {/* 작성 정보 */}
                                <div> {/* 작성자 묶음 */}
                                    <strong>{item.nickname}</strong> {/* 작성자 닉네임 */}
                                    <time dateTime={item.createdAt}>{formatter.format(new Date(item.createdAt))}</time> {/* 작성 시각 */}
                                </div> {/* 작성자 묶음 끝 */}
                                <span className={`moderation-status moderation-status-${item.status}`}>{STATUS_LABELS[item.status]}</span> {/* 공개 상태 */}
                            </header> {/* 작성 정보 끝 */}
                            <p className="moderation-news">뉴스 · <a href={`/news/${item.newsId}`}>{item.newsTitle}</a></p> {/* 뉴스 연결 */}
                            <p className="moderation-content">{item.content}</p> {/* 댓글 내용 */}
                            {flags.length > 0 ? <p className="moderation-flags"><strong>자동 감지</strong> · {flags.join(", ")} — 지금 규칙으로는 등록되지 않는 댓글입니다.</p> : null} {/* 자동 감지 사유 */}
                            {item.imageUrl ? <img className="moderation-image" src={item.imageUrl} alt="댓글 첨부 이미지" /> : null} {/* 첨부 이미지 */}
                            {item.reports.length > 0 ? ( // 신고 기록 확인
                                <div className="moderation-reports"> {/* 신고 정보 */}
                                    <p>{pending > 0 ? <strong>신고 {pending}건 대기 · {summarizePendingReasons(item)}</strong> : "대기 중인 신고 없음"}</p> {/* 신고 요약 */}
                                    <details> {/* 신고 기록 펼침 */}
                                        <summary>신고 기록 {item.reports.length}건 보기</summary> {/* 펼침 제목 */}
                                        <ul> {/* 신고 기록 목록 */}
                                            {item.reports.map((report) => <li key={report.id}>{getReportReasonLabel(report.reason)} · {REPORT_STATUS_LABELS[report.status] ?? report.status} · {formatter.format(new Date(report.createdAt))}{report.detail ? ` — ${report.detail}` : ""}</li>)} {/* 신고 기록 */}
                                        </ul> {/* 신고 기록 목록 끝 */}
                                    </details> {/* 신고 기록 펼침 끝 */}
                                </div> // 신고 정보 끝
                            ) : null} {/* 신고 정보 */}
                            {actions.length > 0 ? ( // 처리 가능 확인
                                <div className="moderation-controls"> {/* 처리 영역 */}
                                    <label htmlFor={`moderation-note-${item.commentId}`}>처리 메모 (선택, 관리자만 보임)</label> {/* 메모 이름 */}
                                    <textarea id={`moderation-note-${item.commentId}`} value={notes[item.commentId] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.commentId]: event.target.value }))} maxLength={MODERATION_NOTE_MAX_LENGTH} rows={2} disabled={busy} /> {/* 메모 입력 */}
                                    <div className="moderation-actions"> {/* 처리 버튼 묶음 */}
                                        {actions.map((action) => <button key={action} type="button" className={`moderation-button moderation-button-${action}`} onClick={() => void handleAction(item, action)} disabled={busyId !== null}>{busy ? "처리 중…" : MODERATION_ACTION_LABELS[action]}</button>)} {/* 처리 버튼 */}
                                    </div> {/* 처리 버튼 묶음 끝 */}
                                </div> // 처리 영역 끝
                            ) : <p className="moderation-closed">삭제된 댓글은 더 이상 처리할 수 없습니다.</p>} {/* 처리 영역 */}
                        </article> // 항목 카드 끝
                    ); // 항목 카드 반환 끝
                })} {/* 항목 반복 끝 */}
            </div> {/* 항목 목록 끝 */}
        </section> // 관리 목록 영역 끝
    ); // 관리 목록 반환 끝
} // 함수 끝
