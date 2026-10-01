export const ADMIN_PAGE_SIZE = 20; // 관리자 목록 한 페이지 항목 수

export interface AdminPageInfo // 관리자 목록 페이지 정보
{ // 형식 시작
    page: number; // 현재 페이지
    from: number; // 조회 시작 위치
    to: number; // 조회 끝 위치
} // 형식 끝

export function parseAdminPage(value: string | string[] | undefined): number // 주소 페이지 번호 읽기
{ // 함수 시작
    const raw = Array.isArray(value) ? value[0] : value; // 첫 값 사용
    const page = Number.parseInt(raw ?? "", 10); // 정수 변환
    return Number.isFinite(page) && page >= 1 && page <= 10_000 ? page : 1; // 안전 범위 페이지 반환
} // 함수 끝

export function getAdminPageInfo(page: number, size = ADMIN_PAGE_SIZE): AdminPageInfo // 페이지 조회 범위 계산
{ // 함수 시작
    const from = (page - 1) * size; // 시작 위치
    return { page, from, to: from + size - 1 }; // 범위 반환
} // 함수 끝

export function getAdminTotalPages(count: number | null | undefined, size = ADMIN_PAGE_SIZE): number // 전체 페이지 수 계산
{ // 함수 시작
    return Math.max(1, Math.ceil(Math.max(0, count ?? 0) / size)); // 최소 1페이지 반환
} // 함수 끝
