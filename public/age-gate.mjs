const LOCKED_IMAGE_PATH = "images/games/age-restricted.svg"; // 잠금 이미지 경로
const LOCKED_IMAGE_ALT = "성인 확인이 필요한 게임"; // 잠금 이미지 설명

export async function getAgeVerificationStatus(fetcher = fetch) // 인증 상태 조회
{ // 함수 시작
    try // 상태 요청 시도
    { // 시도 시작
        const response = await fetcher("/api/age/status", { cache: "no-store", credentials: "same-origin" }); // 인증 상태 요청
        if (!response.ok) // 응답 실패 확인
        { // 조건 시작
            return false; // 잠금 상태 반환
        } // 조건 끝
        const result = await response.json(); // 응답 본문 읽기
        return result?.verified === true; // 인증 여부 반환
    } // 시도 끝
    catch // 상태 요청 실패
    { // 오류 처리 시작
        return false; // 잠금 상태 반환
    } // 오류 처리 끝
} // 함수 끝

export function applyAdultVisibility(verified, root = document) // 성인 카드 표시 적용
{ // 함수 시작
    const cards = root.querySelectorAll("[data-adult-game]"); // 성인 카드 목록
    cards.forEach((card) => // 카드 순회 시작
    { // 반복 시작
        const image = card.querySelector("img[data-adult-image]"); // 보호 이미지 찾기
        if (!image) // 이미지 누락 확인
        { // 조건 시작
            return; // 현재 카드 종료
        } // 조건 끝
        if (verified) // 인증 상태 확인
        { // 조건 시작
            const adultImage = image.getAttribute("data-adult-image"); // 원본 주소 읽기
            const adultAlt = image.getAttribute("data-adult-alt"); // 원본 설명 읽기
            if (adultImage) // 원본 주소 확인
            { // 조건 시작
                image.setAttribute("src", adultImage); // 원본 이미지 요청
            } // 조건 끝
            if (adultAlt) // 원본 설명 확인
            { // 조건 시작
                image.setAttribute("alt", adultAlt); // 원본 설명 적용
            } // 조건 끝
            card.classList.remove("is-age-locked"); // 잠금 표시 제거
            return; // 현재 카드 종료
        } // 조건 끝
        image.setAttribute("src", LOCKED_IMAGE_PATH); // 모자이크 이미지 유지
        image.setAttribute("alt", LOCKED_IMAGE_ALT); // 잠금 설명 적용
        card.classList.add("is-age-locked"); // 잠금 표시 적용
    }); // 카드 순회 끝
} // 함수 끝

async function initializeAgeGate() // 성인 카드 초기화
{ // 함수 시작
    applyAdultVisibility(false); // 초기 잠금 적용
    const verified = await getAgeVerificationStatus(); // 서버 인증 확인
    applyAdultVisibility(verified); // 인증 결과 적용
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    void initializeAgeGate(); // 성인 카드 초기화 실행
} // 조건 끝
