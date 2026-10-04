import { connectJsonForm } from "./form-submit.mjs"; // 공통 양식 전송 도구

export const CONTACT_FORM_FIELDS = Object.freeze(["category", "email", "subject", "message", "consent"]); // 화면 입력 순서
export const CONTACT_FORM_CATEGORIES = Object.freeze(["game", "account", "goods", "privacy", "other"]); // 문의 분류 값
export const CONTACT_MESSAGE_MAX_LENGTH = 2000; // 내용 최대 글자 수

function countCharacters(value) // 글자 수 세기
{ // 함수 시작
    return [...value].length; // 유니코드 글자 수 반환
} // 함수 끝

export function collectContactForm(form) // 양식 값 모으기
{ // 함수 시작
    const read = (name) => String(form.elements.namedItem(name)?.value ?? ""); // 글자 입력 읽기
    return { category: read("category"), email: read("email"), subject: read("subject"), message: read("message"), consent: form.elements.namedItem("consent")?.checked === true, website: read("website") }; // 전송 내용 반환
} // 함수 끝

export function validateContactForm(payload) // 화면 입력 검증(서버 규칙과 같은 문구)
{ // 함수 시작
    const errors = {}; // 오류 목록
    const email = payload.email.trim(); // 이메일
    const subject = payload.subject.trim().replace(/\s+/g, " "); // 제목
    const message = payload.message.trim().replace(/\r\n/g, "\n"); // 내용
    if (!CONTACT_FORM_CATEGORIES.includes(payload.category)) // 분류 확인
    { // 조건 시작
        errors.category = "문의 분류를 선택해 주세요."; // 분류 오류
    } // 조건 끝
    if (!email) // 이메일 누락 확인
    { // 조건 시작
        errors.email = "답변 받을 이메일을 입력해 주세요."; // 이메일 누락 오류
    } // 조건 끝
    else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) // 이메일 형식 확인
    { // 조건 시작
        errors.email = "이메일 형식을 확인해 주세요."; // 이메일 형식 오류
    } // 조건 끝
    if (countCharacters(subject) < 2) // 짧은 제목 확인
    { // 조건 시작
        errors.subject = "제목을 2자 이상 입력해 주세요."; // 제목 길이 오류
    } // 조건 끝
    else if (countCharacters(subject) > 100) // 긴 제목 확인
    { // 조건 시작
        errors.subject = "제목은 100자 이하로 입력해 주세요."; // 제목 길이 오류
    } // 조건 끝
    if (countCharacters(message) < 10) // 짧은 내용 확인
    { // 조건 시작
        errors.message = "문의 내용을 10자 이상 입력해 주세요."; // 내용 길이 오류
    } // 조건 끝
    else if (countCharacters(message) > CONTACT_MESSAGE_MAX_LENGTH) // 긴 내용 확인
    { // 조건 시작
        errors.message = "문의 내용은 2,000자 이하로 입력해 주세요."; // 내용 길이 오류
    } // 조건 끝
    if (payload.consent !== true) // 수집 동의 확인
    { // 조건 시작
        errors.consent = "개인정보 수집·이용에 동의해 주세요."; // 동의 오류
    } // 조건 끝
    return errors; // 오류 목록 반환
} // 함수 끝

export function formatContactCount(value) // 글자 수 표시
{ // 함수 시작
    return `${countCharacters(value).toLocaleString("en-US")} / ${CONTACT_MESSAGE_MAX_LENGTH.toLocaleString("en-US")}`; // 현재·최대 글자 수 반환
} // 함수 끝

export function initializeContactForm(root = document) // 문의 양식 연결
{ // 함수 시작
    const form = root.querySelector("[data-contact-form]"); // 문의 양식
    if (!form) // 양식 누락 확인
    { // 조건 시작
        return null; // 안전 종료
    } // 조건 끝
    const message = form.elements.namedItem("message"); // 내용 입력
    const counter = form.querySelector("[data-contact-count]"); // 글자 수 표시
    const updateCount = () => // 글자 수 갱신
    { // 갱신 시작
        if (counter && message) // 요소 확인
        { // 조건 시작
            counter.textContent = formatContactCount(message.value); // 글자 수 반영
        } // 조건 끝
    }; // 갱신 끝
    message?.addEventListener("input", updateCount); // 입력할 때 글자 수 갱신
    updateCount(); // 처음 글자 수 표시
    return connectJsonForm(form, // 공통 전송 연결
    { // 연결 설정 시작
        url: "/api/contact", // 문의 접수 주소
        fieldOrder: CONTACT_FORM_FIELDS, // 오류 표시 순서
        collect: collectContactForm, // 값 모으기
        validate: validateContactForm, // 화면 검증
        onSuccess: () => // 접수 뒤 처리
        { // 처리 시작
            form.reset(); // 입력 비우기
            updateCount(); // 글자 수 초기화
            form.querySelector("[data-form-status]")?.focus?.(); // 결과 안내로 초점 이동
        }, // 처리 끝
    }); // 연결 설정 끝
} // 함수 끝

if (typeof document !== "undefined") // 브라우저 환경 확인
{ // 조건 시작
    if (document.readyState === "loading") // 문서 준비 상태 확인
    { // 조건 시작
        document.addEventListener("DOMContentLoaded", () => initializeContactForm(document), { once: true }); // 준비 뒤 연결
    } // 조건 끝
    else // 준비 완료
    { // 대안 시작
        initializeContactForm(document); // 즉시 연결
    } // 대안 끝
} // 조건 끝
