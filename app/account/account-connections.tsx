"use client"; // 브라우저 계정 연결 모듈

import { useEffect, useState } from "react"; // 화면 상태 도구
import type { SocialProviderId } from "@/lib/member/auth-providers"; // 간편 로그인 식별자
import type { MemberMode } from "@/lib/member/config"; // 회원 모드 형식
import { ConnectionError, listLinkableProviders, readAccountSummary, readLinkedLogins, removeLoginLink, startLoginLink, type AccountUser } from "@/lib/member/connections"; // 로그인 연동 도구
import { buildConnectedServices, disconnectService, loadConnectedServices, ServiceError, type ConnectedService, type ServiceState } from "@/lib/member/services"; // 서비스 연결 도구
import { createBrowserSupabaseClient } from "@/lib/supabase/client"; // 브라우저 인증 도구
import styles from "../login/member-login.module.css"; // 회원 화면 공통 스타일
import accountStyles from "./account.module.css"; // 내 정보 전용 스타일

interface AccountConnectionsProps // 계정 연결 영역 속성
{ // 형식 시작
    mode: MemberMode; // 회원 모드
    user: AccountUser | null; // 로그인 회원 원본
    nickname: string | null; // 홈페이지 닉네임
    providers: SocialProviderId[]; // 켜진 간편 로그인
    onUserChange: (user: AccountUser) => void; // 회원 정보 갱신 전달
    announce: (text: string, role?: "status" | "alert") => void; // 결과 안내 전달
} // 형식 끝

type ServicesState = // 서비스 목록 상태
    | { status: "loading" } // 조회 중
    | { status: "ready"; items: ConnectedService[]; ready: boolean }; // 조회 완료(ready가 거짓이면 통합 계정 설정 전)

const STATE_LABELS: Record<ServiceState, string> = // 연결 상태 표시 문구
{ // 문구 시작
    current: "지금 이용 중", // 홈페이지
    connected: "연결됨", // 이 계정으로 로그인한 서비스
    available: "연결 가능", // 이 계정으로 로그인할 수 있는 서비스
    preparing: "준비 중", // 통합 계정 연결 전 서비스
}; // 문구 끝

function formatDay(value: string): string // 날짜 표시
{ // 함수 시작
    const locale = document.documentElement.lang === "en" ? "en-US" : "ko-KR"; // 화면 언어 표기
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value)); // 날짜 문구 반환
} // 함수 끝

function formatMoment(value: string): string // 날짜와 시각 표시
{ // 함수 시작
    const locale = document.documentElement.lang === "en" ? "en-US" : "ko-KR"; // 화면 언어 표기
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); // 날짜·시각 문구 반환
} // 함수 끝

export default function AccountConnections({ mode, user, nickname, providers, onUserChange, announce }: AccountConnectionsProps) // 계정 정보·로그인 연동·연결된 서비스 영역
{ // 함수 시작
    const [fetched, setFetched] = useState<{ items: ConnectedService[]; ready: boolean } | null>(null); // 서버에서 불러온 서비스 목록
    const [busy, setBusy] = useState<string | null>(null); // 진행 중 작업
    const summary = user ? readAccountSummary(user) : null; // 계정 기본 정보
    const logins = user ? readLinkedLogins(user) : []; // 연결된 로그인 수단
    const linkable = mode === "supabase" && user ? listLinkableProviders(providers, logins) : []; // 새로 연결할 수 있는 간편 로그인
    const userId = mode === "supabase" ? user?.id ?? null : null; // 실제 회원 식별자
    const joinedAt = summary?.joinedAt ?? null; // 가입 시각
    const services: ServicesState = !userId ? { status: "ready", items: buildConnectedServices({ nickname }), ready: false } : fetched ? { status: "ready", items: fetched.items, ready: fetched.ready } : { status: "loading" }; // 서비스 목록 상태(시연 모드는 목록만 표시)

    useEffect(() => // 연결된 서비스 불러오기
    { // 효과 시작
        if (!userId) // 실제 회원 확인
        { // 조건 시작
            return; // 조회 생략
        } // 조건 끝
        let active = true; // 화면 유지 여부
        void loadConnectedServices(createBrowserSupabaseClient(), userId, { joinedAt, nickname }).then((loaded) => // 서비스 조회
        { // 반영 시작
            if (active) // 화면 유지 확인
            { // 조건 시작
                setFetched({ items: loaded.services, ready: loaded.ready }); // 목록 저장
            } // 조건 끝
        }); // 반영 끝
        return () => // 화면 해제
        { // 해제 시작
            active = false; // 늦은 결과 무시
        }; // 해제 끝
    }, [userId, joinedAt, nickname]); // 회원 변경 감시

    async function handleLink(provider: SocialProviderId) // 간편 로그인 연결
    { // 함수 시작
        setBusy(`link:${provider}`); // 진행 표시
        try // 연결 시도
        { // 시도 시작
            await startLoginLink(createBrowserSupabaseClient(), provider, `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent("/account")}`); // 로그인 서비스로 이동
        } // 시도 끝
        catch (error: unknown) // 연결 실패 처리
        { // 오류 처리 시작
            announce(error instanceof ConnectionError ? error.message : "로그인을 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.", "alert"); // 실패 안내
            setBusy(null); // 진행 종료
        } // 오류 처리 끝
    } // 함수 끝

    async function handleUnlink(key: string, label: string) // 간편 로그인 연결 해제
    { // 함수 시작
        if (!window.confirm(`${label} 로그인 연결을 해제할까요? 해제한 뒤에는 이 방법으로 로그인할 수 없습니다.`)) // 해제 확인
        { // 조건 시작
            return; // 해제 취소
        } // 조건 끝
        setBusy(`unlink:${key}`); // 진행 표시
        try // 해제 시도
        { // 시도 시작
            onUserChange(await removeLoginLink(createBrowserSupabaseClient(), key)); // 해제 뒤 회원 정보 갱신
            announce("로그인 연결을 해제했습니다."); // 완료 안내
        } // 시도 끝
        catch (error: unknown) // 해제 실패 처리
        { // 오류 처리 시작
            announce(error instanceof ConnectionError ? error.message : "로그인 연결을 해제하지 못했습니다.", "alert"); // 실패 안내
        } // 오류 처리 끝
        finally // 공통 정리
        { // 정리 시작
            setBusy(null); // 진행 종료
        } // 정리 끝
    } // 함수 끝

    async function handleDisconnect(service: ConnectedService) // 서비스 연결 해제
    { // 함수 시작
        if (!userId || !window.confirm(`${service.name} 연결을 해제할까요? 그 서비스에서 이 계정으로 다시 로그인하려면 허용을 다시 해야 합니다. 서비스 안에 저장된 내용은 지워지지 않습니다.`)) // 해제 확인
        { // 조건 시작
            return; // 해제 취소
        } // 조건 끝
        setBusy(`service:${service.id}`); // 진행 표시
        try // 해제 시도
        { // 시도 시작
            const client = createBrowserSupabaseClient(); // 인증 도구
            await disconnectService(client, userId, service); // 연결 해제
            const loaded = await loadConnectedServices(client, userId, { joinedAt, nickname }); // 목록 다시 조회
            setFetched({ items: loaded.services, ready: loaded.ready }); // 목록 갱신
            announce("서비스 연결을 해제했습니다."); // 완료 안내
        } // 시도 끝
        catch (error: unknown) // 해제 실패 처리
        { // 오류 처리 시작
            announce(error instanceof ServiceError ? error.message : "서비스 연결을 해제하지 못했습니다. 잠시 후 다시 시도해 주세요.", "alert"); // 실패 안내
        } // 오류 처리 끝
        finally // 공통 정리
        { // 정리 시작
            setBusy(null); // 진행 종료
        } // 정리 끝
    } // 함수 끝

    return ( // 계정 연결 화면 반환
        <> {/* 계정 연결 묶음 */}
            <section className={styles.account} aria-labelledby="account-summary-title"> {/* 계정 기본 정보 영역 */}
                <h2 id="account-summary-title">계정 기본 정보</h2> {/* 기본 정보 제목 */}
                {summary ? ( // 실제 계정 정보
                    <dl className={accountStyles.facts}> {/* 기본 정보 목록 */}
                        <div><dt>이메일</dt><dd>{summary.email ?? "이메일 없음"}</dd></div> {/* 로그인 이메일 */}
                        <div><dt>이메일 인증</dt><dd>{summary.emailVerified ? "완료" : "하지 않음"}</dd></div> {/* 이메일 인증 여부 */}
                        <div><dt>가입일</dt><dd>{summary.joinedAt ? formatDay(summary.joinedAt) : "알 수 없음"}</dd></div> {/* 가입 시각 */}
                        <div><dt>마지막 로그인</dt><dd>{summary.lastSignInAt ? formatMoment(summary.lastSignInAt) : "알 수 없음"}</dd></div> {/* 마지막 로그인 시각 */}
                    </dl> // 기본 정보 목록 끝
                ) : <p className={styles.description}>시연 모드에는 실제 계정이 없어 보여 줄 정보가 없습니다.</p>} {/* 시연 안내 */}
                <p className={styles.description}>이메일과 로그인 기록은 본인에게만 보입니다.</p> {/* 공개 범위 안내 */}
            </section> {/* 계정 기본 정보 영역 끝 */}

            <section className={styles.account} aria-labelledby="account-logins-title"> {/* 로그인 연동 영역 */}
                <h2 id="account-logins-title">로그인 연동</h2> {/* 로그인 연동 제목 */}
                <p className={styles.description}>이 계정에 연결된 로그인 방법입니다. 간편 로그인을 연결해 두면 어느 방법으로 로그인해도 같은 계정으로 들어옵니다.</p> {/* 로그인 연동 설명 */}
                {mode === "demo" ? <p className={styles.notice}>시연 모드에서는 로그인을 연결할 수 없습니다. 서버를 연결하면 켜 둔 간편 로그인이 여기에 표시됩니다.</p> : null} {/* 시연 안내 */}
                {logins.length > 0 ? ( // 연결된 로그인 목록
                    <ul className={accountStyles.rows}> {/* 로그인 목록 */}
                        {logins.map((login) => ( // 로그인 반복
                            <li key={login.key} className={accountStyles.row}> {/* 로그인 항목 */}
                                <div className={accountStyles.rowText}> {/* 로그인 정보 */}
                                    <strong>{login.label}</strong> {/* 로그인 방법 이름 */}
                                    {login.account ? <span>{login.account}</span> : null} {/* 로그인 서비스 쪽 계정 */}
                                    {login.linkedAt ? <span>{`연결일 ${formatDay(login.linkedAt)}`}</span> : null} {/* 연결 날짜 */}
                                </div> {/* 로그인 정보 끝 */}
                                {login.removable ? <button className={accountStyles.deleteButton} type="button" onClick={() => void handleUnlink(login.key, login.label)} disabled={busy !== null} aria-busy={busy === `unlink:${login.key}`}>{busy === `unlink:${login.key}` ? "해제 중…" : "연결 해제"}</button> : null} {/* 해제 버튼 */}
                            </li> // 로그인 항목 끝
                        ))} {/* 로그인 반복 끝 */}
                    </ul> // 로그인 목록 끝
                ) : null} {/* 연결된 로그인 목록 끝 */}
                {linkable.length > 0 ? ( // 연결할 수 있는 로그인
                    <div className={accountStyles.linkable}> {/* 연결 버튼 영역 */}
                        <h3>연결할 수 있는 로그인</h3> {/* 연결 버튼 제목 */}
                        <div className={styles.socialGrid}> {/* 버튼 격자 */}
                            {linkable.map((provider) => <button key={provider.id} type="button" className={`${styles.socialButton} ${styles[`provider_${provider.id}`] ?? ""}`} data-provider={provider.id} onClick={() => void handleLink(provider.id)} disabled={busy !== null} aria-busy={busy === `link:${provider.id}`}>{busy === `link:${provider.id}` ? "이동 중…" : `${provider.label} 연결하기`}</button>)} {/* 연결 버튼 */}
                        </div> {/* 버튼 격자 끝 */}
                    </div> // 연결 버튼 영역 끝
                ) : null} {/* 연결할 수 있는 로그인 끝 */}
            </section> {/* 로그인 연동 영역 끝 */}

            <section className={styles.account} aria-labelledby="account-services-title"> {/* 연결된 서비스 영역 */}
                <h2 id="account-services-title">연결된 서비스</h2> {/* 연결된 서비스 제목 */}
                <p className={styles.description}>이 계정으로 로그인하는 서비스입니다. 서비스마다 내용은 따로 보관하고, 로그인만 이 계정으로 합니다.</p> {/* 연결된 서비스 설명 */}
                {services.status === "loading" ? <p className={styles.description} role="status">연결된 서비스를 불러오고 있습니다…</p> : null} {/* 조회 중 */}
                {services.status === "ready" && !services.ready ? <p className={styles.notice}>다른 서비스에서 이 계정으로 로그인하는 기능은 준비 중입니다. 준비되면 연결한 서비스와 이용 기록이 여기에 표시됩니다.</p> : null} {/* 통합 계정 설정 전 안내 */}
                {services.status === "ready" ? ( // 서비스 목록
                    <ul className={accountStyles.rows}> {/* 서비스 목록 */}
                        {services.items.map((service) => ( // 서비스 반복
                            <li key={service.id} className={accountStyles.row}> {/* 서비스 항목 */}
                                <div className={accountStyles.rowText}> {/* 서비스 정보 */}
                                    <strong><span translate="no">{service.name}</span></strong> {/* 서비스 이름 */}
                                    <span className={accountStyles.state} data-state={service.state}>{STATE_LABELS[service.state]}</span> {/* 연결 상태 */}
                                    {service.grantedAt ? <span>{`연결일 ${formatDay(service.grantedAt)}`}</span> : null} {/* 로그인 허용 날짜 */}
                                    {service.firstUsedAt ? <span>{service.state === "current" ? `가입일 ${formatDay(service.firstUsedAt)}` : `처음 이용 ${formatDay(service.firstUsedAt)}`}</span> : null} {/* 처음 이용 날짜 */}
                                    {service.lastUsedAt ? <span>{`마지막 이용 ${formatDay(service.lastUsedAt)}`}</span> : null} {/* 마지막 이용 날짜 */}
                                    {service.summary.length > 0 ? ( // 서비스 요약
                                        <dl className={accountStyles.summary}> {/* 요약 목록 */}
                                            {service.summary.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)} {/* 요약 줄 */}
                                        </dl> // 요약 목록 끝
                                    ) : null} {/* 서비스 요약 끝 */}
                                </div> {/* 서비스 정보 끝 */}
                                <div className={accountStyles.rowActions}> {/* 서비스 행동 */}
                                    {service.url ? <a className={accountStyles.linkButton} href={service.url}>이동</a> : null} {/* 서비스 이동 */}
                                    {service.revocable && mode === "supabase" ? <button className={accountStyles.deleteButton} type="button" onClick={() => void handleDisconnect(service)} disabled={busy !== null} aria-busy={busy === `service:${service.id}`}>{busy === `service:${service.id}` ? "해제 중…" : "연결 해제"}</button> : null} {/* 연결 해제 */}
                                </div> {/* 서비스 행동 끝 */}
                            </li> // 서비스 항목 끝
                        ))} {/* 서비스 반복 끝 */}
                    </ul> // 서비스 목록 끝
                ) : null} {/* 서비스 목록 끝 */}
            </section> {/* 연결된 서비스 영역 끝 */}
        </> // 계정 연결 묶음 끝
    ); // 계정 연결 화면 반환 끝
} // 함수 끝
