"use client"; // 브라우저 입력 모듈

import { useRef, useState, type FormEvent } from "react"; // 입력 상태 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { toAuthErrorMessage, validateEmail } from "@/lib/member/signup"; // 이메일 규칙
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "../member-login.module.css"; // 로그인 화면 스타일

interface ForgotPasswordFormProps // 비밀번호 찾기 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
} // 형식 끝

export default function ForgotPasswordForm({ mode }: ForgotPasswordFormProps) // 비밀번호 찾기 폼
{ // 함수 시작
    const [email, setEmail] = useState(""); // 이메일 상태
    const [error, setError] = useState(""); // 입력 오류 상태
    const [message, setMessage] = useState(""); // 처리 안내 상태
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태
    const inputRef = useRef<HTMLInputElement>(null); // 이메일 입력 참조

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 재설정 메일 요청
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        const emailError = validateEmail(email); // 이메일 검증
        setError(emailError ?? ""); // 입력 오류 표시
        setMessage(""); // 이전 안내 제거

        if (emailError) // 입력 오류 확인
        { // 조건 시작
            inputRef.current?.focus(); // 입력 포커스 이동
            return; // 요청 중단
        } // 조건 끝

        if (mode === "demo") // 시연 모드 확인
        { // 조건 시작
            setMessageRole("status"); // 안내 역할
            setMessage("시연 모드: 메일을 보내지 않았습니다. Supabase 연결 후 재설정 메일이 발송됩니다."); // 시연 안내
            return; // 처리 종료
        } // 조건 끝

        setIsSubmitting(true); // 제출 시작

        try // 메일 요청 시도
        { // 시도 시작
            const redirectTo = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent("/login/reset")}`; // 재설정 복귀 주소
            const result = await createBrowserSupabaseClient().auth.resetPasswordForEmail(email.trim(), { redirectTo }); // 재설정 메일 요청

            if (result.error && (result.error.code === "over_email_send_rate_limit" || result.error.code === "over_request_rate_limit" || result.error.status === 429)) // 요청 제한 확인
            { // 조건 시작
                setMessageRole("alert"); // 오류 역할
                setMessage(toAuthErrorMessage(result.error)); // 요청 제한 안내
                return; // 처리 종료
            } // 조건 끝

            setMessageRole("status"); // 안내 역할
            setMessage("입력한 이메일로 가입된 계정이 있으면 비밀번호 재설정 메일을 보냈습니다. 메일의 링크는 이 브라우저에서 열어 주세요."); // 공통 완료 안내
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("메일 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 연결 실패 안내
        } // 오류 처리 끝
        finally // 제출 종료 처리
        { // 정리 시작
            setIsSubmitting(false); // 제출 종료
        } // 정리 끝
    } // 함수 끝

    return ( // 찾기 폼 반환
        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}> {/* 재설정 요청 폼 */}
            <label htmlFor="forgot-email">가입한 이메일</label> {/* 이메일 이름 */}
            <input id="forgot-email" ref={inputRef} name="email" type="email" autoComplete="email" value={email} onChange={(event) => { setEmail(event.target.value); setError(""); }} aria-invalid={Boolean(error)} aria-describedby={error ? "forgot-email-error" : undefined} disabled={isSubmitting} /> {/* 이메일 입력 */}
            {error ? <small id="forgot-email-error" className={styles.fieldError} role="alert">{error}</small> : null} {/* 이메일 오류 */}
            <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "보내는 중…" : "재설정 메일 받기"}</button> {/* 요청 버튼 */}
            {message ? <p className={messageRole === "alert" ? styles.error : styles.success} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
        </form> // 재설정 요청 폼 끝
    ); // 찾기 폼 반환 끝
} // 함수 끝
