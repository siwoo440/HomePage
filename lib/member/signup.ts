import { validateNickname } from "./profile.ts"; // 닉네임 규칙

export const PASSWORD_MIN_LENGTH = 8; // 비밀번호 최소 길이
export const PASSWORD_MAX_BYTES = 72; // 비밀번호 최대 바이트
export const SIGNUP_FIELD_ORDER = ["email", "password", "passwordConfirm", "nickname", "agreeAge", "agreeTerms", "agreePrivacy"] as const; // 가입 입력 순서
export const PASSWORD_FIELD_ORDER = ["password", "passwordConfirm"] as const; // 비밀번호 입력 순서

export const CONSENT_FIELDS = ["agreeAge", "agreeTerms", "agreePrivacy"] as const; // 필수 동의 항목

export type SignupField = typeof SIGNUP_FIELD_ORDER[number]; // 가입 입력 이름
export type ConsentField = typeof CONSENT_FIELDS[number]; // 동의 항목 이름
export type ConsentValues = Record<ConsentField, boolean>; // 동의 값 형식

export const EMPTY_CONSENTS: ConsentValues = { agreeAge: false, agreeTerms: false, agreePrivacy: false }; // 동의 초기값

const CONSENT_MESSAGES: Record<ConsentField, string> = // 미동의 안내
{ // 안내 시작
    agreeAge: "만 14세 이상인 경우에만 가입할 수 있습니다.", // 연령 안내
    agreeTerms: "이용약관에 동의해 주세요.", // 약관 안내
    agreePrivacy: "개인정보 수집·이용에 동의해 주세요.", // 개인정보 안내
}; // 안내 끝

export function validateConsents(values: ConsentValues): Partial<Record<ConsentField, string>> // 필수 동의 확인
{ // 함수 시작
    return Object.fromEntries(CONSENT_FIELDS.filter((field) => !values[field]).map((field) => [field, CONSENT_MESSAGES[field]])); // 미동의 안내 반환
} // 함수 끝

export interface SignupInput // 가입 입력 값
{ // 형식 시작
    email: string; // 이메일
    password: string; // 비밀번호
    passwordConfirm: string; // 비밀번호 확인
    nickname: string; // 닉네임
    agreeAge: boolean; // 만 14세 이상 확인
    agreeTerms: boolean; // 이용약관 동의
    agreePrivacy: boolean; // 개인정보 수집·이용 동의
} // 형식 끝

export type SignupResult = { ok: true; value: { email: string; password: string; nickname: string } } | { ok: false; errors: Partial<Record<SignupField, string>> }; // 가입 검증 결과

interface AuthErrorLike // 인증 오류 형식
{ // 형식 시작
    code?: string; // 오류 코드
    message?: string; // 오류 내용
    status?: number; // 응답 상태
} // 형식 끝

export function validateEmail(value: string): string | null // 이메일 검증
{ // 함수 시작
    const email = value.trim(); // 공백 정리

    if (!email) // 빈 값 확인
    { // 조건 시작
        return "이메일을 입력해 주세요."; // 빈 값 오류
    } // 조건 끝

    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) // 형식 확인
    { // 조건 시작
        return "이메일 주소 형식을 확인해 주세요."; // 형식 오류
    } // 조건 끝

    return null; // 정상 결과
} // 함수 끝

export function validatePassword(password: string): string | null // 비밀번호 검증
{ // 함수 시작
    if (password.length < PASSWORD_MIN_LENGTH) // 최소 길이 확인
    { // 조건 시작
        return "비밀번호는 8자 이상으로 입력해 주세요."; // 길이 오류
    } // 조건 끝

    if (new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES) // 최대 길이 확인
    { // 조건 시작
        return "비밀번호가 너무 깁니다. 영문 기준 72자 이하로 입력해 주세요."; // 최대 길이 오류
    } // 조건 끝

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) // 영문·숫자 조합 확인
    { // 조건 시작
        return "비밀번호에 영문과 숫자를 함께 넣어 주세요."; // 조합 오류
    } // 조건 끝

    return null; // 정상 결과
} // 함수 끝

export function validatePasswordPair(password: string, passwordConfirm: string): Partial<Record<"password" | "passwordConfirm", string>> // 새 비밀번호 검증
{ // 함수 시작
    const passwordError = validatePassword(password); // 비밀번호 규칙 검사
    const confirmError = passwordConfirm !== password ? "비밀번호 확인이 일치하지 않습니다." : null; // 확인 일치 검사
    return { ...(passwordError ? { password: passwordError } : {}), ...(confirmError ? { passwordConfirm: confirmError } : {}) }; // 오류 목록 반환
} // 함수 끝

export function validateSignup(input: SignupInput): SignupResult // 가입 입력 검증
{ // 함수 시작
    const errors: Partial<Record<SignupField, string>> = { ...validatePasswordPair(input.password, input.passwordConfirm), ...validateConsents(input) }; // 비밀번호·동의 오류
    const emailError = validateEmail(input.email); // 이메일 오류
    const nickname = validateNickname(input.nickname); // 닉네임 검증

    if (emailError) // 이메일 오류 확인
    { // 조건 시작
        errors.email = emailError; // 이메일 오류 저장
    } // 조건 끝

    if (!nickname.ok) // 닉네임 오류 확인
    { // 조건 시작
        errors.nickname = nickname.message; // 닉네임 오류 저장
    } // 조건 끝

    if (Object.keys(errors).length > 0 || !nickname.ok) // 오류 존재 확인
    { // 조건 시작
        return { ok: false, errors }; // 실패 결과 반환
    } // 조건 끝

    return { ok: true, value: { email: input.email.trim(), password: input.password, nickname: nickname.value } }; // 정상 결과 반환
} // 함수 끝

export function toAuthErrorMessage(error: AuthErrorLike | null | undefined): string // 인증 오류 안내 변환
{ // 함수 시작
    const code = error?.code ?? ""; // 오류 코드

    if (code === "weak_password") // 약한 비밀번호 확인
    { // 조건 시작
        return "비밀번호가 보안 기준에 맞지 않습니다. 더 길고 다양한 문자로 정해 주세요."; // 약한 비밀번호 안내
    } // 조건 끝

    if (code === "same_password") // 같은 비밀번호 확인
    { // 조건 시작
        return "기존 비밀번호와 다른 비밀번호를 입력해 주세요."; // 같은 비밀번호 안내
    } // 조건 끝

    if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error?.status === 429) // 요청 제한 확인
    { // 조건 시작
        return "요청이 많아 잠시 후 다시 시도해 주세요."; // 요청 제한 안내
    } // 조건 끝

    if (code === "signup_disabled") // 가입 중지 확인
    { // 조건 시작
        return "현재 회원가입을 받지 않습니다."; // 가입 중지 안내
    } // 조건 끝

    if (code === "email_address_invalid" || code === "validation_failed") // 주소 오류 확인
    { // 조건 시작
        return "이메일 주소를 확인해 주세요."; // 주소 오류 안내
    } // 조건 끝

    if (code === "user_already_exists" || code === "email_exists") // 기존 회원 확인
    { // 조건 시작
        return "이미 가입된 이메일이면 로그인하거나 비밀번호 찾기를 이용해 주세요."; // 기존 회원 안내
    } // 조건 끝

    if (code === "email_not_confirmed") // 이메일 미인증 확인
    { // 조건 시작
        return "이메일 인증을 먼저 완료해 주세요. 받은 편지함의 인증 메일을 확인해 주세요."; // 미인증 안내
    } // 조건 끝

    if (code === "session_not_found" || code === "session_expired" || error?.status === 401) // 세션 만료 확인
    { // 조건 시작
        return "링크가 만료되었습니다. 처음부터 다시 진행해 주세요."; // 세션 만료 안내
    } // 조건 끝

    return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요."; // 기본 안내
} // 함수 끝
