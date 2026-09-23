import Link from "next/link"; // 내부 이동 링크
import { sanitizeAgeReturnTo } from "@/lib/age-gate/verification"; // 복귀 주소 정리
import AgeVerificationForm from "./age-verification-form"; // 성인 확인 입력 화면
import styles from "./age-verification.module.css"; // 성인 확인 스타일

interface AgeVerificationPageProps // 화면 속성 형식
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export default async function AgeVerificationPage({ searchParams }: AgeVerificationPageProps) // 성인 확인 화면
{ // 함수 시작
    const parameters = await searchParams; // 검색 값 읽기
    const requestedReturnTo = typeof parameters.returnTo === "string" ? parameters.returnTo : null; // 복귀 주소 읽기
    const returnTo = sanitizeAgeReturnTo(requestedReturnTo); // 복귀 주소 정리
    return ( // 화면 반환
        <main className={styles.shell}> {/* 전체 화면 */}
            <section className={styles.card} aria-labelledby="age-verification-title"> {/* 확인 카드 */}
                <Link className={styles.brand} href="/main.html">DEVFORGE</Link> {/* 메인 이동 브랜드 */}
                <p className={styles.eyebrow}>// AGE CHECK</p> {/* 화면 분류 */}
                <div className={styles.badge} aria-hidden="true">19+</div> {/* 성인 표시 */}
                <h1 id="age-verification-title">성인 콘텐츠 확인</h1> {/* 화면 제목 */}
                <p className={styles.description}>이 페이지는 만 19세 이상만 열람할 수 있습니다.</p> {/* 연령 안내 */}
                <p className={styles.notice}>현재 단계는 개발용 자기 확인이며 통신사·아이핀 본인인증이 아닙니다.</p> {/* 개발 모드 안내 */}
                <AgeVerificationForm returnTo={returnTo} /> {/* 인증 입력 화면 */}
                <Link className={styles.backLink} href="/main.html#games">게임 목록으로 돌아가기</Link> {/* 목록 복귀 링크 */}
            </section> {/* 확인 카드 끝 */}
        </main> // 전체 화면 끝
    ); // 화면 반환 끝
} // 함수 끝
