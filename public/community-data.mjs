import { GAME_PROJECTS } from "./game-projects.mjs"; // 공개 프로젝트 데이터

export const COMMUNITY_GAMES = Object.freeze(GAME_PROJECTS.map((project) => // 커뮤니티 게임 변환
{ // 변환 시작
    return Object.freeze({ id: project.id, label: project.title, hashtag: project.hashtag }); // 커뮤니티 항목 반환
})); // 변환 끝

export const COMMUNITY_PLATFORMS = Object.freeze( // 플랫폼 설정 목록
[ // 플랫폼 배열 시작
    { id: "discord", name: "Discord", channelLabel: "서버 주소 준비 중", channelUrl: null, contentType: "notice", headline: "개발 공지와 베타 테스트 모집", description: "공식 서버의 공지와 실시간 참여 정보를 보여줄 자리입니다." }, // 디스코드 설정
    { id: "youtube", name: "YouTube", channelLabel: "채널 주소 준비 중", channelUrl: null, contentType: "video", headline: "최신 개발 영상과 쇼츠 후보", description: "게임 해시태그로 최신 영상과 라이브를 보여줄 자리입니다." }, // 유튜브 설정
    { id: "x", name: "X", channelLabel: "채널 주소 준비 중", channelUrl: null, contentType: "post", headline: "개발 스크린샷과 빠른 업데이트", description: "최근 개발 게시물과 공개 반응을 보여줄 자리입니다." }, // X 설정
    { id: "instagram", name: "Instagram", channelLabel: "프로필 주소 준비 중", channelUrl: null, contentType: "image", headline: "게임 아트와 개발 릴스", description: "공식 이미지와 릴스를 보여줄 자리입니다." }, // 인스타그램 설정
    { id: "facebook", name: "Facebook", channelLabel: "페이지 주소 준비 중", channelUrl: null, contentType: "post", headline: "공식 페이지 공지와 행사 안내", description: "공식 페이지의 최신 소식을 보여줄 자리입니다." }, // 페이스북 설정
    { id: "tiktok", name: "TikTok", channelLabel: "프로필 주소 준비 중", channelUrl: null, contentType: "short_candidate", headline: "게임플레이와 개발 숏폼", description: "공식 계정의 짧은 영상을 보여줄 자리입니다." }, // 틱톡 설정
]); // 플랫폼 배열 끝

export const ADULT_COMMUNITY_GAME_IDS = Object.freeze(GAME_PROJECTS.filter((project) => project.adultOnly).map((project) => project.id)); // 성인 게임 식별자

export function isAdultCommunityGame(gameId) // 커뮤니티 성인 게임 판정
{ // 함수 시작
    return ADULT_COMMUNITY_GAME_IDS.includes(gameId); // 성인 게임 여부 반환
} // 함수 끝

export function createDemoItems(gameId, ageVerified = false) // 시연 콘텐츠 생성
{ // 함수 시작
    const selectedGame = COMMUNITY_GAMES.find((game) => game.id === gameId); // 선택 게임 조회
    const resolvedGameId = selectedGame?.id ?? "all"; // 화면 게임 식별자
    const gameLabel = selectedGame?.label ?? "전체 프로젝트"; // 화면 게임 이름
    const imageId = selectedGame?.id ?? "project-a"; // 시연 이미지 식별자
    const thumbnailUrl = isAdultCommunityGame(resolvedGameId) && !ageVerified ? "images/games/age-restricted.svg" : `images/games/${imageId}.png`; // 인증별 시연 이미지
    return COMMUNITY_PLATFORMS.map((platform) => // 플랫폼별 항목 변환
    { // 변환 시작
        return { id: `demo-${platform.id}-${resolvedGameId}`, platform: platform.id, contentType: platform.contentType, gameId: resolvedGameId, title: `${gameLabel} · ${platform.headline}`, author: "DEVFORGE 시연 데이터", publishedAt: "연동 준비 중", url: "", thumbnailUrl, metrics: {}, description: platform.description, isDemo: true }; // 시연 항목 반환
    }); // 변환 끝
} // 함수 끝
