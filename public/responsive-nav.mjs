import { getSessionStorage, initializeMemberActions } from "./member-session.mjs"; // 회원 상태 표시 도구
import { getLanguageSwitchUrl, getPageType, isTranslatablePage, readStoredLanguage, resolveLanguage, saveLanguage, startPageTranslation } from "./i18n.mjs"; // 페이지 번역 도구

export const DRAWER_MAX_WIDTH = 959; // 서랍 최대 너비
export const COLOR_MODE_STORAGE_KEY = "devforge-color-mode"; // 색상 모드 저장 키

export const RESPONSIVE_NAV_ITEMS = Object.freeze( // 공통 메뉴 목록
[ // 목록 시작
    Object.freeze({ id: "home", label: "홈", href: "/main.html" }), // 홈 메뉴
    Object.freeze({ id: "games", label: "게임", href: "/main.html#games" }), // 게임 메뉴
    Object.freeze({ id: "goods", label: "굿즈", href: "/goods.html" }), // 굿즈 메뉴
    Object.freeze({ id: "news", label: "개발 뉴스", href: "/devlog.html" }), // 뉴스 메뉴
    Object.freeze({ id: "community", label: "커뮤니티", href: "/community.html" }), // 커뮤니티 메뉴
    Object.freeze({ id: "contact", label: "문의하기", href: "/contact.html" }), // 문의 메뉴
]); // 목록 끝

export function isDrawerViewport(width) // 서랍 화면 판정
{ // 함수 시작
    return Number.isFinite(width) && width <= DRAWER_MAX_WIDTH; // 화면 판정 반환
} // 함수 끝

export function getLoginUrl(pathname) // 로그인 주소 생성
{ // 함수 시작
    const safePath = typeof pathname === "string" && pathname.startsWith("/") && !pathname.startsWith("//") ? pathname : "/main.html"; // 안전 복귀 경로
    return "/login?returnTo=" + encodeURIComponent(safePath); // 로그인 주소 반환
} // 함수 끝

export function resolveColorMode(storedMode, prefersDark) // 색상 모드 결정
{ // 함수 시작
    if (storedMode === "light" || storedMode === "dark") // 저장 모드 확인
    { // 조건 시작
        return storedMode; // 저장 모드 반환
    } // 조건 끝

    return prefersDark ? "dark" : "light"; // 시스템 모드 반환
} // 함수 끝

function readStoredColorMode(view) // 저장 모드 조회
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        return view.localStorage?.getItem(COLOR_MODE_STORAGE_KEY) ?? null; // 저장 모드 반환
    } // 시도 끝
    catch // 저장소 차단 처리
    { // 예외 시작
        return null; // 기본 값 반환
    } // 예외 끝
} // 함수 끝

function saveColorMode(view, colorMode) // 색상 모드 저장
{ // 함수 시작
    try // 저장소 접근 시도
    { // 시도 시작
        view.localStorage?.setItem(COLOR_MODE_STORAGE_KEY, colorMode); // 색상 모드 기록
    } // 시도 끝
    catch // 저장소 차단 처리
    { // 예외 시작
        return; // 저장 생략
    } // 예외 끝
} // 함수 끝

function createElement(root, tagName, className, role) // 공통 요소 생성
{ // 함수 시작
    const element = root.createElement(tagName); // 새 요소 생성
    element.className = className; // 디자인 클래스 연결
    element.dataset.responsiveRole = role; // 테스트 역할 연결
    return element; // 새 요소 반환
} // 함수 끝

function createDrawerLink(root, item, currentPath, currentHash) // 메뉴 링크 생성
{ // 함수 시작
    const link = createElement(root, "a", "responsive-nav-link", "drawer-control"); // 링크 요소 생성
    link.href = item.href; // 이동 주소 설정
    link.textContent = item.label; // 메뉴 이름 설정
    link.dataset.navId = item.id; // 메뉴 식별자 설정
    const targetPath = item.href.split("#")[0]; // 대상 경로 분리
    const targetHash = item.href.includes("#") ? item.href.slice(item.href.indexOf("#")) : ""; // 대상 해시 분리
    const matchesPath = targetPath === currentPath; // 현재 경로 확인
    const matchesHash = targetHash ? targetHash === currentHash : !currentHash; // 현재 구역 확인

    if (matchesPath && matchesHash) // 현재 페이지 확인
    { // 조건 시작
        link.setAttribute("aria-current", "page"); // 현재 페이지 표시
    } // 조건 끝

    return link; // 메뉴 링크 반환
} // 함수 끝

function createLanguageButton(root, className, role, label, language) // 언어 전환 버튼 생성
{ // 함수 시작
    const button = createElement(root, "button", className, role); // 버튼 요소 생성
    button.type = "button"; // 버튼 형식 설정
    button.textContent = label; // 버튼 문구 설정
    button.lang = language === "en" ? "ko" : "en"; // 버튼 문구 언어
    button.dataset.i18nSkip = ""; // 번역 제외 표시
    button.setAttribute("translate", "no"); // 브라우저 번역 제외
    button.setAttribute("aria-label", language === "en" ? "한국어로 보기 (View in Korean)" : "영어로 보기 (View in English)"); // 접근성 이름 설정
    button.title = button.getAttribute("aria-label"); // 마우스 도움말 설정
    return button; // 버튼 반환
} // 함수 끝

function handleContactHash(root, view) // 이전 문의 주소 처리
{ // 함수 시작
    if (view.location?.pathname !== "/main.html" || view.location?.hash !== "#contact") // 이전 문의 주소 확인
    { // 조건 시작
        return; // 처리 종료
    } // 조건 끝

    view.location.replace?.("/contact.html"); // 문의하기 페이지 이동
} // 함수 끝

export function initializeResponsiveNavigation(root = document, view = window) // 반응형 메뉴 초기화
{ // 함수 시작
    const navRoot = root.querySelector("[data-responsive-nav-root]"); // 메뉴 기준 요소 조회

    if (!navRoot) // 기준 요소 누락 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝

    if (root.__devforgeResponsiveNav) // 기존 제어기 확인
    { // 조건 시작
        return root.__devforgeResponsiveNav; // 기존 제어기 반환
    } // 조건 끝

    const usesPlayfulLabTheme = root.body?.dataset.theme === "playful-lab" || root.documentElement?.dataset?.theme === "playful-lab"; // 공통 테마 확인
    const prefersDark = view.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true; // 시스템 다크 선호
    const headerColorMode = resolveColorMode(readStoredColorMode(view), prefersDark); // 공통 헤더 색상 모드
    let colorMode = usesPlayfulLabTheme ? headerColorMode : null; // 초기 색상 모드

    if (root.documentElement?.dataset) // 문서 루트 확인
    { // 조건 시작
        root.documentElement.dataset.colorMode = headerColorMode; // 공통 헤더 모드 적용
    } // 조건 끝

    if (colorMode) // 색상 모드 확인
    { // 조건 시작
        root.body.dataset.colorMode = colorMode; // 본문 모드 적용
    } // 조건 끝

    const toggle = createElement(root, "button", "responsive-nav-toggle", "toggle"); // 메뉴 버튼 생성
    toggle.type = "button"; // 버튼 형식 설정
    toggle.textContent = "사이트 메뉴"; // 버튼 문구 설정
    toggle.setAttribute("aria-controls", "responsive-site-drawer"); // 제어 대상 연결
    toggle.setAttribute("aria-expanded", "false"); // 닫힘 상태 설정
    toggle.setAttribute("aria-label", "전체 메뉴 열기"); // 접근성 이름 설정

    const overlay = createElement(root, "button", "responsive-nav-overlay", "overlay"); // 배경 버튼 생성
    overlay.type = "button"; // 버튼 형식 설정
    overlay.hidden = true; // 배경 기본 숨김
    overlay.setAttribute("aria-label", "메뉴 닫기"); // 접근성 이름 설정

    const drawer = createElement(root, "aside", "responsive-nav-drawer", "drawer"); // 메뉴 패널 생성
    drawer.id = "responsive-site-drawer"; // 메뉴 패널 식별자 설정
    drawer.hidden = true; // 메뉴 기본 숨김
    drawer.setAttribute("aria-hidden", "true"); // 접근성 숨김 설정
    drawer.setAttribute("aria-label", "전체 메뉴"); // 접근성 이름 설정

    const drawerHeader = createElement(root, "div", "responsive-nav-drawer-header", "drawer-header"); // 패널 머리 생성
    const drawerTitle = createElement(root, "strong", "responsive-nav-drawer-title", "drawer-title"); // 패널 제목 생성
    drawerTitle.textContent = "DEVFORGE"; // 브랜드 이름 설정
    const closeButton = createElement(root, "button", "responsive-nav-close", "drawer-control"); // 닫기 버튼 생성
    closeButton.type = "button"; // 버튼 형식 설정
    closeButton.textContent = "닫기"; // 닫기 문구 설정
    closeButton.setAttribute("aria-label", "전체 메뉴 닫기"); // 접근성 이름 설정
    drawerHeader.append(drawerTitle, closeButton); // 패널 머리 연결

    const drawerLinks = createElement(root, "nav", "responsive-nav-links", "drawer-links"); // 패널 링크 영역 생성
    const controls = [closeButton]; // 초점 요소 목록 생성

    for (const item of RESPONSIVE_NAV_ITEMS) // 메뉴 항목 반복
    { // 반복 시작
        const link = createDrawerLink(root, item, view.location?.pathname ?? "/main.html", view.location?.hash ?? ""); // 메뉴 링크 생성
        drawerLinks.append(link); // 링크 영역 연결
        controls.push(link); // 초점 목록 연결
    } // 반복 끝

    let themeToggle = null; // 테마 버튼 초기화

    if (usesPlayfulLabTheme) // 공통 테마 확인
    { // 조건 시작
        themeToggle = createElement(root, "button", "responsive-nav-theme-toggle", "theme-toggle"); // 테마 버튼 생성
        themeToggle.type = "button"; // 버튼 형식 설정
        drawerLinks.append(themeToggle); // 테마 버튼 연결
        controls.push(themeToggle); // 초점 목록 연결
    } // 조건 끝

    const language = resolveLanguage(view.location?.search, readStoredLanguage(view)); // 현재 언어
    let languageToggle = null; // 서랍 언어 버튼

    if (isTranslatablePage(root)) // 번역 가능 페이지 확인
    { // 조건 시작
        languageToggle = createLanguageButton(root, "responsive-nav-language-toggle", "language-toggle", language === "en" ? "한국어" : "English", language); // 서랍 언어 버튼 생성
        drawerLinks.append(languageToggle); // 언어 버튼 연결
        controls.push(languageToggle); // 초점 목록 연결
    } // 조건 끝

    const loginLink = createElement(root, "a", "responsive-nav-login", "drawer-control"); // 로그인 링크 생성
    loginLink.href = getLoginUrl(view.location?.pathname); // 로그인 주소 설정
    loginLink.textContent = "로그인"; // 로그인 문구 설정
    loginLink.dataset.memberAction = "login"; // 회원 동작 표시
    drawerLinks.append(loginLink); // 로그인 링크 연결
    controls.push(loginLink); // 초점 목록 연결
    drawer.append(drawerHeader, drawerLinks); // 패널 내용 연결
    const toggleHost = navRoot.querySelector(".nav-actions") ?? navRoot; // 헤더 조작 묶음 조회
    toggleHost.append(toggle); // 로그인 오른쪽에 메뉴 버튼 연결
    let headerThemeToggle = null; // 넓은 화면 테마 버튼

    if (usesPlayfulLabTheme) // 공통 테마 확인
    { // 조건 시작
        headerThemeToggle = createElement(root, "button", "site-theme-toggle", "header-theme-toggle"); // 헤더 테마 버튼 생성
        headerThemeToggle.type = "button"; // 버튼 형식 설정
        const memberAction = toggleHost.querySelector?.("[data-member-action]") ?? null; // 로그인 버튼 조회
        if (memberAction && typeof toggleHost.insertBefore === "function") // 앞쪽 삽입 가능 확인
        { // 조건 시작
            toggleHost.insertBefore(headerThemeToggle, memberAction); // 로그인 앞에 연결
        } // 조건 끝
        else // 삽입 불가 처리
        { // 대안 시작
            toggleHost.append(headerThemeToggle); // 끝에 연결
        } // 대안 끝
    } // 조건 끝
    let headerLanguageToggle = null; // 넓은 화면 언어 버튼

    if (languageToggle) // 언어 전환 사용 확인
    { // 조건 시작
        headerLanguageToggle = createLanguageButton(root, "site-language-toggle", "header-language-toggle", language === "en" ? "KO" : "EN", language); // 헤더 언어 버튼 생성
        const anchor = headerThemeToggle ?? toggleHost.querySelector?.("[data-member-action]") ?? null; // 앞쪽 기준 버튼
        if (anchor && typeof toggleHost.insertBefore === "function") // 앞쪽 삽입 가능 확인
        { // 조건 시작
            toggleHost.insertBefore(headerLanguageToggle, anchor); // 테마·로그인 앞에 연결
        } // 조건 끝
        else // 삽입 불가 처리
        { // 대안 시작
            toggleHost.append(headerLanguageToggle); // 끝에 연결
        } // 대안 끝
    } // 조건 끝
    root.body.append(overlay, drawer); // 본문에 메뉴 요소 연결

    function open() // 메뉴 열기
    { // 함수 시작
        if (!isDrawerViewport(view.innerWidth)) // 화면 구간 확인
        { // 조건 시작
            return; // 열기 중단
        } // 조건 끝

        drawer.hidden = false; // 패널 표시
        overlay.hidden = false; // 배경 표시
        drawer.setAttribute("aria-hidden", "false"); // 접근성 표시
        toggle.setAttribute("aria-expanded", "true"); // 버튼 열림 표시
        toggle.setAttribute("aria-label", "전체 메뉴 닫기"); // 버튼 이름 변경
        root.body.classList.add("responsive-nav-open"); // 본문 스크롤 잠금
        controls[0]?.focus(); // 첫 요소 초점
    } // 함수 끝

    function close(restoreFocus = true) // 메뉴 닫기
    { // 함수 시작
        drawer.hidden = true; // 패널 숨김
        overlay.hidden = true; // 배경 숨김
        drawer.setAttribute("aria-hidden", "true"); // 접근성 숨김
        toggle.setAttribute("aria-expanded", "false"); // 버튼 닫힘 표시
        toggle.setAttribute("aria-label", "전체 메뉴 열기"); // 버튼 이름 복원
        root.body.classList.remove("responsive-nav-open"); // 본문 스크롤 잠금 해제

        if (restoreFocus) // 초점 복원 확인
        { // 조건 시작
            toggle.focus(); // 메뉴 버튼 초점
        } // 조건 끝
    } // 함수 끝

    function onToggleClick() // 메뉴 버튼 처리
    { // 함수 시작
        if (drawer.hidden) // 닫힘 상태 확인
        { // 조건 시작
            open(); // 메뉴 열기
            return; // 처리 종료
        } // 조건 끝

        close(); // 메뉴 닫기
    } // 함수 끝

    function updateThemeToggle() // 테마 버튼 갱신
    { // 함수 시작
        if (!themeToggle || !colorMode) // 테마 버튼 확인
        { // 조건 시작
            return; // 갱신 생략
        } // 조건 끝

        const isDark = colorMode === "dark"; // 다크 상태 확인
        themeToggle.textContent = isDark ? "다크 모드 끄기" : "다크 모드 켜기"; // 버튼 문구 설정
        themeToggle.setAttribute("aria-pressed", String(isDark)); // 버튼 상태 설정
        themeToggle.setAttribute("aria-label", themeToggle.textContent); // 접근성 이름 설정

        if (headerThemeToggle) // 헤더 테마 버튼 확인
        { // 조건 시작
            headerThemeToggle.textContent = isDark ? "☀" : "☾"; // 다음 모드 아이콘
            headerThemeToggle.setAttribute("aria-pressed", String(isDark)); // 버튼 상태 설정
            headerThemeToggle.setAttribute("aria-label", themeToggle.textContent); // 접근성 이름 설정
            headerThemeToggle.title = themeToggle.textContent; // 마우스 도움말 설정
        } // 조건 끝
    } // 함수 끝

    function onThemeToggleClick() // 테마 버튼 처리
    { // 함수 시작
        if (!themeToggle || !colorMode) // 테마 상태 확인
        { // 조건 시작
            return; // 전환 생략
        } // 조건 끝

        colorMode = colorMode === "dark" ? "light" : "dark"; // 색상 모드 전환
        root.body.dataset.colorMode = colorMode; // 본문 모드 적용
        if (root.documentElement?.dataset) // 문서 루트 확인
        { // 조건 시작
            root.documentElement.dataset.colorMode = colorMode; // 문서 루트 모드 적용
        } // 조건 끝
        saveColorMode(view, colorMode); // 선택 모드 저장
        updateThemeToggle(); // 버튼 상태 갱신
    } // 함수 끝

    function onLanguageToggleClick() // 언어 버튼 처리
    { // 함수 시작
        saveLanguage(view, language === "en" ? "ko" : "en"); // 반대 언어 저장
        const target = getLanguageSwitchUrl(view.location.href); // 이동 주소
        if (target === view.location.href) // 같은 주소 확인
        { // 조건 시작
            view.location.reload(); // 새 언어로 다시 열기
            return; // 처리 종료
        } // 조건 끝
        view.location.replace(target); // 언어 요청 없는 주소로 이동
    } // 함수 끝

    function onKeyDown(event) // 키 입력 처리
    { // 함수 시작
        if (drawer.hidden) // 메뉴 닫힘 확인
        { // 조건 시작
            return; // 처리 종료
        } // 조건 끝

        if (event.key === "Escape") // 닫기 키 확인
        { // 조건 시작
            event.preventDefault(); // 기본 동작 차단
            close(); // 메뉴 닫기
            return; // 처리 종료
        } // 조건 끝

        if (event.key !== "Tab") // 이동 키 확인
        { // 조건 시작
            return; // 처리 종료
        } // 조건 끝

        const first = controls[0]; // 첫 초점 요소
        const last = controls.at(-1); // 마지막 초점 요소

        if (!event.shiftKey && root.activeElement === last) // 정방향 끝 확인
        { // 조건 시작
            event.preventDefault(); // 기본 이동 차단
            first.focus(); // 첫 요소 초점
        } // 조건 끝
        else if (event.shiftKey && root.activeElement === first) // 역방향 끝 확인
        { // 조건 시작
            event.preventDefault(); // 기본 이동 차단
            last.focus(); // 마지막 요소 초점
        } // 조건 끝
    } // 함수 끝

    function onResize() // 화면 변경 처리
    { // 함수 시작
        if (!isDrawerViewport(view.innerWidth)) // 넓은 화면 확인
        { // 조건 시작
            close(false); // 메뉴 상태 초기화
        } // 조건 끝
    } // 함수 끝

    function onDrawerLinkClick() // 링크 선택 처리
    { // 함수 시작
        close(false); // 메뉴 닫기
    } // 함수 끝

    function destroy() // 메뉴 해제
    { // 함수 시작
        toggle.removeEventListener("click", onToggleClick); // 메뉴 처리기 해제
        closeButton.removeEventListener("click", close); // 닫기 처리기 해제
        overlay.removeEventListener("click", close); // 배경 처리기 해제
        controls.slice(1).filter((control) => control !== themeToggle && control !== languageToggle).forEach((control) => control.removeEventListener("click", onDrawerLinkClick)); // 링크 처리기 해제
        languageToggle?.removeEventListener("click", onLanguageToggleClick); // 언어 처리기 해제
        headerLanguageToggle?.removeEventListener("click", onLanguageToggleClick); // 헤더 언어 처리기 해제
        headerLanguageToggle?.remove(); // 헤더 언어 버튼 제거
        themeToggle?.removeEventListener("click", onThemeToggleClick); // 테마 처리기 해제
        headerThemeToggle?.removeEventListener("click", onThemeToggleClick); // 헤더 테마 처리기 해제
        headerThemeToggle?.remove(); // 헤더 테마 버튼 제거
        root.removeEventListener("keydown", onKeyDown); // 키 처리기 해제
        view.removeEventListener("resize", onResize); // 크기 처리기 해제
        root.body.classList.remove("responsive-nav-open"); // 본문 상태 정리
        toggle.remove(); // 메뉴 버튼 제거
        overlay.remove(); // 배경 제거
        drawer.remove(); // 메뉴 패널 제거
        root.__devforgeResponsiveNav = null; // 제어기 연결 해제
    } // 함수 끝

    toggle.addEventListener("click", onToggleClick); // 메뉴 처리기 등록
    closeButton.addEventListener("click", close); // 닫기 처리기 등록
    overlay.addEventListener("click", close); // 배경 처리기 등록
    controls.slice(1).filter((control) => control !== themeToggle && control !== languageToggle).forEach((control) => control.addEventListener("click", onDrawerLinkClick)); // 링크 처리기 등록
    languageToggle?.addEventListener("click", onLanguageToggleClick); // 언어 처리기 등록
    headerLanguageToggle?.addEventListener("click", onLanguageToggleClick); // 헤더 언어 처리기 등록
    themeToggle?.addEventListener("click", onThemeToggleClick); // 테마 처리기 등록
    headerThemeToggle?.addEventListener("click", onThemeToggleClick); // 헤더 테마 처리기 등록
    root.addEventListener("keydown", onKeyDown); // 키 처리기 등록
    view.addEventListener("resize", onResize); // 크기 처리기 등록
    updateThemeToggle(); // 테마 버튼 초기화
    initializeMemberActions(root, view.location, getSessionStorage(view)); // 헤더·서랍 회원 상태 반영
    const controller = Object.freeze({ open, close, destroy }); // 제어기 생성
    root.__devforgeResponsiveNav = controller; // 제어기 저장
    handleContactHash(root, view); // 문의 해시 처리
    return controller; // 제어기 반환
} // 함수 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    window.__devforgeResponsiveNavInit = initializeResponsiveNavigation; // 화면 전환형 페이지 재연결 함수
    if (getPageType(document) === "static") // 정적 페이지 확인(Next 화면은 연결 뒤 React가 시작)
    { // 조건 시작
        void startPageTranslation(document, window); // 선택 언어로 페이지 번역
    } // 조건 끝
    if (document.readyState === "loading") // 문서 준비 상태 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeResponsiveNavigation(document, window), { once: true }); // 준비 후 초기화
    } // 조건 끝
    else // 준비 완료 확인
    { // 대안 시작
        initializeResponsiveNavigation(document, window); // 즉시 초기화
    } // 대안 끝
} // 조건 끝
