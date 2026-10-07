"use client"; // 브라우저 입력 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect, useRef, useState, type FormEvent } from "react"; // 입력 상태 도구
import { createDemoMemberProfile, MEMBER_DEMO_STORAGE_KEY } from "@/lib/member/demo-session"; // 시연 회원 도구
import type { AuthSettings } from "@/lib/member/auth-providers"; // 인증 설정 형식
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { toAuthErrorMessage } from "@/lib/member/signup"; // 인증 오류 안내
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import { isCredentialInputError } from "@/lib/auth/login-message"; // 인증 오류 판정 도구
import SocialLoginButtons from "./social-login-buttons"; // 간편 로그인 버튼
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberLoginFormProps // 로그인 폼 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    returnTo: string; // 로그인 뒤 주소
    settings: AuthSettings; // 인증 설정 요약
} // 형식 끝

function AccountLinks({ returnTo, signupEnabled, forgotEnabled = true }: { returnTo: string; signupEnabled: boolean; forgotEnabled?: boolean }) // 가입·비밀번호 찾기 링크
{ // 함수 시작
    const query = `?returnTo=${encodeURIComponent(returnTo)}`; // 복귀 주소 검색 값
    return ( // 링크 묶음 반환
        <p className={styles.accountLinks}> {/* 계정 링크 묶음 */}
            {forgotEnabled ? <Link href={`/login/forgot${query}`}>비밀번호 찾기</Link> : null} {/* 비밀번호 찾기 이동 */}
            {signupEnabled ? <Link href={`/signup${query}`}>회원가입</Link> : null} {/* 회원가입 이동 */}
        </p> // 계정 링크 묶음 끝
    ); // 링크 묶음 반환 끝
} // 함수 끝

export default function MemberLoginForm({ mode, returnTo, settings }: MemberLoginFormProps) // 회원 로그인 폼
{ // 함수 시작
    const [nickname, setNickname] = useState(""); // 시연 닉네임 상태
    const [email, setEmail] = useState(""); // 이메일 상태
    const [password, setPassword] = useState(""); // 비밀번호 상태
    const [message, setMessage] = useState(""); // 안내 문구 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태
    const [credentialError, setCredentialError] = useState(false); // 자격 증명 오류 상태
    const emailRef = useRef<HTMLInputElement>(null); // 이메일 입력 참조

    useEffect(() => // 자격 증명 오류 포커스 처리
    { // 효과 시작
        if (credentialError && !isSubmitting) // 입력 활성 오류 확인
        { // 조건 시작
            emailRef.current?.focus(); // 이메일 입력 포커스
        } // 조건 끝
    }, [credentialError, isSubmitting]); // 오류와 제출 상태 감시

    function handleDemoSubmit(event: FormEvent<HTMLFormElement>) // 시연 로그인 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        const profile = createDemoMemberProfile(nickname); // 시연 회원 생성
        window.sessionStorage.setItem(MEMBER_DEMO_STORAGE_KEY, JSON.stringify(profile)); // 현재 탭 공개 정보 저장
        window.location.assign(returnTo); // 이전 화면 이동
    } // 함수 끝

    async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) // 이메일 로그인 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        setIsSubmitting(true); // 제출 상태 시작
        setMessage(""); // 이전 안내 제거
        setCredentialError(false); // 이전 입력 오류 제거

        try // 로그인 시도
        { // 시도 시작
            const supabase = createBrowserSupabaseClient(); // 인증 도구 생성
            const result = await supabase.auth.signInWithPassword({ email, password }); // 이메일 로그인 요청

            if (result.error) // 로그인 실패 확인
            { // 조건 시작
                if (isCredentialInputError(result.error)) // 자격 증명 오류 확인
                { // 조건 시작
                    setCredentialError(true); // 자격 증명 오류 표시
                    setMessage("이메일 또는 비밀번호를 확인해 주세요."); // 입력 실패 안내
                } // 조건 끝
                else if ((result.error as { code?: string }).code === "email_not_confirmed") // 이메일 미인증 확인
                { // 조건 시작
                    setCredentialError(false); // 입력 오류 제외
                    setMessage(toAuthErrorMessage(result.error)); // 인증 안내
                } // 조건 끝
                else // 서비스 오류 확인
                { // 대안 시작
                    setCredentialError(false); // 입력 오류 제외
                    setMessage("로그인 서버에 연결할 수 없습니다."); // 서비스 실패 안내
                } // 대안 끝
                setIsSubmitting(false); // 제출 상태 종료
                return; // 실패 처리 종료
            } // 조건 끝

            window.location.assign(returnTo); // 이전 화면 이동
        } // 시도 끝
        catch // 연결 오류 처리
        { // 오류 처리 시작
            setCredentialError(false); // 통신 오류 분리
            setMessage("로그인 서버에 연결할 수 없습니다."); // 연결 실패 안내
            setIsSubmitting(false); // 제출 상태 종료
        } // 오류 처리 끝
    } // 함수 끝

    if (mode === "demo") // 시연 모드 확인
    { // 조건 시작
        return ( // 시연 폼 반환
            <div className={styles.formStack}> {/* 시연 로그인 묶음 */}
                <form className={styles.form} onSubmit={handleDemoSubmit}> {/* 시연 로그인 폼 */}
                    <label htmlFor="demo-nickname">화면에 표시할 닉네임</label> {/* 닉네임 이름 */}
                    <input id="demo-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={20} placeholder="Palettra Games 팬" /> {/* 닉네임 입력 */}
                    <button className={styles.primaryButton} type="submit">시연 계정으로 화면 확인</button> {/* 시연 로그인 버튼 */}
                </form> {/* 시연 로그인 폼 끝 */}
                <SocialLoginButtons mode={mode} providers={[]} returnTo={returnTo} /> {/* 간편 로그인 미리보기 */}
                <AccountLinks returnTo={returnTo} signupEnabled /> {/* 가입·찾기 미리보기 링크 */}
            </div> // 시연 로그인 묶음 끝
        ); // 시연 폼 반환 끝
    } // 조건 끝

    return ( // 실제 로그인 반환
        <div className={styles.formStack}> {/* 실제 로그인 묶음 */}
            {settings.emailEnabled ? <form className={styles.form} onSubmit={handleEmailSubmit} aria-busy={isSubmitting}> {/* 이메일 로그인 폼 */}
                <label htmlFor="member-email">이메일</label> {/* 이메일 이름 */}
                <input id="member-email" ref={emailRef} aria-invalid={credentialError} aria-describedby={credentialError ? "member-login-error" : undefined} type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isSubmitting} /> {/* 이메일 입력 */}
                <label htmlFor="member-password">비밀번호</label> {/* 비밀번호 이름 */}
                <input id="member-password" aria-invalid={credentialError} aria-describedby={credentialError ? "member-login-error" : undefined} type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting} /> {/* 비밀번호 입력 */}
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "확인 중…" : "이메일로 로그인"}</button> {/* 이메일 로그인 버튼 */}
            </form> : null} {/* 이메일 로그인 폼 끝 */}
            {message ? <p id="member-login-error" className={styles.error} role="alert">{message}</p> : null} {/* 오류 안내 */}
            <SocialLoginButtons mode={mode} providers={settings.providers} returnTo={returnTo} /> {/* 켜진 간편 로그인 */}
            <AccountLinks returnTo={returnTo} signupEnabled={settings.signupEnabled && settings.emailEnabled} forgotEnabled={settings.emailEnabled} /> {/* 가입·찾기 링크 */}
        </div> // 실제 로그인 묶음 끝
    ); // 실제 로그인 반환 끝
} // 함수 끝
