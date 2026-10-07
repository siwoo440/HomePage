import { getAgeVerificationStatus } from "./age-gate.mjs"; // 성인 인증 상태 도구
import { COMMUNITY_GAMES, COMMUNITY_PLATFORMS, createDemoItems, isAdultCommunityGame } from "./community-data.mjs"; // 커뮤니티 화면 데이터
import { createDataStateController, requestJson, resolveCollectionState } from "./data-state.mjs"; // 공통 데이터 상태 도구
import { getPageLocale } from "./i18n.mjs"; // 화면 언어 표기

let ageVerified = false; // 현재 성인 인증 상태
let selectionVersion = 0; // 선택 변경 번호
let youtubeRequestVersion = 0; // 유튜브 요청 변경 번호

export function resolveGameSelection(gameId) // 안전한 게임 선택
{ // 함수 시작
    return COMMUNITY_GAMES.some((game) => game.id === gameId) ? gameId : "all"; // 허용 게임 반환
} // 함수 끝

export function buildCommunityUrl(gameId) // 선택 주소 생성
{ // 함수 시작
    return gameId === "all" ? "community.html" : `community.html?game=${encodeURIComponent(gameId)}`; // 안전한 주소 반환
} // 함수 끝

export async function copyCommunityHashtag(value, clipboard) // 커뮤니티 해시태그 복사
{ // 함수 시작
    const hashtag = typeof value === "string" ? value.trim() : ""; // 안전한 해시태그 정리

    if (!hashtag || typeof clipboard?.writeText !== "function") // 복사 가능 여부 확인
    { // 조건 시작
        return false; // 복사 실패 반환
    } // 조건 끝

    try // 클립보드 복사 시도
    { // 시도 시작
        await clipboard.writeText(hashtag); // 해시태그 복사
        return true; // 복사 성공 반환
    } // 시도 끝
    catch // 복사 오류 처리
    { // 오류 처리 시작
        return false; // 복사 실패 반환
    } // 오류 처리 끝
} // 함수 끝

export function selectDemoContent(gameId, verified = false) // 게임별 시연 콘텐츠 선택
{ // 함수 시작
    return createDemoItems(resolveGameSelection(gameId), verified); // 안전한 시연 목록 반환
} // 함수 끝

export function isStaleYouTubeRequest(expectedSelectionVersion, activeSelectionVersion, requestVersion = null, activeRequestVersion = null) // 유튜브 요청 만료 판정
{ // 함수 시작
    const selectionChanged = expectedSelectionVersion !== activeSelectionVersion; // 선택 변경 여부
    const requestChanged = requestVersion !== null && requestVersion !== activeRequestVersion; // 요청 변경 여부
    return selectionChanged || requestChanged; // 만료 상태 반환
} // 함수 끝

function createTextElement(tagName, className, value) // 텍스트 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 새 요소 생성
    element.className = className; // 요소 스타일 연결
    element.textContent = value; // 안전한 일반 텍스트 삽입
    return element; // 완성 요소 반환
} // 함수 끝

function formatMetric(value) // 반응 수치 표시
{ // 함수 시작
    return typeof value === "number" ? new Intl.NumberFormat("ko-KR").format(value) : "—"; // 한국어 수치 반환
} // 함수 끝

function metricEntries(item) // 콘텐츠 반응 목록
{ // 함수 시작
    if (item.platform === "discord") // 디스코드 확인
    { // 조건 시작
        return [["온라인", undefined], ["참여자", undefined]]; // 디스코드 지표 반환
    } // 조건 끝

    if (item.platform === "x") // X 확인
    { // 조건 시작
        return [["좋아요", item.metrics.likes], ["재게시", item.metrics.shares], ["답글", item.metrics.comments]]; // X 지표 반환
    } // 조건 끝

    if (item.platform === "instagram" || item.platform === "facebook") // 메타 플랫폼 확인
    { // 조건 시작
        return [[item.platform === "facebook" ? "반응" : "좋아요", item.metrics.likes], ["댓글", item.metrics.comments]]; // 메타 지표 반환
    } // 조건 끝

    return [["조회", item.metrics.views], ["좋아요", item.metrics.likes], [item.platform === "tiktok" ? "공유" : "댓글", item.platform === "tiktok" ? item.metrics.shares : item.metrics.comments]]; // 영상 지표 반환
} // 함수 끝

function createContentCard(item) // 최신 소식 카드 생성
{ // 함수 시작
    const article = document.createElement("article"); // 카드 요소 생성
    article.className = item.thumbnailUrl ? "media-card" : "signal-card"; // 이미지 여부별 스타일

    if (item.thumbnailUrl) // 이미지 존재 확인
    { // 조건 시작
        const image = document.createElement("img"); // 이미지 요소 생성
        image.src = item.thumbnailUrl; // 이미지 주소 연결
        image.alt = `${item.title} 썸네일`; // 이미지 설명 연결
        article.append(image); // 카드 이미지 추가
    } // 조건 끝

    const copy = document.createElement("div"); // 카드 내용 묶음 생성

    if (item.isDemo) // 시연 항목 확인
    { // 조건 시작
        copy.append(createTextElement("span", "demo-badge", "시연 화면")); // 시연 배지 추가
    } // 조건 끝
    else // 실제 항목 처리
    { // 대안 시작
        copy.append(createTextElement("span", "card-label", item.contentType === "live" ? "LIVE" : item.contentType === "short_candidate" ? "쇼츠 후보" : "최신 소식")); // 콘텐츠 종류 추가
    } // 대안 끝

    copy.append(createTextElement("h3", "", item.title)); // 안전한 제목 추가
    copy.append(createTextElement("p", "", item.description ?? `${item.author} · ${new Date(item.publishedAt).toLocaleDateString(getPageLocale())}`)); // 안전한 설명 추가
    article.append(copy); // 카드 내용 추가
    return article; // 완성 카드 반환
} // 함수 끝

function createReactionCard(item) // 사람들 반응 카드 생성
{ // 함수 시작
    const article = document.createElement("article"); // 반응 카드 생성
    article.className = "reaction-card"; // 반응 카드 스타일
    article.append(createTextElement("span", "card-label", "사람들 반응")); // 반응 분류 추가
    const metricRow = document.createElement("div"); // 반응 목록 생성
    metricRow.className = "metric-row"; // 반응 목록 스타일

    for (const [label, value] of metricEntries(item)) // 반응 지표 순회
    { // 반복 시작
        const metric = document.createElement("span"); // 반응 항목 생성
        metric.append(createTextElement("strong", "", formatMetric(value))); // 반응 수치 추가
        metric.append(document.createTextNode(label)); // 반응 이름 추가
        metricRow.append(metric); // 반응 목록에 추가
    } // 반복 끝

    article.append(metricRow); // 반응 목록 추가
    article.append(createTextElement("p", "", item.isDemo ? "실제 API 응답이 연결되면 공개 반응을 표시합니다." : "공식 API에서 확인한 최신 공개 반응입니다.")); // 반응 상태 추가
    return article; // 완성 반응 카드 반환
} // 함수 끝

function renderPlatformItem(item) // 플랫폼 항목 렌더링
{ // 함수 시작
    const section = document.querySelector(`[data-platform="${item.platform}"]`); // 플랫폼 영역 조회
    const feed = section?.querySelector("[data-feed]"); // 콘텐츠 격자 조회

    if (!section || !feed) // 화면 요소 누락 확인
    { // 조건 시작
        return; // 안전한 렌더링 중단
    } // 조건 끝

    feed.replaceChildren(createContentCard(item), createReactionCard(item)); // 최신 카드 교체
} // 함수 끝

function renderFeatured(item) // 대표 콘텐츠 렌더링
{ // 함수 시작
    const image = document.getElementById("featured-image"); // 대표 이미지 조회
    const badge = document.getElementById("featured-badge"); // 대표 배지 조회
    const title = document.getElementById("featured-title"); // 대표 제목 조회
    const description = document.getElementById("featured-description"); // 대표 설명 조회
    const meta = document.getElementById("featured-meta"); // 대표 정보 조회
    const action = document.getElementById("featured-action"); // 대표 이동 요소 조회

    if (!(image instanceof HTMLImageElement) || !badge || !title || !description || !meta || !action) // 필수 요소 확인
    { // 조건 시작
        return; // 안전한 렌더링 중단
    } // 조건 끝

    image.src = item.thumbnailUrl ?? "images/games/project-a.png"; // 대표 이미지 연결
    image.alt = `${item.title} 썸네일`; // 대표 이미지 설명
    badge.textContent = item.isDemo ? "시연 화면" : item.contentType === "live" ? "LIVE" : item.contentType === "short_candidate" ? "쇼츠 후보" : "최신 영상"; // 대표 상태 표시
    title.textContent = item.title; // 안전한 대표 제목 삽입
    description.textContent = item.isDemo ? item.description : `${item.author}의 최신 공개 콘텐츠입니다.`; // 안전한 대표 설명 삽입
    meta.textContent = `${item.author} · ${item.isDemo ? "연동 준비 중" : new Date(item.publishedAt).toLocaleString(getPageLocale())}`; // 안전한 대표 정보 삽입

    const nextAction = document.createElement(!item.isDemo && item.url ? "a" : "span"); // 새 이동 요소 생성
    nextAction.id = "featured-action"; // 대표 이동 식별자 연결
    nextAction.className = !item.isDemo && item.url ? "channel-action" : "channel-action is-disabled"; // 이동 상태 스타일
    nextAction.textContent = !item.isDemo && item.url ? "YouTube에서 영상 보기 →" : "영상 주소 준비 중"; // 이동 상태 문구

    if (nextAction instanceof HTMLAnchorElement) // 실제 링크 확인
    { // 조건 시작
        nextAction.href = item.url; // 원본 영상 주소
        nextAction.target = "_blank"; // 새 창 열기
        nextAction.rel = "noopener noreferrer"; // 새 창 보호
    } // 조건 끝
    else // 비활성 요소 처리
    { // 대안 시작
        nextAction.setAttribute("aria-disabled", "true"); // 비활성 상태 전달
    } // 대안 끝

    action.replaceWith(nextAction); // 이전 이동 요소 교체
} // 함수 끝

function renderDemoState(gameId, verified) // 시연 화면 렌더링
{ // 함수 시작
    const items = selectDemoContent(gameId, verified); // 게임별 시연 항목 조회

    for (const item of items) // 시연 항목 순회
    { // 반복 시작
        renderPlatformItem(item); // 플랫폼 항목 표시
    } // 반복 끝

    const youtubeItem = items.find((item) => item.platform === "youtube"); // 유튜브 시연 항목 조회

    if (youtubeItem) // 대표 항목 존재 확인
    { // 조건 시작
        renderFeatured(youtubeItem); // 대표 콘텐츠 표시
    } // 조건 끝
} // 함수 끝

function updateAgeVerificationLink(gameId, verified) // 성인 확인 링크 갱신
{ // 함수 시작
    const link = document.getElementById("age-verification-link"); // 성인 확인 링크 조회
    if (!(link instanceof HTMLAnchorElement)) // 링크 요소 확인
    { // 조건 시작
        return; // 갱신 중단
    } // 조건 끝
    const locked = isAdultCommunityGame(gameId) && !verified; // 잠금 상태 판정
    link.hidden = !locked; // 잠금 상태별 표시
    if (locked) // 잠금 상태 확인
    { // 조건 시작
        const returnTo = `/community.html?game=${encodeURIComponent(gameId)}#platforms`; // 인증 뒤 복귀 주소
        link.href = `/age-verification?returnTo=${encodeURIComponent(returnTo)}`; // 성인 확인 주소 연결
    } // 조건 끝
} // 함수 끝

async function loadYouTubeFeed(gameId, verified, expectedSelectionVersion = selectionVersion) // 유튜브 최신 피드 조회
{ // 함수 시작
    if (isStaleYouTubeRequest(expectedSelectionVersion, selectionVersion)) // 이전 선택 확인
    { // 조건 시작
        return; // 이전 선택 재시도 차단
    } // 조건 끝

    const section = document.querySelector('[data-platform="youtube"]'); // 유튜브 영역 조회
    const state = section?.querySelector("[data-connection]"); // 유튜브 연동 상태 조회
    const stateController = createDataStateController(document.getElementById("youtube-feed-state")); // 유튜브 상태 제어기
    const currentRequest = ++youtubeRequestVersion; // 현재 유튜브 요청 번호

    if (gameId === "all") // 전체 선택 확인
    { // 조건 시작
        if (state) // 상태 요소 확인
        { // 조건 시작
            state.textContent = "게임 선택 대기 중"; // 전체 선택 상태 표시
        } // 조건 끝
        stateController.show("demo", { title: "게임을 선택해 주세요", message: "게임을 선택하면 해당 YouTube 채널의 연결 상태를 확인합니다." }); // 선택 대기 상태 표시
        return; // API 조회 생략
    } // 조건 끝

    if (isAdultCommunityGame(gameId) && !verified) // 미인증 성인 게임 확인
    { // 조건 시작
        if (state) // 상태 요소 확인
        { // 조건 시작
            state.textContent = "성인 확인 후 연결"; // 잠금 상태 표시
        } // 조건 끝
        stateController.show("demo", { title: "성인 확인이 필요합니다", message: "성인 확인을 마치면 해당 게임의 콘텐츠 연결을 확인합니다." }); // 인증 대기 상태 표시
        return; // API 조회 차단
    } // 조건 끝

    if (state) // 상태 요소 확인
    { // 조건 시작
        state.textContent = "최신 콘텐츠 확인 중"; // 로딩 상태 표시
    } // 조건 끝
    stateController.show("loading", { title: "YouTube 확인 중", message: "선택한 게임의 최신 공개 콘텐츠를 불러오고 있습니다." }); // 로딩 상태 표시

    try // API 조회 시도
    { // 시도 시작
        const data = await requestJson(`/api/community/youtube?game=${encodeURIComponent(gameId)}`); // 서버 유튜브 API 요청

        if (isStaleYouTubeRequest(expectedSelectionVersion, selectionVersion, currentRequest, youtubeRequestVersion)) // 오래된 요청 확인
        { // 조건 시작
            return; // 오래된 결과 폐기
        } // 조건 끝

        const dataState = resolveCollectionState(data, "items"); // 유튜브 응답 상태 판정

        if (dataState === "demo") // API 키 누락 확인
        { // 조건 시작
            if (state) // 상태 요소 확인
            { // 조건 시작
                state.textContent = "API 키 대기 중"; // 미설정 상태 표시
            } // 조건 끝
            stateController.show("demo", { title: "시연 콘텐츠 표시 중", message: "YouTube API 연결 전이라 준비된 시연 콘텐츠를 표시합니다." }); // 시연 상태 표시
            return; // 시연 화면 유지
        } // 조건 끝

        if (dataState === "ready") // 실제 항목 확인
        { // 조건 시작
            renderPlatformItem(data.items[0]); // 유튜브 실제 카드 표시
            renderFeatured(data.items[0]); // 대표 실제 콘텐츠 표시
            if (state) // 상태 요소 확인
            { // 조건 시작
                state.textContent = "최신 콘텐츠 연결됨"; // 연결 상태 표시
            } // 조건 끝
            stateController.hide(); // 상태 안내 숨김
            return; // 성공 처리 종료
        } // 조건 끝

        if (dataState === "empty") // 빈 결과 상태 확인
        { // 대안 시작
            if (state) // 상태 요소 확인
            { // 조건 시작
                state.textContent = "검색 결과 없음"; // 빈 결과 표시
            } // 조건 끝
            stateController.show("empty", { title: "검색 결과가 없습니다", message: "현재는 준비된 시연 콘텐츠를 표시합니다.", onRetry: () => loadYouTubeFeed(gameId, verified, expectedSelectionVersion) }); // 빈 결과 상태 표시
            return; // 빈 결과 처리 종료
        } // 대안 끝

        throw new Error("YOUTUBE_RESPONSE_INVALID"); // 잘못된 응답 발생
    } // 시도 끝
    catch (error) // API 오류 처리
    { // 오류 처리 시작
        if (isStaleYouTubeRequest(expectedSelectionVersion, selectionVersion, currentRequest, youtubeRequestVersion)) // 오래된 오류 확인
        { // 조건 시작
            return; // 오래된 오류 폐기
        } // 조건 끝

        if (state) // 상태 요소 확인
        { // 조건 시작
            state.textContent = "연결 확인 필요"; // 오류 상태 표시
        } // 조건 끝
        const message = error?.code === "DATA_TIMEOUT" ? "응답이 늦어 시연 콘텐츠를 유지합니다." : "YouTube 연결을 확인하지 못해 시연 콘텐츠를 유지합니다."; // 오류별 안내 문구
        stateController.show("error", { title: "YouTube 연결 확인 필요", message, onRetry: () => loadYouTubeFeed(gameId, verified, expectedSelectionVersion) }); // 오류 상태 표시
    } // 오류 처리 끝
} // 함수 끝

async function updateSelection(gameId, updateUrl = true) // 선택 화면 갱신
{ // 함수 시작
    const currentVersion = ++selectionVersion; // 현재 선택 번호
    youtubeRequestVersion += 1; // 이전 유튜브 요청 무효화
    const selectedId = resolveGameSelection(gameId); // 안전한 선택값 조회
    const selectedGame = COMMUNITY_GAMES.find((game) => game.id === selectedId); // 선택 게임 조회
    const filter = document.getElementById("game-filter"); // 게임 선택 상자 조회
    const hashtag = document.getElementById("active-hashtag"); // 해시태그 요소 조회
    const status = document.getElementById("community-status"); // 상태 안내 조회
    const feedStateController = createDataStateController(document.getElementById("youtube-feed-state")); // 유튜브 상태 제어기
    feedStateController.show("loading", { title: "선택 정보 확인 중", message: "선택한 게임의 콘텐츠 연결 상태를 확인하고 있습니다." }); // 이전 재시도 제거

    if (filter instanceof HTMLSelectElement) // 선택 상자 확인
    { // 조건 시작
        filter.value = selectedId; // 선택값 동기화
    } // 조건 끝

    if (hashtag) // 해시태그 요소 확인
    { // 조건 시작
        hashtag.textContent = selectedGame?.hashtag ?? "#PalettraGames"; // 안전한 해시태그 표시
    } // 조건 끝

    if (status) // 상태 안내 확인
    { // 조건 시작
        status.textContent = selectedGame ? `${selectedGame.label}의 시연 콘텐츠와 연동 상태를 표시하고 있습니다.` : "전체 프로젝트의 시연 콘텐츠를 표시하고 있습니다."; // 안전한 상태 표시
    } // 조건 끝

    if (updateUrl) // 주소 변경 확인
    { // 조건 시작
        window.history.replaceState({}, "", buildCommunityUrl(selectedId)); // 브라우저 주소 동기화
    } // 조건 끝

    renderDemoState(selectedId, ageVerified); // 시연 화면 우선 표시
    updateAgeVerificationLink(selectedId, ageVerified); // 성인 확인 링크 표시

    if (isAdultCommunityGame(selectedId)) // 성인 게임 선택 확인
    { // 조건 시작
        const verified = await getAgeVerificationStatus(); // 서버 인증 상태 조회
        if (currentVersion !== selectionVersion) // 선택 변경 확인
        { // 조건 시작
            return; // 이전 요청 종료
        } // 조건 끝
        ageVerified = verified; // 현재 인증 상태 저장
        renderDemoState(selectedId, ageVerified); // 인증별 시연 화면 갱신
        updateAgeVerificationLink(selectedId, ageVerified); // 인증 링크 갱신
        if (!ageVerified && status) // 미인증 상태 확인
        { // 조건 시작
            status.textContent = "선택한 성인 게임은 성인 확인 후 커뮤니티 콘텐츠를 볼 수 있습니다."; // 잠금 안내 표시
        } // 조건 끝
    } // 조건 끝

    await loadYouTubeFeed(selectedId, ageVerified, currentVersion); // 실제 유튜브 피드 확인
} // 함수 끝

function initializeCommunityPage() // 커뮤니티 화면 초기화
{ // 함수 시작
    const filter = document.getElementById("game-filter"); // 게임 선택 상자 조회
    const copyButton = document.querySelector("[data-copy-community-hashtag]"); // 해시태그 복사 버튼 조회
    const copyStatus = document.querySelector("[data-copy-community-status]"); // 복사 상태 요소 조회

    if (!(filter instanceof HTMLSelectElement)) // 선택 상자 누락 확인
    { // 조건 시작
        return; // 초기화 중단
    } // 조건 끝

    for (const game of COMMUNITY_GAMES) // 게임 목록 순회
    { // 반복 시작
        const option = document.createElement("option"); // 선택 항목 생성
        option.value = game.id; // 게임 식별자 연결
        option.textContent = game.label; // 안전한 게임 이름 삽입
        filter.append(option); // 선택 상자에 추가
    } // 반복 끝

    filter.addEventListener("change", () => // 선택 변경 처리
    { // 처리 시작
        void updateSelection(filter.value); // 화면 비동기 갱신
    }); // 처리 끝
    copyButton?.addEventListener("click", async () => // 해시태그 복사 처리
    { // 처리 시작
        const hashtag = document.getElementById("active-hashtag")?.textContent ?? ""; // 현재 해시태그 조회
        const copied = await copyCommunityHashtag(hashtag, navigator.clipboard); // 클립보드 복사 시도

        if (copyStatus) // 상태 요소 확인
        { // 조건 시작
            copyStatus.textContent = copied ? `${hashtag} 복사 완료` : "복사할 수 없습니다. 태그를 직접 선택해 주세요."; // 복사 결과 안내
        } // 조건 끝
    }); // 처리 끝
    const initialGame = new URLSearchParams(window.location.search).get("game") ?? "all"; // 초기 게임 주소 조회
    void updateSelection(initialGame, false); // 초기 화면 갱신
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    initializeCommunityPage(); // 커뮤니티 화면 실행
} // 조건 끝
