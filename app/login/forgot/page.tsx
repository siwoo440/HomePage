import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { getMemberMode, sanitizeMemberReturnTo } from "@/lib/member/config"; // 회원 설정 도구
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import ForgotPasswordForm from "./forgot-password-form"; // 비밀번호 찾기 폼
import styles from "../member-login.module.css"; // 로그인 화면 스타일

interface ForgotPasswordPageProps // 비밀번호 찾기 화면 속성
{ // 형식 시작
    searchParams: Promise<{ returnTo?: string }>; // 주소 검색 값
} // 형식 끝

export const metadata: Metadata = { title: "비밀번호 찾기 · Palettra Games" }; // 브라우저 제목

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) // 비밀번호 찾기 화면
{ // 함수 시작
    const query = await searchParams; // 검색 값 읽기
    const returnTo = sanitizeMemberReturnTo(query.returnTo); // 복귀 주소 정리
    const mode = getMemberMode(); // 회원 모드 판정

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="forgot-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// PASSWORD HELP"}</p> {/* 영문 분류 */}
                        <h1 id="forgot-title">비밀번호 찾기</h1> {/* 화면 제목 */}
                        <p className={styles.description}>가입한 이메일을 입력하면 비밀번호를 다시 정할 수 있는 링크를 보내 드립니다. 간편 로그인으로 가입했다면 해당 계정으로 로그인해 주세요.</p> {/* 화면 설명 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않은 시연 모드입니다. 메일은 발송되지 않습니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="비밀번호 찾기 입력"> {/* 입력 영역 */}
                        <ForgotPasswordForm mode={mode} /> {/* 재설정 메일 요청 */}
                        <Link className={styles.backLink} href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>← 로그인 화면으로 돌아가기</Link> {/* 로그인 이동 */}
                    </section> {/* 입력 영역 끝 */}
                </div> {/* 두 열 배치 끝 */}
            </main> {/* 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
