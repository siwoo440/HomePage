"use client"; // 브라우저 입력 모듈

import { useState, type FormEvent } from "react"; // 입력 상태 도구
import { createDemoMemberProfile, MEMBER_DEMO_STORAGE_KEY } from "@/lib/member/demo-session"; // 시연 회원 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberLoginFormProps // 로그인 폼 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    returnTo: string; // 로그인 뒤 주소
} // 형식 끝

export default function MemberLoginForm({ mode, returnTo }: MemberLoginFormProps) // 회원 로그인 폼
{ // 함수 시작
    const [nickname, setNickname] = useState(""); // 시연 닉네임 상태
    const [email, setEmail] = useState(""); // 이메일 상태
    const [password, setPassword] = useState(""); // 비밀번호 상태
    const [message, setMessage] = useState(""); // 안내 문구 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 상태

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

        try // 로그인 시도
        { // 시도 시작
            const supabase = createBrowserSupabaseClient(); // 인증 도구 생성
            const result = await supabase.auth.signInWithPassword({ email, password }); // 이메일 로그인 요청

            if (result.error) // 로그인 실패 확인
            { // 조건 시작
                setMessage("이메일 또는 비밀번호를 확인해 주세요."); // 실패 안내
                setIsSubmitting(false); // 제출 상태 종료
                return; // 실패 처리 종료
            } // 조건 끝

            window.location.assign(returnTo); // 이전 화면 이동
        } // 시도 끝
        catch // 연결 오류 처리
        { // 오류 처리 시작
            setMessage("로그인 서버에 연결할 수 없습니다."); // 연결 실패 안내
            setIsSubmitting(false); // 제출 상태 종료
        } // 오류 처리 끝
    } // 함수 끝

    async function handleGoogleLogin() // 구글 로그인 처리
    { // 함수 시작
        setIsSubmitting(true); // 제출 상태 시작
        setMessage(""); // 이전 안내 제거

        try // 로그인 시도
        { // 시도 시작
            const supabase = createBrowserSupabaseClient(); // 인증 도구 생성
            const callback = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`; // 인증 복귀 주소
            const result = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback } }); // 구글 로그인 요청

            if (result.error) // 로그인 실패 확인
            { // 조건 시작
                setMessage("구글 로그인을 시작할 수 없습니다."); // 실패 안내
                setIsSubmitting(false); // 제출 상태 종료
            } // 조건 끝
        } // 시도 끝
        catch // 연결 오류 처리
        { // 오류 처리 시작
            setMessage("로그인 서버에 연결할 수 없습니다."); // 연결 실패 안내
            setIsSubmitting(false); // 제출 상태 종료
        } // 오류 처리 끝
    } // 함수 끝

    if (mode === "demo") // 시연 모드 확인
    { // 조건 시작
        return ( // 시연 폼 반환
            <form className={styles.form} onSubmit={handleDemoSubmit}> {/* 시연 로그인 폼 */}
                <label htmlFor="demo-nickname">화면에 표시할 닉네임</label> {/* 닉네임 이름 */}
                <input id="demo-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={20} placeholder="DEVFORGE 팬" /> {/* 닉네임 입력 */}
                <button className={styles.primaryButton} type="submit">시연 계정으로 화면 확인</button> {/* 시연 로그인 버튼 */}
            </form> // 시연 로그인 폼 끝
        ); // 시연 폼 반환 끝
    } // 조건 끝

    return ( // 실제 로그인 반환
        <div className={styles.formStack}> {/* 실제 로그인 묶음 */}
            <form className={styles.form} onSubmit={handleEmailSubmit}> {/* 이메일 로그인 폼 */}
                <label htmlFor="member-email">이메일</label> {/* 이메일 이름 */}
                <input id="member-email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={isSubmitting} /> {/* 이메일 입력 */}
                <label htmlFor="member-password">비밀번호</label> {/* 비밀번호 이름 */}
                <input id="member-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={isSubmitting} /> {/* 비밀번호 입력 */}
                <button className={styles.primaryButton} type="submit" disabled={isSubmitting}>{isSubmitting ? "확인 중…" : "이메일로 로그인"}</button> {/* 이메일 로그인 버튼 */}
            </form> {/* 이메일 로그인 폼 끝 */}
            <span className={styles.divider}>또는</span> {/* 로그인 구분 */}
            <button className={styles.googleButton} type="button" onClick={handleGoogleLogin} disabled={isSubmitting}>Google로 로그인</button> {/* 구글 로그인 버튼 */}
            {message ? <p className={styles.error} role="alert">{message}</p> : null} {/* 오류 안내 */}
        </div> // 실제 로그인 묶음 끝
    ); // 실제 로그인 반환 끝
} // 함수 끝
