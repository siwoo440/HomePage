const AUTO_ADVANCE_MS = 7000; // 자동 전환 간격
const TRANSITION_MS = 550; // 화면 전환 시간

export function initializeHeroCarousel(root = document, options = {}) // 히어로 전환 초기화
{ // 함수 시작
    const carousel = root.querySelector?.("[data-hero-carousel]"); // 전환 영역 조회
    const track = root.querySelector?.("[data-hero-carousel-track]"); // 이동 트랙 조회
    const slides = [...(root.querySelectorAll?.("[data-hero-slide]") ?? [])]; // 슬라이드 목록 조회
    const previousButton = root.querySelector?.("[data-hero-carousel-previous]"); // 이전 버튼 조회
    const nextButton = root.querySelector?.("[data-hero-carousel-next]"); // 다음 버튼 조회
    const status = root.querySelector?.("[data-hero-carousel-status]"); // 상태 문구 조회
    const progress = root.querySelector?.("[data-hero-carousel-progress]"); // 진행 게이지 조회

    if (!carousel || !track || slides.length === 0 || !previousButton || !nextButton || !progress) // 필수 요소 확인
    { // 조건 시작
        return null; // 초기화 중단
    } // 조건 끝

    const setTimeoutFn = options.setTimeoutFn ?? ((callback, delay) => globalThis.setTimeout(callback, delay)); // 예약 등록 도구
    const clearTimeoutFn = options.clearTimeoutFn ?? ((timer) => globalThis.clearTimeout(timer)); // 예약 해제 도구
    const reduceMotion = options.reduceMotion ?? root.defaultView?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false; // 움직임 축소 설정
    let index = 0; // 현재 슬라이드 번호
    let automaticTimer = null; // 자동 전환 예약
    let cleanupTimer = null; // 전환 정리 예약
    let transitioning = false; // 전환 진행 상태

    function normalize(nextIndex) // 순환 번호 계산
    { // 함수 시작
        return ((Number(nextIndex) % slides.length) + slides.length) % slides.length; // 유효 번호 반환
    } // 함수 끝

    function updateStatus() // 현재 위치 갱신
    { // 함수 시작
        if (status) // 상태 문구 존재 확인
        { // 조건 시작
            status.textContent = `${index + 1} / ${slides.length}`; // 현재 위치 표시
        } // 조건 끝
    } // 함수 끝

    function resetProgress() // 진행 게이지 초기화
    { // 함수 시작
        progress.classList?.remove?.("is-running"); // 기존 움직임 제거
        void progress.offsetWidth; // 움직임 재시작 준비
        progress.style.animationDuration = `${AUTO_ADVANCE_MS}ms`; // 전체 시간 반영
        progress.style.animationPlayState = "running"; // 진행 상태 반영
        progress.classList?.add?.("is-running"); // 진행 움직임 시작
    } // 함수 끝

    function scheduleAutomaticAdvance() // 자동 전환 예약
    { // 함수 시작
        if (automaticTimer !== null) // 기존 예약 확인
        { // 조건 시작
            clearTimeoutFn(automaticTimer); // 기존 예약 해제
        } // 조건 끝

        resetProgress(); // 진행 게이지 동기화

        if (reduceMotion) // 움직임 축소 설정 확인
        { // 조건 시작
            automaticTimer = null; // 예약 상태 초기화
            return; // 예약 중단
        } // 조건 끝

        automaticTimer = setTimeoutFn(() => // 자동 전환 처리
        { // 처리 시작
            automaticTimer = null; // 완료 예약 초기화
            move(1, false); // 다음 화면 이동
            scheduleAutomaticAdvance(); // 다음 전환 예약
        }, AUTO_ADVANCE_MS); // 전체 시간 지정
    } // 함수 끝

    function setInitialSlide(nextIndex = 0) // 첫 화면 설정
    { // 함수 시작
        index = normalize(nextIndex); // 첫 번호 저장

        for (const [slideIndex, slide] of slides.entries()) // 슬라이드 반복
        { // 반복 시작
            const active = slideIndex === index; // 활성 상태 판정
            slide.inert = !active; // 비활성 화면 조작 차단
            slide.classList?.remove?.("is-entering-left", "is-entering-right", "is-exiting-left", "is-exiting-right"); // 전환 클래스 초기화
            slide.classList?.toggle?.("is-active", active); // 활성 클래스 반영
            slide.setAttribute?.("aria-hidden", String(!active)); // 접근성 상태 반영
        } // 반복 끝

        updateStatus(); // 현재 위치 표시
        return index; // 현재 번호 반환
    } // 함수 끝

    function move(direction, restartTimer = true) // 방향별 화면 이동
    { // 함수 시작
        if (transitioning || slides.length < 2) // 전환 가능 상태 확인
        { // 조건 시작
            return index; // 현재 번호 유지
        } // 조건 끝

        const outgoing = slides[index]; // 나가는 화면 조회
        const nextIndex = normalize(index + direction); // 다음 번호 계산
        const incoming = slides[nextIndex]; // 들어오는 화면 조회
        const enteringClass = direction > 0 ? "is-entering-right" : "is-entering-left"; // 진입 방향 선택
        const exitingClass = direction > 0 ? "is-exiting-left" : "is-exiting-right"; // 퇴장 방향 선택
        transitioning = true; // 전환 상태 시작
        incoming.classList?.remove?.("is-exiting-left", "is-exiting-right"); // 이전 퇴장 상태 제거
        incoming.classList?.add?.(enteringClass); // 진입 시작 위치 지정
        incoming.inert = false; // 새 화면 조작 허용
        incoming.setAttribute?.("aria-hidden", "false"); // 새 화면 공개
        void track.offsetWidth; // 시작 위치 렌더링
        outgoing.classList?.remove?.("is-active"); // 기존 활성 상태 제거
        outgoing.classList?.add?.(exitingClass); // 기존 화면 퇴장
        outgoing.inert = true; // 기존 화면 조작 차단
        outgoing.setAttribute?.("aria-hidden", "true"); // 기존 화면 숨김
        incoming.classList?.remove?.(enteringClass); // 진입 준비 상태 제거
        incoming.classList?.add?.("is-active"); // 새 화면 활성화
        index = nextIndex; // 현재 번호 갱신
        updateStatus(); // 현재 위치 갱신

        if (cleanupTimer !== null) // 기존 정리 예약 확인
        { // 조건 시작
            clearTimeoutFn(cleanupTimer); // 기존 정리 예약 해제
        } // 조건 끝

        cleanupTimer = setTimeoutFn(() => // 전환 정리 처리
        { // 처리 시작
            outgoing.classList?.remove?.("is-exiting-left", "is-exiting-right"); // 퇴장 클래스 제거
            cleanupTimer = null; // 정리 예약 초기화
            transitioning = false; // 전환 상태 종료
        }, TRANSITION_MS); // 전환 시간 지정

        if (restartTimer) // 수동 이동 확인
        { // 조건 시작
            scheduleAutomaticAdvance(); // 자동 전환 재예약
        } // 조건 끝

        return index; // 현재 번호 반환
    } // 함수 끝

    function show(nextIndex) // 번호 기준 화면 이동
    { // 함수 시작
        const normalizedIndex = normalize(nextIndex); // 목표 번호 계산

        if (normalizedIndex === index) // 동일 화면 확인
        { // 조건 시작
            return index; // 현재 번호 유지
        } // 조건 끝

        const direction = Number(nextIndex) < index ? -1 : 1; // 이동 방향 계산
        return move(direction); // 방향 전환 실행
    } // 함수 끝

    function next() // 다음 슬라이드 이동
    { // 함수 시작
        return move(1); // 오른쪽 화면 진입
    } // 함수 끝

    function previous() // 이전 슬라이드 이동
    { // 함수 시작
        return move(-1); // 왼쪽 화면 진입
    } // 함수 끝

    previousButton.addEventListener?.("click", previous); // 이전 버튼 처리기 연결
    nextButton.addEventListener?.("click", next); // 다음 버튼 처리기 연결
    carousel.addEventListener?.("keydown", (event) => // 키보드 이동 처리
    { // 처리 시작
        if (event.key === "ArrowLeft") // 왼쪽 방향키 확인
        { // 조건 시작
            event.preventDefault?.(); // 기본 이동 차단
            previous(); // 이전 화면 이동
        } // 조건 끝
        else if (event.key === "ArrowRight") // 오른쪽 방향키 확인
        { // 대안 시작
            event.preventDefault?.(); // 기본 이동 차단
            next(); // 다음 화면 이동
        } // 대안 끝
    }); // 처리 끝
    setInitialSlide(0); // 첫 화면 표시
    scheduleAutomaticAdvance(); // 첫 자동 전환 예약

    return Object.freeze( // 전환 제어기 반환
    { // 객체 시작
        get index() // 현재 번호 조회
        { // 조회 시작
            return index; // 현재 번호 반환
        }, // 조회 끝
        show, // 번호 이동 기능
        next, // 다음 이동 기능
        previous, // 이전 이동 기능
    }); // 객체 끝
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    initializeHeroCarousel(document); // 히어로 전환 실행
} // 조건 끝
