"use client"; // 브라우저 로그인 허용 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect, useState } from "react"; // 화면 상태 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { buildConsentReturnTo, ConsentError, decideConsent, loadConsentRequest, type ConsentRequest } from "@/lib/member/oauth-consent"; // 로그인 허용 도구
import { fetchMemberProfile } from "@/lib/member/profile"; // 회원 프로필 조회
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "../../login/member-login.module.css"; // 회원 화면 공통 스타일
import accountStyles from "../../account/account.module.css"; // 내 정보 전용 스타일

interface ConsentPanelProps // 로그인 허용 영역 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    authorizationId: string | null; // 요청 번호
} // 형식 끝

type ConsentState = // 로그인 허용 상태
    | { status: "checking" } // 확인 중
    | { status: "unavailable" } // 시연 모드
    | { status: "invalid"; message: string } // 잘못된 요청
    | { status: "signed-out" } // 로그인 필요
    | { status: "profile-required" } // 닉네임·약관 동의 필요
    | { status: "moving" } // 서비스로 이동 중
    | { status: "ready"; request: Extract<ConsentRequest, { status: "consent" }>; nickname: string }; // 허용 여부 확인

const INVALID_MESSAGE = "요청이 올바르지 않거나 시간이 지났습니다. 이용하려던 서비스에서 다시 시도해 주세요."; // 잘못된 요청 안내

export default function ConsentPanel({ mode, authorizationId }: ConsentPanelProps) // 다른 서비스 로그인 허용 영역
{ // 함수 시작
    const [state, setState] = useState<ConsentState>({ status: "checking" }); // 로그인 허용 상태
    const [busy, setBusy] = useState<"approve" | "deny" | null>(null); // 진행 중 결정
    const [message, setMessage] = useState(""); // 실패 안내
    const returnTo = authorizationId ? buildConsentReturnTo(authorizationId) : "/main.html"; // 로그인 뒤 돌아올 주소

    useEffect(() => // 요청 확인
    { // 효과 시작
        let active = true; // 화면 유지 여부

        async function resolve(): Promise<ConsentState> // 요청 상태 판정
        { // 함수 시작
            if (mode === "demo") // 시연 모드 확인
            { // 조건 시작
                return { status: "unavailable" }; // 동작하지 않음 안내
            } // 조건 끝
            if (!authorizationId) // 요청 번호 확인
            { // 조건 시작
                return { status: "invalid", message: INVALID_MESSAGE }; // 잘못된 요청 안내
            } // 조건 끝
            try // 요청 조회 시도
            { // 시도 시작
                const supabase = createBrowserSupabaseClient(); // 인증 도구
                const user = (await supabase.auth.getUser()).data.user; // 현재 사용자
                if (!user) // 로그아웃 확인
                { // 조건 시작
                    return { status: "signed-out" }; // 로그인 안내
                } // 조건 끝
                const profile = await fetchMemberProfile(supabase, user.id); // 회원 프로필 조회
                if (!profile) // 가입 마무리 확인
                { // 조건 시작
                    return { status: "profile-required" }; // 닉네임·약관 동의 안내
                } // 조건 끝
                const request = await loadConsentRequest(supabase, authorizationId); // 로그인 허용 요청 조회
                if (request.status === "redirect") // 이미 허용한 서비스 확인
                { // 조건 시작
                    window.location.assign(request.url); // 바로 서비스로 이동
                    return { status: "moving" }; // 이동 중 안내
                } // 조건 끝
                return { status: "ready", request, nickname: profile.nickname }; // 허용 여부 확인
            } // 시도 끝
            catch (error: unknown) // 조회 실패 처리
            { // 오류 처리 시작
                if (error instanceof ConsentError && error.code === "SIGN_IN_REQUIRED") // 세션 만료 확인
                { // 조건 시작
                    return { status: "signed-out" }; // 로그인 안내
                } // 조건 끝
                return { status: "invalid", message: error instanceof ConsentError ? error.message : INVALID_MESSAGE }; // 실패 안내
            } // 오류 처리 끝
        } // 함수 끝

        void resolve().then((next) => // 판정 결과 반영
        { // 반영 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setState(next); // 상태 저장
            } // 조건 끝
        }); // 반영 끝
        return () => // 화면 해제
        { // 해제 시작
            active = false; // 늦은 결과 무시
        }; // 해제 끝
    }, [mode, authorizationId]); // 요청 변경 감시

    async function handleDecision(approve: boolean) // 허용·거부 처리
    { // 함수 시작
        if (state.status !== "ready") // 확인 상태 검사
        { // 조건 시작
            return; // 처리 생략
        } // 조건 끝
        setBusy(approve ? "approve" : "deny"); // 진행 표시
        setMessage(""); // 이전 안내 제거
        try // 결정 전달 시도
        { // 시도 시작
            const url = await decideConsent(createBrowserSupabaseClient(), state.request.authorizationId, approve); // 결정 전달
            setState({ status: "moving" }); // 이동 중 안내
            window.location.assign(url); // 서비스로 돌아가기
        } // 시도 끝
        catch (error: unknown) // 처리 실패
        { // 오류 처리 시작
            setMessage(error instanceof ConsentError ? error.message : "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 실패 안내
            setBusy(null); // 진행 종료
        } // 오류 처리 끝
    } // 함수 끝

    if (state.status === "checking") // 확인 중
    { // 조건 시작
        return <p className={styles.description} role="status">요청을 확인하고 있습니다…</p>; // 확인 안내
    } // 조건 끝

    if (state.status === "moving") // 이동 중
    { // 조건 시작
        return <p className={styles.description} role="status">서비스로 이동하고 있습니다…</p>; // 이동 안내
    } // 조건 끝

    if (state.status === "unavailable" || state.status === "invalid") // 동작하지 않거나 잘못된 요청
    { // 조건 시작
        return ( // 안내 반환
            <section className={styles.account} aria-labelledby="consent-invalid-title"> {/* 안내 영역 */}
                <h2 id="consent-invalid-title">로그인을 진행할 수 없습니다</h2> {/* 안내 제목 */}
                <p className={styles.error} role="alert">{state.status === "invalid" ? state.message : "서버가 연결되지 않은 시연 모드에서는 다른 서비스 로그인을 진행할 수 없습니다."}</p> {/* 안내 문구 */}
                <Link className={styles.primaryButton} href="/main.html">메인으로 이동</Link> {/* 메인 이동 */}
            </section> // 안내 영역 끝
        ); // 안내 반환 끝
    } // 조건 끝

    if (state.status === "signed-out" || state.status === "profile-required") // 로그인 또는 가입 마무리 필요
    { // 조건 시작
        return ( // 로그인 안내 반환
            <section className={styles.account} aria-labelledby="consent-signin-title"> {/* 로그인 안내 영역 */}
                <h2 id="consent-signin-title">{state.status === "signed-out" ? "먼저 로그인해 주세요" : "가입을 마무리해 주세요"}</h2> {/* 안내 제목 */}
                <p className={styles.description}>{state.status === "signed-out" ? "Palettra Games 계정으로 로그인하면 이 화면으로 돌아옵니다." : "닉네임과 약관 동의를 마치면 이 화면으로 돌아옵니다."}</p> {/* 안내 설명 */}
                <Link className={styles.primaryButton} href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>{state.status === "signed-out" ? "로그인하러 가기" : "닉네임 정하러 가기"}</Link> {/* 로그인 이동 */}
            </section> // 로그인 안내 영역 끝
        ); // 로그인 안내 반환 끝
    } // 조건 끝

    return ( // 허용 확인 반환
        <section className={styles.account} aria-labelledby="consent-request-title"> {/* 허용 확인 영역 */}
            <h2 id="consent-request-title">로그인 허용 확인</h2> {/* 확인 제목 */}
            <p className={styles.accountName}><span translate="no">{state.request.clientName}</span></p> {/* 요청한 서비스 이름 */}
            <p className={styles.description}>이 서비스가 내 Palettra Games 계정으로 로그인하려고 합니다.</p> {/* 요청 설명 */}
            <dl className={accountStyles.facts}> {/* 요청 정보 */}
                <div><dt>로그인할 계정</dt><dd>{state.nickname}{state.request.email ? ` (${state.request.email})` : ""}</dd></div> {/* 현재 계정 */}
                {state.request.redirectHost ? <div><dt>돌아갈 주소</dt><dd>{state.request.redirectHost}</dd></div> : null} {/* 서비스 주소 */}
            </dl> {/* 요청 정보 끝 */}
            <h3 className={styles.socialTitle}>서비스가 받는 정보</h3> {/* 넘겨주는 정보 제목 */}
            <ul className={accountStyles.consentList}> {/* 넘겨주는 정보 목록 */}
                {state.request.scopes.length > 0 ? state.request.scopes.map((scope) => <li key={scope.id}>{scope.label}</li>) : <li>이메일 주소</li>} {/* 넘겨주는 정보 줄 */}
            </ul> {/* 넘겨주는 정보 목록 끝 */}
            {message ? <p className={styles.error} role="alert">{message}</p> : null} {/* 실패 안내 */}
            <div className={accountStyles.consentActions}> {/* 결정 버튼 */}
                <button className={styles.primaryButton} type="button" onClick={() => void handleDecision(true)} disabled={busy !== null} aria-busy={busy === "approve"}>{busy === "approve" ? "처리 중…" : "허용하고 계속"}</button> {/* 허용 버튼 */}
                <button className={accountStyles.deleteButton} type="button" onClick={() => void handleDecision(false)} disabled={busy !== null} aria-busy={busy === "deny"}>{busy === "deny" ? "처리 중…" : "허용하지 않음"}</button> {/* 거부 버튼 */}
            </div> {/* 결정 버튼 끝 */}
        </section> // 허용 확인 영역 끝
    ); // 허용 확인 반환 끝
} // 함수 끝
