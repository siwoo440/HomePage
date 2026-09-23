export const AGE_GATE_COOKIE_NAME = "devforge_age_verified"; // 성인 확인 쿠키 이름
export const AGE_GATE_MAX_AGE_SECONDS = 43_200; // 인증 유지 초
export const AGE_GATE_MAX_AGE_MS = AGE_GATE_MAX_AGE_SECONDS * 1_000; // 인증 유지 밀리초

export const ADULT_GAMES = Object.freeze( // 성인 게임 목록
[ // 목록 시작
    Object.freeze({ id: "project-h", directory: "/project_h/", imagePath: "/images/games/project-h.png" }), // 프로젝트 H
    Object.freeze({ id: "project-u", directory: "/project_u/", imagePath: "/images/games/project-u.png" }), // 프로젝트 U
    Object.freeze({ id: "project-v", directory: "/project_v/", imagePath: "/images/games/project-v.png" }), // 프로젝트 V
]); // 목록 끝

export function isAdultGameId(gameId: string): boolean // 성인 게임 판정
{ // 함수 시작
    return ADULT_GAMES.some((game) => game.id === gameId); // 식별자 일치 확인
} // 함수 끝

export function isProtectedAdultPath(pathname: string): boolean // 성인 경로 판정
{ // 함수 시작
    return ADULT_GAMES.some((game) => pathname.startsWith(game.directory) || pathname === game.imagePath); // 보호 경로 일치 확인
} // 함수 끝
