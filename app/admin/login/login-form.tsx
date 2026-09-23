"use client"; // 브라우저 입력 모듈

import { useState, type FormEvent } from "react"; // 입력 상태 도구
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import { getLoginMessage } from "@/lib/auth/login-message"; // 초기 로그인 안내 판정

interface LoginFormProps // 로그인 입력 속성
{ // 형식 시작
    configured: boolean; // 설정 완료 여부
    errorCode: string; // 서버 오류 코드
    returnTo: string; // 로그인 뒤 이동 주소
} // 형식 끝

export default function LoginForm({ configured, errorCode, returnTo }: LoginFormProps) // 로그인 입력 화면
{ // 함수 시작
    const [email, setEmail] = useState(""); // 이메일 입력 상태
    const [password, setPassword] = useState(""); // 비밀번호 입력 상태
    const [message, setMessage] = useState(getLoginMessage(configured, errorCode)); // 안내 문구 상태
    const [isSubmitting, setIsSubmitting] = useState(false); // 제출 진행 상태

    async function handleSubmit(event: FormEvent<HTMLFormElement>) // 로그인 제출 처리
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단

        if (!configured) // 설정 누락 확인
        { // 조건 시작
            setMessage(getLoginMessage(false, "")); // 설정 누락 안내
            return; // 제출 처리 종료
        } // 조건 끝

        setMessage(""); // 이전 안내 제거
        setIsSubmitting(true); // 제출 상태 시작

        try // 로그인 시도
        { // 시도 시작
            const supabase = createBrowserSupabaseClient(); // 브라우저 인증 도구
            const result = await supabase.auth.signInWithPassword({ email, password }); // 이메일 로그인

            if (result.error) // 로그인 실패 확인
            { // 조건 시작
                setMessage("이메일 또는 비밀번호를 확인해 주세요."); // 안전한 실패 안내
                setIsSubmitting(false); // 제출 상태 종료
                return; // 실패 처리 종료
            } // 조건 끝

            window.location.assign(returnTo); // 보호 화면 이동
        } // 시도 끝
        catch // 설정 또는 통신 오류 처리
        { // 오류 처리 시작
            setMessage("로그인 서비스를 연결할 수 없습니다."); // 연결 실패 안내
            setIsSubmitting(false); // 제출 상태 종료
        } // 오류 처리 끝
    } // 함수 끝

    return ( // 입력 화면 반환
        <form className="admin-login-form" onSubmit={handleSubmit}> {/* 로그인 폼 */}
            <label htmlFor="admin-email">이메일</label> {/* 이메일 이름 */}
            <input id="admin-email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={!configured || isSubmitting} /> {/* 이메일 입력 */}
            <label htmlFor="admin-password">비밀번호</label> {/* 비밀번호 이름 */}
            <input id="admin-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required disabled={!configured || isSubmitting} /> {/* 비밀번호 입력 */}
            {message ? <p className="admin-message admin-message-error" role="alert">{message}</p> : null} {/* 로그인 안내 */}
            <button className="admin-primary-button" type="submit" disabled={!configured || isSubmitting}>{isSubmitting ? "확인 중…" : "로그인"}</button> {/* 로그인 버튼 */}
        </form> // 로그인 폼 끝
    ); // 입력 화면 반환 끝
} // 함수 끝
