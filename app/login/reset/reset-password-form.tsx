"use client"; // 브라우저 입력 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect, useState, type FormEvent } from "react"; // 입력 상태 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { preventInvalidFormSubmission } from "@/lib/forms/validation"; // 폼 제출 검증 도구
import { PASSWORD_FIELD_ORDER, toAuthErrorMessage, validatePasswordPair } from "@/lib/member/signup"; // 비밀번호 규칙
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "../member-login.module.css"; // 로그인 화면 스타일

interface ResetPasswordFormProps // 새 비밀번호 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
} // 형식 끝

type SessionState = "checking" | "ready" | "expired"; // 재설정 세션 상태

export default function ResetPasswordForm({ mode }: ResetPasswordFormProps) // 새 비밀번호 폼
{ // 함수 시작
    const [session, setSession] = useState<SessionState>(mode === "demo" ? "ready" : "checking"); // 재설정 세션 상태
    const [password, setPassword] = useState(""); // 새 비밀번호 상태
    const [passwordConfirm, setPasswordConfirm] = useState(""); // 비밀번호 확인 상태
    const [errors, setErrors] = useState<Partial<Record<"password" | "passwordConfirm", string>>>({}); // 입력 오류 상태
    const [message, setMessage] = useState(""); // 처리 안내 상태
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [done, setDone] = useState(false); // 변경 완료 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태

    useEffect(() => // 재설정 세션 확인
    { // 효과 시작
        if (mode === "demo") // 시연 모드 확인
        { // 조건 시작
            return; // 확인 생략
        } // 조건 끝

        let active = true; // 화면 유지 여부
        void createBrowserSupabaseClient().auth.getUser().then((result) => // 현재 사용자 조회
        { // 결과 처리 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setSession(result.data.user ? "ready" : "expired"); // 세션 상태 저장
            } // 조건 끝
        }).catch(() => // 조회 실패 처리
        { // 오류 처리 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setSession("expired"); // 만료 상태 저장
            } // 조건 끝
        }); // 조회 처리 끝

        return () => // 정리 함수 반환
        { // 정리 시작
            active = false; // 늦은 결과 무시
        }; // 정리 끝
    }, [mode]); // 모드 변경 시 실행

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 새 비밀번호 저장
    { // 함수 시작
        const nextErrors = validatePasswordPair(password, passwordConfirm); // 비밀번호 검증
        setErrors(nextErrors); // 입력 오류 표시
        setMessage(""); // 이전 안내 제거

        if (preventInvalidFormSubmission(event, PASSWORD_FIELD_ORDER, nextErrors)) // 잘못된 제출 확인
        { // 조건 시작
            return; // 제출 중단
        } // 조건 끝

        event.preventDefault(); // 기본 제출 차단

        if (mode === "demo") // 시연 모드 확인
        { // 조건 시작
            setMessageRole("status"); // 안내 역할
            setMessage("시연 모드: 비밀번호 규칙 검증을 통과했습니다. 실제 변경은 Supabase 연결 후 가능합니다."); // 시연 안내
            return; // 처리 종료
        } // 조건 끝

        setIsSubmitting(true); // 제출 시작

        try // 비밀번호 변경 시도
        { // 시도 시작
            const result = await createBrowserSupabaseClient().auth.updateUser({ password }); // 비밀번호 변경 요청

            if (result.error) // 변경 실패 확인
            { // 조건 시작
                setMessageRole("alert"); // 오류 역할
                setMessage(toAuthErrorMessage(result.error)); // 실패 안내
                return; // 처리 종료
            } // 조건 끝

            setDone(true); // 완료 상태 전환
            setMessageRole("status"); // 안내 역할
            setMessage("비밀번호를 바꿨습니다. 지금 로그인된 상태이며 다음부터 새 비밀번호로 로그인하면 됩니다."); // 완료 안내
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("인증 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 연결 실패 안내
        } // 오류 처리 끝
        finally // 제출 종료 처리
        { // 정리 시작
            setIsSubmitting(false); // 제출 종료
        } // 정리 끝
    } // 함수 끝

    if (session === "checking") // 세션 확인 중
    { // 조건 시작
        return <p className={styles.description} role="status">재설정 링크를 확인하고 있습니다…</p>; // 확인 중 안내
    } // 조건 끝

    if (session === "expired") // 세션 만료 확인
    { // 조건 시작
        return ( // 만료 안내 반환
            <div className={styles.account} role="alert"> {/* 만료 안내 영역 */}
                <h2>링크가 만료되었거나 올바르지 않습니다</h2> {/* 안내 제목 */}
                <p className={styles.description}>비밀번호 찾기를 다시 요청한 뒤, 받은 메일의 링크를 같은 브라우저에서 열어 주세요.</p> {/* 다시 요청 안내 */}
                <Link className={styles.primaryButton} href="/login/forgot">비밀번호 찾기 다시 요청</Link> {/* 다시 요청 이동 */}
            </div> // 만료 안내 영역 끝
        ); // 만료 안내 반환 끝
    } // 조건 끝

    return ( // 새 비밀번호 폼 반환
        <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}> {/* 새 비밀번호 폼 */}
            <label htmlFor="reset-password">새 비밀번호 (영문·숫자 포함 8자 이상)</label> {/* 새 비밀번호 이름 */}
            <input id="reset-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => { setPassword(event.target.value); setErrors((current) => ({ ...current, password: undefined })); }} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "reset-password-error" : undefined} disabled={isSubmitting || done} /> {/* 새 비밀번호 입력 */}
            {errors.password ? <small id="reset-password-error" className={styles.fieldError} role="alert">{errors.password}</small> : null} {/* 새 비밀번호 오류 */}
            <label htmlFor="reset-password-confirm">새 비밀번호 확인</label> {/* 확인 이름 */}
            <input id="reset-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(event) => { setPasswordConfirm(event.target.value); setErrors((current) => ({ ...current, passwordConfirm: undefined })); }} aria-invalid={Boolean(errors.passwordConfirm)} aria-describedby={errors.passwordConfirm ? "reset-password-confirm-error" : undefined} disabled={isSubmitting || done} /> {/* 확인 입력 */}
            {errors.passwordConfirm ? <small id="reset-password-confirm-error" className={styles.fieldError} role="alert">{errors.passwordConfirm}</small> : null} {/* 확인 오류 */}
            <button className={styles.primaryButton} type="submit" disabled={isSubmitting || done}>{isSubmitting ? "바꾸는 중…" : "새 비밀번호 저장"}</button> {/* 저장 버튼 */}
            {message ? <p className={messageRole === "alert" ? styles.error : styles.success} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
            {done ? <Link className={styles.backLink} href="/main.html">메인 화면으로 이동</Link> : null} {/* 완료 후 이동 */}
        </form> // 새 비밀번호 폼 끝
    ); // 새 비밀번호 폼 반환 끝
} // 함수 끝
