export type CommunityPlatform = "discord" | "youtube" | "x" | "instagram" | "facebook" | "tiktok"; // 플랫폼 이름
export type CommunityContentType = "video" | "short_candidate" | "live" | "image" | "post" | "notice"; // 콘텐츠 종류

export interface CommunityGame // 커뮤니티 게임 형식
{ // 형식 시작
    id: string; // 게임 식별자
    label: string; // 화면 이름
    hashtag: string; // 대표 해시태그
    searchTerms: readonly string[]; // 검색 보조어
} // 형식 끝

export interface CommunityMetrics // 반응 지표 형식
{ // 형식 시작
    views?: number; // 조회 수
    likes?: number; // 좋아요 수
    comments?: number; // 댓글 수
    shares?: number; // 공유 수
} // 형식 끝

export interface CommunityContentItem // 공통 콘텐츠 형식
{ // 형식 시작
    id: string; // 콘텐츠 식별자
    platform: CommunityPlatform; // 플랫폼 이름
    gameId: string; // 게임 식별자
    title: string; // 콘텐츠 제목
    author: string; // 작성자 이름
    publishedAt: string; // 게시 시각
    url: string; // 원본 주소
    thumbnailUrl: string | null; // 썸네일 주소
    contentType: CommunityContentType; // 콘텐츠 종류
    metrics: CommunityMetrics; // 반응 지표
    isDemo: boolean; // 시연 여부
} // 형식 끝

export interface YouTubeFeedResponse // 유튜브 피드 응답 형식
{ // 형식 시작
    configured: boolean; // 연동 설정 여부
    items: CommunityContentItem[]; // 콘텐츠 목록
    message?: string; // 상태 안내
} // 형식 끝
