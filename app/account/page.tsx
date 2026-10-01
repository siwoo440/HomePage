import type { Metadata } from "next"; // 문서 정보 형식
import { getMemberMode } from "@/lib/member/config"; // 회원 모드 판정
import SiteHeader from "../site-header"; // 공통 상단 헤더
import AccountPanel from "./account-panel"; // 내 정보 관리 영역
import styles from "../login/member-login.module.css"; // 회원 화면 공통 스타일

export const metadata: Metadata = // 내 정보 문서 정보
{ // 문서 정보 시작
    title: "내 정보 · DEVFORGE", // 브라우저 제목
    robots: { index: false }, // 검색 색인 제외
}; // 문서 정보 끝

export const dynamic = "force-dynamic"; // 요청별 회원 모드 확인

export default function AccountPage() // 내 정보 화면
{ // 함수 시작
    const mode = getMemberMode(); // 회원 모드 판정

    return ( // 화면 반환
        <> {/* 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            <main className={styles.shell}> {/* 내 정보 전체 영역 */}
                <div className={styles.layout}> {/* 소개·관리 두 열 배치 */}
                    <section className={styles.intro} aria-labelledby="account-title"> {/* 안내 영역 */}
                        <p className={styles.eyebrow}>{"// MY ACCOUNT"}</p> {/* 영문 분류 */}
                        <h1 id="account-title">내 정보</h1> {/* 화면 제목 */}
                        <p className={styles.description}>닉네임을 바꾸고, 내가 쓴 댓글을 확인하거나 지우고, 회원 탈퇴를 할 수 있습니다.</p> {/* 화면 설명 */}
                        <ul className={styles.benefits}> {/* 관리 기능 안내 */}
                            <li><strong>닉네임</strong><span>댓글에 표시되는 이름입니다. 1~20자로 바꿀 수 있습니다.</span></li> {/* 닉네임 안내 */}
                            <li><strong>내 댓글</strong><span>최근 댓글 50개를 보여 줍니다. 관리자가 숨긴 댓글도 본인에게는 보입니다.</span></li> {/* 댓글 안내 */}
                            <li><strong>회원 탈퇴</strong><span>탈퇴하면 프로필·댓글·반응·신고 기록과 첨부 이미지가 바로 삭제되며 되돌릴 수 없습니다.</span></li> {/* 탈퇴 안내 */}
                        </ul> {/* 관리 기능 안내 끝 */}
                        {mode === "demo" ? <p className={styles.notice}>현재 서버가 연결되지 않은 시연 모드입니다. 시연 닉네임만 이 탭에 저장되고, 탈퇴하면 이 탭의 시연 정보가 지워집니다.</p> : null} {/* 시연 안내 */}
                    </section> {/* 안내 영역 끝 */}
                    <section className={styles.formArea} aria-label="내 정보 관리"> {/* 관리 영역 */}
                        <AccountPanel mode={mode} /> {/* 내 정보 관리 */}
                    </section> {/* 관리 영역 끝 */}
                </div> {/* 소개·관리 두 열 배치 끝 */}
            </main> {/* 내 정보 전체 영역 끝 */}
        </> // 화면 묶음 끝
    ); // 화면 반환 끝
} // 함수 끝
