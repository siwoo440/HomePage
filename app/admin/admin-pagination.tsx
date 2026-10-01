import Link from "next/link"; // 내부 이동 링크

interface AdminPaginationProps // 관리자 목록 페이지 이동 속성
{ // 형식 시작
    basePath: string; // 목록 주소
    page: number; // 현재 페이지
    totalPages: number; // 전체 페이지 수
    label: string; // 이동 메뉴 이름
    params?: Record<string, string>; // 함께 유지할 검색 값
} // 형식 끝

function pageHref(basePath: string, page: number, params: Record<string, string>): string // 페이지 주소 생성
{ // 함수 시작
    return `${basePath}?${new URLSearchParams({ ...params, page: String(page) }).toString()}`; // 검색 값 포함 주소 반환
} // 함수 끝

export default function AdminPagination({ basePath, page, totalPages, label, params = {} }: AdminPaginationProps) // 관리자 목록 페이지 이동
{ // 함수 시작
    if (totalPages <= 1) // 한 페이지 확인
    { // 조건 시작
        return null; // 이동 메뉴 생략
    } // 조건 끝

    return ( // 이동 메뉴 반환
        <nav className="admin-pagination" aria-label={label}> {/* 페이지 이동 메뉴 */}
            {page > 1 ? <Link href={pageHref(basePath, page - 1, params)} rel="prev">← 이전</Link> : <span aria-disabled="true">← 이전</span>} {/* 이전 페이지 */}
            <span aria-current="page">{page} / {totalPages} 페이지</span> {/* 현재 위치 */}
            {page < totalPages ? <Link href={pageHref(basePath, page + 1, params)} rel="next">다음 →</Link> : <span aria-disabled="true">다음 →</span>} {/* 다음 페이지 */}
        </nav> // 페이지 이동 메뉴 끝
    ); // 이동 메뉴 반환 끝
} // 함수 끝
