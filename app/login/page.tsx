import Link from "next/link"; // 내부 이동 링크
import { getMemberMode, sanitizeMemberReturnTo } from "@/lib/member/config"; // 회원 설정 도구
import MemberLoginForm from "./member-login-form"; // 회원 로그인 폼
import styles from "./member-login.module.css"; // 로그인 화면 스타일

interface MemberLoginPageProps // 로그인 화면 속성
{ // 형식 시작
    searchParams: Promise<{ returnTo?: string }>; // 주소 검색 값
} // 형식 끝

export default async function MemberLoginPage({ searchParams }: MemberLoginPageProps) // 회원 로그인 화면
{ // 함수 시작
    const query = await searchParams; // 검색 값 읽기
    const returnTo = sanitizeMemberReturnTo(query.returnTo); // 복귀 주소 정리
    const mode = getMemberMode(); // 회원 모드 판정

    return ( // 화면 반환
        <main className={styles.shell}> {/* 로그인 전체 영역 */}
            <section className={styles.panel} aria-labelledby="member-login-title"> {/* 로그인 카드 */}
                <Link className={styles.brand} href="/main.html">DEVFORGE</Link> {/* 메인 이동 로고 */}
                <p className={styles.eyebrow}>// MEMBER ACCESS</p> {/* 영문 분류 */}
                <h1 id="member-login-title">회원 로그인</h1> {/* 화면 제목 */}
                <p className={styles.description}>개발 뉴스에 반응하고 댓글을 남기기 위한 회원 공간입니다.</p> {/* 화면 설명 */}
                {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않아 닉네임만 사용하는 시연 모드입니다. 비밀번호와 개인정보는 저장하지 않습니다.</p> : null} {/* 시연 안내 */}
                <MemberLoginForm mode={mode} returnTo={returnTo} /> {/* 로그인 입력 */}
                <Link className={styles.backLink} href={returnTo}>이전 화면으로 돌아가기</Link> {/* 이전 화면 이동 */}
            </section> {/* 로그인 카드 끝 */}
        </main> // 로그인 전체 영역 끝
    ); // 화면 반환 끝
} // 함수 끝
