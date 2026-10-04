"use client"; // 브라우저 상호작용 모듈

import { useState } from "react"; // 화면 상태 도구
import styles from "../../login/member-login.module.css"; // 로그인 화면과 같은 스타일

interface UnsubscribePanelProps // 수신 거부 영역 속성
{ // 형식 시작
    token: string; // 수신 거부 값
} // 형식 끝

export default function UnsubscribePanel({ token }: UnsubscribePanelProps) // 수신 거부 버튼 영역
{ // 함수 시작
    const [message, setMessage] = useState(""); // 처리 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [isSubmitting, setIsSubmitting] = useState(false); // 처리 중 여부
    const [isDone, setIsDone] = useState(false); // 처리 완료 여부

    async function handleUnsubscribe() // 수신 거부 요청
    { // 함수 시작
        setIsSubmitting(true); // 처리 시작
        setMessage(""); // 이전 안내 제거

        try // 요청 시도
        { // 시도 시작
            const response = await fetch("/api/notify/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), cache: "no-store" }); // 수신 거부 요청
            const data = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null; // 응답 본문
            const succeeded = response.ok && data?.ok !== false; // 성공 여부
            setMessageRole(succeeded ? "status" : "alert"); // 안내 역할
            setMessage(typeof data?.message === "string" && data.message ? data.message : succeeded ? "수신 거부를 처리했습니다." : "수신 거부를 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 결과 안내
            setIsDone(succeeded); // 완료 상태 저장
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요."); // 연결 실패 안내
        } // 오류 처리 끝
        finally // 처리 종료
        { // 정리 시작
            setIsSubmitting(false); // 처리 상태 해제
        } // 정리 끝
    } // 함수 끝

    return ( // 수신 거부 영역 반환
        <div className={styles.formStack} aria-busy={isSubmitting}> {/* 버튼과 안내 묶음 */}
            {isDone ? null : <button className={styles.primaryButton} type="button" onClick={() => void handleUnsubscribe()} disabled={isSubmitting}>{isSubmitting ? "처리 중…" : "출시 알림 그만 받기"}</button>} {/* 수신 거부 버튼 */}
            {message ? <p className={messageRole === "alert" ? styles.error : styles.notice} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
        </div> // 버튼과 안내 묶음 끝
    ); // 수신 거부 영역 반환 끝
} // 함수 끝
