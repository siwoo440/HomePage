import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import styles from "./not-found.module.css"; // 없는 페이지 스타일
import SiteHeader from "./site-header"; // 공통 상단 헤더

export const metadata: Metadata = // 없는 페이지 문서 정보
{ // 문서 정보 시작
    title: "페이지를 찾을 수 없습니다 · DEVFORGE", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export default function NotFoundPage() // 없는 페이지 화면
{ // 함수 시작
    return ( // 화면 반환
        <> {/* 화면 묶음 */}
        <SiteHeader /> {/* 공통 상단 헤더 */}
        <main className={styles.shell}> {/* 없는 페이지 전체 영역 */}
            <section className={styles.panel} aria-labelledby="not-found-title"> {/* 안내 카드 */}
                <p className={styles.code} aria-hidden="true">404</p> {/* 오류 번호 장식 */}
                <p className={styles.eyebrow}>{"// PAGE NOT FOUND"}</p> {/* 영문 분류 */}
                <h1 id="not-found-title">페이지를 찾을 수 없습니다</h1> {/* 화면 제목 */}
                <p className={styles.description}>주소가 바뀌었거나 삭제된 페이지입니다. 입력한 주소를 확인하거나 아래 메뉴에서 이동해 주세요.</p> {/* 화면 설명 */}
                <nav className={styles.actions} aria-label="이동 메뉴"> {/* 이동 링크 묶음 */}
                    <Link className={styles.primaryLink} href="/main.html">메인으로 이동</Link> {/* 메인 이동 */}
                    <Link className={styles.secondaryLink} href="/main.html#games">게임 목록 보기</Link> {/* 게임 목록 이동 */}
                    <Link className={styles.secondaryLink} href="/devlog.html">개발 뉴스 보기</Link> {/* 개발 뉴스 이동 */}
                </nav> {/* 이동 링크 묶음 끝 */}
            </section> {/* 안내 카드 끝 */}
        </main> {/* 없는 페이지 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
