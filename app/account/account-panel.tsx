"use client"; // 브라우저 내 정보 관리 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect, useRef, useState, type FormEvent } from "react"; // 화면 상태 도구
import { AccountError, deleteMyComment, deleteOwnAccount, isDeleteConfirmed, listMyComments, type MyComment } from "@/lib/member/account"; // 내 정보 처리 도구
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { createDemoMemberProfile, MEMBER_DEMO_STORAGE_KEY, parseDemoMemberProfile } from "@/lib/member/demo-session"; // 시연 회원 도구
import { ensureMemberProfile, validateNickname } from "@/lib/member/profile"; // 회원 프로필 도구
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import MemberNicknameForm from "../login/member-nickname-form"; // 실제 닉네임 입력
import styles from "../login/member-login.module.css"; // 회원 화면 공통 스타일
import accountStyles from "./account.module.css"; // 내 정보 전용 스타일

interface AccountPanelProps // 내 정보 영역 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
} // 형식 끝

type PanelState = // 내 정보 상태
    | { status: "checking" } // 확인 중
    | { status: "signed-out" } // 로그아웃 상태
    | { status: "deleted" } // 탈퇴 완료
    | { status: "signed-in"; userId: string | null; email: string | null; nickname: string | null; profileError: boolean }; // 로그인 상태

type CommentsState = // 내 댓글 상태
    | { status: "idle" | "loading" } // 대기·조회 중
    | { status: "error"; message: string } // 조회 실패
    | { status: "ready"; items: MyComment[] }; // 조회 완료

function readDemoNickname(): string | null // 시연 닉네임 읽기
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

function formatDate(value: string): string // 작성 시각 표시
{ // 함수 시작
    const locale = document.documentElement.lang === "en" ? "en-US" : "ko-KR"; // 화면 언어 표기
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); // 날짜 문구 반환
} // 함수 끝

export default function AccountPanel({ mode }: AccountPanelProps) // 내 정보 관리 영역
{ // 함수 시작
    const [state, setState] = useState<PanelState>({ status: "checking" }); // 내 정보 상태
    const [comments, setComments] = useState<CommentsState>({ status: "idle" }); // 내 댓글 상태
    const [message, setMessage] = useState(""); // 처리 결과 안내
    const [messageRole, setMessageRole] = useState<"status" | "alert">("status"); // 안내 역할
    const [demoNickname, setDemoNickname] = useState(""); // 시연 닉네임 입력
    const [confirmText, setConfirmText] = useState(""); // 탈퇴 확인 입력
    const [busy, setBusy] = useState<string | null>(null); // 진행 중 작업
    const messageRef = useRef<HTMLParagraphElement>(null); // 안내 참조

    useEffect(() => // 현재 계정 확인
    { // 효과 시작
        let active = true; // 화면 유지 여부

        async function resolve(): Promise<PanelState> // 계정 상태 판정
        { // 함수 시작
            if (mode === "demo") // 시연 모드 확인
            { // 조건 시작
                const nickname = readDemoNickname(); // 시연 닉네임
                return nickname ? { status: "signed-in", userId: null, email: null, nickname, profileError: false } : { status: "signed-out" }; // 시연 상태 반환
            } // 조건 끝
            try // 실제 세션 조회 시도
            { // 시도 시작
                const supabase = createBrowserSupabaseClient(); // 인증 도구
                const user = (await supabase.auth.getUser()).data.user; // 현재 사용자
                if (!user) // 로그아웃 확인
                { // 조건 시작
                    return { status: "signed-out" }; // 로그아웃 상태 반환
                } // 조건 끝
                const profile = await ensureMemberProfile(supabase, user).catch(() => undefined); // 프로필 조회
                return { status: "signed-in", userId: user.id, email: user.email ?? null, nickname: profile?.nickname ?? null, profileError: profile === undefined }; // 로그인 상태 반환
            } // 시도 끝
            catch // 조회 실패 처리
            { // 오류 처리 시작
                return { status: "signed-out" }; // 로그인 안내 대체
            } // 오류 처리 끝
        } // 함수 끝

        void resolve().then((next) => // 판정 결과 반영
        { // 반영 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setState(next); // 상태 저장
                if (next.status === "signed-in" && next.nickname) // 닉네임 확인
                { // 조건 시작
                    setDemoNickname(next.nickname); // 입력 기본값
                } // 조건 끝
            } // 조건 끝
        }); // 반영 끝
        return () => // 화면 해제
        { // 해제 시작
            active = false; // 늦은 결과 무시
        }; // 해제 끝
    }, [mode]); // 회원 모드 감시

    const userId = state.status === "signed-in" ? state.userId : null; // 실제 회원 식별자

    useEffect(() => // 내 댓글 불러오기
    { // 효과 시작
        if (mode !== "supabase" || !userId) // 실제 회원 확인
        { // 조건 시작
            return; // 조회 생략
        } // 조건 끝
        let active = true; // 화면 유지 여부
        void listMyComments(createBrowserSupabaseClient(), userId).then( // 댓글 조회
            (items) => { if (active) setComments({ status: "ready", items }); }, // 조회 성공
            (error: unknown) => { if (active) setComments({ status: "error", message: error instanceof AccountError ? error.message : "내 댓글을 불러오지 못했습니다." }); }, // 조회 실패
        ); // 조회 끝
        return () => // 화면 해제
        { // 해제 시작
            active = false; // 늦은 결과 무시
        }; // 해제 끝
    }, [mode, userId]); // 회원 변경 감시

    useEffect(() => // 안내 초점 이동
    { // 효과 시작
        if (message) // 안내 확인
        { // 조건 시작
            messageRef.current?.focus(); // 안내 초점
        } // 조건 끝
    }, [message]); // 안내 변경 감시

    function announce(text: string, role: "status" | "alert" = "status") // 결과 안내
    { // 함수 시작
        setMessageRole(role); // 안내 역할
        setMessage(text); // 안내 문구
    } // 함수 끝

    function handleDemoNickname(event: FormEvent<HTMLFormElement>) // 시연 닉네임 저장
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        const checked = validateNickname(demoNickname); // 닉네임 검증
        if (!checked.ok) // 검증 실패 확인
        { // 조건 시작
            announce(checked.message, "alert"); // 오류 안내
            return; // 처리 종료
        } // 조건 끝
        try // 저장 시도
        { // 시도 시작
            window.sessionStorage.setItem(MEMBER_DEMO_STORAGE_KEY, JSON.stringify(createDemoMemberProfile(checked.value))); // 시연 닉네임 저장
            setState({ status: "signed-in", userId: null, email: null, nickname: checked.value, profileError: false }); // 상태 갱신
            announce("시연 닉네임을 바꿨습니다."); // 완료 안내
        } // 시도 끝
        catch // 저장 실패 처리
        { // 오류 처리 시작
            announce("브라우저 저장소에 접근할 수 없어 저장하지 못했습니다.", "alert"); // 실패 안내
        } // 오류 처리 끝
    } // 함수 끝

    async function handleDeleteComment(comment: MyComment) // 내 댓글 삭제
    { // 함수 시작
        if (!userId || !window.confirm("이 댓글을 삭제할까요? 답글과 첨부 이미지도 함께 삭제되며 되돌릴 수 없습니다.")) // 삭제 확인
        { // 조건 시작
            return; // 삭제 취소
        } // 조건 끝
        setBusy(comment.id); // 진행 표시
        try // 삭제 시도
        { // 시도 시작
            await deleteMyComment(createBrowserSupabaseClient(), userId, comment); // 댓글 삭제
            setComments((current) => (current.status === "ready" ? { status: "ready", items: current.items.filter((item) => item.id !== comment.id) } : current)); // 목록 갱신
            announce("댓글을 삭제했습니다."); // 완료 안내
        } // 시도 끝
        catch (error: unknown) // 삭제 실패 처리
        { // 오류 처리 시작
            announce(error instanceof AccountError ? error.message : "댓글을 삭제하지 못했습니다.", "alert"); // 실패 안내
        } // 오류 처리 끝
        finally // 공통 정리
        { // 정리 시작
            setBusy(null); // 진행 종료
        } // 정리 끝
    } // 함수 끝

    async function handleDeleteAccount(event: FormEvent<HTMLFormElement>) // 회원 탈퇴
    { // 함수 시작
        event.preventDefault(); // 기본 제출 차단
        if (!isDeleteConfirmed(confirmText)) // 확인 입력 검사
        { // 조건 시작
            announce("확인 칸에 \"탈퇴\"를 정확히 입력해 주세요.", "alert"); // 확인 오류 안내
            return; // 처리 종료
        } // 조건 끝
        setBusy("account"); // 진행 표시
        try // 탈퇴 시도
        { // 시도 시작
            if (mode === "demo") // 시연 모드 확인
            { // 조건 시작
                window.sessionStorage.removeItem(MEMBER_DEMO_STORAGE_KEY); // 시연 정보 삭제
            } // 조건 끝
            else if (userId) // 실제 회원 확인
            { // 조건 시작
                await deleteOwnAccount(createBrowserSupabaseClient(), userId); // 계정 삭제
            } // 조건 끝
            setState({ status: "deleted" }); // 탈퇴 완료 상태
            setMessage(""); // 이전 안내 제거
        } // 시도 끝
        catch (error: unknown) // 탈퇴 실패 처리
        { // 오류 처리 시작
            announce(error instanceof AccountError ? error.message : "탈퇴하지 못했습니다. 잠시 후 다시 시도해 주세요.", "alert"); // 실패 안내
        } // 오류 처리 끝
        finally // 공통 정리
        { // 정리 시작
            setBusy(null); // 진행 종료
        } // 정리 끝
    } // 함수 끝

    const notice = message ? <p ref={messageRef} tabIndex={-1} className={messageRole === "alert" ? styles.error : styles.success} role={messageRole}>{message}</p> : null; // 결과 안내

    if (state.status === "checking") // 확인 중
    { // 조건 시작
        return <p className={styles.description} role="status">로그인 상태를 확인하고 있습니다…</p>; // 확인 안내
    } // 조건 끝

    if (state.status === "deleted") // 탈퇴 완료
    { // 조건 시작
        return ( // 완료 안내 반환
            <section className={styles.account} aria-labelledby="account-deleted-title"> {/* 완료 영역 */}
                <h2 id="account-deleted-title">탈퇴가 완료되었습니다</h2> {/* 완료 제목 */}
                <p className={styles.description}>{mode === "demo" ? "이 탭의 시연 회원 정보를 지웠습니다." : "계정과 프로필, 댓글, 반응, 신고 기록, 첨부 이미지를 삭제했습니다. 그동안 이용해 주셔서 감사합니다."}</p> {/* 완료 설명 */}
                <Link className={styles.primaryButton} href="/main.html">메인으로 이동</Link> {/* 메인 이동 */}
            </section> // 완료 영역 끝
        ); // 완료 안내 반환 끝
    } // 조건 끝

    if (state.status === "signed-out") // 로그아웃 상태
    { // 조건 시작
        return ( // 로그인 안내 반환
            <section className={styles.account} aria-labelledby="account-signin-title"> {/* 로그인 안내 영역 */}
                <h2 id="account-signin-title">로그인이 필요합니다</h2> {/* 안내 제목 */}
                <p className={styles.description}>내 정보는 로그인한 회원만 볼 수 있습니다.</p> {/* 안내 설명 */}
                <Link className={styles.primaryButton} href="/login?returnTo=%2Faccount">로그인하러 가기</Link> {/* 로그인 이동 */}
            </section> // 로그인 안내 영역 끝
        ); // 로그인 안내 반환 끝
    } // 조건 끝

    return ( // 관리 화면 반환
        <div className={accountStyles.stack}> {/* 관리 묶음 */}
            {notice} {/* 결과 안내 */}
            <section className={styles.account} aria-labelledby="account-profile-title"> {/* 프로필 영역 */}
                <h2 id="account-profile-title">닉네임</h2> {/* 프로필 제목 */}
                <p className={styles.accountName}>{state.nickname ?? "닉네임 없음"}</p> {/* 현재 닉네임 */}
                {state.email ? <p className={styles.description}>로그인 이메일: {state.email} (본인에게만 보입니다)</p> : null} {/* 본인 이메일 */}
                {state.profileError ? <p className={styles.error} role="alert">회원 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.</p> : null} {/* 조회 실패 */}
                {mode === "supabase" && state.userId && !state.profileError ? <MemberNicknameForm userId={state.userId} nickname={state.nickname} requireConsent={!state.nickname} onSaved={(nickname) => setState({ ...state, nickname })} /> : null} {/* 실제 닉네임 변경 */}
                {mode === "demo" ? ( // 시연 닉네임 변경
                    <form className={styles.form} onSubmit={handleDemoNickname} noValidate> {/* 시연 닉네임 폼 */}
                        <label htmlFor="account-demo-nickname">새 닉네임</label> {/* 입력 이름 */}
                        <input id="account-demo-nickname" name="nickname" value={demoNickname} maxLength={20} autoComplete="nickname" onChange={(event) => setDemoNickname(event.target.value)} /> {/* 닉네임 입력 */}
                        <button className={styles.primaryButton} type="submit">닉네임 바꾸기</button> {/* 저장 버튼 */}
                    </form> // 시연 닉네임 폼 끝
                ) : null} {/* 시연 닉네임 변경 끝 */}
            </section> {/* 프로필 영역 끝 */}

            <section className={styles.account} aria-labelledby="account-comments-title"> {/* 내 댓글 영역 */}
                <h2 id="account-comments-title">내 댓글</h2> {/* 댓글 제목 */}
                {mode === "demo" ? <p className={styles.description}>시연 모드의 댓글은 새로고침하면 사라지므로 여기에 모으지 않습니다.</p> : null} {/* 시연 안내 */}
                {comments.status === "loading" || (mode === "supabase" && comments.status === "idle") ? <p className={styles.description} role="status">내 댓글을 불러오고 있습니다…</p> : null} {/* 조회 중 */}
                {comments.status === "error" ? <p className={styles.error} role="alert">{comments.message}</p> : null} {/* 조회 실패 */}
                {comments.status === "ready" && comments.items.length === 0 ? <p className={styles.description}>아직 작성한 댓글이 없습니다.</p> : null} {/* 빈 목록 */}
                {comments.status === "ready" && comments.items.length > 0 ? ( // 댓글 목록
                    <ul className={accountStyles.comments}> {/* 댓글 목록 */}
                        {comments.items.map((item) => ( // 댓글 반복
                            <li key={item.id} className={accountStyles.comment}> {/* 댓글 항목 */}
                                <p className={accountStyles.commentMeta}><Link href={`/news/${item.newsId}`}>{item.newsTitle}</Link><span>{formatDate(item.createdAt)}</span>{item.status === "hidden" ? <span className={accountStyles.hidden}>관리자가 숨김</span> : null}</p> {/* 댓글 정보 */}
                                <p className={accountStyles.commentBody}>{item.content}</p> {/* 댓글 내용 */}
                                <button className={accountStyles.deleteButton} type="button" onClick={() => void handleDeleteComment(item)} disabled={busy !== null} aria-busy={busy === item.id}>{busy === item.id ? "삭제 중…" : "삭제"}</button> {/* 삭제 버튼 */}
                            </li> // 댓글 항목 끝
                        ))} {/* 댓글 반복 끝 */}
                    </ul> // 댓글 목록 끝
                ) : null} {/* 댓글 목록 끝 */}
            </section> {/* 내 댓글 영역 끝 */}

            <section className={`${styles.account} ${accountStyles.danger}`} aria-labelledby="account-delete-title"> {/* 탈퇴 영역 */}
                <h2 id="account-delete-title">회원 탈퇴</h2> {/* 탈퇴 제목 */}
                <p className={styles.description}>탈퇴하면 계정, 프로필, 댓글(달린 답글 포함), 반응, 신고 기록, 첨부 이미지가 바로 삭제되며 복구할 수 없습니다.</p> {/* 탈퇴 설명 */}
                <form className={styles.form} onSubmit={(event) => void handleDeleteAccount(event)} noValidate> {/* 탈퇴 폼 */}
                    <label htmlFor="account-delete-confirm">{"확인을 위해 \"탈퇴\"를 입력해 주세요"}</label> {/* 확인 입력 이름 */}
                    <input id="account-delete-confirm" name="confirm" value={confirmText} autoComplete="off" onChange={(event) => setConfirmText(event.target.value)} /> {/* 확인 입력 */}
                    <button className={accountStyles.dangerButton} type="submit" disabled={busy !== null || !isDeleteConfirmed(confirmText)} aria-busy={busy === "account"}>{busy === "account" ? "탈퇴 처리 중…" : "회원 탈퇴"}</button> {/* 탈퇴 버튼 */}
                </form> {/* 탈퇴 폼 끝 */}
            </section> {/* 탈퇴 영역 끝 */}
        </div> // 관리 묶음 끝
    ); // 관리 화면 반환 끝
} // 함수 끝
