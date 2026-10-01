(function prepareLanguage() // 언어 선택 준비
{ // 함수 시작
    var root = document.documentElement; // 문서 루트
    root.dataset.i18nPage = "static"; // 번역 가능한 정적 페이지 표시
    try // 저장소 접근 시도
    { // 시도 시작
        var requested = new URLSearchParams(window.location.search).get("lang"); // 주소 요청 언어
        if (requested === "en" || requested === "ko") // 지원 언어 확인
        { // 조건 시작
            window.localStorage.setItem("devforge-language", requested); // 요청 언어 저장
        } // 조건 끝
        if (window.localStorage.getItem("devforge-language") !== "en") // 영어 선택 확인
        { // 조건 시작
            return; // 한국어 그대로 표시
        } // 조건 끝
    } // 시도 끝
    catch (error) // 저장소 차단 처리
    { // 예외 시작
        return; // 한국어 그대로 표시
    } // 예외 끝
    var style = document.createElement("style"); // 번역 전 가림 규칙
    style.textContent = "html.i18n-pending body{visibility:hidden}"; // 본문 잠시 숨김
    document.head.appendChild(style); // 규칙 연결
    root.classList.add("i18n-pending"); // 번역 대기 표시
    window.setTimeout(function revealPage() // 번역 지연 대비
    { // 함수 시작
        root.classList.remove("i18n-pending"); // 3초 뒤 강제 표시
    }, 3000); // 대기 시간 끝
})(); // 즉시 실행
