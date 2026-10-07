import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { FALLBACK_AUTH_SETTINGS, fetchAuthSettings } from "@/lib/member/auth-providers"; // 인증 설정 조회
import { getMemberMode, sanitizeMemberReturnTo } from "@/lib/member/config"; // 회원 설정 도구
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import SiteHeader from "../site-header"; // 공통 상단 헤더
import SignupForm from "./signup-form"; // 회원가입 폼
import styles from "../login/member-login.module.css"; // 로그인 화면 스타일

interface SignupPageProps // 가입 화면 속성
{ // 형식 시작
    searchParams: Promise<{ returnTo?: string }>; // 주소 검색 값
} // 형식 끝

export const dynamic = "force-dynamic"; // 요청별 설정 확인

export const metadata: Metadata = { title: "회원가입 · Palettra Games" }; // 브라우저 제목

export default async function SignupPage({ searchParams }: SignupPageProps) // 회원가입 화면
{ // 함수 시작
    const query = await searchParams; // 검색 값 읽기
    const returnTo = sanitizeMemberReturnTo(query.returnTo); // 복귀 주소 정리
    const mode = getMemberMode(); // 회원 모드 판정
    const config = getSupabasePublicConfig(); // 공개 연결 설정
    const settings = mode === "supabase" && config ? (await fetchAuthSettings(config)) ?? FALLBACK_AUTH_SETTINGS : FALLBACK_AUTH_SETTINGS; // 켜진 로그인 방식
    const closed = mode === "supabase" && !settings.signupEnabled; // 가입 중지 여부

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 가입 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="signup-title"> {/* 가입 소개 영역 */}
                        <p className={styles.eyebrow}>{"// JOIN PALETTRA GAMES"}</p> {/* 영문 분류 */}
                        <h1 id="signup-title">회원가입</h1> {/* 화면 제목 */}
                        <p className={styles.description}>평소 쓰는 계정으로 바로 시작하거나 이메일로 가입할 수 있습니다. 가입하면 개발 뉴스에 댓글과 반응을 남길 수 있습니다.</p> {/* 화면 설명 */}
                        <ul className={styles.benefits}> {/* 가입 방식 안내 */}
                            <li><strong>간편 가입</strong><span>카카오·Google 등 계정으로 로그인하면 자동으로 가입되고, 처음 한 번 닉네임과 약관 동의를 받습니다.</span></li> {/* 간편 가입 안내 */}
                            <li><strong>이메일 가입</strong><span>이메일 인증을 마치면 입력한 닉네임으로 바로 댓글을 남길 수 있습니다.</span></li> {/* 이메일 가입 안내 */}
                            <li><strong>공개 정보</strong><span>댓글에는 닉네임만 표시되며 이메일은 공개하지 않습니다.</span></li> {/* 공개 정보 안내 */}
                        </ul> {/* 가입 방식 안내 끝 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않은 시연 모드입니다. 입력 검증과 화면만 확인할 수 있으며 계정은 만들어지지 않습니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 가입 소개 영역 끝 */}
                    <section className={styles.formArea} aria-label="회원가입 입력"> {/* 가입 입력 영역 */}
                        {closed ? <p className={styles.notice} role="status">현재 회원가입을 받지 않습니다. 이미 가입한 계정으로 로그인해 주세요.</p> : <SignupForm mode={mode} returnTo={returnTo} settings={settings} />} {/* 가입 입력 또는 중지 안내 */}
                        <p className={styles.accountLinks}>이미 회원이신가요? <Link href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>로그인</Link></p> {/* 로그인 이동 */}
                    </section> {/* 가입 입력 영역 끝 */}
                </div> {/* 소개·입력 두 열 배치 끝 */}
            </main> {/* 가입 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
