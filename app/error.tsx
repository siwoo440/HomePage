"use client"; // 브라우저 오류 경계 모듈

import Link from "next/link"; // 내부 이동 링크
import { useEffect } from "react"; // 화면 효과 도구
import styles from "./not-found.module.css"; // 안내 화면 스타일
import SiteHeader from "./site-header"; // 공통 상단 헤더

interface ErrorPageProps // 오류 화면 속성
{ // 형식 시작
    error: Error & { digest?: string }; // 발생한 오류
    reset: () => void; // 다시 시도 함수
} // 형식 끝

export default function ErrorPage({ error, reset }: ErrorPageProps) // 화면 오류 안내
{ // 함수 시작
    useEffect(() => // 오류 기록
    { // 효과 시작
        console.error(error); // 개발자 도구 기록
    }, [error]); // 오류 변경 시 실행

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
        <SiteHeader /> {/* 공통 상단 헤더 */}
        <main className={styles.shell}> {/* 오류 화면 전체 영역 */}
            <section className={styles.panel} aria-labelledby="error-title"> {/* 안내 카드 */}
                <p className={styles.code} aria-hidden="true">500</p> {/* 오류 번호 장식 */}
                <p className={styles.eyebrow}>{"// SOMETHING WENT WRONG"}</p> {/* 영문 분류 */}
                <h1 id="error-title">화면을 불러오지 못했습니다</h1> {/* 화면 제목 */}
                <p className={styles.description}>일시적인 오류가 발생했습니다. 잠시 후 다시 시도하거나 아래 메뉴에서 이동해 주세요.</p> {/* 화면 설명 */}
                {error.digest ? <p className={styles.description}>오류 번호: {error.digest}</p> : null} {/* 문의용 오류 번호 */}
                <nav className={styles.actions} aria-label="이동 메뉴"> {/* 이동 링크 묶음 */}
                    <button className={styles.primaryLink} type="button" onClick={reset}>다시 시도</button> {/* 다시 불러오기 */}
                    <Link className={styles.secondaryLink} href="/main.html">메인으로 이동</Link> {/* 메인 이동 */}
                    <Link className={styles.secondaryLink} href="/contact.html">문의하기</Link> {/* 문의 이동 */}
                </nav> {/* 이동 링크 묶음 끝 */}
            </section> {/* 안내 카드 끝 */}
        </main> {/* 오류 화면 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
