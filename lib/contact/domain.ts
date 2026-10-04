export const CONTACT_CATEGORIES = // 문의 분류 목록
[ // 목록 시작
    { value: "game", label: "게임·출시" }, // 게임 문의
    { value: "account", label: "회원·이용" }, // 회원 문의
    { value: "goods", label: "굿즈" }, // 굿즈 문의
    { value: "privacy", label: "개인정보" }, // 개인정보 문의
    { value: "other", label: "기타" }, // 기타 문의
] as const; // 목록 끝

export type ContactCategory = typeof CONTACT_CATEGORIES[number]["value"]; // 문의 분류 형식
export const CONTACT_FIELD_ORDER = ["category", "email", "subject", "message", "consent"] as const; // 화면 입력 순서
export type ContactField = typeof CONTACT_FIELD_ORDER[number]; // 문의 입력 이름
export const CONTACT_EMAIL_MAX_LENGTH = 254; // 이메일 최대 길이
export const CONTACT_SUBJECT_MIN_LENGTH = 2; // 제목 최소 글자 수
export const CONTACT_SUBJECT_MAX_LENGTH = 100; // 제목 최대 글자 수
export const CONTACT_MESSAGE_MIN_LENGTH = 10; // 내용 최소 글자 수
export const CONTACT_MESSAGE_MAX_LENGTH = 2000; // 내용 최대 글자 수
export const CONTACT_HONEYPOT_FIELD = "website"; // 자동 입력 방지용 숨김 칸

export interface ContactInput // 검증된 문의 내용
{ // 형식 시작
    category: ContactCategory; // 문의 분류
    email: string; // 답변 받을 이메일
    subject: string; // 문의 제목
    message: string; // 문의 내용
} // 형식 끝

export type ContactErrors = Partial<Record<ContactField, string>>; // 입력별 오류 문구

export type ContactValidation = // 문의 검증 결과
    | { ok: true; value: ContactInput; spam: boolean } // 통과(자동 입력 의심 여부 포함)
    | { ok: false; errors: ContactErrors }; // 입력 오류

function readText(value: unknown): string // 글자 입력 정리
{ // 함수 시작
    return typeof value === "string" ? value.trim() : ""; // 앞뒤 공백 제거 반환
} // 함수 끝

function countCharacters(value: string): number // 글자 수 세기
{ // 함수 시작
    return [...value].length; // 유니코드 글자 수 반환
} // 함수 끝

export function getContactCategoryLabel(value: string): string // 문의 분류 이름
{ // 함수 시작
    return CONTACT_CATEGORIES.find((category) => category.value === value)?.label ?? "기타"; // 분류 이름 반환
} // 함수 끝

export function validateContact(payload: Record<string, unknown>): ContactValidation // 문의 입력 검증
{ // 함수 시작
    const errors: ContactErrors = {}; // 오류 목록
    const category = CONTACT_CATEGORIES.find((item) => item.value === payload.category)?.value; // 분류 확인
    const email = readText(payload.email); // 이메일
    const subject = readText(payload.subject).replace(/\s+/g, " "); // 제목(공백 정리)
    const message = readText(payload.message).replace(/\r\n/g, "\n"); // 내용(줄바꿈 통일)

    if (!category) // 분류 누락 확인
    { // 조건 시작
        errors.category = "문의 분류를 선택해 주세요."; // 분류 오류
    } // 조건 끝
    if (!email) // 이메일 누락 확인
    { // 조건 시작
        errors.email = "답변 받을 이메일을 입력해 주세요."; // 이메일 누락 오류
    } // 조건 끝
    else if (email.length > CONTACT_EMAIL_MAX_LENGTH || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) // 이메일 형식 확인
    { // 조건 시작
        errors.email = "이메일 형식을 확인해 주세요."; // 이메일 형식 오류
    } // 조건 끝
    if (countCharacters(subject) < CONTACT_SUBJECT_MIN_LENGTH) // 짧은 제목 확인
    { // 조건 시작
        errors.subject = "제목을 2자 이상 입력해 주세요."; // 제목 길이 오류
    } // 조건 끝
    else if (countCharacters(subject) > CONTACT_SUBJECT_MAX_LENGTH) // 긴 제목 확인
    { // 조건 시작
        errors.subject = "제목은 100자 이하로 입력해 주세요."; // 제목 길이 오류
    } // 조건 끝
    if (countCharacters(message) < CONTACT_MESSAGE_MIN_LENGTH) // 짧은 내용 확인
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

    if (Object.keys(errors).length > 0 || !category) // 오류 존재 확인
    { // 조건 시작
        return { ok: false, errors }; // 오류 반환
    } // 조건 끝
    return { ok: true, value: { category, email, subject, message }, spam: readText(payload[CONTACT_HONEYPOT_FIELD]) !== "" }; // 통과 반환
} // 함수 끝
