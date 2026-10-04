import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { isNotifyToken } from "@/lib/notify/domain"; // 수신 거부 값 형식 확인
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import styles from "../../login/member-login.module.css"; // 로그인 화면과 같은 스타일
import UnsubscribePanel from "./unsubscribe-panel"; // 수신 거부 버튼 영역

interface UnsubscribePageProps // 수신 거부 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export const metadata: Metadata = // 수신 거부 문서 정보
{ // 문서 정보 시작
    title: "출시 알림 수신 거부 · DEVFORGE", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) // 출시 알림 수신 거부 화면
{ // 함수 시작
    const parameters = await searchParams; // 검색 값 읽기
    const token = isNotifyToken(parameters.token) ? parameters.token : ""; // 형식이 맞는 수신 거부 값

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="unsubscribe-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// RELEASE NOTICE"}</p> {/* 영문 분류 */}
                        <h1 id="unsubscribe-title">출시 알림 수신 거부</h1> {/* 화면 제목 */}
                        <p className={styles.description}>아래 버튼을 누르면 해당 게임의 출시 소식 메일을 더 보내지 않습니다. 다시 받고 싶으면 게임 소개 페이지에서 새로 신청할 수 있습니다.</p> {/* 화면 설명 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="수신 거부 확인"> {/* 입력 영역 */}
                        {token ? <UnsubscribePanel token={token} /> : <p className={styles.error} role="alert">수신 거부 주소가 올바르지 않습니다. 메일에 있는 주소를 다시 열어 주세요.</p>} {/* 수신 거부 버튼 또는 주소 오류 */}
                        <Link className={styles.backLink} href="/main.html">← 메인으로 돌아가기</Link> {/* 메인 이동 */}
                    </section> {/* 입력 영역 끝 */}
                </div> {/* 두 열 배치 끝 */}
            </main> {/* 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
