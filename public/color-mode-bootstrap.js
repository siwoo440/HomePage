(function initializeColorMode() // 색상 모드 초기화
{ // 함수 시작
    const storageKey = "devforge-color-mode"; // 저장 키
    let storedMode = null; // 저장 모드 초기값
    let prefersDark = false; // 시스템 다크 초기값

    try // 저장소 조회 시도
    { // 시도 시작
        storedMode = window.localStorage?.getItem(storageKey) ?? null; // 저장 모드 조회
    } // 시도 끝
    catch // 저장소 오류 처리
    { // 예외 시작
        storedMode = null; // 저장 모드 초기화
    } // 예외 끝

    try // 시스템 설정 조회 시도
    { // 시도 시작
        prefersDark = typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches === true; // 시스템 다크 확인
    } // 시도 끝
    catch // 시스템 설정 오류 처리
    { // 예외 시작
        prefersDark = false; // 밝은 모드 대체
    } // 예외 끝

    const colorMode = storedMode === "light" || storedMode === "dark" ? storedMode : prefersDark ? "dark" : "light"; // 최종 모드 결정
    document.documentElement.dataset.colorMode = colorMode; // 문서 루트 모드 적용
}()); // 즉시 실행 끝
