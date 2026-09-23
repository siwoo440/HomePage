const TAG_LABELS = // 태그 표시 이름 시작
{ // 태그 표시 이름 객체
    update: "업데이트", // 업데이트 이름
    feature: "신기능", // 신기능 이름
    devlog: "데브로그", // 데브로그 이름
    fix: "버그픽스", // 버그픽스 이름
}; // 태그 표시 이름 끝

export function matchesNewsFilter(tags, selectedFilter) // 태그 일치 판정
{ // 판정 함수 시작
    return selectedFilter === "all" || tags.includes(selectedFilter); // 전체 또는 포함 태그 판정
} // 판정 함수 끝

export function shouldUseRemotePosts(response) // 원격 게시물 사용 판정
{ // 판정 함수 시작
    return response?.configured === true && Array.isArray(response.posts) && response.posts.length > 0; // 정상 원격 목록 확인
} // 판정 함수 끝

function readNewsTags(newsRow) // 뉴스 태그 읽기
{ // 읽기 함수 시작
    return (newsRow.dataset.tags ?? "").split(" ").filter(Boolean); // 공백 기준 태그 목록
} // 읽기 함수 끝

function formatPublishedDate(value) // 공개 날짜 표시
{ // 함수 시작
    const date = new Date(value); // 공개 날짜 객체

    if (Number.isNaN(date.getTime())) // 잘못된 날짜 확인
    { // 조건 시작
        return { year: "----", day: "--.--" }; // 빈 날짜 표시
    } // 조건 끝

    const year = String(date.getFullYear()); // 공개 연도
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 공개 월
    const day = String(date.getDate()).padStart(2, "0"); // 공개 일
    return { year, day: `${month}.${day}` }; // 날짜 표시 반환
} // 함수 끝

function createTextElement(tagName, className, text) // 글자 요소 생성
{ // 함수 시작
    const element = document.createElement(tagName); // 새 요소 생성
    element.className = className; // 요소 클래스 지정
    element.textContent = text; // 안전한 글자 지정
    return element; // 글자 요소 반환
} // 함수 끝

function createNewsRow(post, index) // 원격 뉴스 행 생성
{ // 함수 시작
    const row = document.createElement("a"); // 뉴스 링크 생성
    row.className = "news-row news-row-link"; // 뉴스 행 클래스
    row.href = `/news/${encodeURIComponent(post.id)}`; // 뉴스 상세 주소
    row.dataset.tags = Array.isArray(post.tags) ? post.tags.join(" ") : ""; // 필터 태그 저장
    const dateValue = formatPublishedDate(post.published_at); // 공개 날짜 표시
    const date = document.createElement("div"); // 날짜 영역 생성
    date.className = "news-date"; // 날짜 영역 클래스
    date.append(createTextElement("span", "", dateValue.year)); // 공개 연도 추가
    date.append(createTextElement("strong", "", dateValue.day)); // 공개 월일 추가
    const content = document.createElement("div"); // 뉴스 내용 생성
    content.className = "news-content"; // 뉴스 내용 클래스
    const tags = document.createElement("div"); // 태그 영역 생성
    tags.className = "news-tags"; // 태그 영역 클래스

    for (const tag of post.tags ?? []) // 게시물 태그 반복
    { // 반복 시작
        const label = TAG_LABELS[tag]; // 태그 표시 이름

        if (label) // 허용 태그 확인
        { // 조건 시작
            tags.append(createTextElement("span", `news-tag tag-${tag}`, label)); // 태그 표시 추가
        } // 조건 끝
    } // 반복 끝

    content.append(tags); // 태그 영역 추가
    content.append(createTextElement("h2", "", String(post.title ?? "제목 없는 뉴스"))); // 뉴스 제목 추가
    content.append(createTextElement("p", "", String(post.summary ?? ""))); // 뉴스 요약 추가
    row.append(date); // 날짜 영역 추가
    row.append(content); // 내용 영역 추가
    row.append(createTextElement("span", "news-index", String(index + 1).padStart(2, "0"))); // 뉴스 순번 추가
    return row; // 뉴스 행 반환
} // 함수 끝

function initializeDevelopmentNews() // 개발 뉴스 초기화
{ // 초기화 함수 시작
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]")); // 필터 버튼 목록
    const newsList = document.querySelector(".news-list"); // 뉴스 목록 영역
    const resultCount = document.querySelector("#result-count"); // 결과 개수 영역
    const emptyState = document.querySelector("#empty-state"); // 빈 결과 영역
    const loadStatus = document.querySelector("#news-load-status"); // 원격 조회 상태
    let selectedFilter = "all"; // 현재 선택 필터

    function applyNewsFilter(nextFilter) // 선택 필터 적용
    { // 적용 함수 시작
        selectedFilter = nextFilter; // 현재 필터 갱신
        const newsRows = Array.from(document.querySelectorAll(".news-row")); // 현재 뉴스 카드 목록
        let visibleCount = 0; // 표시 뉴스 개수

        for (const newsRow of newsRows) // 뉴스 카드 반복
        { // 카드 반복 시작
            const isVisible = matchesNewsFilter(readNewsTags(newsRow), selectedFilter); // 카드 표시 여부
            newsRow.hidden = !isVisible; // 카드 숨김 상태
            visibleCount += isVisible ? 1 : 0; // 표시 개수 누적
        } // 카드 반복 끝

        for (const filterButton of filterButtons) // 필터 버튼 반복
        { // 버튼 반복 시작
            const isSelected = filterButton.dataset.filter === selectedFilter; // 현재 버튼 선택 여부
            filterButton.classList.toggle("active", isSelected); // 활성 클래스 전환
            filterButton.setAttribute("aria-pressed", String(isSelected)); // 접근성 선택 상태
        } // 버튼 반복 끝

        if (resultCount) // 결과 개수 영역 확인
        { // 결과 개수 갱신 시작
            resultCount.textContent = `${visibleCount}개의 뉴스`; // 결과 개수 문구
        } // 결과 개수 갱신 끝

        if (emptyState) // 빈 결과 영역 확인
        { // 빈 결과 갱신 시작
            emptyState.hidden = visibleCount !== 0; // 결과 존재 여부 반영
        } // 빈 결과 갱신 끝
    } // 적용 함수 끝

    for (const filterButton of filterButtons) // 필터 버튼 이벤트 반복
    { // 이벤트 반복 시작
        filterButton.addEventListener("click", () => // 클릭 이벤트 등록
        { // 클릭 처리 시작
            applyNewsFilter(filterButton.dataset.filter ?? "all"); // 선택 필터 적용
        }); // 클릭 처리 끝
    } // 이벤트 반복 끝

    applyNewsFilter("all"); // 전체 뉴스 초기 표시

    if (!newsList) // 뉴스 목록 없음 확인
    { // 조건 시작
        return; // 원격 조회 종료
    } // 조건 끝

    fetch("/api/news", { headers: { Accept: "application/json" } }) // 공개 뉴스 조회
        .then((response) => // 응답 처리 시작
        { // 응답 처리 함수 시작
            if (!response.ok) // 응답 실패 확인
            { // 조건 시작
                throw new Error("NEWS_REQUEST_FAILED"); // 조회 실패 발생
            } // 조건 끝

            return response.json(); // JSON 응답 읽기
        }) // 응답 처리 끝
        .then((response) => // 게시물 처리 시작
        { // 게시물 처리 함수 시작
            if (!shouldUseRemotePosts(response)) // 원격 목록 사용 여부 확인
            { // 조건 시작
                return; // 기존 임시 뉴스 유지
            } // 조건 끝

            const fragment = document.createDocumentFragment(); // 뉴스 조각 생성
            response.posts.forEach((post, index) => fragment.append(createNewsRow(post, index))); // 원격 뉴스 행 추가
            newsList.replaceChildren(fragment); // 기존 뉴스 목록 교체
            applyNewsFilter(selectedFilter); // 현재 필터 재적용

            if (loadStatus) // 조회 상태 영역 확인
            { // 조건 시작
                loadStatus.textContent = "최신 등록 뉴스를 표시하고 있습니다."; // 최신 뉴스 안내
            } // 조건 끝
        }) // 게시물 처리 끝
        .catch(() => // 조회 오류 처리 시작
        { // 오류 처리 함수 시작
            if (loadStatus) // 조회 상태 영역 확인
            { // 조건 시작
                loadStatus.textContent = "등록 서버에 연결되지 않아 임시 뉴스를 표시합니다."; // 임시 뉴스 안내
            } // 조건 끝
        }); // 조회 오류 처리 끝
} // 초기화 함수 끝

function initializeContactDialog() // 문의 창 초기화
{ // 초기화 함수 시작
    const openButton = document.querySelector("#contact-open"); // 문의 열기 버튼
    const dialog = document.querySelector("#contact-dialog"); // 문의 대화상자

    if (!openButton || !dialog) // 필수 요소 확인
    { // 조건 시작
        return; // 초기화 종료
    } // 조건 끝

    openButton.addEventListener("click", () => // 열기 이벤트 등록
    { // 클릭 처리 시작
        if (typeof dialog.showModal === "function") // 대화상자 지원 확인
        { // 조건 시작
            dialog.showModal(); // 대화상자 열기
            return; // 열기 처리 종료
        } // 조건 끝

        dialog.setAttribute("open", ""); // 구형 브라우저 열기
    }); // 클릭 처리 끝
} // 초기화 함수 끝

if (typeof document !== "undefined") // 브라우저 문서 환경 확인
{ // 브라우저 실행 시작
    initializeDevelopmentNews(); // 개발 뉴스 기능 시작
    initializeContactDialog(); // 문의 창 기능 시작
} // 브라우저 실행 끝
