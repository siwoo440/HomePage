import assert from "node:assert/strict"; // 엄격 검증 도구
import test from "node:test"; // 테스트 실행 도구
import { classifyYouTubeContent, createYouTubeApiResponse, fetchYouTubeCommunityFeed, parseYouTubeDuration } from "../lib/community/youtube.ts"; // 유튜브 연동 도구

test("유튜브 재생 시간을 초 단위로 변환한다", () => // 재생 시간 변환 검증
{ // 테스트 시작
    assert.equal(parseYouTubeDuration("PT2M30S"), 150); // 분과 초 변환 확인
    assert.equal(parseYouTubeDuration("PT1H2M3S"), 3723); // 시분초 변환 확인
    assert.equal(parseYouTubeDuration("잘못된값"), 0); // 잘못된 값 보정 확인
}); // 테스트 끝

test("라이브와 쇼츠 후보와 일반 영상을 구분한다", () => // 콘텐츠 구분 검증
{ // 테스트 시작
    assert.equal(classifyYouTubeContent("live", 30), "live"); // 라이브 확인
    assert.equal(classifyYouTubeContent("upcoming", 30), "live"); // 예정 라이브 확인
    assert.equal(classifyYouTubeContent("none", 180), "short_candidate"); // 쇼츠 후보 확인
    assert.equal(classifyYouTubeContent("none", 181), "video"); // 일반 영상 확인
}); // 테스트 끝

test("미등록 게임과 API 키 누락을 안전하게 처리한다", async () => // 안전 응답 검증
{ // 테스트 시작
    const unknown = await createYouTubeApiResponse("http://localhost/api/community/youtube?game=unknown", "", fetch); // 미등록 게임 요청
    const unconfigured = await createYouTubeApiResponse("http://localhost/api/community/youtube?game=project-a", "", fetch); // 미설정 요청
    assert.equal(unknown.status, 400); // 미등록 상태 확인
    assert.deepEqual(unconfigured.body, { configured: false, items: [] }); // 미설정 본문 확인
}); // 테스트 끝

test("공식 API 응답을 공개 카드 데이터로 정규화한다", async () => // 응답 정규화 검증
{ // 테스트 시작
    const requestedUrls = []; // 요청 주소 기록
    const fakeFetch = async (input) => // 외부 API 가짜 호출
    { // 함수 시작
        const url = String(input); // 주소 문자열 변환
        requestedUrls.push(url); // 요청 주소 저장

        if (url.includes("/search")) // 검색 요청 확인
        { // 조건 시작
            return new Response(JSON.stringify({ items: [{ id: { videoId: "video-1" }, snippet: { title: "최신 개발 영상", channelTitle: "DEVFORGE 채널", publishedAt: "2026-09-12T00:00:00.000Z", liveBroadcastContent: "none", thumbnails: { medium: { url: "https://i.example/video.jpg" } } } }] }), { status: 200 }); // 검색 응답 반환
        } // 조건 끝

        return new Response(JSON.stringify({ items: [{ id: "video-1", contentDetails: { duration: "PT2M" }, statistics: { viewCount: "123", likeCount: "7", commentCount: "3" } }] }), { status: 200 }); // 상세 응답 반환
    }; // 함수 끝
    const result = await fetchYouTubeCommunityFeed("project-a", "secret-key", fakeFetch); // 피드 조회
    assert.equal(requestedUrls.length, 2); // 요청 횟수 확인
    assert.match(requestedUrls[0], /q=%23DEVFORGEProjectA/); // 해시태그 검색 확인
    assert.match(requestedUrls[0], /order=date/); // 최신순 검색 확인
    assert.match(requestedUrls[0], /key=secret-key/); // 서버 키 전달 확인
    assert.deepEqual(result.items[0], { id: "youtube-video-1", platform: "youtube", contentType: "short_candidate", gameId: "project-a", title: "최신 개발 영상", author: "DEVFORGE 채널", publishedAt: "2026-09-12T00:00:00.000Z", url: "https://www.youtube.com/watch?v=video-1", thumbnailUrl: "https://i.example/video.jpg", metrics: { views: 123, likes: 7, comments: 3 }, isDemo: false }); // 공개 카드 확인
}); // 테스트 끝
