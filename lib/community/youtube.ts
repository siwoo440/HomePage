import { resolveCommunityGame } from "./games.ts"; // 게임 검색 설정 도구
import type { CommunityContentItem, CommunityContentType, YouTubeFeedResponse } from "./types.ts"; // 커뮤니티 데이터 형식

type CommunityFetch = (input: string, init?: RequestInit) => Promise<Response>; // 외부 요청 함수 형식

interface YouTubeSearchItem // 검색 결과 형식
{ // 형식 시작
    id?: { videoId?: string }; // 영상 식별자
    snippet?: { title?: string; channelTitle?: string; publishedAt?: string; liveBroadcastContent?: string; thumbnails?: { medium?: { url?: string }; high?: { url?: string }; default?: { url?: string } } }; // 검색 요약
} // 형식 끝

interface YouTubeVideoItem // 영상 상세 형식
{ // 형식 시작
    id?: string; // 영상 식별자
    contentDetails?: { duration?: string }; // 재생 시간 정보
    statistics?: { viewCount?: string; likeCount?: string; commentCount?: string }; // 반응 수치 정보
} // 형식 끝

export interface YouTubeApiResult // API 처리 결과 형식
{ // 형식 시작
    status: number; // HTTP 상태
    body: YouTubeFeedResponse | { message: string }; // 공개 응답 본문
} // 형식 끝

export function parseYouTubeDuration(duration: string): number // 재생 시간 변환
{ // 함수 시작
    const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(duration); // ISO 시간 분석

    if (!match) // 분석 실패 확인
    { // 조건 시작
        return 0; // 안전한 기본값 반환
    } // 조건 끝

    const hours = Number(match[1] ?? 0); // 시간 숫자 변환
    const minutes = Number(match[2] ?? 0); // 분 숫자 변환
    const seconds = Number(match[3] ?? 0); // 초 숫자 변환
    return (hours * 3600) + (minutes * 60) + seconds; // 전체 초 반환
} // 함수 끝

export function classifyYouTubeContent(liveState: string, durationSeconds: number): CommunityContentType // 콘텐츠 종류 판정
{ // 함수 시작
    if (liveState === "live" || liveState === "upcoming") // 라이브 상태 확인
    { // 조건 시작
        return "live"; // 라이브 반환
    } // 조건 끝

    if (durationSeconds > 0 && durationSeconds <= 180) // 짧은 영상 확인
    { // 조건 시작
        return "short_candidate"; // 쇼츠 후보 반환
    } // 조건 끝

    return "video"; // 일반 영상 반환
} // 함수 끝

function toMetric(value?: string): number | undefined // 반응 수치 변환
{ // 함수 시작
    const parsed = Number(value); // 숫자 변환
    return Number.isFinite(parsed) ? parsed : undefined; // 안전한 수치 반환
} // 함수 끝

function resolveThumbnail(item: YouTubeSearchItem): string | null // 대표 이미지 선택
{ // 함수 시작
    return item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url ?? null; // 가장 큰 이미지 반환
} // 함수 끝

export async function fetchYouTubeCommunityFeed(gameId: string, apiKey: string, fetcher: CommunityFetch = fetch): Promise<YouTubeFeedResponse> // 유튜브 피드 조회
{ // 함수 시작
    const game = resolveCommunityGame(gameId); // 게임 설정 조회

    if (!game) // 미등록 게임 확인
    { // 조건 시작
        throw new Error("등록되지 않은 게임입니다."); // 허용 목록 오류
    } // 조건 끝

    const searchParams = new URLSearchParams({ part: "snippet", type: "video", order: "date", safeSearch: "strict", regionCode: "KR", relevanceLanguage: "ko", maxResults: "8", q: `${game.hashtag} ${game.searchTerms.join(" ")}`, key: apiKey }); // 검색 조건 구성
    const searchResponse = await fetcher(`https://www.googleapis.com/youtube/v3/search?${searchParams.toString()}`); // 최신 영상 검색

    if (!searchResponse.ok) // 검색 실패 확인
    { // 조건 시작
        throw new Error("유튜브 검색 요청에 실패했습니다."); // 안전한 검색 오류
    } // 조건 끝

    const searchData = await searchResponse.json() as { items?: YouTubeSearchItem[] }; // 검색 응답 해석
    const searchItems = searchData.items ?? []; // 검색 결과 목록
    const videoIds = searchItems.map((item) => item.id?.videoId ?? "").filter(Boolean); // 영상 식별자 목록

    if (videoIds.length === 0) // 검색 결과 없음 확인
    { // 조건 시작
        return { configured: true, items: [] }; // 빈 피드 반환
    } // 조건 끝

    const videoParams = new URLSearchParams({ part: "contentDetails,statistics", id: videoIds.join(","), key: apiKey }); // 상세 조회 조건 구성
    const videoResponse = await fetcher(`https://www.googleapis.com/youtube/v3/videos?${videoParams.toString()}`); // 영상 상세 조회

    if (!videoResponse.ok) // 상세 조회 실패 확인
    { // 조건 시작
        throw new Error("유튜브 영상 정보 요청에 실패했습니다."); // 안전한 상세 오류
    } // 조건 끝

    const videoData = await videoResponse.json() as { items?: YouTubeVideoItem[] }; // 상세 응답 해석
    const detailMap = new Map((videoData.items ?? []).map((item) => [item.id ?? "", item])); // 상세 정보 색인
    const items = searchItems.map((searchItem): CommunityContentItem | null => // 공개 카드 변환
    { // 변환 시작
        const videoId = searchItem.id?.videoId; // 영상 식별자 추출
        const snippet = searchItem.snippet; // 검색 요약 추출

        if (!videoId || !snippet?.title || !snippet.channelTitle || !snippet.publishedAt) // 필수 값 확인
        { // 조건 시작
            return null; // 불완전 항목 제외
        } // 조건 끝

        const detail = detailMap.get(videoId); // 상세 정보 조회
        const durationSeconds = parseYouTubeDuration(detail?.contentDetails?.duration ?? ""); // 재생 시간 변환
        const views = toMetric(detail?.statistics?.viewCount); // 조회 수 변환
        const likes = toMetric(detail?.statistics?.likeCount); // 좋아요 수 변환
        const comments = toMetric(detail?.statistics?.commentCount); // 댓글 수 변환
        return { id: `youtube-${videoId}`, platform: "youtube", contentType: classifyYouTubeContent(snippet.liveBroadcastContent ?? "none", durationSeconds), gameId: game.id, title: snippet.title, author: snippet.channelTitle, publishedAt: snippet.publishedAt, url: `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`, thumbnailUrl: resolveThumbnail(searchItem), metrics: { views, likes, comments }, isDemo: false }; // 공개 카드 반환
    }).filter((item): item is CommunityContentItem => item !== null); // 불완전 항목 제거
    return { configured: true, items }; // 공개 피드 반환
} // 함수 끝

export async function createYouTubeApiResponse(requestUrl: string, apiKey: string, fetcher: CommunityFetch = fetch): Promise<YouTubeApiResult> // 공개 API 응답 생성
{ // 함수 시작
    const gameId = new URL(requestUrl).searchParams.get("game") ?? ""; // 게임 식별자 추출

    if (!resolveCommunityGame(gameId)) // 미등록 게임 확인
    { // 조건 시작
        return { status: 400, body: { message: "등록되지 않은 게임입니다." } }; // 잘못된 요청 반환
    } // 조건 끝

    if (!apiKey.trim()) // API 키 누락 확인
    { // 조건 시작
        return { status: 200, body: { configured: false, items: [] } }; // 연동 준비 응답 반환
    } // 조건 끝

    try // 외부 조회 시도
    { // 시도 시작
        const body = await fetchYouTubeCommunityFeed(gameId, apiKey, fetcher); // 최신 피드 조회
        return { status: 200, body }; // 성공 응답 반환
    } // 시도 끝
    catch // 외부 오류 처리
    { // 오류 처리 시작
        return { status: 503, body: { message: "유튜브 콘텐츠를 불러오지 못했습니다." } }; // 안전한 오류 반환
    } // 오류 처리 끝
} // 함수 끝
