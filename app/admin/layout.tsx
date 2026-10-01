import "./admin.css"; // 관리자 공통 스타일
import SiteHeader from "../site-header"; // 공통 상단 헤더

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) // 관리자 화면 틀
{ // 함수 시작
    return ( // 관리자 화면 반환
        <> {/* 관리자 화면 묶음 */}
            <SiteHeader /> {/* 공통 상단 헤더 */}
            {children} {/* 관리자 화면 내용 */}
        </> // 관리자 화면 묶음 끝
    ); // 관리자 화면 반환 끝
} // 함수 끝
