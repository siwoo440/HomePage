"use client"; // 브라우저 입력 모듈

import { useState } from "react"; // 화면 상태 도구
import { SOCIAL_PROVIDERS, type SocialProviderId } from "@/lib/member/auth-providers"; // 간편 로그인 목록
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface SocialLoginButtonsProps // 간편 로그인 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    providers: SocialProviderId[]; // 켜진 간편 로그인
    returnTo: string; // 로그인 뒤 주소
} // 형식 끝

export default function SocialLoginButtons({ mode, providers, returnTo }: SocialLoginButtonsProps) // 간편 로그인 버튼 묶음
{ // 함수 시작
    const [pendingId, setPendingId] = useState<SocialProviderId | null>(null); // 진행 중 로그인
    const [message, setMessage] = useState(""); // 실패 안내
    const visible = mode === "demo" ? SOCIAL_PROVIDERS : SOCIAL_PROVIDERS.filter((provider) => providers.includes(provider.id)); // 표시 로그인 목록

    async function handleClick(provider: SocialProviderId) // 간편 로그인 시작
    { // 함수 시작
        setPendingId(provider); // 진행 상태 시작
        setMessage(""); // 이전 안내 제거

        try // 로그인 요청 시도
        { // 시도 시작
            const callback = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`; // 인증 복귀 주소
            const result = await createBrowserSupabaseClient().auth.signInWithOAuth({ provider, options: { redirectTo: callback } }); // 간편 로그인 요청

            if (result.error) // 요청 실패 확인
            { // 조건 시작
                setMessage("간편 로그인을 시작할 수 없습니다. 잠시 후 다시 시도해 주세요."); // 실패 안내
                setPendingId(null); // 진행 상태 종료
            } // 조건 끝
        } // 시도 끝
        catch // 연결 실패 처리
        { // 오류 처리 시작
            setMessage("로그인 서버에 연결할 수 없습니다."); // 연결 실패 안내
            setPendingId(null); // 진행 상태 종료
        } // 오류 처리 끝
    } // 함수 끝

    if (visible.length === 0) // 표시할 로그인 없음 확인
    { // 조건 시작
        return null; // 영역 생략
    } // 조건 끝

    return ( // 간편 로그인 반환
        <section className={styles.social} aria-labelledby="social-login-title"> {/* 간편 로그인 영역 */}
            <h2 id="social-login-title" className={styles.socialTitle}>간편 로그인</h2> {/* 영역 제목 */}
            <p className={styles.socialNote}>{mode === "demo" ? "시연 모드 · Supabase를 연결하고 켜 둔 계정만 실제 화면에 표시됩니다." : "처음 이용하면 자동으로 가입되고, 다음 단계에서 닉네임과 약관 동의를 받습니다."}</p> {/* 이용 안내 */}
            <div className={styles.socialGrid}> {/* 버튼 격자 */}
                {visible.map((provider) => <button key={provider.id} type="button" className={`${styles.socialButton} ${styles[`provider_${provider.id}`] ?? ""}`} data-provider={provider.id} onClick={() => void handleClick(provider.id)} disabled={mode === "demo" || pendingId !== null} aria-busy={pendingId === provider.id}>{pendingId === provider.id ? "이동 중…" : provider.action}</button>)} {/* 로그인 버튼 */}
            </div> {/* 버튼 격자 끝 */}
            {message ? <p className={styles.error} role="alert">{message}</p> : null} {/* 실패 안내 */}
        </section> // 간편 로그인 영역 끝
    ); // 간편 로그인 반환 끝
} // 함수 끝
