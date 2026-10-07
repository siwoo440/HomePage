export const LOCAL_SITE_URL = "http://localhost:3000"; // 로컬 개발 주소

interface SiteUrlEnvironment // 사이트 주소 환경 값
{ // 형식 시작
    [key: string]: string | undefined; // 기타 환경 값(process.env 호환)
    SITE_URL?: string; // 직접 지정한 공개 주소
    VERCEL_PROJECT_PRODUCTION_URL?: string; // Vercel 운영 도메인
} // 형식 끝

export function getSiteUrl(environment: SiteUrlEnvironment = process.env): string // 공개 사이트 주소 결정
{ // 함수 시작
    const configured = environment.SITE_URL?.trim(); // 직접 지정 주소
    if (configured && /^https?:\/\/[^/\s]+/.test(configured)) // 주소 형식 확인
    { // 조건 시작
        return configured.replace(/\/+$/, ""); // 끝 슬래시 제거 반환
    } // 조건 끝
    const vercel = environment.VERCEL_PROJECT_PRODUCTION_URL?.trim(); // Vercel 운영 도메인
    if (vercel && /^[a-z0-9.-]+$/i.test(vercel)) // 도메인 형식 확인
    { // 조건 시작
        return `https://${vercel}`; // HTTPS 주소 반환
    } // 조건 끝
    return LOCAL_SITE_URL; // 로컬 주소 반환
} // 함수 끝

export const PUBLIC_STATIC_PATHS = Object.freeze( // 검색 노출 공개 페이지
[ // 목록 시작
    "/main.html", // 메인
    "/goods.html", // 굿즈
    "/devlog.html", // 개발 뉴스
    "/community.html", // 커뮤니티
    "/contact.html", // 문의하기
    "/roadmap.html", // 개발 로드맵
    "/atelier-verse.html", // Atelier | Verse 소개
    "/terms.html", // 이용약관
    "/privacy.html", // 개인정보처리방침
    "/project_c/ProjectC_Cards.html", // 카오스폰즈 카드
    "/project_d/characters.html", // 바스티온 캐릭터
    "/project_d/factions.html", // 바스티온 세력
]); // 목록 끝

export const CRAWL_BLOCKED_PATHS = Object.freeze( // 검색 수집 제외 경로
[ // 목록 시작
    "/admin", // 관리자
    "/api/", // 서버 API
    "/auth/", // 인증 복귀
    "/login", // 로그인
    "/signup", // 회원가입
    "/account", // 내 정보
    "/notify/", // 출시 알림 수신 거부
    "/age-verification", // 성인 확인
    "/project_h/", // 성인 게임 H
    "/project_u/", // 성인 게임 U
    "/project_v/", // 성인 게임 V
    "/device-preview.html", // 개발용 미리보기
]); // 목록 끝
