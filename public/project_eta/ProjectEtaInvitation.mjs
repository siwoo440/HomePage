export const INVITATION_SEEN_KEY = "etaInvitationSeen"; // 세션 방문 기록 이름

export function shouldPlayInvitation(search = "", seenValue = null) // 초대장 재생 여부 판단
{ // 판단 시작
    const parameters = new URLSearchParams(search); // 주소 옵션 해석
    const forceReplay = parameters.get("intro") === "1"; // 강제 재생 옵션 확인
    return forceReplay || seenValue !== "true"; // 재생 여부 반환
} // 판단 끝

function readSeenValue(storage) // 방문 기록 안전 조회
{ // 조회 시작
    try // 저장소 접근 시도
    { // 접근 시작
        return storage?.getItem(INVITATION_SEEN_KEY) ?? null; // 방문 기록 반환
    } // 접근 끝
    catch // 저장소 접근 실패 처리
    { // 실패 시작
        return null; // 첫 방문 처리
    } // 실패 끝
} // 조회 끝

function saveSeenValue(storage) // 방문 기록 안전 저장
{ // 저장 시작
    try // 저장소 접근 시도
    { // 접근 시작
        storage?.setItem(INVITATION_SEEN_KEY, "true"); // 방문 완료 기록
    } // 접근 끝
    catch // 저장소 접근 실패 처리
    { // 실패 시작
        return; // 화면 진행 유지
    } // 실패 끝
} // 저장 끝

function finishInvitation(overlay, storage, letterButton) // 초대장 화면 종료
{ // 종료 시작
    saveSeenValue(storage); // 방문 완료 저장
    overlay.classList.add("is-finished"); // 종료 전환 적용
    window.setTimeout(() => // 전환 완료 대기
    { // 대기 시작
        overlay.hidden = true; // 초대장 화면 숨김
        overlay.classList.remove("is-ready", "is-opening", "is-revealing", "is-finished"); // 연출 상태 초기화
        document.body.classList.remove("intro-active"); // 본문 스크롤 복구
        letterButton.disabled = false; // 편지 버튼 복구
    }, 360); // 종료 전환 시간
} // 종료 끝

export function initializeInvitation(root = document, storage = window.sessionStorage, locationValue = window.location) // 초대장 연출 초기화
{ // 초기화 시작
    const overlay = root.querySelector("#invitation-intro"); // 초대장 화면 조회
    const letterButton = root.querySelector("#invitation-letter"); // 편지 버튼 조회
    const skipButton = root.querySelector("#invitation-skip"); // 건너뛰기 버튼 조회

    if (!overlay || !letterButton || !skipButton) // 필수 요소 확인
    { // 누락 처리 시작
        return; // 초기화 중단
    } // 누락 처리 끝

    const seenValue = readSeenValue(storage); // 방문 기록 조회
    const search = locationValue?.search ?? ""; // 현재 주소 옵션 조회

    if (!shouldPlayInvitation(search, seenValue)) // 재생 생략 확인
    { // 생략 처리 시작
        overlay.hidden = true; // 초대장 화면 숨김
        return; // 초기화 종료
    } // 생략 처리 끝

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false; // 동작 감소 설정 확인
    const revealDelay = reducedMotion ? 120 : 560; // 조명 전환 대기 시간
    const finishDelay = reducedMotion ? 420 : 1760; // 화면 종료 대기 시간
    let openingStarted = false; // 중복 클릭 방지 상태

    overlay.hidden = false; // 초대장 화면 표시
    document.body.classList.add("intro-active"); // 본문 스크롤 잠금
    window.requestAnimationFrame(() => // 첫 화면 그리기 대기
    { // 대기 시작
        overlay.classList.add("is-ready"); // 편지 낙하 시작
    }); // 대기 끝

    const openInvitation = () => // 편지 열기 처리
    { // 열기 시작
        if (openingStarted) // 중복 실행 확인
        { // 중복 처리 시작
            return; // 추가 실행 차단
        } // 중복 처리 끝

        openingStarted = true; // 열기 상태 기록
        letterButton.disabled = true; // 추가 클릭 차단
        overlay.classList.add("is-opening"); // 봉투 개봉 연출
        window.setTimeout(() => // 조명 전환 대기
        { // 대기 시작
            overlay.classList.add("is-revealing"); // 방 조명 연출
        }, revealDelay); // 조명 전환 시간
        window.setTimeout(() => // 화면 종료 대기
        { // 대기 시작
            finishInvitation(overlay, storage, letterButton); // 본문 화면 전환
        }, finishDelay); // 전체 연출 시간
    }; // 열기 처리 끝

    letterButton.addEventListener("click", openInvitation); // 편지 클릭 연결
    skipButton.addEventListener("click", () => // 건너뛰기 연결
    { // 건너뛰기 시작
        openingStarted = true; // 열기 상태 종료
        finishInvitation(overlay, storage, letterButton); // 즉시 본문 전환
    }); // 건너뛰기 끝
} // 초기화 끝

if (typeof document !== "undefined" && typeof window !== "undefined") // 브라우저 환경 확인
{ // 자동 실행 시작
    initializeInvitation(); // 초대장 연출 연결
} // 자동 실행 끝
