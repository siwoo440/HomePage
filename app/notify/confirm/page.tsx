import type { Metadata } from "next"; // 문서 정보 형식
import Link from "next/link"; // 내부 이동 링크
import { isNotifyToken } from "@/lib/notify/domain"; // 확인 값 형식 확인
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import styles from "../../login/member-login.module.css"; // 로그인 화면과 같은 스타일
import TokenActionPanel from "../token-action-panel"; // 확인 버튼 영역

interface ConfirmPageProps // 신청 확인 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export const metadata: Metadata = // 신청 확인 문서 정보
{ // 문서 정보 시작
    title: "출시 알림 신청 확인 · DEVFORGE", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export default async function ConfirmPage({ searchParams }: ConfirmPageProps) // 출시 알림 신청 확인 화면
{ // 함수 시작
    const parameters = await searchParams; // 검색 값 읽기
    const token = isNotifyToken(parameters.token) ? parameters.token : ""; // 형식이 맞는 확인 값

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 전체 영역 */}
                <div className={styles.layout}> {/* 소개·입력 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="confirm-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// RELEASE NOTICE"}</p> {/* 영문 분류 */}
                        <h1 id="confirm-title">출시 알림 신청 확인</h1> {/* 화면 제목 */}
                        <p className={styles.description}>아래 버튼을 누르면 출시 알림 신청이 완료됩니다. 신청하신 적이 없다면 이 화면을 닫으시면 됩니다. 확인하지 않은 주소로는 출시 소식을 보내지 않습니다.</p> {/* 화면 설명 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="신청 확인"> {/* 입력 영역 */}
                        {token ? <TokenActionPanel token={token} endpoint="/api/notify/confirm" buttonLabel="출시 알림 신청 확인하기" doneMessage="신청이 확인되었습니다." failMessage="신청을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요." /> : <p className={styles.error} role="alert">확인 주소가 올바르지 않습니다. 메일에 있는 주소를 다시 열어 주세요.</p>} {/* 확인 버튼 또는 주소 오류 */}
                        <Link className={styles.backLink} href="/main.html">← 메인으로 돌아가기</Link> {/* 메인 이동 */}
                    </section> {/* 입력 영역 끝 */}
                </div> {/* 두 열 배치 끝 */}
            </main> {/* 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
