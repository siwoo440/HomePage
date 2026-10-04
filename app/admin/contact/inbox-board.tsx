"use client"; // 브라우저 상호작용 모듈

import { useState } from "react"; // 화면 상태 도구
import { getContactCategoryLabel } from "@/lib/contact/domain"; // 문의 분류 이름
import { CONTACT_NOTE_MAX_LENGTH, CONTACT_STATUS_LABELS, type ContactActionResult, type ContactFilter, type ContactMessage, type ContactStatus } from "@/lib/contact/inbox"; // 문의함 도구

interface InboxBoardProps // 문의함 목록 속성
{ // 형식 시작
    initialItems: ContactMessage[]; // 처음 문의 목록
    filter: ContactFilter; // 현재 목록 종류
    onUpdate: (input: { id: string; status: string; note: string }) => Promise<ContactActionResult>; // 처리 실행 함수
} // 형식 끝

const EMPTY_MESSAGES: Record<ContactFilter, string> = { pending: "답변을 기다리는 문의가 없습니다.", answered: "답변 완료한 문의가 없습니다.", all: "아직 접수된 문의가 없습니다." }; // 빈 목록 안내
const formatter = new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }); // 날짜 표시 형식

export default function InboxBoard({ initialItems, filter, onUpdate }: InboxBoardProps) // 문의함 목록
{ // 함수 시작
    const [items, setItems] = useState(initialItems); // 문의 상태
    const [notes, setNotes] = useState<Record<string, string>>({}); // 문의별 처리 메모
    const [busyId, setBusyId] = useState<string | null>(null); // 처리 중 문의
    const [message, setMessage] = useState(""); // 처리 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할

    async function handleUpdate(item: ContactMessage, status: ContactStatus) // 처리 상태 변경
    { // 함수 시작
        setBusyId(item.id); // 처리 시작
        setMessage(""); // 이전 안내 제거

        try // 처리 시도
        { // 시도 시작
            const result = await onUpdate({ id: item.id, status, note: notes[item.id] ?? "" }); // 처리 요청
            setMessageRole(result.ok ? "status" : "alert"); // 안내 역할
            setMessage(result.message); // 결과 안내

            if (result.ok && result.item) // 성공 문의 확인
            { // 조건 시작
                const updated = result.item; // 처리 뒤 문의
                setItems((current) => current.map((entry) => entry.id === updated.id ? updated : entry)); // 문의 갱신
                setNotes((current) => ({ ...current, [item.id]: "" })); // 메모 비우기
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

    return ( // 문의함 목록 반환
        <section className="moderation-board" aria-label="문의 목록"> {/* 문의함 영역 */}
            {message ? <p className={`admin-message ${messageRole === "alert" ? "admin-message-error" : "admin-message-success"}`} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
            {items.length === 0 ? <p className="admin-empty-state">{EMPTY_MESSAGES[filter]}</p> : null} {/* 빈 목록 안내 */}
            <div className="moderation-list"> {/* 문의 목록 */}
                {items.map((item) => // 문의 반복
                { // 문의 시작
                    const busy = busyId === item.id; // 처리 중 여부
                    const answered = item.status === "answered"; // 답변 완료 여부
                    return ( // 문의 카드 반환
                        <article className="moderation-card" data-status={answered ? "visible" : "hidden"} key={item.id} aria-busy={busy}> {/* 문의 카드 */}
                            <header className="moderation-card-header"> {/* 접수 정보 */}
                                <div> {/* 보낸 사람 묶음 */}
                                    <strong>{item.subject}</strong> {/* 문의 제목 */}
                                    <time dateTime={item.createdAt}>{formatter.format(new Date(item.createdAt))}</time> {/* 접수 시각 */}
                                </div> {/* 보낸 사람 묶음 끝 */}
                                <span className={`moderation-status ${answered ? "moderation-status-visible" : "moderation-status-hidden"}`}>{CONTACT_STATUS_LABELS[item.status]}</span> {/* 처리 상태 */}
                            </header> {/* 접수 정보 끝 */}
                            <p className="moderation-news">{getContactCategoryLabel(item.category)} · <a href={`mailto:${item.email}`}>{item.email}</a></p> {/* 분류와 답변 주소 */}
                            <p className="moderation-content">{item.message}</p> {/* 문의 내용 */}
                            {item.adminNote ? <p className="moderation-closed">메모: {item.adminNote}</p> : null} {/* 저장된 메모 */}
                            {item.handledAt ? <p className="moderation-closed">답변 완료 시각: {formatter.format(new Date(item.handledAt))}</p> : null} {/* 처리 시각 */}
                            <div className="moderation-controls"> {/* 처리 영역 */}
                                <label htmlFor={`contact-note-${item.id}`}>처리 메모 (선택, 관리자만 보임)</label> {/* 메모 이름 */}
                                <textarea id={`contact-note-${item.id}`} value={notes[item.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={CONTACT_NOTE_MAX_LENGTH} rows={2} /> {/* 처리 메모 */}
                                <div className="moderation-actions"> {/* 처리 버튼 묶음 */}
                                    {answered
                                        ? <button type="button" className="moderation-button moderation-button-hide" onClick={() => void handleUpdate(item, "pending")} disabled={busyId !== null} aria-busy={busy}>{busy ? "처리 중…" : "답변 대기로 되돌리기"}</button>
                                        : <button type="button" className="moderation-button moderation-button-restore" onClick={() => void handleUpdate(item, "answered")} disabled={busyId !== null} aria-busy={busy}>{busy ? "처리 중…" : "답변 완료로 표시"}</button>} {/* 상태 변경 버튼 */}
                                </div> {/* 처리 버튼 묶음 끝 */}
                            </div> {/* 처리 영역 끝 */}
                        </article> // 문의 카드 끝
                    ); // 문의 카드 반환 끝
                })} {/* 문의 반복 끝 */}
            </div> {/* 문의 목록 끝 */}
        </section> // 문의함 영역 끝
    ); // 문의함 목록 반환 끝
} // 함수 끝
