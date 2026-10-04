"use client"; // 브라우저 상호작용 모듈

import { useState } from "react"; // 화면 상태 도구
import styles from "../login/member-login.module.css"; // 로그인 화면과 같은 스타일

interface TokenActionPanelProps // 메일 주소 처리 영역 속성
{ // 형식 시작
    token: string; // 메일로 받은 값
    endpoint: "/api/notify/confirm" | "/api/notify/unsubscribe"; // 처리 주소
    buttonLabel: string; // 버튼 이름
    doneMessage: string; // 기본 성공 안내
    failMessage: string; // 기본 실패 안내
} // 형식 끝

// 메일 프로그램이 주소를 미리 여는 것만으로 처리되지 않도록, 화면이 열릴 때가 아니라 버튼을 누를 때만 요청합니다.
export default function TokenActionPanel({ token, endpoint, buttonLabel, doneMessage, failMessage }: TokenActionPanelProps) // 확인·수신 거부 버튼 영역
{ // 함수 시작
    const [message, setMessage] = useState(""); // 처리 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [isSubmitting, setIsSubmitting] = useState(false); // 처리 중 여부
    const [isDone, setIsDone] = useState(false); // 처리 완료 여부

    async function handleAction() // 처리 요청
    { // 함수 시작
        setIsSubmitting(true); // 처리 시작
        setMessage(""); // 이전 안내 제거

        try // 요청 시도
        { // 시도 시작
            const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }), cache: "no-store" }); // 처리 요청
            const data = await response.json().catch(() => null) as { ok?: boolean; message?: string } | null; // 응답 본문
            const succeeded = response.ok && data?.ok !== false; // 성공 여부
            setMessageRole(succeeded ? "status" : "alert"); // 안내 역할
            setMessage(typeof data?.message === "string" && data.message ? data.message : succeeded ? doneMessage : failMessage); // 결과 안내
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

    return ( // 버튼 영역 반환
        <div className={styles.formStack} aria-busy={isSubmitting}> {/* 버튼과 안내 묶음 */}
            {isDone ? null : <button className={styles.primaryButton} type="button" onClick={() => void handleAction()} disabled={isSubmitting}>{isSubmitting ? "처리 중…" : buttonLabel}</button>} {/* 처리 버튼 */}
            {message ? <p className={messageRole === "alert" ? styles.error : styles.notice} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
        </div> // 버튼과 안내 묶음 끝
    ); // 버튼 영역 반환 끝
} // 함수 끝
