import Link from "next/link"; // 내부 이동 링크

interface AdminPaginationProps // 관리자 목록 페이지 이동 속성
{ // 형식 시작
    basePath: string; // 목록 주소
    page: number; // 현재 페이지
    totalPages: number; // 전체 페이지 수
    label: string; // 이동 메뉴 이름
} // 형식 끝

export default function AdminPagination({ basePath, page, totalPages, label }: AdminPaginationProps) // 관리자 목록 페이지 이동
{ // 함수 시작
    if (totalPages <= 1) // 한 페이지 확인
    { // 조건 시작
        return null; // 이동 메뉴 생략
    } // 조건 끝

    return ( // 이동 메뉴 반환
        <nav className="admin-pagination" aria-label={label}> {/* 페이지 이동 메뉴 */}
            {page > 1 ? <Link href={`${basePath}?page=${page - 1}`} rel="prev">← 이전</Link> : <span aria-disabled="true">← 이전</span>} {/* 이전 페이지 */}
            <span aria-current="page">{page} / {totalPages} 페이지</span> {/* 현재 위치 */}
            {page < totalPages ? <Link href={`${basePath}?page=${page + 1}`} rel="next">다음 →</Link> : <span aria-disabled="true">다음 →</span>} {/* 다음 페이지 */}
        </nav> // 페이지 이동 메뉴 끝
    ); // 이동 메뉴 반환 끝
} // 함수 끝
