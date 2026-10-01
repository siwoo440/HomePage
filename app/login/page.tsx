import Link from "next/link"; // 내부 이동 링크
import { FALLBACK_AUTH_SETTINGS, fetchAuthSettings } from "@/lib/member/auth-providers"; // 인증 설정 조회
import { getMemberMode, sanitizeMemberReturnTo } from "@/lib/member/config"; // 회원 설정 도구
import { getSupabasePublicConfig } from "@/lib/supabase/config"; // Supabase 설정 판정
import MemberAccess from "./member-access"; // 회원 로그인·로그아웃 영역
import SiteHeader from "../site-header"; // 공통 상단 헤더
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberLoginPageProps // 로그인 화면 속성
{ // 형식 시작
    searchParams: Promise<{ returnTo?: string; auth?: string }>; // 주소 검색 값
} // 형식 끝

const AUTH_NOTICES: Record<string, string> = // 인증 결과 안내
{ // 안내 시작
    failed: "인증을 끝내지 못했습니다. 이메일 인증을 마쳤다면 이메일과 비밀번호로 로그인해 주세요. 간편 로그인은 다시 시도해 주세요.", // 인증 실패 안내
    "reset-done": "비밀번호를 바꿨습니다. 새 비밀번호로 로그인해 주세요.", // 비밀번호 변경 안내
}; // 안내 끝

export const dynamic = "force-dynamic"; // 요청별 설정 확인

export default async function MemberLoginPage({ searchParams }: MemberLoginPageProps) // 회원 로그인 화면
{ // 함수 시작
    const query = await searchParams; // 검색 값 읽기
    const returnTo = sanitizeMemberReturnTo(query.returnTo); // 복귀 주소 정리
    const mode = getMemberMode(); // 회원 모드 판정
    const config = getSupabasePublicConfig(); // 공개 연결 설정
    const settings = mode === "supabase" && config ? (await fetchAuthSettings(config)) ?? FALLBACK_AUTH_SETTINGS : FALLBACK_AUTH_SETTINGS; // 켜진 로그인 방식
    const authNotice = AUTH_NOTICES[query.auth ?? ""] ?? ""; // 인증 결과 안내

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 로그인 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="member-login-title"> {/* 회원 소개 영역 */}
                        <p className={styles.eyebrow}>{"// MEMBER ACCESS"}</p> {/* 영문 분류 */}
                        <h1 id="member-login-title">회원 로그인</h1> {/* 화면 제목 */}
                        <p className={styles.description}>개발 뉴스에 반응하고 댓글을 남기기 위한 회원 공간입니다. 게임 소개와 소식은 로그인 없이도 볼 수 있습니다.</p> {/* 화면 설명 */}
                        <ul className={styles.benefits}> {/* 회원 기능 안내 */}
                            <li><strong>댓글과 반응</strong><span>개발 뉴스에 의견을 남기고 반응을 표시할 수 있습니다.</span></li> {/* 댓글 기능 */}
                            <li><strong>간편 로그인</strong><span>이메일 가입 없이 카카오·Google 등 평소 쓰는 계정으로 바로 시작할 수 있습니다.</span></li> {/* 간편 로그인 기능 */}
                            <li><strong>회원 메뉴</strong><span>상단의 닉네임 버튼으로 로그인 상태를 확인하고 로그아웃할 수 있습니다.</span></li> {/* 회원 메뉴 기능 */}
                            <li><strong>개인정보 최소화</strong><span>{mode === "demo" ? "시연 모드에서는 닉네임만 현재 탭에 저장하고 서버로 보내지 않습니다." : "로그인에 필요한 정보만 인증 서비스에서 처리하고, 댓글에는 닉네임만 공개합니다."}</span></li> {/* 개인정보 안내 */}
                        </ul> {/* 회원 기능 안내 끝 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않아 닉네임만 사용하는 시연 모드입니다. 비밀번호와 개인정보는 저장하지 않습니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 회원 소개 영역 끝 */}
                    <section className={styles.formArea} aria-label="로그인 입력"> {/* 로그인 입력 영역 */}
                        {authNotice ? <p className={query.auth === "failed" ? styles.error : styles.success} role={query.auth === "failed" ? "alert" : "status"}>{authNotice}</p> : null} {/* 인증 결과 안내 */}
                        <MemberAccess mode={mode} returnTo={returnTo} settings={settings} /> {/* 로그인 입력과 로그아웃 */}
                        <Link className={styles.backLink} href={returnTo}>← 이전 화면으로 돌아가기</Link> {/* 이전 화면 이동 */}
                    </section> {/* 로그인 입력 영역 끝 */}
                </div> {/* 소개·입력 두 열 배치 끝 */}
            </main> {/* 로그인 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
