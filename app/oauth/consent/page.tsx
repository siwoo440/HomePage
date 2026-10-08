import type { Metadata } from "next"; // 문서 정보 형식
import { getMemberMode } from "@/lib/member/config"; // 회원 모드 판정
import { sanitizeAuthorizationId } from "@/lib/member/oauth-consent"; // 요청 번호 확인
import SiteHeader from "../../site-header"; // 공통 상단 헤더
import ConsentPanel from "./consent-panel"; // 로그인 허용 영역
import styles from "../../login/member-login.module.css"; // 회원 화면 공통 스타일

interface ConsentPageProps // 로그인 허용 화면 속성
{ // 형식 시작
    searchParams: Promise<{ authorization_id?: string }>; // 주소 검색 값
} // 형식 끝

export const metadata: Metadata = // 로그인 허용 문서 정보
{ // 문서 정보 시작
    title: "계정으로 로그인 · Palettra Games", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export const dynamic = "force-dynamic"; // 요청별 회원 모드 확인

export default async function ConsentPage({ searchParams }: ConsentPageProps) // 다른 서비스 로그인 허용 화면
{ // 함수 시작
    const query = await searchParams; // 검색 값 읽기
    const authorizationId = sanitizeAuthorizationId(query.authorization_id); // 요청 번호 확인
    const mode = getMemberMode(); // 회원 모드 판정

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 로그인 허용 전체 영역 */}
                <div className={styles.layout}> {/* 소개·확인 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="consent-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// ONE ACCOUNT"}</p> {/* 영문 분류 */}
                        <h1 id="consent-title">계정으로 로그인</h1> {/* 화면 제목 */}
                        <p className={styles.description}>Palettra Games 계정 하나로 다른 서비스에 로그인합니다. 서비스가 받는 정보를 확인한 뒤 허용해 주세요.</p> {/* 화면 설명 */}
                        <ul className={styles.benefits}> {/* 이용 안내 */}
                            <li><strong>비밀번호는 넘기지 않습니다</strong><span>서비스는 아래에 표시된 정보만 받고, 비밀번호는 받지 않습니다.</span></li> {/* 비밀번호 안내 */}
                            <li><strong>언제든 해제할 수 있습니다</strong><span>내 정보의 연결된 서비스에서 허용을 취소할 수 있습니다.</span></li> {/* 해제 안내 */}
                        </ul> {/* 이용 안내 끝 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않은 시연 모드라 이 화면은 동작하지 않습니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="로그인 허용 확인"> {/* 확인 영역 */}
                        <ConsentPanel mode={mode} authorizationId={authorizationId} /> {/* 로그인 허용 확인 */}
                    </section> {/* 확인 영역 끝 */}
                </div> {/* 소개·확인 두 열 배치 끝 */}
            </main> {/* 로그인 허용 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
