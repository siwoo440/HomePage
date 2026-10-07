import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { getMemberMode } from "@/lib/member/config"; // 회원 설정 도구
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import ResetPasswordForm from "./reset-password-form"; // 새 비밀번호 폼
import styles from "../member-login.module.css"; // 로그인 화면 스타일

export const metadata: Metadata = { title: "새 비밀번호 설정 · Palettra Games" }; // 브라우저 제목

export const dynamic = "force-dynamic"; // 요청별 세션 확인

export default function ResetPasswordPage() // 새 비밀번호 화면
{ // 함수 시작
    const mode = getMemberMode(); // 회원 모드 판정

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="reset-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// NEW PASSWORD"}</p> {/* 영문 분류 */}
                        <h1 id="reset-title">새 비밀번호 설정</h1> {/* 화면 제목 */}
                        <p className={styles.description}>메일의 링크로 들어온 경우에만 비밀번호를 바꿀 수 있습니다. 영문과 숫자를 함께 넣어 8자 이상으로 정해 주세요.</p> {/* 화면 설명 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않은 시연 모드입니다. 규칙 검증만 확인하며 비밀번호는 바뀌지 않습니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="새 비밀번호 입력"> {/* 입력 영역 */}
                        <ResetPasswordForm mode={mode} /> {/* 새 비밀번호 입력 */}
                        <Link className={styles.backLink} href="/login">← 로그인 화면으로 돌아가기</Link> {/* 로그인 이동 */}
                    </section> {/* 입력 영역 끝 */}
                </div> {/* 두 열 배치 끝 */}
            </main> {/* 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
