import Link from "next/link"; // 내부 이동 링크
import { requireAdmin } from "@/lib/auth/admin"; // 관리자 보호 함수
import { parseAdminPage } from "@/lib/admin/pagination"; // 목록 페이지 계산
import { CONTACT_FILTER_LABELS, CONTACT_FILTERS, CONTACT_PAGE_SIZE, createSupabaseContactInbox, parseContactFilter, type ContactPage } from "@/lib/contact/inbox"; // 문의함 도구
import { createServerSupabaseClient } from "@/lib/supabase/server"; // 서버 데이터 도구
import AdminHeader from "../news/admin-header"; // 관리자 상단 메뉴
import AdminPagination from "../admin-pagination"; // 목록 페이지 이동
import { updateContactMessage } from "./actions"; // 문의 처리
import InboxBoard from "./inbox-board"; // 문의함 목록

interface ContactAdminPageProps // 문의함 화면 속성
{ // 형식 시작
    searchParams: Promise<Record<string, string | string[] | undefined>>; // 주소 검색 값
} // 형식 끝

export const dynamic = "force-dynamic"; // 사용자별 동적 화면

export default async function ContactAdminPage({ searchParams }: ContactAdminPageProps) // 문의함 화면
{ // 함수 시작
    await requireAdmin("/admin/contact"); // 관리자 권한 확인
    const parameters = await searchParams; // 검색 값 읽기
    const filter = parseContactFilter(parameters.filter); // 목록 종류
    const page = parseAdminPage(parameters.page); // 현재 페이지
    let result: ContactPage = { items: [], total: 0 }; // 목록 결과
    let loadError = false; // 조회 실패 여부

    try // 목록 조회 시도
    { // 시도 시작
        const supabase = await createServerSupabaseClient(); // 서버 데이터 도구
        result = await createSupabaseContactInbox({ client: supabase }).list(filter, page); // 문의 목록 조회
    } // 시도 끝
    catch // 조회 실패 처리
    { // 오류 처리 시작
        loadError = true; // 실패 상태 저장
    } // 오류 처리 끝

    return ( // 문의함 화면 반환
        <main className="admin-shell"> {/* 관리자 전체 영역 */}
            <AdminHeader /> {/* 관리자 상단 메뉴 */}
            <section className="admin-page-heading"> {/* 화면 제목 영역 */}
                <div> {/* 제목 묶음 */}
                    <p className="admin-eyebrow">{"// CONTACT INBOX"}</p> {/* 영문 분류 */}
                    <h1>문의함</h1> {/* 화면 제목 */}
                </div> {/* 제목 묶음 끝 */}
            </section> {/* 화면 제목 영역 끝 */}
            <nav className="moderation-tabs" aria-label="문의 목록 종류"> {/* 목록 종류 메뉴 */}
                {CONTACT_FILTERS.map((item) => <Link key={item} href={`/admin/contact?filter=${item}`} aria-current={item === filter ? "page" : undefined}>{CONTACT_FILTER_LABELS[item]}{item === filter ? ` ${result.total}` : ""}</Link>)} {/* 목록 종류 링크 */}
            </nav> {/* 목록 종류 메뉴 끝 */}
            {loadError ? <p className="admin-message admin-message-error" role="alert">문의 목록을 불러오지 못했습니다. 문의 마이그레이션 적용 여부를 확인해 주세요.</p> : <InboxBoard key={`${filter}-${page}`} initialItems={result.items} filter={filter} onUpdate={updateContactMessage} />} {/* 문의함 목록 */}
            <AdminPagination basePath="/admin/contact" page={page} totalPages={Math.max(1, Math.ceil(result.total / CONTACT_PAGE_SIZE))} label="문의 목록 페이지" params={{ filter }} /> {/* 페이지 이동 */}
        </main> // 관리자 전체 영역 끝
    ); // 문의함 화면 반환 끝
} // 함수 끝
