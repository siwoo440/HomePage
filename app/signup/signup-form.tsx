"use client"; // 브라우저 입력 모듈

import { useEffect, useRef, useState, type FormEvent } from "react"; // 입력 상태 도구
import type { AuthSettings } from "@/lib/member/auth-providers"; // 인증 설정 형식
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { preventInvalidFormSubmission } from "@/lib/forms/validation"; // 폼 제출 검증 도구
import { ensureMemberProfile, NICKNAME_MAX_LENGTH } from "@/lib/member/profile"; // 회원 프로필 도구
import { EMPTY_CONSENTS, SIGNUP_FIELD_ORDER, toAuthErrorMessage, validateSignup, type ConsentValues, type SignupField } from "@/lib/member/signup"; // 가입 규칙
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import ConsentFields from "../login/consent-fields"; // 필수 동의 입력
import SocialLoginButtons from "../login/social-login-buttons"; // 간편 로그인 버튼
import styles from "../login/member-login.module.css"; // 로그인 화면 스타일

interface SignupFormProps // 가입 폼 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    returnTo: string; // 가입 뒤 주소
    settings: AuthSettings; // 인증 설정 요약
} // 형식 끝

type FieldErrors = Partial<Record<SignupField, string>>; // 입력 오류 형식

export default function SignupForm({ mode, returnTo, settings }: SignupFormProps) // 회원가입 폼
{ // 함수 시작
    const [email, setEmail] = useState(""); // 이메일 상태
    const [password, setPassword] = useState(""); // 비밀번호 상태
    const [passwordConfirm, setPasswordConfirm] = useState(""); // 비밀번호 확인 상태
    const [nickname, setNickname] = useState(""); // 닉네임 상태
    const [consents, setConsents] = useState<ConsentValues>(EMPTY_CONSENTS); // 필수 동의 상태
    const [errors, setErrors] = useState<FieldErrors>({}); // 입력 오류 상태
    const [message, setMessage] = useState(""); // 처리 안내 상태
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [sentTo, setSentTo] = useState(""); // 인증 메일 주소
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태
    const resultRef = useRef<HTMLDivElement>(null); // 완료 안내 참조

    useEffect(() => // 완료 안내 포커스
    { // 효과 시작
        if (sentTo) // 메일 발송 완료 확인
        { // 조건 시작
            resultRef.current?.focus(); // 완료 안내 포커스
        } // 조건 끝
    }, [sentTo]); // 완료 상태 감시

    function updateField(field: SignupField, update: () => void) // 입력 변경 처리
    { // 함수 시작
        update(); // 값 저장
        setErrors((current) => ({ ...current, [field]: undefined })); // 해당 오류 해제
    } // 함수 끝

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 가입 제출 처리
    { // 함수 시작
        const result = validateSignup({ email, password, passwordConfirm, nickname, ...consents }); // 가입 입력 검증
        const nextErrors: FieldErrors = result.ok ? {} : result.errors; // 입력 오류 목록
        setErrors(nextErrors); // 입력 오류 표시
        setMessage(""); // 이전 안내 제거

        if (preventInvalidFormSubmission(event, SIGNUP_FIELD_ORDER, nextErrors) || !result.ok) // 잘못된 제출 확인
        { // 조건 시작
            return; // 제출 중단
        } // 조건 끝

        event.preventDefault(); // 기본 제출 차단

        if (mode === "demo") // 시연 모드 확인
        { // 조건 시작
            setMessageRole("status"); // 안내 역할
            setMessage("시연 모드: 입력 검증을 통과했습니다. 실제 가입은 Supabase 연결 후 가능하며 지금은 아무 정보도 저장하지 않았습니다."); // 시연 안내
            return; // 처리 종료
        } // 조건 끝

        setIsSubmitting(true); // 제출 시작

        try // 가입 요청 시도
        { // 시도 시작
            const supabase = createBrowserSupabaseClient(); // 인증 도구 생성
            const redirect = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`; // 인증 복귀 주소
            const signup = await supabase.auth.signUp({ email: result.value.email, password: result.value.password, options: { emailRedirectTo: redirect, data: { nickname: result.value.nickname, consent_agreed_at: new Date().toISOString() } } }); // 가입 요청

            if (signup.error) // 가입 실패 확인
            { // 조건 시작
                setMessageRole("alert"); // 오류 역할
                setMessage(toAuthErrorMessage(signup.error)); // 실패 안내
                return; // 처리 종료
            } // 조건 끝

            if (signup.data.session && signup.data.user) // 즉시 로그인 확인
            { // 조건 시작
                await ensureMemberProfile(supabase, signup.data.user).catch(() => null); // 가입 닉네임 프로필 생성
                window.location.assign(returnTo); // 원래 화면 이동
                return; // 처리 종료
            } // 조건 끝

            setSentTo(result.value.email); // 인증 메일 안내 전환
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("가입 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 연결 실패 안내
        } // 오류 처리 끝
        finally // 제출 종료 처리
        { // 정리 시작
            setIsSubmitting(false); // 제출 종료
        } // 정리 끝
    } // 함수 끝

    if (sentTo) // 인증 메일 발송 확인
    { // 조건 시작
        return ( // 발송 안내 반환
            <div ref={resultRef} tabIndex={-1} className={styles.account} role="status"> {/* 발송 안내 영역 */}
                <h2>인증 메일을 보냈습니다</h2> {/* 안내 제목 */}
                <p className={styles.accountName}>{sentTo}</p> {/* 받는 주소 */}
                <p className={styles.description}>받은 메일의 링크를 눌러 가입을 마쳐 주세요. 메일이 보이지 않으면 스팸함을 확인하고, 이미 가입한 이메일이라면 로그인하거나 비밀번호 찾기를 이용해 주세요.</p> {/* 다음 단계 안내 */}
            </div> // 발송 안내 영역 끝
        ); // 발송 안내 반환 끝
    } // 조건 끝

    const emailForm = mode === "demo" || settings.emailEnabled; // 이메일 가입 표시 여부

    return ( // 가입 입력 반환
        <div className={styles.formStack}> {/* 가입 입력 묶음 */}
            {emailForm ? <form className={styles.form} onSubmit={handleSubmit} noValidate aria-busy={isSubmitting}> {/* 이메일 가입 폼 */}
                <label htmlFor="signup-email">이메일</label> {/* 이메일 이름 */}
                <input id="signup-email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => updateField("email", () => setEmail(event.target.value))} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "signup-email-error" : undefined} disabled={isSubmitting} /> {/* 이메일 입력 */}
                {errors.email ? <small id="signup-email-error" className={styles.fieldError} role="alert">{errors.email}</small> : null} {/* 이메일 오류 */}
                <label htmlFor="signup-password">비밀번호 (영문·숫자 포함 8자 이상)</label> {/* 비밀번호 이름 */}
                <input id="signup-password" name="password" type="password" autoComplete="new-password" value={password} onChange={(event) => updateField("password", () => setPassword(event.target.value))} aria-invalid={Boolean(errors.password)} aria-describedby={errors.password ? "signup-password-error" : undefined} disabled={isSubmitting} /> {/* 비밀번호 입력 */}
                {errors.password ? <small id="signup-password-error" className={styles.fieldError} role="alert">{errors.password}</small> : null} {/* 비밀번호 오류 */}
                <label htmlFor="signup-password-confirm">비밀번호 확인</label> {/* 비밀번호 확인 이름 */}
                <input id="signup-password-confirm" name="passwordConfirm" type="password" autoComplete="new-password" value={passwordConfirm} onChange={(event) => updateField("passwordConfirm", () => setPasswordConfirm(event.target.value))} aria-invalid={Boolean(errors.passwordConfirm)} aria-describedby={errors.passwordConfirm ? "signup-password-confirm-error" : undefined} disabled={isSubmitting} /> {/* 비밀번호 확인 입력 */}
                {errors.passwordConfirm ? <small id="signup-password-confirm-error" className={styles.fieldError} role="alert">{errors.passwordConfirm}</small> : null} {/* 비밀번호 확인 오류 */}
                <label htmlFor="signup-nickname">댓글에 표시할 닉네임 (1~20자)</label> {/* 닉네임 이름 */}
                <input id="signup-nickname" name="nickname" autoComplete="nickname" maxLength={NICKNAME_MAX_LENGTH * 2} value={nickname} onChange={(event) => updateField("nickname", () => setNickname(event.target.value))} aria-invalid={Boolean(errors.nickname)} aria-describedby={errors.nickname ? "signup-nickname-error" : undefined} disabled={isSubmitting} /> {/* 닉네임 입력 */}
                {errors.nickname ? <small id="signup-nickname-error" className={styles.fieldError} role="alert">{errors.nickname}</small> : null} {/* 닉네임 오류 */}
                <ConsentFields values={consents} errors={errors} onChange={(next) => { setConsents(next); setErrors((current) => ({ ...current, agreeAge: undefined, agreeTerms: undefined, agreePrivacy: undefined })); }} disabled={isSubmitting} /> {/* 필수 동의 */}
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "가입 중…" : "이메일로 가입하기"}</button> {/* 가입 버튼 */}
                {message ? <p className={messageRole === "alert" ? styles.error : styles.success} role={messageRole}>{message}</p> : null} {/* 처리 안내 */}
            </form> : null} {/* 이메일 가입 폼 끝 */}
            <SocialLoginButtons mode={mode} providers={settings.providers} returnTo={returnTo} /> {/* 간편 가입 */}
        </div> // 가입 입력 묶음 끝
    ); // 가입 입력 반환 끝
} // 함수 끝
