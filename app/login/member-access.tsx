"use client"; // 브라우저 회원 상태 모듈

import { useEffect, useRef, useState } from "react"; // 화면 상태 도구
import { MEMBER_DEMO_STORAGE_KEY, parseDemoMemberProfile } from "@/lib/member/demo-session"; // 시연 회원 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { fetchMemberProfile } from "@/lib/member/profile"; // 회원 프로필 조회
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import MemberLoginForm from "./member-login-form"; // 회원 로그인 폼
import MemberNicknameForm from "./member-nickname-form"; // 회원 닉네임 입력
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberAccessProps // 회원 접근 영역 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    returnTo: string; // 로그인 뒤 주소
} // 형식 끝

type AccessState = // 회원 접근 상태
    | { status: "checking" } // 상태 확인 중
    | { status: "signed-out" } // 로그아웃 상태
    | { status: "signed-in"; displayName: string; userId: string | null; nickname: string | null; profileError: boolean }; // 로그인 상태

function readStoredDemoName(): string | null // 시연 닉네임 읽기
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        return parseDemoMemberProfile(window.sessionStorage.getItem(MEMBER_DEMO_STORAGE_KEY))?.nickname ?? null; // 시연 닉네임 반환
    } // 시도 끝
    catch // 저장소 차단 처리
    { // 오류 처리 시작
        return null; // 회원 없음 반환
    } // 오류 처리 끝
} // 함수 끝

export default function MemberAccess({ mode, returnTo }: MemberAccessProps) // 회원 접근 영역
{ // 함수 시작
    const [state, setState] = useState<AccessState>({ status: "checking" }); // 회원 접근 상태
    const [message, setMessage] = useState(""); // 처리 결과 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [isSigningOut, setIsSigningOut] = useState(false); // 로그아웃 진행 상태
    const messageRef = useRef<HTMLParagraphElement>(null); // 결과 안내 참조

    useEffect(() => // 현재 로그인 상태 확인
    { // 효과 시작
        let active = true; // 화면 유지 여부

        async function resolveState(): Promise<AccessState> // 로그인 상태 판정
        { // 함수 시작
            if (mode === "demo") // 시연 모드 확인
            { // 조건 시작
                const nickname = readStoredDemoName(); // 시연 닉네임 읽기
                return nickname ? { status: "signed-in", displayName: nickname, userId: null, nickname, profileError: false } : { status: "signed-out" }; // 시연 상태 반환
            } // 조건 끝
            try // 실제 세션 조회 시도
            { // 시도 시작
                const supabase = createBrowserSupabaseClient(); // 인증 도구 생성
                const result = await supabase.auth.getUser(); // 현재 사용자 조회
                const user = result.data.user; // 사용자 정보

                if (!user) // 로그아웃 상태 확인
                { // 조건 시작
                    return { status: "signed-out" }; // 로그아웃 상태 반환
                } // 조건 끝

                const profile = await fetchMemberProfile(supabase, user.id).catch(() => undefined); // 공개 프로필 조회
                const nickname = profile?.nickname ?? null; // 현재 닉네임
                return { status: "signed-in", displayName: nickname ?? user.email ?? "회원", userId: user.id, nickname, profileError: profile === undefined }; // 실제 상태 반환
            } // 시도 끝
            catch // 조회 실패 처리
            { // 오류 처리 시작
                return { status: "signed-out" }; // 로그인 화면 대체
            } // 오류 처리 끝
        } // 함수 끝

        void resolveState().then((nextState) => // 판정 결과 반영
        { // 반영 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setState(nextState); // 상태 저장
            } // 조건 끝
        }); // 반영 끝
        return () => // 화면 해제 처리
        { // 해제 시작
            active = false; // 늦은 결과 무시
        }; // 해제 끝
    }, [mode]); // 회원 모드 감시

    useEffect(() => // 결과 안내 초점 처리
    { // 효과 시작
        if (message) // 안내 존재 확인
        { // 조건 시작
            messageRef.current?.focus(); // 안내 초점 이동
        } // 조건 끝
    }, [message]); // 안내 변경 감시

    async function handleSignOut() // 로그아웃 처리
    { // 함수 시작
        setIsSigningOut(true); // 진행 상태 시작
        setMessage(""); // 이전 안내 제거

        if (mode === "demo") // 시연 모드 확인
        { // 조건 시작
            try // 시연 정보 삭제 시도
            { // 시도 시작
                window.sessionStorage.removeItem(MEMBER_DEMO_STORAGE_KEY); // 시연 닉네임 삭제
            } // 시도 끝
            catch // 삭제 실패 처리
            { // 오류 처리 시작
                setMessageRole("alert"); // 오류 역할
                setMessage("브라우저 저장소에 접근할 수 없어 로그아웃하지 못했습니다. 탭을 닫으면 시연 로그인이 해제됩니다."); // 실패 안내
                setIsSigningOut(false); // 진행 상태 종료
                return; // 처리 종료
            } // 오류 처리 끝
            setState({ status: "signed-out" }); // 로그아웃 상태 반영
            setMessageRole("status"); // 상태 역할
            setMessage("로그아웃했습니다. 시연 닉네임을 이 탭에서 삭제했습니다."); // 완료 안내
            setIsSigningOut(false); // 진행 상태 종료
            return; // 처리 종료
        } // 조건 끝

        try // 실제 세션 종료 시도
        { // 시도 시작
            const result = await createBrowserSupabaseClient().auth.signOut(); // 세션 종료 요청
            if (result.error) // 종료 실패 확인
            { // 조건 시작
                throw result.error; // 실패 처리 이동
            } // 조건 끝
            setState({ status: "signed-out" }); // 로그아웃 상태 반영
            setMessageRole("status"); // 상태 역할
            setMessage("로그아웃했습니다."); // 완료 안내
        } // 시도 끝
        catch // 종료 실패 처리
        { // 오류 처리 시작
            setMessageRole("alert"); // 오류 역할
            setMessage("로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요."); // 실패 안내
        } // 오류 처리 끝
        finally // 종료 공통 처리
        { // 정리 시작
            setIsSigningOut(false); // 진행 상태 종료
        } // 정리 끝
    } // 함수 끝

    const notice = message ? <p ref={messageRef} tabIndex={-1} className={messageRole === "alert" ? styles.error : styles.success} role={messageRole}>{message}</p> : null; // 처리 결과 안내

    if (state.status === "checking") // 상태 확인 중 확인
    { // 조건 시작
        return <p className={styles.description} role="status">로그인 상태를 확인하고 있습니다…</p>; // 확인 중 안내
    } // 조건 끝

    if (state.status === "signed-in") // 로그인 상태 확인
    { // 조건 시작
        return ( // 회원 정보 반환
            <section className={styles.account} aria-labelledby="member-account-title"> {/* 현재 계정 영역 */}
                <h2 id="member-account-title">현재 로그인 계정</h2> {/* 계정 영역 제목 */}
                <p className={styles.accountName}>{state.displayName}</p> {/* 계정 이름 */}
                <p className={styles.description}>{mode === "demo" ? "시연 닉네임은 현재 탭에만 저장되며 서버로 전송하지 않습니다." : "로그아웃하면 이 브라우저의 로그인 세션이 종료됩니다."}</p> {/* 계정 안내 */}
                {state.profileError ? <p className={styles.error} role="alert">회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null} {/* 프로필 조회 실패 안내 */}
                {mode === "supabase" && state.userId && !state.profileError ? <MemberNicknameForm userId={state.userId} nickname={state.nickname} onSaved={(nickname) => setState({ ...state, displayName: nickname, nickname })} /> : null} {/* 닉네임 설정 */}
                <button className={styles.primaryButton} type="button" onClick={handleSignOut} disabled={isSigningOut} aria-busy={isSigningOut}>{isSigningOut ? "로그아웃 중…" : "로그아웃"}</button> {/* 로그아웃 버튼 */}
                {notice} {/* 처리 결과 안내 */}
            </section> // 현재 계정 영역 끝
        ); // 회원 정보 반환 끝
    } // 조건 끝

    return ( // 로그인 폼 반환
        <> {/* 로그인 영역 묶음 */}
            {notice} {/* 로그아웃 결과 안내 */}
            <MemberLoginForm mode={mode} returnTo={returnTo} /> {/* 로그인 입력 */}
        </> // 로그인 영역 묶음 끝
    ); // 로그인 폼 반환 끝
} // 함수 끝
