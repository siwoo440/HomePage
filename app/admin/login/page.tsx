import Link from "next/link"; // 내부 이동 링크
import { isSupabaseConfigured } from "@/lib/supabase/config"; // 설정 여부 판정
import LoginForm from "./login-form"; // 로그인 입력 화면

interface LoginPageProps // 로그인 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export default async function AdminLoginPage({ searchParams }: LoginPageProps) // 관리자 로그인 화면
{ // 함수 시작
    const parameters = await searchParams; // 검색 값 읽기
    const error = typeof parameters.error === "string" ? parameters.error : ""; // 오류 코드 읽기
    const requestedReturnTo = typeof parameters.returnTo === "string" ? parameters.returnTo : "/admin/news"; // 복귀 주소 읽기
    const returnTo = requestedReturnTo.startsWith("/") && !requestedReturnTo.startsWith("//") ? requestedReturnTo : "/admin/news"; // 안전한 복귀 주소
    const configured = isSupabaseConfigured(); // Supabase 설정 확인

    return ( // 로그인 화면 반환
        <main className="admin-shell admin-login-shell"> {/* 로그인 전체 영역 */}
            <section className="admin-login-card" aria-labelledby="login-title"> {/* 로그인 카드 */}
                <Link className="admin-brand" href="/main.html">DEVFORGE</Link> {/* 메인 이동 브랜드 */}
                <p className="admin-eyebrow">// DEVELOPER ACCESS</p> {/* 관리자 영문 분류 */}
                <h1 id="login-title">관리자 로그인</h1> {/* 로그인 제목 */}
                <p className="admin-description">개발 뉴스 작성과 수정은 등록된 관리자 계정만 사용할 수 있습니다.</p> {/* 로그인 설명 */}
                <LoginForm configured={configured} errorCode={error} returnTo={returnTo} /> {/* 로그인 입력 */}
                <Link className="admin-back-link" href="/devlog.html">개발 뉴스로 돌아가기</Link> {/* 뉴스 복귀 링크 */}
            </section> {/* 로그인 카드 끝 */}
        </main> // 로그인 전체 영역 끝
    ); // 로그인 화면 반환 끝
} // 함수 끝
