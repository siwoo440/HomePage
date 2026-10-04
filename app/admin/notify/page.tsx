import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { buildNotifySummary, loadNotifySummary, type NotifySummary } from "@/lib/notify/store"; // 출시 알림 집계 도구
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import AdminHeader from "../news/admin-header"; // 관리자 상단 메뉴
import NotifySummaryTable from "./summary-table"; // 게임별 집계 표

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function NotifyAdminPage() // 출시 알림 관리 화면
{ // 함수 시작
    await requireAdmin("/admin/notify"); // 관리자 권한 확인
    let summary: NotifySummary = buildNotifySummary([]); // 집계 결과
    let loadError = false; // 조회 실패 여부

    try // 집계 조회 시도
    { // 시도 시작
        summary = await loadNotifySummary(await createServerSupabaseClient()); // 게임별 집계 조회
    } // 시도 끝
    catch // 조회 실패 처리
    { // 오류 처리 시작
        loadError = true; // 실패 상태 저장
    } // 오류 처리 끝

    return ( // 출시 알림 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 상단 메뉴 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">{"// RELEASE NOTICE"}</p> {/* 영문 분류 */}
                    <h1>출시 알림 신청</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
            </section> {/* 화면 제목 영역 끝 */}
            {loadError ? <p className="admin-message admin-message-error" role="alert">출시 알림 집계를 불러오지 못했습니다. 출시 알림 마이그레이션 적용 여부를 확인해 주세요.</p> : <NotifySummaryTable summary={summary} />} {/* 게임별 집계 */}
        </main> // 관리자 전체 영역 끝
    ); // 출시 알림 화면 반환 끝
} // 함수 끝
